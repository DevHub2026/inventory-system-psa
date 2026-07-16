<?php

namespace App\Modules\Maintenance\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class MaintenanceServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Route::middleware('api')
            ->prefix('api/v1')
            ->group(__DIR__.'/../Routes/api.php');
    }
}
