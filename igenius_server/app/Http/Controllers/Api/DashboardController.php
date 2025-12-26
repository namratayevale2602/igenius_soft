<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if ($user->isAdmin()) {
            return response()->json([
                'message' => 'Welcome to Admin Dashboard',
                'type' => 'admin',
                'permissions' => ['manage_users', 'view_reports', 'system_settings']
            ]);
        }
        
        return response()->json([
            'message' => 'Welcome to User Dashboard',
            'type' => 'user',
            'permissions' => ['view_profile', 'edit_profile']
        ]);
    }
}