<?php

use App\Modules\Unit\Controllers\UnitController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function (): void {
    // All authenticated users can READ units (needed for the Inventory form
    // Unit-of-Measure dropdown).
    Route::get('units', [UnitController::class, 'index'])->name('units.index');
    Route::get('units/{unit}', [UnitController::class, 'show'])->name('units.show');

    // Creating, updating, and deleting units is restricted to administrators
    // and system setup roles.
    Route::middleware([
        'role:Super Administrator,System Administrator,Property Custodian,Inventory Officer',
    ])->group(function (): void {
        Route::post('units', [UnitController::class, 'store'])->name('units.store');
        Route::put('units/{unit}', [UnitController::class, 'update'])->name('units.update');
        Route::patch('units/{unit}', [UnitController::class, 'update']);
        Route::delete('units/{unit}', [UnitController::class, 'destroy'])->name('units.destroy');
    });
});
