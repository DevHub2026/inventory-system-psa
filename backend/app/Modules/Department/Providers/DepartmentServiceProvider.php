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
        // Register department routes under the standard API prefix and middleware
        // to be consistent with other modules (e.g., AssetServiceProvider).
        \Illuminate\Support\Facades\Route::middleware('api')
            ->prefix('api/v1')
            ->group(__DIR__.'/../Routes/api.php');
    }
}
