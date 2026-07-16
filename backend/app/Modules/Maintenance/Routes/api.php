<?php

use App\Modules\Maintenance\Controllers\MaintenanceController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('maintenances', [MaintenanceController::class, 'index']);
    Route::post('maintenances', [MaintenanceController::class, 'store']);
    Route::put('maintenances/{maintenance}', [MaintenanceController::class, 'update']);
    Route::delete('maintenances/{maintenance}', [MaintenanceController::class, 'destroy']);
    Route::post('maintenances/{maintenance}/complete', [MaintenanceController::class, 'complete']);
    Route::get('maintenances/scheduled', [MaintenanceController::class, 'scheduled']);
    Route::get('maintenances/overdue', [MaintenanceController::class, 'overdue']);
});
