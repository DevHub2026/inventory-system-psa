<?php

use App\Modules\Department\Controllers\DepartmentController;
use Illuminate\Support\Facades\Route;

Route::middleware([
    'auth:sanctum',
    'role:Super Administrator,System Administrator',
])->group(function (): void {
    Route::apiResource('departments', DepartmentController::class);
});
