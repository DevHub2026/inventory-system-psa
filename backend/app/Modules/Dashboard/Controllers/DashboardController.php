<?php

namespace App\Modules\Dashboard\Controllers;

use App\Modules\Asset\Traits\RespondsWithJson;
use App\Modules\Dashboard\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class DashboardController extends Controller
{
    use RespondsWithJson;

    public function __construct(private readonly DashboardService $dashboardService) {}

    public function stats(): JsonResponse
    {
        $stats = $this->dashboardService->getStats();

        return $this->success($stats, 'Dashboard statistics retrieved successfully.');
    }

    public function recentActivity(): JsonResponse
    {
        $activity = $this->dashboardService->getRecentActivity();

        return $this->success($activity, 'Recent activity retrieved successfully.');
    }

    public function lowStock(): JsonResponse
    {
        $items = $this->dashboardService->getLowStockItems();

        return $this->success($items, 'Low stock items retrieved successfully.');
    }

    public function overdueAssets(): JsonResponse
    {
        $assets = $this->dashboardService->getOverdueAssets();

        return $this->success($assets, 'Overdue assets retrieved successfully.');
    }
}
