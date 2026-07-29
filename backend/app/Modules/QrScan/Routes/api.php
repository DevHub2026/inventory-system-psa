<?php

namespace App\Modules\QrScan\Routes;

use App\Modules\QrScan\Controllers\QrScanController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function (): void {
    // Resolve asset by QR identifier (records VIEW scan)
    Route::get('qr/asset/{identifier}', [QrScanController::class, 'resolveAsset'])
        ->where('identifier', '.*');

    // Record a non-VIEW scan action
    Route::post('qr/scan-action', [QrScanController::class, 'recordAction']);

    // Employee's own scan history
    Route::get('qr/my-history', [QrScanController::class, 'myHistory']);

    // Admin/Custodian: full scan history
    Route::middleware('role:Super Administrator,System Administrator,Property Custodian,Inventory Officer')
        ->group(function (): void {
            Route::get('qr/history', [QrScanController::class, 'history']);
        });
});
