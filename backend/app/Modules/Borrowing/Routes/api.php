<?php

use App\Modules\Borrowing\Controllers\BorrowingController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('borrowings', [BorrowingController::class, 'index']);
    Route::post('borrowings', [BorrowingController::class, 'store']);
    Route::post('borrowings/{borrowing}/return', [BorrowingController::class, 'return'])
        ->middleware('role:Super Administrator,System Administrator,Property Custodian,Inventory Officer,Department Head');
});
