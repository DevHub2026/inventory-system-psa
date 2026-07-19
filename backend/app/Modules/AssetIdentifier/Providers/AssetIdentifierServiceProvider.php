<?php

namespace App\Modules\AssetIdentifier\Providers;

use Illuminate\Support\ServiceProvider;

class AssetIdentifierServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {


        // Module routes are registered via backend/app/Modules/Asset/Routes/api.php
        // (Asset domain routes include asset-identifiers). No additional routing needed here.

    }
}

