<?php

use App\Modules\Unit\Controllers\UnitController;
use Illuminate\Support\Facades\Route;

Route::middleware([
    'auth:sanctum',
    'role:Super Administrator,System Administrator',
])->group(function (): void {
    Route::apiResource('units', UnitController::class);
});
