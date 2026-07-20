<?php

use App\Modules\Report\Controllers\ReportController;
use Illuminate\Support\Facades\Route;

Route::middleware([
    'auth:sanctum',
    'role:Super Administrator,System Administrator,Property Custodian,Inventory Officer,Department Head,Auditor',
])->group(function (): void {
    Route::get('reports/assets', [ReportController::class, 'assets']);
    Route::get('reports/borrowings', [ReportController::class, 'borrowings']);
    Route::get('reports/reservations', [ReportController::class, 'reservations']);
    Route::get('reports/inventory', [ReportController::class, 'inventory']);
    Route::get('reports/overdue', [ReportController::class, 'overdue']);
    Route::get('reports/low-stock', [ReportController::class, 'lowStock']);
    Route::get('reports/user-activity', [ReportController::class, 'userActivity']);
});
