<?php

use App\Modules\LostAssetReport\Controllers\LostAssetReportController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function (): void {
    // Any authenticated user can report a lost asset
    Route::post('assets/{asset}/report-lost', [LostAssetReportController::class, 'reportLost']);

    // Employee's own reports
    Route::get('lost-asset-reports/mine', [LostAssetReportController::class, 'mine']);

    // Admin/Custodian: list all reports
    Route::middleware('role:Super Administrator,System Administrator,Property Custodian,Inventory Officer,Department Head')
        ->group(function (): void {
            Route::get('lost-asset-reports', [LostAssetReportController::class, 'index']);
        });
});
