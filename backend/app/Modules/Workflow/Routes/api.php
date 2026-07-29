<?php

use App\Modules\Workflow\Controllers\WorkflowController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function (): void {
    // Module metadata & request histories — accessible to authenticated users
    Route::get('workflows/modules', [WorkflowController::class, 'modules']);
    Route::get('workflows/request-history', [WorkflowController::class, 'requestHistory']);

    // Admin-only management endpoints
    Route::middleware('role:Super Administrator,System Administrator')->group(function (): void {
        Route::get('workflows', [WorkflowController::class, 'index']);
        Route::post('workflows', [WorkflowController::class, 'store']);
        Route::get('workflows/{workflow}', [WorkflowController::class, 'show']);
        Route::put('workflows/{workflow}', [WorkflowController::class, 'update']);
        Route::post('workflows/{workflow}/duplicate', [WorkflowController::class, 'duplicate']);
        Route::post('workflows/{workflow}/archive', [WorkflowController::class, 'archive']);
        Route::post('workflows/{workflow}/restore', [WorkflowController::class, 'restore']);
        Route::post('workflows/{workflow}/toggle-status', [WorkflowController::class, 'toggleStatus']);
        Route::get('workflows/{workflow}/versions', [WorkflowController::class, 'versions']);
        Route::get('workflows/{workflow}/audit-logs', [WorkflowController::class, 'auditLogs']);
    });
});
