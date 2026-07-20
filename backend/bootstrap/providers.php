<?php

use App\Modules\Asset\Providers\AssetServiceProvider;
use App\Modules\AssetIdentifier\Providers\AssetIdentifierServiceProvider;
use App\Modules\Auth\Providers\AuthServiceProvider;
use App\Modules\AuditLog\Providers\AuditLogServiceProvider;
use App\Modules\Borrowing\Providers\BorrowingServiceProvider;
use App\Modules\Dashboard\Providers\DashboardServiceProvider;
use App\Modules\Inventory\Providers\InventoryServiceProvider;
use App\Modules\Maintenance\Providers\MaintenanceServiceProvider;
use App\Modules\Report\Providers\ReportServiceProvider;
use App\Modules\Reservation\Providers\ReservationServiceProvider;
use App\Providers\AppServiceProvider;

return [
    AppServiceProvider::class,
    AssetServiceProvider::class,
    AssetIdentifierServiceProvider::class,
    AuthServiceProvider::class,
    ReservationServiceProvider::class,
    BorrowingServiceProvider::class,
    InventoryServiceProvider::class,
    DashboardServiceProvider::class,
    ReportServiceProvider::class,
    AuditLogServiceProvider::class,
    MaintenanceServiceProvider::class,
];