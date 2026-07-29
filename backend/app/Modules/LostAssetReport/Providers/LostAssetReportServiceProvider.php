<?php

namespace App\Modules\LostAssetReport\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class LostAssetReportServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Route::middleware('api')
            ->prefix('api/v1')
            ->group(base_path('app/Modules/LostAssetReport/Routes/api.php'));
    }
}
