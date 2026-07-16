<?php

namespace App\Modules\Reservation\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class ReservationServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Route::middleware('api')
            ->prefix('api/v1')
            ->group(__DIR__.'/../Routes/api.php');
    }
}
