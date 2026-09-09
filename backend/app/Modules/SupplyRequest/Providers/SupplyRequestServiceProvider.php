<?php

namespace App\Modules\SupplyRequest\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class SupplyRequestServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Route::prefix('api/v1')
            ->middleware('api')
            ->group(__DIR__ . '/../Routes/api.php');
    }
}
