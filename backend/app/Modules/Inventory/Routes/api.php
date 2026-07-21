<?php

use App\Modules\Inventory\Controllers\InventoryController;
use Illuminate\Support\Facades\Route;

Route::middleware([
    'auth:sanctum',
    'role:Super Administrator,System Administrator,Property Custodian,Inventory Officer,Department Head',
])->group(function (): void {
    Route::get('inventory', [InventoryController::class, 'index']);
    Route::post('inventory', [InventoryController::class, 'store']);
    Route::put('inventory/{item}', [InventoryController::class, 'update']);
    Route::delete('inventory/{item}', [InventoryController::class, 'destroy']);
    Route::post('inventory/{item}/stock-in', [InventoryController::class, 'stockIn']);
    Route::post('inventory/{item}/stock-out', [InventoryController::class, 'stockOut']);
    Route::post('inventory/{item}/adjust', [InventoryController::class, 'adjust']);
    Route::get('inventory/{item}/history', [InventoryController::class, 'history']);
});
