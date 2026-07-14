<?php

namespace App\Modules\Asset\Providers;

use App\Modules\Asset\Models\Asset;
use App\Modules\Asset\Policies\AssetPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class AssetServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Gate::policy(Asset::class, AssetPolicy::class);

        Route::middleware('api')
            ->prefix('api/v1')
            ->group(__DIR__.'/../Routes/api.php');
    }
}
