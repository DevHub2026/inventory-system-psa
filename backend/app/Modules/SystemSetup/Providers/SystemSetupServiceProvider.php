<?php

namespace App\Modules\SystemSetup\Providers;

use App\Modules\SystemSetup\Models\DocumentTemplate;
use App\Modules\SystemSetup\Policies\DocumentTemplatePolicy;
use App\Modules\SystemSetup\Repositories\Contracts\DocumentTemplateRepositoryInterface;
use App\Modules\SystemSetup\Repositories\DocumentTemplateRepository;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class SystemSetupServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Bind the repository interface to the concrete implementation
        $this->app->bind(
            DocumentTemplateRepositoryInterface::class,
            DocumentTemplateRepository::class,
        );
    }

    public function boot(): void
    {
        Gate::policy(DocumentTemplate::class, DocumentTemplatePolicy::class);

        Route::middleware('api')
            ->prefix('api/v1')
            ->group(__DIR__.'/../Routes/api.php');
    }
}
