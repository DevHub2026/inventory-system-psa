<?php

namespace App\Modules\Department\Providers;

use Illuminate\Support\ServiceProvider;

class DepartmentServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(
            \App\Modules\Department\Repositories\Contracts\DepartmentRepositoryInterface::class,
            \App\Modules\Department\Repositories\DepartmentRepository::class
        );
    }

    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__.'/../Routes/api.php');
    }
}
