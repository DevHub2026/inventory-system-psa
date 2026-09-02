<?php

namespace App\Modules\Dashboard\Services;

use App\Enums\UserRole;
use App\Models\User;
use App\Enums\MaintenanceStatus;
use App\Modules\Asset\Enums\AssetStatus;
use App\Modules\Asset\Models\Asset;
use App\Modules\Borrowing\Models\Borrowing;
use App\Modules\Inventory\Models\InventoryItem;
use App\Modules\Maintenance\Models\Maintenance;
use App\Modules\Reservation\Models\Reservation;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    public function getStats(array $filters = [], ?User $user = null): array
    {
        // Determine whether this request is from an Employee.
        // Employees only see their own aggregate metrics; staff and admins see
        // system-wide metrics. The check deliberately mirrors the existing
        // canViewAllBorrowings / canViewAllReservations role lists used in the
        // Borrowing and Reservation services.
        $isEmployee = $user !== null && $this->isEmployeeOnly($user);
        $scopedUserId = $isEmployee ? $user->id : null;

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

        $borrowingActive = Borrowing::query()
            ->where('status', 'BORROWED')
            ->when($scopedUserId, fn ($q) => $q->where('user_id', $scopedUserId))
            ->count();
        $borrowingReturned = Borrowing::query()
            ->where('status', 'RETURNED')
            ->when($scopedUserId, fn ($q) => $q->where('user_id', $scopedUserId))
            ->count();

        $reservationPending = Reservation::query()
            ->where('status', 'PENDING')
            ->when($scopedUserId, fn ($q) => $q->where('user_id', $scopedUserId))
            ->count();
        $reservationApproved = Reservation::query()
            ->where('status', 'APPROVED')
            ->when($scopedUserId, fn ($q) => $q->where('user_id', $scopedUserId))
            ->count();
        $reservationRejected = Reservation::query()
            ->where('status', 'REJECTED')
            ->when($scopedUserId, fn ($q) => $q->where('user_id', $scopedUserId))
            ->count();

        $adminRoles = [
            UserRole::SUPER_ADMINISTRATOR->value,
            UserRole::SYSTEM_ADMINISTRATOR->value,
        ];
        $staffRoles = [
            UserRole::PROPERTY_CUSTODIAN->value,
            UserRole::INVENTORY_OFFICER->value,
            UserRole::DEPARTMENT_HEAD->value,
            UserRole::AUDITOR->value,
            UserRole::SUPPLY_OFFICER->value,
        ];
        $employeeRoles = [
            UserRole::EMPLOYEE->value,
        ];

        // For employees, skip the expensive system-wide user/asset/inventory
        // aggregate queries — they are not authorised to see those figures.
        $usersTotal        = $isEmployee ? null : User::query()->count();
        $usersActive       = $isEmployee ? null : User::query()->where('status', 'active')->count();
        $usersAdministrators = $isEmployee ? null : User::query()
            ->whereHas('roles', fn ($q) => $q->whereIn('name', $adminRoles))
            ->count();
        $usersStaff = $isEmployee ? null : User::query()
            ->whereHas('roles', fn ($q) => $q->whereIn('name', $staffRoles))
            ->count();
        $usersEmployees = $isEmployee ? null : User::query()
            ->whereHas('roles', fn ($q) => $q->whereIn('name', $employeeRoles))
            ->count();

        // Overdue count (active borrowings past due_date).
        // Scoped to the user when employee.
        $overdueCount = Borrowing::query()
            ->where('status', 'BORROWED')
            ->whereNotNull('due_date')
            ->where('due_date', '<', now()->toDateString())
            ->when($scopedUserId, fn ($q) => $q->where('user_id', $scopedUserId))
            ->count();

        $base = [
            // Nested groups (preferred)
            'assets' => [
                'total'               => $isEmployee ? null : $totalAssets,
                'available'           => $isEmployee ? null : $available,
                'borrowed'            => $isEmployee ? null : $borrowed,
                'reserved'            => $isEmployee ? null : $reserved,
                'maintenance'         => $isEmployee ? null : $maintenance,
                'reissued_this_month' => $isEmployee ? null : $reissuedThisMonth,
            ],
            'inventory' => [
                'total'           => $isEmployee ? null : $inventoryTotal,
                'expendable'      => $isEmployee ? null : $inventoryExpendable,
                'non_expendable'  => $isEmployee ? null : $inventoryNonExpendable,
                'low_stock'       => $isEmployee ? null : $inventoryLowStock,
                'out_of_stock'    => $isEmployee ? null : $inventoryOutOfStock,
            ],
            'borrowings' => [
                'active'            => $borrowingActive,
                'returned'          => $borrowingReturned,
                'pending_requests'  => $reservationPending,
                'approved_requests' => $reservationApproved,
                'overdue'           => $overdueCount,
            ],
            'reservations' => [
                'pending'  => $reservationPending,
                'approved' => $reservationApproved,
                'rejected' => $reservationRejected,
            ],
            'users' => [
                'total'          => $usersTotal,
                'active'         => $usersActive,
                'employees'      => $usersEmployees,
                'staff'          => $usersStaff,
                'administrators' => $usersAdministrators,
            ],

            // Flat aliases kept for existing consumers/tests
            'total_assets' => $isEmployee ? null : $totalAssets,
            'available'    => $isEmployee ? null : $available,
            'borrowed'     => $isEmployee ? null : $borrowed,
            'reserved'     => $isEmployee ? null : $reserved,
            'maintenance'  => $isEmployee ? null : $maintenance,
        ];

        // Employee-specific convenience block: personal aggregate counts.
        // Only present when the caller is an Employee role.
        if ($isEmployee) {
            $base['my_stats'] = [
                'active_borrowings'  => $borrowingActive,
                'total_borrowings'   => $borrowingActive + $borrowingReturned,
                'pending_requests'   => $reservationPending,
                'approved_requests'  => $reservationApproved,
                'overdue'            => $overdueCount,
            ];
        }

        return $base;
    }

    /**
     * Returns true when the user holds only the Employee role and no
     * elevated role that would grant them system-wide visibility.
     */
    public function isEmployeeOnly(User $user): bool
    {
        $elevatedRoles = [
            UserRole::SUPER_ADMINISTRATOR->value,
            UserRole::SYSTEM_ADMINISTRATOR->value,
            UserRole::PROPERTY_CUSTODIAN->value,
            UserRole::INVENTORY_OFFICER->value,
            UserRole::DEPARTMENT_HEAD->value,
            UserRole::AUDITOR->value,
            UserRole::SUPPLY_OFFICER->value,
        ];

        $hasEmployeeRole = $user->hasRole(UserRole::EMPLOYEE->value);
        foreach ($elevatedRoles as $role) {
            if ($user->hasRole($role)) {
                return false;
            }
        }

        return $hasEmployeeRole;
    }

    public function getAnalytics(array $filters = [], ?User $user = null): array
    {
        if ($user !== null && $this->isEmployeeOnly($user)) {
            throw new AuthorizationException('You are not authorized to view dashboard analytics.');
        }

        $statuses = Asset::query()
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->orderByDesc('total')
            ->get()
            ->map(function ($row) {
                $statusValue = $row->status ?? 'Unknown';

                if ($statusValue instanceof \BackedEnum) {
                    $statusValue = $statusValue->value;
                }

                return [
                    'label' => is_string($statusValue) ? $statusValue : (string) $statusValue,
                    'value' => (int) $row->total,
                ];
            })
            ->values()
            ->all();

        $inventoryHealthy = InventoryItem::query()
            ->where('quantity', '>', 0)
            ->where(function ($query) {
                $query->whereNull('reorder_level')
                    ->orWhereColumn('quantity', '>', 'reorder_level');
            })
            ->count();

        $inventoryLowStock = InventoryItem::query()
            ->where('quantity', '>', 0)
            ->whereNotNull('reorder_level')
            ->whereColumn('quantity', '<=', 'reorder_level')
            ->count();

        $inventoryOutOfStock = InventoryItem::query()
            ->where('quantity', '<=', 0)
            ->count();

        $borrowingTrend = Borrowing::query()
            ->select('created_at')
            ->where('created_at', '>=', now()->subMonths(5)->startOfMonth())
            ->get()
            ->groupBy(fn ($row) => \Carbon\Carbon::parse($row->created_at)->format('Y-m'))
            ->map(fn ($group, $period) => [
                'label' => \Carbon\Carbon::createFromFormat('Y-m', $period)->format('M'),
                'value' => $group->count(),
            ])
            ->values()
            ->all();

        $reservationTrend = Reservation::query()
            ->select('created_at')
            ->where('created_at', '>=', now()->subMonths(5)->startOfMonth())
            ->get()
            ->groupBy(fn ($row) => \Carbon\Carbon::parse($row->created_at)->format('Y-m'))
            ->map(fn ($group, $period) => [
                'label' => \Carbon\Carbon::createFromFormat('Y-m', $period)->format('M'),
                'value' => $group->count(),
            ])
            ->values()
            ->all();

        $maintenanceSummary = [
            'total' => Maintenance::query()->count(),
            'pending' => Maintenance::query()->where('status', MaintenanceStatus::PENDING->value)->count(),
            'ongoing' => Maintenance::query()->where('status', MaintenanceStatus::ONGOING->value)->count(),
            'completed' => Maintenance::query()->where('status', MaintenanceStatus::COMPLETED->value)->count(),
            'cancelled' => Maintenance::query()->where('status', MaintenanceStatus::CANCELLED->value)->count(),
        ];

        $categoryDistribution = Asset::query()
            ->join('asset_categories', 'asset_categories.id', '=', 'assets.asset_category_id')
            ->select('asset_categories.name as label', DB::raw('count(*) as total'))
            ->groupBy('asset_categories.id', 'asset_categories.name')
            ->orderByDesc('total')
            ->limit(6)
            ->get()
            ->map(fn ($row) => ['label' => (string) $row->label, 'value' => (int) $row->total])
            ->values()
            ->all();

        $officeDistribution = Asset::query()
            ->join('offices', 'offices.id', '=', 'assets.office_id')
            ->select('offices.name as label', DB::raw('count(*) as total'))
            ->groupBy('offices.id', 'offices.name')
            ->orderByDesc('total')
            ->limit(6)
            ->get()
            ->map(fn ($row) => ['label' => (string) $row->label, 'value' => (int) $row->total])
            ->values()
            ->all();

        $base = [
            'asset_status_distribution' => $statuses,
            'inventory_health' => [
                ['label' => 'Healthy', 'value' => $inventoryHealthy],
                ['label' => 'Low stock', 'value' => $inventoryLowStock],
                ['label' => 'Out of stock', 'value' => $inventoryOutOfStock],
            ],
            'borrowing_trend' => $borrowingTrend,
            'reservation_trend' => $reservationTrend,
            'maintenance_summary' => $maintenanceSummary,
            'category_distribution' => $categoryDistribution,
            'office_distribution' => $officeDistribution,
        ];

        return $base;
    }

    public function getRecentActivity(?User $user = null): array
    {
        if ($user !== null && $this->isEmployeeOnly($user)) {
            throw new AuthorizationException('You are not authorized to view system-wide dashboard activity.');
        }
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

    public function getLowStockItems(array $filters = [], ?User $user = null): array
    {
        if ($user !== null && $this->isEmployeeOnly($user)) {
            throw new AuthorizationException('You are not authorized to view low-stock dashboard data.');
        }

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

    public function getOverdueAssets(array $filters = [], ?User $user = null): array
    {
        if ($user !== null && $this->isEmployeeOnly($user)) {
            throw new AuthorizationException('You are not authorized to view overdue dashboard data.');
        }

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
