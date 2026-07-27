<?php

use App\Modules\Import\Controllers\ImportWizardController;
use Illuminate\Support\Facades\Route;

Route::middleware([
    'auth:sanctum',
    'role:Super Administrator,System Administrator,Property Custodian,Inventory Officer,Department Head',
])->prefix('imports')->group(function (): void {
    Route::get('types', [ImportWizardController::class, 'types']);
    Route::get('{type}/configuration', [ImportWizardController::class, 'configuration']);
    Route::post('upload', [ImportWizardController::class, 'upload']);
    Route::post('validate-mapping', [ImportWizardController::class, 'validateMapping']);
    Route::post('validate-data', [ImportWizardController::class, 'validateData']);
    Route::post('execute', [ImportWizardController::class, 'execute']);
    Route::get('history', [ImportWizardController::class, 'history']);
});
