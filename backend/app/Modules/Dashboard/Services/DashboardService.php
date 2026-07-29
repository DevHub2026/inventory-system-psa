<?php

namespace App\Modules\Dashboard\Services;

use App\Enums\UserRole;
use App\Models\User;
use App\Modules\Asset\Enums\AssetStatus;
use App\Modules\Asset\Models\Asset;
use App\Modules\Borrowing\Models\Borrowing;
use App\Modules\Inventory\Models\InventoryItem;
use App\Modules\Reservation\Models\Reservation;

class DashboardService
{
    public function getStats(array $filters = []): array
    {
        $assetQuery = Asset::query();
        
        // Apply filters to asset queries
        if (! empty($filters['office_id'])) {
            $assetQuery->where('office_id', $filters['office_id']);
        }
        if (! empty($filters['location_id'])) {
            $assetQuery->where('location_id', $filters['location_id']);
        }
        if (! empty($filters['manufacturer_id'])) {
            $assetQuery->where('manufacturer_id', $filters['manufacturer_id']);
        }
        if (! empty($filters['asset_category_id'])) {
            $assetQuery->where('asset_category_id', $filters['asset_category_id']);
        }

        $totalAssets = (clone $assetQuery)->count();
        $available = (clone $assetQuery)->where('status', AssetStatus::AVAILABLE)->count();
        $borrowed = (clone $assetQuery)->where('status', AssetStatus::BORROWED)->count();
        $reserved = (clone $assetQuery)->where('status', AssetStatus::RESERVED)->count();
        $maintenance = (clone $assetQuery)->where('status', AssetStatus::MAINTENANCE)->count();
        $reissuedThisMonth = \App\Modules\Asset\Models\AssetIssuanceHistory::whereMonth('transfer_date', now()->month)->whereYear('transfer_date', now()->year)->count();

        $inventoryBase = InventoryItem::query();
        
        // Apply filters to inventory queries
        if (! empty($filters['office_id'])) {
            $inventoryBase->where('office_id', $filters['office_id']);
        }
        if (! empty($filters['location_id'])) {
            $inventoryBase->where('location_id', $filters['location_id']);
        }
        if (! empty($filters['manufacturer_id'])) {
            $inventoryBase->where('manufacturer_id', $filters['manufacturer_id']);
        }

        $inventoryTotal = (clone $inventoryBase)->count();
        $inventoryExpendable = (clone $inventoryBase)->where('type', 'expendable')->count();
        $inventoryNonExpendable = (clone $inventoryBase)->where('type', 'non_expendable')->count();
        $inventoryOutOfStock = (clone $inventoryBase)->where('quantity', '<=', 0)->count();
        $inventoryLowStock = (clone $inventoryBase)
            ->where('quantity', '>', 0)
            ->whereNotNull('reorder_level')
            ->whereColumn('quantity', '<=', 'reorder_level')
            ->count();

        $borrowingActive = Borrowing::query()->where('status', 'BORROWED')->count();
        $borrowingReturned = Borrowing::query()->where('status', 'RETURNED')->count();

        $reservationPending = Reservation::query()->where('status', 'PENDING')->count();
        $reservationApproved = Reservation::query()->where('status', 'APPROVED')->count();
        $reservationRejected = Reservation::query()->where('status', 'REJECTED')->count();

        $adminRoles = [
            UserRole::SUPER_ADMINISTRATOR->value,
            UserRole::SYSTEM_ADMINISTRATOR->value,
        ];
        $staffRoles = [
            UserRole::PROPERTY_CUSTODIAN->value,
            UserRole::INVENTORY_OFFICER->value,
            UserRole::DEPARTMENT_HEAD->value,
            UserRole::AUDITOR->value,
        ];
        $employeeRoles = [
            UserRole::EMPLOYEE->value,
        ];

        $usersTotal = User::query()->count();
        $usersActive = User::query()->where('status', 'active')->count();
        $usersAdministrators = User::query()
            ->whereHas('roles', fn ($q) => $q->whereIn('name', $adminRoles))
            ->count();
        $usersStaff = User::query()
            ->whereHas('roles', fn ($q) => $q->whereIn('name', $staffRoles))
            ->count();
        $usersEmployees = User::query()
            ->whereHas('roles', fn ($q) => $q->whereIn('name', $employeeRoles))
            ->count();

        return [
            // Nested groups (preferred)
            'assets' => [
                'total' => $totalAssets,
                'available' => $available,
                'borrowed' => $borrowed,
                'reserved' => $reserved,
                'maintenance' => $maintenance,
                'reissued_this_month' => $reissuedThisMonth,
            ],
            'inventory' => [
                'total' => $inventoryTotal,
                'expendable' => $inventoryExpendable,
                'non_expendable' => $inventoryNonExpendable,
                'low_stock' => $inventoryLowStock,
                'out_of_stock' => $inventoryOutOfStock,
            ],
            'borrowings' => [
                'active' => $borrowingActive,
                'returned' => $borrowingReturned,
                'pending_requests' => $reservationPending,
                'approved_requests' => $reservationApproved,
            ],
            'reservations' => [
                'pending' => $reservationPending,
                'approved' => $reservationApproved,
                'rejected' => $reservationRejected,
            ],
            'users' => [
                'total' => $usersTotal,
                'active' => $usersActive,
                'employees' => $usersEmployees,
                'staff' => $usersStaff,
                'administrators' => $usersAdministrators,
            ],

            // Flat aliases kept for existing consumers/tests
            'total_assets' => $totalAssets,
            'available' => $available,
            'borrowed' => $borrowed,
            'reserved' => $reserved,
            'maintenance' => $maintenance,
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
            $action = match ($borrowing->status) {
                'RETURNED' => 'Returned',
                'BORROWED' => 'Borrowed',
                default => ucfirst(strtolower((string) $borrowing->status)),
            };

            $activities[] = [
                'id' => 'borrowing-'.$borrowing->id,
                'action' => $action,
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
            $action = match ($reservation->status) {
                'PENDING' => 'Borrow Request Submitted',
                'APPROVED' => 'Borrow Request Approved',
                'REJECTED' => 'Borrow Request Rejected',
                'CANCELLED' => 'Borrow Request Cancelled',
                default => ucfirst(strtolower((string) $reservation->status)),
            };

            $activities[] = [
                'id' => 'reservation-'.$reservation->id,
                'action' => $action,
                'user' => ($reservation->user?->full_name ?: $reservation->user?->email) ?? 'Unknown',
                'module' => 'Reservation',
                'created_at' => $reservation->created_at->format('Y-m-d H:i:s'),
            ];
        }

        usort($activities, fn ($a, $b) => strtotime($b['created_at']) <=> strtotime($a['created_at']));

        return array_slice($activities, 0, 10);
    }

    public function getLowStockItems(array $filters = []): array
    {
        $query = InventoryItem::query()
            ->where('quantity', '>', 0)
            ->whereNotNull('reorder_level')
            ->whereColumn('quantity', '<=', 'reorder_level');
        
        // Apply filters
        if (! empty($filters['office_id'])) {
            $query->where('office_id', $filters['office_id']);
        }
        if (! empty($filters['location_id'])) {
            $query->where('location_id', $filters['location_id']);
        }
        if (! empty($filters['manufacturer_id'])) {
            $query->where('manufacturer_id', $filters['manufacturer_id']);
        }

        return $query
            ->with(['unit', 'office', 'location', 'manufacturer'])
            ->orderBy('quantity')
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'name' => $item->name,
                'sku' => $item->sku,
                'quantity' => $item->quantity,
                'reorder_level' => $item->reorder_level,
                'unit' => $item->unit?->name ?? $item->unit,
                'office' => $item->office?->name,
                'location' => $item->location?->name,
                'manufacturer' => $item->manufacturer?->name,
            ])
            ->toArray();
    }

    public function getOverdueAssets(array $filters = []): array
    {
        $query = Borrowing::query()
            ->with(['user', 'asset'])
            ->where('status', 'BORROWED')
            ->whereNotNull('due_date')
            ->where('due_date', '<', now()->toDateString());
        
        // Apply filters via asset relationship
        if (! empty($filters['office_id'])) {
            $query->whereHas('asset', fn ($q) => $q->where('office_id', $filters['office_id']));
        }
        if (! empty($filters['location_id'])) {
            $query->whereHas('asset', fn ($q) => $q->where('location_id', $filters['location_id']));
        }
        if (! empty($filters['manufacturer_id'])) {
            $query->whereHas('asset', fn ($q) => $q->where('manufacturer_id', $filters['manufacturer_id']));
        }
        if (! empty($filters['asset_category_id'])) {
            $query->whereHas('asset', fn ($q) => $q->where('asset_category_id', $filters['asset_category_id']));
        }

        return $query
            ->orderBy('due_date')
            ->get()
            ->map(fn ($borrowing) => [
                'id' => $borrowing->id,
                'asset_name' => $borrowing->asset->name ?? 'Unknown',
                'asset_number' => $borrowing->asset->asset_number ?? 'Unknown',
                'borrower' => ($borrowing->user?->full_name ?: $borrowing->user?->email) ?? 'Unknown',
                'due_date' => $borrowing->due_date?->format('Y-m-d'),
                'days_overdue' => (int) abs(now()->startOfDay()->diffInDays($borrowing->due_date->startOfDay())),
            ])
            ->toArray();
    }
}
