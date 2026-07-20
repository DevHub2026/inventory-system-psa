<?php

use App\Modules\Asset\Controllers\AssetController;
use App\Modules\Asset\Controllers\LocationController;
use App\Modules\Asset\Controllers\ManufacturerController;
use App\Modules\Asset\Controllers\OfficeController;
use App\Modules\AssetCategory\Controllers\AssetCategoryController;
use App\Modules\AssetIdentifier\Controllers\AssetIdentifierController;
use Illuminate\Support\Facades\Route;

/*
| Asset domain routes — /api/v1
| Protected by Sanctum (Auth module — Eman).
*/

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('assets/search', [AssetController::class, 'search']);
    Route::get('assets/scan', [AssetController::class, 'scan']);
    Route::post('assets/{asset}/archive', [AssetController::class, 'archive']);
    Route::post('assets/{asset}/transfer', [AssetController::class, 'transfer']);
    Route::apiResource('assets', AssetController::class);

    Route::middleware('role:Super Administrator,System Administrator')->group(function (): void {
        Route::apiResource('asset-categories', AssetCategoryController::class)
            ->parameters(['asset-categories' => 'assetCategory']);

        Route::apiResource('offices', OfficeController::class);
        Route::apiResource('locations', LocationController::class);
        Route::apiResource('manufacturers', ManufacturerController::class);
    });

    Route::apiResource('asset-identifiers', AssetIdentifierController::class)
        ->middleware('role:Super Administrator,System Administrator,Property Custodian,Inventory Officer')
        ->parameters(['asset-identifiers' => 'assetIdentifier']);
});
