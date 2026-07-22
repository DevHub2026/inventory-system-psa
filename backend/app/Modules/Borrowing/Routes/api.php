<?php

use App\Modules\Borrowing\Controllers\BorrowingController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('borrowings', [BorrowingController::class, 'index']);
    Route::post('borrowings', [BorrowingController::class, 'store']);
    Route::post('assets/scan', [BorrowingController::class, 'scan']);
    Route::post('borrowings/{borrowing}/return', [BorrowingController::class, 'return']);
});
