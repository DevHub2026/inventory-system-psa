<?php

use App\Modules\Inventory\Controllers\InventoryController;
use App\Modules\Inventory\Controllers\InventoryImportWizardController;
use Illuminate\Support\Facades\Route;

Route::middleware([
    'auth:sanctum',
    'role:Super Administrator,System Administrator,Property Custodian,Inventory Officer,Department Head',
])->group(function (): void {
    Route::get('inventory/validate-sku', [InventoryController::class, 'validateSku']);
    Route::get('inventory', [InventoryController::class, 'index']);
    Route::post('inventory', [InventoryController::class, 'store']);
    Route::put('inventory/{item}', [InventoryController::class, 'update']);
    Route::delete('inventory/{item}', [InventoryController::class, 'destroy']);
    Route::post('inventory/{item}/stock-in', [InventoryController::class, 'stockIn']);
    Route::post('inventory/{item}/stock-out', [InventoryController::class, 'stockOut']);
    Route::post('inventory/{item}/adjust', [InventoryController::class, 'adjust']);
    Route::get('inventory/{item}/history', [InventoryController::class, 'history']);

    // Import / Export
    Route::post('inventory/import', [InventoryController::class, 'import']);
    Route::get('inventory/export', [InventoryController::class, 'export']);
    Route::get('inventory/export/download', [InventoryController::class, 'downloadExport']);

    // Import Wizard
    Route::post('inventory/import-wizard/upload', [InventoryImportWizardController::class, 'upload']);
    Route::post('inventory/import-wizard/validate-mapping', [InventoryImportWizardController::class, 'validateMapping']);
    Route::post('inventory/import-wizard/validate-data', [InventoryImportWizardController::class, 'validateData']);
    Route::post('inventory/import-wizard/execute', [InventoryImportWizardController::class, 'execute']);
    Route::get('inventory/import-wizard/history', [InventoryImportWizardController::class, 'history']);
    Route::get('inventory/import-wizard/system-fields', [InventoryImportWizardController::class, 'systemFields']);
});
