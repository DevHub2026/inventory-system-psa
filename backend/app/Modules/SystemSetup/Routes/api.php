<?php

use App\Modules\SystemSetup\Controllers\DocumentTemplateController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function (): void {
    // Document type listing (any authenticated user)
    Route::get('document-templates/types', [DocumentTemplateController::class, 'documentTypes']);

    // Templates by document type (any authenticated user)
    Route::get('document-templates/type/{type}', [DocumentTemplateController::class, 'byType']);

    // Full CRUD — admin only
    Route::middleware('role:Super Administrator,System Administrator')->group(function (): void {
        Route::post('document-templates', [DocumentTemplateController::class, 'store']);
        Route::put('document-templates/{template}', [DocumentTemplateController::class, 'update']);
        Route::delete('document-templates/{template}', [DocumentTemplateController::class, 'destroy']);
        Route::post('document-templates/{template}/set-default', [DocumentTemplateController::class, 'setDefault']);
        Route::post('document-templates/{template}/restore-default', [DocumentTemplateController::class, 'restoreDefault']);
        Route::post('document-templates/{template}/toggle-status', [DocumentTemplateController::class, 'toggleStatus']);
        Route::post('document-templates/{template}/duplicate', [DocumentTemplateController::class, 'duplicate']);
    });

    // Read access for all authenticated users
    Route::get('document-templates', [DocumentTemplateController::class, 'index']);
    Route::get('document-templates/{template}', [DocumentTemplateController::class, 'show']);

    // Download / preview — any authenticated user
    Route::get('document-templates/{template}/download', [DocumentTemplateController::class, 'download']);
    Route::get('document-templates/{template}/preview', [DocumentTemplateController::class, 'preview']);
});
