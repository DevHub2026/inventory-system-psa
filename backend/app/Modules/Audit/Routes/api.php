<?php

use App\Modules\Audit\Controllers\AuditController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('audit-logs', [AuditController::class, 'index']);
    Route::get('audit-logs/user/{userId}', [AuditController::class, 'userActivity']);
    Route::get('audit-logs/module/{module}', [AuditController::class, 'moduleActivity']);
});
