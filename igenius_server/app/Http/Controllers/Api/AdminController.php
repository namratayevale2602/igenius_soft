<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AdminController extends Controller
{
    // Get all users
    public function getUsers(Request $request): JsonResponse
    {
        $perPage = $request->get('per_page', 15);
        
        $users = User::select(['id', 'name', 'email', 'role', 'created_at'])
                    ->latest()
                    ->paginate($perPage);

        return response()->json([
            'users' => $users->items(),
            'pagination' => [
                'total' => $users->total(),
                'per_page' => $users->perPage(),
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
            ]
        ]);
    }

    // Get user by ID
    public function getUser($id): JsonResponse
    {
        $user = User::findOrFail($id, ['id', 'name', 'email', 'role', 'created_at']);
        
        return response()->json([
            'user' => $user
        ]);
    }

    // Create new user
    public function createUser(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:6|confirmed',
            'role' => 'required|in:admin,user',
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
            'role' => $request->role,
        ]);

        return response()->json([
            'message' => 'User created successfully',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ]
        ], Response::HTTP_CREATED);
    }

    // Update user
    public function updateUser(Request $request, $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'role' => 'sometimes|in:admin,user',
            'password' => 'sometimes|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $validator->errors()
            ], Response::HTTP_BAD_REQUEST);
        }

        $data = $request->only(['name', 'email', 'role']);
        
        if ($request->has('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);
        $user->refresh(); // Refresh to get updated data

        return response()->json([
            'message' => 'User updated successfully',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'updated_at' => $user->updated_at->toDateTimeString(),

            ]
        ]);
    }

    // Delete user
    public function deleteUser($id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->id === auth()->id()) {
            return response()->json([
                'error' => 'Cannot delete your own account'
            ], Response::HTTP_BAD_REQUEST);
        }

        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully'
        ]);
    }

    // Get stats
    public function getStats(): JsonResponse
    {
        $totalUsers = User::count();
        $adminCount = User::where('role', 'admin')->count();
        $userCount = User::where('role', 'user')->count();
        $usersToday = User::whereDate('created_at', today())->count();

        return response()->json([
            'stats' => [
                'total_users' => $totalUsers,
                'admins' => $adminCount,
                'regular_users' => $userCount,
                'new_today' => $usersToday,
            ]
        ]);
    }
}