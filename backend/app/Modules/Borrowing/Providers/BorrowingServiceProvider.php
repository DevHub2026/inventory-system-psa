<?php

namespace App\Modules\Borrowing\Providers;

use App\Modules\Borrowing\Repositories\BorrowExtensionRequestRepository;
use App\Modules\Borrowing\Repositories\Contracts\BorrowExtensionRequestRepositoryInterface;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class BorrowingServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(
            BorrowExtensionRequestRepositoryInterface::class,
            BorrowExtensionRequestRepository::class,
        );
    }

    public function boot(): void
    {
        Route::middleware('api')
            ->prefix('api/v1')
            ->group(__DIR__.'/../Routes/api.php');
    }
}
