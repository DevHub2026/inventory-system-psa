<?php

namespace App\Modules\Unit\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class UnitServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(
            \App\Modules\Unit\Repositories\Contracts\UnitRepositoryInterface::class,
            \App\Modules\Unit\Repositories\UnitRepository::class
        );
    }

    public function boot(): void
    {
        // Load routes under the api/v1 prefix — matching every other module.
        // Using loadRoutesFrom() would register them at /units (no prefix),
        // causing 404s when the frontend requests /api/v1/units.
        Route::middleware('api')
            ->prefix('api/v1')
            ->group(__DIR__.'/../Routes/api.php');
    }
}
