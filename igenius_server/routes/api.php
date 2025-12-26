<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\LevelController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']); // 

// routes/levels get
Route::prefix('levels')->group(function () {
    Route::get('/', [LevelController::class, 'index']);
    Route::get('/{level}', [LevelController::class, 'show']);
    Route::get('/{level}/weeks', [LevelController::class, 'getWeeks']);
    Route::get('/{level}/weeks/{week}/question-sets', [LevelController::class, 'getWeekQuestionSets']);
    Route::get('/{level}/weeks/{week}/question-sets/{questionSet}/questions', [LevelController::class, 'getQuestionSetQuestions']);
});

// Protected routes
Route::middleware('auth.cookie')->group(function () {
    // Auth routes
    Route::get('/check-auth', [AuthController::class, 'checkAuth']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
    Route::get('/user', [AuthController::class, 'user']);
    
    // Admin routes (admin only)
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/stats', [AdminController::class, 'getStats']);
        Route::post('/create-admin', [AuthController::class, 'createAdminUser']);
        Route::post('/users', [AdminController::class, 'createUser']);
        Route::get('/users', [AdminController::class, 'getUsers']);
        Route::get('/users/{id}', [AdminController::class, 'getUser']);
        Route::put('/users/{id}', [AdminController::class, 'updateUser']);
        Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);
       
       
    });
});