<?php

use App\Modules\Asset\Providers\AssetServiceProvider;
use App\Modules\Auth\Providers\AuthServiceProvider;
use App\Providers\AppServiceProvider;

return [
    AppServiceProvider::class,
    AssetServiceProvider::class,
    AuthServiceProvider::class,
];