<?php

use App\Modules\Dashboard\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;

<<<<<<< HEAD
// Dashboard domain routes — /api/v1
// These are protected by Sanctum via the global api.php routing middleware.

Route::middleware('auth:sanctum')->group(function (): void {
    // Staff dashboard
    Route::get('dashboard/stats/staff', [DashboardController::class, 'statsStaff']);

    // Admin dashboard (kept separate in case UI distinguishes them)
    Route::get('reports/dashboard', [DashboardController::class, 'statsAdmin']);

    // Shared recent activity feed (used by current DashboardPage)
    Route::get('dashboard/recent', [DashboardController::class, 'recent']);
});

=======
Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('dashboard/recent-activity', [DashboardController::class, 'recentActivity']);
    Route::get('dashboard/low-stock', [DashboardController::class, 'lowStock']);
    Route::get('dashboard/overdue-assets', [DashboardController::class, 'overdueAssets']);
});
>>>>>>> a91d3b64a04f5687fe5e91c55609e3ee706d5df9
