<?php

use App\Http\Controllers\BorrowController;
use App\Modules\Auth\Controllers\AuthController;
use App\Modules\Auth\Controllers\PermissionController;
use App\Modules\Auth\Controllers\RoleController;
use App\Modules\Auth\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::put('/change-password', [AuthController::class, 'changePassword']);

        // Dashboard routes (admin + staff)
        require __DIR__.'/../app/Modules/Dashboard/Routes/api.php';

        Route::middleware('can:viewAny,App\Models\User')->group(function (): void {
            Route::get('/users', [UserController::class, 'index']);
        });

        Route::middleware('can:create,App\Models\User')->group(function (): void {
            Route::post('/users', [UserController::class, 'store']);
        });

        Route::middleware('can:view,user')->group(function (): void {
            Route::get('/users/{user}', [UserController::class, 'show']);
        });

        Route::middleware('can:update,user')->group(function (): void {
            Route::put('/users/{user}', [UserController::class, 'update']);
        });

        Route::middleware('can:delete,user')->group(function (): void {
            Route::delete('/users/{user}', [UserController::class, 'destroy']);
        });

        Route::middleware('can:viewAny,App\Models\Role')->group(function (): void {
            Route::get('/roles', [RoleController::class, 'index']);
        });

        Route::middleware('can:create,App\Models\Role')->group(function (): void {
            Route::post('/roles', [RoleController::class, 'store']);
        });

        Route::middleware('can:view,role')->group(function (): void {
            Route::get('/roles/{role}', [RoleController::class, 'show']);
        });

        Route::middleware('can:update,role')->group(function (): void {
            Route::put('/roles/{role}', [RoleController::class, 'update']);
        });

        Route::middleware('can:delete,role')->group(function (): void {
            Route::delete('/roles/{role}', [RoleController::class, 'destroy']);
        });

        Route::get('/permissions', [PermissionController::class, 'index']);
        Route::post('/permissions', [PermissionController::class, 'store']);
        Route::get('/permissions/{permission}', [PermissionController::class, 'show']);
        Route::put('/permissions/{permission}', [PermissionController::class, 'update']);
        Route::delete('/permissions/{permission}', [PermissionController::class, 'destroy']);

        // Borrow routes
        Route::post('/assets/{asset}/borrow', [BorrowController::class, 'borrow']);
        Route::post('/assets/{asset}/return', [BorrowController::class, 'return']);
    });
});

