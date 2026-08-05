<?php

use App\Modules\Auth\Controllers\AuditLogController;
use App\Modules\Auth\Controllers\SessionController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('sessions', [SessionController::class, 'index']);
    Route::post('sessions/{id}/revoke', [SessionController::class, 'revoke']);
    Route::post('sessions/revoke-all', [SessionController::class, 'revokeAll']);
    
    // Audit logs - admin only
    Route::middleware('role:Super Administrator,System Administrator')->group(function (): void {
        Route::get('audit-logs', [AuditLogController::class, 'index']);
        Route::get('audit-logs/{auditLog}', [AuditLogController::class, 'show']);
    });
});
