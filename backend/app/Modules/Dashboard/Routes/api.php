<?php

use App\Modules\Dashboard\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;

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

