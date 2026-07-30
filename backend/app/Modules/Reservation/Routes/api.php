<?php

use App\Modules\Reservation\Controllers\ReservationController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('reservations', [ReservationController::class, 'index']);
    Route::post('reservations', [ReservationController::class, 'store']);
    Route::post('reservations/scan-authorize', [ReservationController::class, 'scanAuthorize'])
        ->middleware('role:Super Administrator,System Administrator,Property Custodian,Inventory Officer,Department Head');
    Route::post('reservations/{reservation}/approve', [ReservationController::class, 'approve'])
        ->middleware('role:Super Administrator,System Administrator,Property Custodian,Inventory Officer,Department Head');
    Route::post('reservations/{reservation}/release', [ReservationController::class, 'release'])
        ->middleware('role:Super Administrator,System Administrator,Property Custodian,Inventory Officer,Department Head');
    Route::post('reservations/{reservation}/reject', [ReservationController::class, 'reject'])
        ->middleware('role:Super Administrator,System Administrator,Property Custodian,Inventory Officer,Department Head');
    Route::post('reservations/{reservation}/cancel', [ReservationController::class, 'cancel']);
});
