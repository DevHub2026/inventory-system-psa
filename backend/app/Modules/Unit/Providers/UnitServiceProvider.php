<?php

namespace App\Modules\Unit\Providers;

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
        $this->loadRoutesFrom(__DIR__.'/../Routes/api.php');
    }
}
