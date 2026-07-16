<?php

namespace App\Modules\Report\Services;

use App\Modules\Asset\Models\Asset;
use App\Modules\Borrowing\Models\Borrowing;
use App\Modules\Inventory\Models\InventoryItem;
use App\Modules\Reservation\Models\Reservation;
use Illuminate\Database\Eloquent\Collection;

class ReportService
{
    public function getAssetReport(array $filters = []): Collection
    {
        $query = Asset::query()->with(['category', 'manufacturer', 'office', 'location']);

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['category_id'])) {
            $query->where('asset_category_id', $filters['category_id']);
        }

        if (isset($filters['office_id'])) {
            $query->where('office_id', $filters['office_id']);
        }

        return $query->orderByDesc('created_at')->get();
    }

    public function getBorrowingReport(array $filters = []): Collection
    {
        $query = Borrowing::query()->with(['user', 'asset']);

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['from_date'])) {
            $query->where('borrow_date', '>=', $filters['from_date']);
        }

        if (isset($filters['to_date'])) {
            $query->where('borrow_date', '<=', $filters['to_date']);
        }

        return $query->orderByDesc('borrow_date')->get();
    }

    public function getReservationReport(array $filters = []): Collection
    {
        $query = Reservation::query()->with(['user', 'assets']);

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['from_date'])) {
            $query->where('start_date', '>=', $filters['from_date']);
        }

        if (isset($filters['to_date'])) {
            $query->where('end_date', '<=', $filters['to_date']);
        }

        return $query->orderByDesc('created_at')->get();
    }

    public function getInventoryReport(array $filters = []): Collection
    {
        $query = InventoryItem::query();

        if (isset($filters['low_stock'])) {
            $query->whereColumn('quantity', '<=', 'reorder_level');
        }

        return $query->orderByDesc('created_at')->get();
    }

    public function getOverdueItemsReport(): Collection
    {
        return Borrowing::query()
            ->with(['user', 'asset'])
            ->where('status', 'BORROWED')
            ->where('due_date', '<', now())
            ->orderBy('due_date', 'asc')
            ->get();
    }

    public function getLowStockReport(): Collection
    {
        return InventoryItem::query()
            ->whereColumn('quantity', '<=', 'reorder_level')
            ->where('reorder_level', '>', 0)
            ->orderBy('quantity', 'asc')
            ->get();
    }

    public function getUserActivityReport(array $filters = []): Collection
    {
        $query = Borrowing::query()->with(['user', 'asset']);

        if (isset($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (isset($filters['from_date'])) {
            $query->where('created_at', '>=', $filters['from_date']);
        }

        if (isset($filters['to_date'])) {
            $query->where('created_at', '<=', $filters['to_date']);
        }

        return $query->orderByDesc('created_at')->get();
    }
}
