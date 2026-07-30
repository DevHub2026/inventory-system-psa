<?php

use App\Modules\Asset\Controllers\AssetController;
use App\Modules\Maintenance\Controllers\MaintenanceController;
use Illuminate\Support\Facades\Route;

// Employee damage reporting — any authenticated user
Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('assets/{asset}/report-damage', [MaintenanceController::class, 'reportDamage']);
});

// Staff/Admin maintenance management
Route::middleware([
    'auth:sanctum',
    'role:Super Administrator,System Administrator,Property Custodian,Inventory Officer,Department Head',
])->group(function (): void {
    Route::get('maintenances', [MaintenanceController::class, 'index']);
    Route::post('maintenances', [MaintenanceController::class, 'store']);
    Route::put('maintenances/{maintenance}', [MaintenanceController::class, 'update']);
    Route::delete('maintenances/{maintenance}', [MaintenanceController::class, 'destroy']);
    Route::post('maintenances/{maintenance}/complete', [MaintenanceController::class, 'complete']);
    Route::get('maintenances/scheduled', [MaintenanceController::class, 'scheduled']);
    Route::get('maintenances/overdue', [MaintenanceController::class, 'overdue']);

    // Asset search for maintenance creation
    Route::get('assets/search', [AssetController::class, 'search']);
});
