<?php

use App\Modules\Reservation\Controllers\ReservationController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('reservations', [ReservationController::class, 'index']);
    Route::post('reservations', [ReservationController::class, 'store']);
    Route::post('reservations/{reservation}/approve', [ReservationController::class, 'approve']);
});
