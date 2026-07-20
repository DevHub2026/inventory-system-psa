<?php

use App\Modules\AuditLog\Controllers\AuditLogController;
use Illuminate\Support\Facades\Route;

Route::middleware([
    'auth:sanctum',
    'role:Super Administrator,System Administrator,Auditor',
])->group(function (): void {
    Route::get('audit-logs', [AuditLogController::class, 'index']);
    Route::get('audit-logs/user/{userId}', [AuditLogController::class, 'userActivity']);
    Route::get('audit-logs/module/{module}', [AuditLogController::class, 'moduleActivity']);
});
