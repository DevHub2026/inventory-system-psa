<?php

use App\Modules\Borrowing\Controllers\BorrowExtensionController;
use App\Modules\Borrowing\Controllers\BorrowingController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('borrowings', [BorrowingController::class, 'index']);
    Route::post('borrowings', [BorrowingController::class, 'store']);
    Route::post('assets/scan', [BorrowingController::class, 'scan']);
    Route::post('borrowings/{borrowing}/return', [BorrowingController::class, 'return']);

    // Employee QR scan to create a borrow request (PENDING reservation)
    Route::post('assets/request-borrow', [BorrowingController::class, 'requestBorrow']);

    // Borrow Extension Requests
    Route::get('borrowings/{borrowing}/extension-requests', [BorrowExtensionController::class, 'index']);
    Route::post('borrowings/{borrowing}/extension-requests', [BorrowExtensionController::class, 'store']);
    Route::patch('extension-requests/{extensionRequest}/approve', [BorrowExtensionController::class, 'approve']);
    Route::patch('extension-requests/{extensionRequest}/reject', [BorrowExtensionController::class, 'reject']);
    Route::get('extension-requests/pending-count', [BorrowExtensionController::class, 'pendingCount']);
});