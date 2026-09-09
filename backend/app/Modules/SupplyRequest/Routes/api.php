<?php

use App\Modules\SupplyRequest\Controllers\SupplyRequestController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('supply-requests', [SupplyRequestController::class, 'index']);
    Route::post('supply-requests', [SupplyRequestController::class, 'store']);
    Route::get('supply-requests/{supplyRequest}', [SupplyRequestController::class, 'show']);
    
    Route::post('supply-requests/{supplyRequest}/approve', [SupplyRequestController::class, 'approve']);
    Route::post('supply-requests/{supplyRequest}/reject', [SupplyRequestController::class, 'reject']);
    Route::post('supply-requests/{supplyRequest}/cancel', [SupplyRequestController::class, 'cancel']);
    
    Route::post('supply-requests/{supplyRequest}/fulfill', [SupplyRequestController::class, 'fulfill']);
});
