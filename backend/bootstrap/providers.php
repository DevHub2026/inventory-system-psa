<?php

use App\Modules\Asset\Providers\AssetServiceProvider;
use App\Modules\Auth\Providers\AuthServiceProvider;
use App\Modules\Borrowing\Providers\BorrowingServiceProvider;
use App\Modules\Inventory\Providers\InventoryServiceProvider;
use App\Modules\Reservation\Providers\ReservationServiceProvider;
use App\Providers\AppServiceProvider;

return [
    AppServiceProvider::class,
    AssetServiceProvider::class,
    AuthServiceProvider::class,
    ReservationServiceProvider::class,
    BorrowingServiceProvider::class,
    InventoryServiceProvider::class,
];