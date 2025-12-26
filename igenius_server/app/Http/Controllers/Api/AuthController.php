<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash; // ADD THIS

use Illuminate\Support\Facades\Validator;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{  // Add this method to your AuthController

    // In AuthController.php
public function createAdminUser(Request $request): JsonResponse
{
    // Only allow if user is already authenticated as admin
    $currentUser = $request->user();
    
    if (!$currentUser || !$currentUser->isAdmin()) {
        return response()->json([
            'error' => 'Only existing admins can create new admin users'
        ], Response::HTTP_FORBIDDEN);
    }

    $validator = Validator::make($request->all(), [
        'name' => 'required|string|max:255',
        'email' => 'required|string|email|max:255|unique:users',
        'password' => 'required|string|min:8|confirmed', // Stronger password for admin
        'admin_secret' => 'required|string|in:CREATE_ADMIN_2024' // Secret key for extra security
    ]);

    if ($validator->fails()) {
        return response()->json([
            'error' => 'Validation failed',
            'errors' => $validator->errors()
        ], Response::HTTP_BAD_REQUEST);
    }

    $user = User::create([
        'name' => $request->name,
        'email' => $request->email,
        'password' => Hash::make($request->password),
        'role' => 'admin',
    ]);

    return response()->json([
        'message' => 'Admin user created successfully',
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'created_at' => $user->created_at->toDateTimeString(),
        ]
    ], Response::HTTP_CREATED);
}
public function register(Request $request): JsonResponse
{
    $validator = Validator::make($request->all(), [
        'name' => 'required|string|max:255',
        'email' => 'required|string|email|max:255|unique:users',
        'password' => 'required|string|min:6|confirmed',
        'role' => 'sometimes|in:admin,user', // Admin can specify role
    ]);

    if ($validator->fails()) {
        return response()->json([
            'error' => 'Validation failed',
            'errors' => $validator->errors()
        ], Response::HTTP_BAD_REQUEST);
    }

    // Default role is 'user' unless admin is creating with admin role
    $role = $request->role ?? 'user';
    
    // If trying to create admin, check if requester is admin
    if ($role === 'admin') {
        $currentUser = $request->user();
        if (!$currentUser || !$currentUser->isAdmin()) {
            return response()->json([
                'error' => 'Only admins can create admin users'
            ], Response::HTTP_FORBIDDEN);
        }
    }

    $user = User::create([
        'name' => $request->name,
        'email' => $request->email,
        'password' => Hash::make($request->password),
        'role' => $role,
    ]);

    // Auto-login after registration (optional)
    if (!$request->user()) {
        Auth::login($user);
        
        $accessToken = $user->createToken('access_token', ['*'], now()->addMinutes(60))->plainTextToken;
        $refreshToken = $user->createToken('refresh_token', ['refresh'], now()->addDays(7))->plainTextToken;

        $response = response()->json([
            'message' => 'Registration successful',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ]
        ]);

        return $response->cookie(
            'access_token',
            $accessToken,
            60,
            '/',
            'localhost',
            false,
            true,
            false,
            'lax'
        )->cookie(
            'refresh_token',
            $refreshToken,
            10080,
            '/',
            'localhost',
            false,
            true,
            false,
            'lax'
        );
    }

    return response()->json([
        'message' => 'User registered successfully',
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
        ]
    ], Response::HTTP_CREATED);
}
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Invalid credentials format'
            ], Response::HTTP_BAD_REQUEST);
        }

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'error' => 'Invalid email or password'
            ], Response::HTTP_UNAUTHORIZED);
        }

        $user = Auth::user();
        $user->tokens()->delete();
        
        $accessToken = $user->createToken('access_token', ['*'], now()->addMinutes(60))->plainTextToken;
        $refreshToken = $user->createToken('refresh_token', ['refresh'], now()->addDays(7))->plainTextToken;

        $response = response()->json([
            'message' => 'Login successful',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ]
        ]);

        // Set cookies
        return $response->cookie(
            'access_token',
            $accessToken,
            60,
            '/',
            'localhost',
            false,
            true,
            false,
            'lax'
        )->cookie(
            'refresh_token',
            $refreshToken,
            10080,
            '/',
            'localhost',
            false,
            true,
            false,
            'lax'
        );
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->tokens()->delete();
        
        $response = response()->json([
            'message' => 'Logged out successfully'
        ]);
        
        return $response->withoutCookie('access_token')
                       ->withoutCookie('refresh_token');
    }

    public function user(Request $request): JsonResponse
    {
        $user = $request->user();
        
        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ]
        ]);
    }

    public function checkAuth(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'authenticated' => false,
                'message' => 'Please login'
            ]);
        }

        return response()->json([
            'authenticated' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ]
        ]);
    }

    public function refresh(Request $request): JsonResponse
    {
        $refreshToken = $request->cookie('refresh_token');
        
        if (!$refreshToken) {
            return response()->json(['error' => 'No refresh token'], 401);
        }

        $token = \Laravel\Sanctum\PersonalAccessToken::findToken($refreshToken);
        
        if (!$token || !$token->can('refresh')) {
            return response()->json(['error' => 'Invalid refresh token'], 401);
        }

        $user = $token->tokenable;
        $user->tokens()->where('name', 'access_token')->delete();
        
        $newAccessToken = $user->createToken('access_token', ['*'], now()->addMinutes(60))->plainTextToken;

        $response = response()->json([
            'message' => 'Token refreshed'
        ]);

        return $response->cookie(
            'access_token',
            $newAccessToken,
            60,
            '/',
            'localhost',
            false,
            true,
            false,
            'lax'
        );
    }
}