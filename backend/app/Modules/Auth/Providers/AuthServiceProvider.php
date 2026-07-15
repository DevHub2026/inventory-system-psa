<?php

namespace App\Modules\Auth\Providers;

use App\Modules\Auth\Repositories\Contracts\PermissionRepositoryInterface;
use App\Modules\Auth\Repositories\Contracts\RoleRepositoryInterface;
use App\Modules\Auth\Repositories\Contracts\UserRepositoryInterface;
use App\Modules\Auth\Repositories\PermissionRepository;
use App\Modules\Auth\Repositories\RoleRepository;
use App\Modules\Auth\Repositories\UserRepository;
use Illuminate\Support\ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
        $this->app->bind(RoleRepositoryInterface::class, RoleRepository::class);
        $this->app->bind(PermissionRepositoryInterface::class, PermissionRepository::class);
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
