<?php

use App\Modules\Asset\Controllers\PermanentIssuanceController;
use App\Modules\Asset\Controllers\AssetAttachmentController;
use App\Modules\Asset\Controllers\AssetController;
use App\Modules\Asset\Controllers\DisposalController;
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
    Route::get('assets/validate-code', [AssetController::class, 'validateCode']);
    Route::get('assets/search', [AssetController::class, 'search']);
    Route::get('assets/scan', [AssetController::class, 'scan']);
    Route::post('assets/{asset}/archive', [AssetController::class, 'archive']);
    // IMPORTANT: /assets/archived must be registered BEFORE apiResource('assets')
    // otherwise 'archived' would be treated as the {asset} route parameter.
    Route::get('assets/archived', [AssetController::class, 'archived']);
    Route::post('assets/{asset}/restore', [AssetController::class, 'restore']);
    Route::post('assets/{asset}/transfer', [AssetController::class, 'transfer']);
    Route::patch('assets/{asset}/borrowable', [AssetController::class, 'setBorrowable']);
    Route::get('assets/{asset}/attachments', [AssetAttachmentController::class, 'index']);
    Route::post('assets/{asset}/attachments', [AssetAttachmentController::class, 'store']);
    Route::get('assets/{asset}/attachments/{attachment}/download', [AssetAttachmentController::class, 'download']);
    Route::delete('assets/{asset}/attachments/{attachment}', [AssetAttachmentController::class, 'destroy']);

    // Disposal lifecycle routes — restricted to staff/admin roles
    Route::middleware('role:Super Administrator,System Administrator,Property Custodian,Inventory Officer,Department Head')->group(function (): void {
        Route::post('assets/{asset}/dispose', [DisposalController::class, 'markForDisposal']);
        Route::post('assets/{asset}/dispose/finalize', [DisposalController::class, 'finalize']);
        Route::post('assets/{asset}/dispose/cancel', [DisposalController::class, 'cancel']);
    });
    
    // Reissuance routes
    Route::post('assets/{asset}/reissue', [\App\Modules\Asset\Controllers\AssetReissuanceController::class, 'reissue']);
    Route::get('assets/{asset}/issuance-history', [\App\Modules\Asset\Controllers\AssetReissuanceController::class, 'history']);
    Route::middleware('role:Super Administrator,System Administrator,Property Custodian,Inventory Officer,Department Head,Auditor')->group(function (): void {
        Route::get('reports/reissuances', [\App\Modules\Asset\Controllers\AssetReissuanceController::class, 'report']);
        Route::get('reports/reissuances/export', [\App\Modules\Asset\Controllers\AssetReissuanceController::class, 'export']);
    });

    // Permanent issuance routes
    Route::middleware('role:Super Administrator,System Administrator,Property Custodian,Inventory Officer')->group(function (): void {
        Route::get('permanent-issuances/users/search', [PermanentIssuanceController::class, 'searchUsers']);
        Route::get('permanent-issuances/users', [PermanentIssuanceController::class, 'directoryUsers']);
    });
    Route::get('permanent-issuances/users/{user}/assets', [PermanentIssuanceController::class, 'userAssets']);
    Route::post('assets/{asset}/permanent-issue', [PermanentIssuanceController::class, 'assign']);
    
    Route::apiResource('assets', AssetController::class);

    Route::middleware('role:Super Administrator,System Administrator,Property Custodian,Inventory Officer,Supply Officer,Department Head')->group(function (): void {
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
