<?php

namespace App\Modules\Dashboard\Services;

use App\Modules\Asset\Models\Asset;
use App\Modules\Borrowing\Models\Borrowing;
use App\Modules\Inventory\Models\InventoryItem;
use App\Modules\Reservation\Models\Reservation;

class DashboardService
{
    public function getStats(): array
    {
        return [
            'total_assets' => Asset::query()->count(),
            'available' => Asset::query()->where('status', 'AVAILABLE')->count(),
            'borrowed' => Asset::query()->where('status', 'BORROWED')->count(),
            'reserved' => Asset::query()->where('status', 'RESERVED')->count(),
            'maintenance' => Asset::query()->where('status', 'MAINTENANCE')->count(),
        ];
    }

    public function getRecentActivity(): array
    {
        $activities = [];

        $borrowings = Borrowing::query()
            ->with('user')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get();

        foreach ($borrowings as $borrowing) {
            $activities[] = [
                'id' => $borrowing->id,
                'action' => $borrowing->status === 'BORROWED' ? 'Borrowed' : 'Returned',
                'user' => ($borrowing->user?->full_name ?: $borrowing->user?->email) ?? 'Unknown',
                'module' => 'Borrowing',
                'created_at' => $borrowing->created_at->format('Y-m-d H:i:s'),
            ];
        }

        $reservations = Reservation::query()
            ->with('user')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get();

        foreach ($reservations as $reservation) {
            $activities[] = [
                'id' => $reservation->id,
                'action' => $reservation->status === 'PENDING' ? 'Reserved' : 'Approved',
                'user' => ($reservation->user?->full_name ?: $reservation->user?->email) ?? 'Unknown',
                'module' => 'Reservation',
                'created_at' => $reservation->created_at->format('Y-m-d H:i:s'),
            ];
        }

        usort($activities, fn ($a, $b) => strtotime($b['created_at']) - strtotime($a['created_at']));

        return array_slice($activities, 0, 10);
    }

    public function getLowStockItems(): array
    {
        return InventoryItem::query()
            ->whereColumn('quantity', '<=', 'reorder_level')
            ->where('reorder_level', '>', 0)
            ->orderBy('quantity', 'asc')
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'name' => $item->name,
                'sku' => $item->sku,
                'quantity' => $item->quantity,
                'reorder_level' => $item->reorder_level,
                'unit' => $item->unit,
            ])
            ->toArray();
    }

    public function getOverdueAssets(): array
    {
        return Borrowing::query()
            ->with(['user', 'asset'])
            ->where('status', 'BORROWED')
            ->where('due_date', '<', now())
            ->orderBy('due_date', 'asc')
            ->get()
            ->map(fn ($borrowing) => [
                'id' => $borrowing->id,
                'asset_name' => $borrowing->asset->name ?? 'Unknown',
                'borrower' => ($borrowing->user?->full_name ?: $borrowing->user?->email) ?? 'Unknown',
                'due_date' => $borrowing->due_date?->format('Y-m-d'),
                'days_overdue' => abs(now()->diffInDays($borrowing->due_date)),
            ])
            ->toArray();
    }
}
