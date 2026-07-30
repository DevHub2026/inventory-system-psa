<?php

use App\Modules\SystemSetup\Controllers\DocumentTemplateController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('document-templates/types', [DocumentTemplateController::class, 'documentTypes']);
    Route::get('document-templates/placeholders', [DocumentTemplateController::class, 'placeholders']);
    Route::get('document-templates/type/{type}', [DocumentTemplateController::class, 'byType']);

    Route::middleware('role:Super Administrator,System Administrator')->group(function (): void {
        Route::post('document-templates', [DocumentTemplateController::class, 'store']);
        Route::put('document-templates/{template}', [DocumentTemplateController::class, 'update']);
        Route::delete('document-templates/{template}', [DocumentTemplateController::class, 'destroy']);
        Route::post('document-templates/{template}/upload', [DocumentTemplateController::class, 'upload']);
        Route::post('document-templates/{template}/replace', [DocumentTemplateController::class, 'replace']);
        Route::post('document-templates/{template}/validate', [DocumentTemplateController::class, 'validateTemplate']);
        Route::post('document-templates/{template}/activate', [DocumentTemplateController::class, 'activate']);
        Route::post('document-templates/{template}/deactivate', [DocumentTemplateController::class, 'deactivate']);
        Route::post('document-templates/{template}/set-default', [DocumentTemplateController::class, 'setDefault']);
        Route::post('document-templates/{template}/toggle-status', [DocumentTemplateController::class, 'toggleStatus']);
        Route::post('document-templates/{template}/duplicate', [DocumentTemplateController::class, 'duplicate']);
        Route::get('document-templates/{template}/versions', [DocumentTemplateController::class, 'versions']);
        Route::post('document-templates/{template}/versions/{version}/restore', [DocumentTemplateController::class, 'restoreVersion']);
        Route::get('document-templates/{template}/versions/{version}/download', [DocumentTemplateController::class, 'downloadVersion']);
    });

    Route::get('document-templates', [DocumentTemplateController::class, 'index']);
    Route::get('document-templates/{template}', [DocumentTemplateController::class, 'show']);
    Route::get('document-templates/{template}/download', [DocumentTemplateController::class, 'download']);
});
