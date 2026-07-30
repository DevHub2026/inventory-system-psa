<?php

namespace App\Modules\QrScan\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class QrScanServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Route::middleware('api')
            ->prefix('api/v1')
            ->group(base_path('app/Modules/QrScan/Routes/api.php'));
    }
}
