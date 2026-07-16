<?php

namespace App\Modules\Dashboard\Controllers;

<<<<<<< HEAD
use App\Http\Controllers\Controller;
use App\Models\Borrow;
use App\Modules\Asset\Enums\AssetStatus;
use App\Modules\Asset\Models\Asset as DomainAsset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function statsAdmin(Request $request): JsonResponse
    {
        return $this->stats($request);
    }

    public function statsStaff(Request $request): JsonResponse
    {
        // Staff dashboard should include: what the staff just borrowed + history for borrowed/returned.
        $base = $this->stats($request)->getData(true);

        $userId = Auth::id();

        $recentBorrowed = Borrow::query()
            ->with(['asset', 'user'])
            ->where('user_id', $userId)
            ->whereNull('returned_at')
            ->latest('borrowed_at')
            ->take(5)
            ->get();

        $historyBorrowed = Borrow::query()
            ->with(['asset', 'user'])
            ->where('user_id', $userId)
            ->whereNotNull('returned_at')
            ->latest('returned_at')
            ->take(10)
            ->get();

        // Provide a consistent payload shape for the frontend.
        $base['data'] = array_merge($base['data'], [
            'recent_borrowed' => $recentBorrowed->map(fn (Borrow $b) => [
                'borrow_id' => $b->id,
                'asset_id' => $b->asset_id,
                'asset' => $b->asset,
                'borrowed_at' => $b->borrowed_at,
                'due_date' => $b->due_date,
            ]),
            'history' => [
                'borrowed' => $recentBorrowed->map(fn (Borrow $b) => [
                    'borrow_id' => $b->id,
                    'asset_id' => $b->asset_id,
                    'asset' => $b->asset,
                    'borrowed_at' => $b->borrowed_at,
                    'due_date' => $b->due_date,
                    'returned_at' => null,
                ]),
                'returned' => $historyBorrowed->map(fn (Borrow $b) => [
                    'borrow_id' => $b->id,
                    'asset_id' => $b->asset_id,
                    'asset' => $b->asset,
                    'borrowed_at' => $b->borrowed_at,
                    'due_date' => $b->due_date,
                    'returned_at' => $b->returned_at,
                ]),
            ],
        ]);

        return response()->json($base);
    }

    public function recent(Request $request): JsonResponse
    {
        // Recent activity feed (shared by DashboardPage):
        // - staff: show their own borrowed/returned history
        // - admin: show empty or future global feed. For now we return staff-like data.
        $userId = Auth::id();

        $recent = Borrow::query()
            ->with(['asset', 'user'])
            ->where('user_id', $userId)
            ->latest('borrowed_at')
            ->take(10)
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Recent activity retrieved successfully.',
            'data' => $recent->map(fn (Borrow $b) => [
                'borrow_id' => $b->id,
                'asset_id' => $b->asset_id,
                'asset' => $b->asset,
                'borrowed_at' => $b->borrowed_at,
                'returned_at' => $b->returned_at,
            ]),
        ]);
    }

    private function stats(Request $request): JsonResponse
    {
        $query = DomainAsset::query();

        $total = (clone $query)->count();
        $available = (clone $query)->where('status', AssetStatus::AVAILABLE->value)->count();
        $borrowed = (clone $query)->where('status', AssetStatus::BORROWED->value)->count();
        $reserved = (clone $query)->where('status', AssetStatus::RESERVED->value)->count();
        $maintenance = (clone $query)->where('status', AssetStatus::MAINTENANCE->value)->count();

        return response()->json([
            'success' => true,
            'message' => 'Dashboard stats retrieved successfully.',
            'data' => [
                'total_assets' => $total,
                'available' => $available,
                'borrowed' => $borrowed,
                'reserved' => $reserved,
                'maintenance' => $maintenance,
            ],
        ]);
    }
}



=======
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
>>>>>>> a91d3b64a04f5687fe5e91c55609e3ee706d5df9
