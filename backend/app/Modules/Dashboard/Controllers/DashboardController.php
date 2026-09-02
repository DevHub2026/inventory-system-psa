<?php

namespace App\Modules\Dashboard\Controllers;

use App\Modules\Asset\Traits\RespondsWithJson;
use App\Modules\Dashboard\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class DashboardController extends Controller
{
    use RespondsWithJson;

    public function __construct(private readonly DashboardService $dashboardService) {}

    public function stats(Request $request): JsonResponse
    {
        // Pass the authenticated user so the service can apply role-based
        // scoping. Employees receive only their own aggregate metrics.
        $stats = $this->dashboardService->getStats($request->all(), $request->user());

        return $this->success($stats, 'Dashboard statistics retrieved successfully.');
    }

    public function analytics(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user && $this->dashboardService->isEmployeeOnly($user)) {
            return $this->error('You are not authorized to view system-wide dashboard analytics.', null, 403);
        }

        $analytics = $this->dashboardService->getAnalytics($request->all(), $user);

        return $this->success($analytics, 'Dashboard analytics retrieved successfully.');
    }

    public function recentActivity(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user && $this->dashboardService->isEmployeeOnly($user)) {
            return $this->error('You are not authorized to view system-wide dashboard activity.', null, 403);
        }

        $activity = $this->dashboardService->getRecentActivity($user);

        return $this->success($activity, 'Recent activity retrieved successfully.');
    }

    public function lowStock(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user && $this->dashboardService->isEmployeeOnly($user)) {
            return $this->error('You are not authorized to view low-stock dashboard data.', null, 403);
        }

        $items = $this->dashboardService->getLowStockItems($request->all(), $user);

        return $this->success($items, 'Low stock items retrieved successfully.');
    }

    public function overdueAssets(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user && $this->dashboardService->isEmployeeOnly($user)) {
            return $this->error('You are not authorized to view overdue dashboard data.', null, 403);
        }

        $assets = $this->dashboardService->getOverdueAssets($request->all(), $user);

        return $this->success($assets, 'Overdue assets retrieved successfully.');
    }
}
