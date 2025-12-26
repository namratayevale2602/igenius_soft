<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class SanctumCookieAuth
{
    // Routes that don't require authentication
    protected $except = [
        'api/login',
        'api/csrf-token',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        // Skip authentication for excluded routes
        if ($this->inExceptArray($request)) {
            return $next($request);
        }

       // Check if user is already authenticated via session
        if ($request->user()) {
            \Log::debug('User already authenticated', [
                'user_id' => $request->user()->id
            ]);
            return $next($request);
        }

        $user = null;
        $tokenRefreshed = false;
        $newAccessToken = null;

        // Method 1: Check Access Token Cookie
        if ($accessToken = $request->cookie('access_token')) {
            $token = PersonalAccessToken::findToken($accessToken);
            
            if ($token) {
                if ($this->isTokenValid($token)) {
                    $user = $token->tokenable;
                    auth()->setUser($user);
                    \Log::debug('Authenticated via valid access token', ['user_id' => $user->id]);
                } else {
                    // Access token is expired, try to refresh it
                    \Log::debug('Access token expired, attempting refresh');
                    $user = $this->attemptTokenRefresh($request);
                    if ($user) {
                        auth()->setUser($user);
                        $tokenRefreshed = true;
                        $newAccessToken = $user->newAccessToken;
                        \Log::debug('Token refreshed successfully', ['user_id' => $user->id]);
                    }
                }
            } else {
                \Log::debug('Invalid access token');
            }
        } else {
            \Log::debug('No access token cookie found');
        }

        // Method 2: If no access token, try refresh token directly
        if (!$user && ($refreshToken = $request->cookie('refresh_token'))) {
            \Log::debug('Trying refresh token directly');
            $user = $this->attemptTokenRefresh($request);
            if ($user) {
                auth()->setUser($user);
                $tokenRefreshed = true;
                $newAccessToken = $user->newAccessToken;
                \Log::debug('Authenticated via refresh token', ['user_id' => $user->id]);
            }
        }

        // If still no user, return unauthorized
        if (!$user) {
            \Log::debug('No valid authentication found');
            return response()->json([
                'error' => 'Unauthenticated',
                'message' => 'Please login to access this resource'
            ], 401);
        }

        // Process the request
        $response = $next($request);

        // If token was refreshed, set the new access token cookie
        if ($tokenRefreshed && $newAccessToken) {
            $response = $this->addTokenCookie($response, $newAccessToken);
            \Log::debug('New access token cookie set');
        }

        return $response;
    }

    private function inExceptArray(Request $request): bool
    {
        foreach ($this->except as $except) {
            if ($except !== '/') {
                $except = trim($except, '/');
            }

            if ($request->fullUrlIs($except) || $request->is($except)) {
                return true;
            }
        }

        return false;
    }

    private function isTokenValid($token): bool
    {
        if (!$token) {
            return false;
        }
        
        // Check if token has expired
        if ($token->expires_at && $token->expires_at->isPast()) {
            \Log::debug('Token expired at: ' . $token->expires_at);
            return false;
        }
        
        // Check if token is about to expire (within 1 minute)
        if ($token->expires_at && $token->expires_at->diffInMinutes(now()) < 1) {
            \Log::debug('Token expiring soon');
            return false; // Force refresh if about to expire
        }
        
        return true;
    }

    private function attemptTokenRefresh(Request $request)
    {
        try {
            $refreshToken = $request->cookie('refresh_token');
            
            if (!$refreshToken) {
                \Log::debug('No refresh token in cookie');
                return null;
            }

            $token = PersonalAccessToken::findToken($refreshToken);
            
            if (!$token) {
                \Log::debug('Refresh token not found in database');
                return null;
            }

            // Verify this is a refresh token
            if (!$token->can('refresh')) {
                \Log::debug('Token missing refresh ability');
                return null;
            }

            $user = $token->tokenable;

            // Check if refresh token is expired
            if ($token->expires_at && $token->expires_at->isPast()) {
                \Log::debug('Refresh token expired at: ' . $token->expires_at);
                $token->delete();
                return null;
            }

            // Revoke old access tokens (optional, can keep for tracking)
            $user->tokens()->where('name', 'access_token')->where('expires_at', '<', now())->delete();

            // Create new access token (use 15 minutes for better UX)
            $newAccessToken = $user->createToken('access_token', ['*'], now()->addMinutes(15))->plainTextToken;

            // Store the new token on the user object temporarily
            $user->newAccessToken = $newAccessToken;

            \Log::debug('New access token created', ['user_id' => $user->id]);

            return $user;

        } catch (\Exception $e) {
            \Log::error('Token refresh failed: ' . $e->getMessage());
            return null;
        }
    }

    private function addTokenCookie($response, $token)
    {
        $isLocal = app()->environment('local');

        \Log::debug('Setting access_token cookie', [
            'domain' => $isLocal ? 'localhost' : null,
            'secure' => $isLocal ? false : true,
            'httpOnly' => true,
            'sameSite' => $isLocal ? 'lax' : 'none'
        ]);
        
        return $response->cookie(
            'access_token',
            $token,
            15, // 15 minutes
            '/',
            $isLocal ? 'localhost' : null,
            $isLocal ? false : true,
            true,
            false,
            $isLocal ? 'lax' : 'none'
        );
    }
}