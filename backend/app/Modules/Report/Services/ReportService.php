<?php

namespace App\Modules\Report\Services;

use App\Modules\Asset\Models\Asset;
use App\Modules\Asset\Models\AssetIssuanceHistory;
use App\Modules\Borrowing\Models\Borrowing;
use App\Modules\Inventory\Models\StockTransaction;
use App\Modules\Maintenance\Models\Maintenance;
use App\Modules\Inventory\Models\InventoryItem;
use App\Modules\Reservation\Models\Reservation;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection as SupportCollection;
use App\Models\User;
use Illuminate\Support\Str;

class ReportService
{
    public function getAssetHistoryReport(array $filters = [], bool $paginate = true): array
    {
        $assetIds = $this->assetHistoryAssetIds($filters);
        $events = collect();

        if ($assetIds->isEmpty()) {
            return $this->assetHistoryPayload(collect(), $filters, $paginate);
        }

        Asset::query()
            ->with(['category', 'office', 'location', 'custodian', 'issuedToUser', 'issuedByUser'])
            ->whereIn('id', $assetIds)
            ->get()
            ->each(function (Asset $asset) use ($events): void {
                $events->push($this->assetHistoryEvent([
                    'source' => 'assets',
                    'source_id' => $asset->id,
                    'asset' => $asset,
                    'event_type' => 'Created',
                    'event_at' => $asset->created_at,
                    'current_status' => $this->stringValue($asset->status),
                    'new_custodian' => $this->userName($asset->custodian) ?? $this->userName($asset->issuedToUser) ?? $asset->issued_to,
                    'new_location' => $asset->location?->name,
                    'performed_by' => $this->userName($asset->issuedByUser),
                    'remarks' => $asset->remarks,
                    'reference' => 'asset:'.$asset->id,
                ]));

                if (in_array($this->stringValue($asset->status), ['FOR_DISPOSAL', 'DISPOSED'], true) || $asset->disposal_date !== null) {
                    $events->push($this->assetHistoryEvent([
                        'source' => 'assets',
                        'source_id' => $asset->id,
                        'asset' => $asset,
                        'event_type' => $this->stringValue($asset->status) === 'DISPOSED' ? 'Disposed' : 'Marked for Disposal',
                        'event_at' => $asset->disposal_date ?? $asset->updated_at,
                        'current_status' => $this->stringValue($asset->status),
                        'new_status' => $this->stringValue($asset->status),
                        'previous_custodian' => $this->userName($asset->custodian) ?? $this->userName($asset->issuedToUser) ?? $asset->issued_to,
                        'previous_location' => $asset->location?->name,
                        'performed_by' => $this->userName($asset->disposalApprover),
                        'reason' => $asset->disposal_reason,
                        'remarks' => $asset->disposal_method,
                        'reference' => $asset->disposal_approval_ref ?: 'asset:'.$asset->id,
                    ]));
                }
            });

        Reservation::query()
            ->with(['user', 'authorizer', 'assets.office', 'assets.location', 'assets.custodian'])
            ->whereHas('assets', fn ($query) => $query->whereIn('assets.id', $assetIds))
            ->get()
            ->each(function (Reservation $reservation) use ($events, $assetIds): void {
                $reservation->assets->whereIn('id', $assetIds)->each(function (Asset $asset) use ($events, $reservation): void {
                    $events->push($this->assetHistoryEvent([
                        'source' => 'reservations',
                        'source_id' => $reservation->id,
                        'asset' => $asset,
                        'event_type' => 'Reserved',
                        'event_at' => $reservation->created_at,
                        'current_status' => $this->stringValue($asset->status),
                        'new_status' => $reservation->status,
                        'new_custodian' => $this->userName($reservation->user),
                        'new_location' => $asset->location?->name,
                        'performed_by' => $this->userName($reservation->user),
                        'reason' => $reservation->remarks,
                        'reference' => 'reservation:'.$reservation->id,
                    ]));

                    if ($reservation->authorized_at !== null) {
                        $events->push($this->assetHistoryEvent([
                            'source' => 'reservations',
                            'source_id' => $reservation->id,
                            'asset' => $asset,
                            'event_type' => 'Reservation Approved',
                            'event_at' => $reservation->authorized_at,
                            'current_status' => $this->stringValue($asset->status),
                            'new_status' => $reservation->status,
                            'new_custodian' => $this->userName($reservation->user),
                            'performed_by' => $this->userName($reservation->authorizer),
                            'reason' => $reservation->remarks,
                            'reference' => 'reservation:'.$reservation->id,
                        ]));
                    }
                });
            });

        Borrowing::query()
            ->with(['asset.office', 'asset.location', 'asset.custodian', 'user', 'authorizer'])
            ->whereIn('asset_id', $assetIds)
            ->get()
            ->each(function (Borrowing $borrowing) use ($events): void {
                if (! $borrowing->asset) {
                    return;
                }

                $events->push($this->assetHistoryEvent([
                    'source' => 'borrowings',
                    'source_id' => $borrowing->id,
                    'asset' => $borrowing->asset,
                    'event_type' => 'Borrowed',
                    'event_at' => $borrowing->borrowed_at ?? $borrowing->borrow_date ?? $borrowing->created_at,
                    'current_status' => $this->stringValue($borrowing->asset->status),
                    'new_status' => 'BORROWED',
                    'new_custodian' => $this->userName($borrowing->user),
                    'performed_by' => $this->userName($borrowing->authorizer) ?? $this->userName($borrowing->user),
                    'reason' => $borrowing->remarks,
                    'reference' => 'borrowing:'.$borrowing->id,
                ]));

                if ($borrowing->returned_at !== null || in_array((string) $borrowing->status, ['RETURNED', 'PARTIALLY_RETURNED'], true)) {
                    $events->push($this->assetHistoryEvent([
                        'source' => 'borrowings',
                        'source_id' => $borrowing->id,
                        'asset' => $borrowing->asset,
                        'event_type' => 'Returned',
                        'event_at' => $borrowing->returned_at ?? $borrowing->updated_at,
                        'previous_status' => 'BORROWED',
                        'current_status' => $this->stringValue($borrowing->asset->status),
                        'new_status' => (string) $borrowing->status,
                        'previous_custodian' => $this->userName($borrowing->user),
                        'performed_by' => $this->userName($borrowing->authorizer),
                        'reason' => $borrowing->remarks,
                        'reference' => 'borrowing:'.$borrowing->id,
                    ]));
                }
            });

        AssetIssuanceHistory::query()
            ->with(['asset.office', 'asset.location', 'previousEmployee', 'newEmployee', 'officer'])
            ->whereIn('asset_id', $assetIds)
            ->get()
            ->each(function (AssetIssuanceHistory $history) use ($events): void {
                if (! $history->asset) {
                    return;
                }

                $events->push($this->assetHistoryEvent([
                    'source' => 'asset_issuance_histories',
                    'source_id' => $history->id,
                    'asset' => $history->asset,
                    'event_type' => $history->issuance_type === 'initial' ? 'Issued' : 'Reissued',
                    'event_at' => $history->transfer_date ?? $history->created_at,
                    'current_status' => $this->stringValue($history->asset->status),
                    'previous_custodian' => $this->userName($history->previousEmployee),
                    'new_custodian' => $this->userName($history->newEmployee),
                    'performed_by' => $this->userName($history->officer),
                    'reason' => $history->reason,
                    'remarks' => $history->remarks,
                    'reference' => 'issuance_history:'.$history->id,
                ]));
            });

        Maintenance::query()
            ->with(['asset.office', 'asset.location', 'asset.custodian', 'user', 'reportedByUser'])
            ->whereIn('asset_id', $assetIds)
            ->get()
            ->each(function (Maintenance $maintenance) use ($events): void {
                if (! $maintenance->asset) {
                    return;
                }

                $events->push($this->assetHistoryEvent([
                    'source' => 'maintenances',
                    'source_id' => $maintenance->id,
                    'asset' => $maintenance->asset,
                    'event_type' => $maintenance->type === 'damage' ? 'Damage Reported' : 'Maintenance',
                    'event_at' => $maintenance->scheduled_date ?? $maintenance->created_at,
                    'current_status' => $this->stringValue($maintenance->asset->status),
                    'new_status' => $maintenance->status,
                    'performed_by' => $this->userName($maintenance->reportedByUser) ?? $this->userName($maintenance->user),
                    'reason' => $maintenance->description,
                    'remarks' => $maintenance->notes,
                    'reference' => 'maintenance:'.$maintenance->id,
                ]));

                if ($maintenance->completed_date !== null) {
                    $events->push($this->assetHistoryEvent([
                        'source' => 'maintenances',
                        'source_id' => $maintenance->id,
                        'asset' => $maintenance->asset,
                        'event_type' => 'Maintenance Completed',
                        'event_at' => $maintenance->completed_date,
                        'current_status' => $this->stringValue($maintenance->asset->status),
                        'new_status' => $maintenance->status,
                        'performed_by' => $this->userName($maintenance->user),
                        'reason' => $maintenance->description,
                        'remarks' => $maintenance->notes,
                        'reference' => 'maintenance:'.$maintenance->id,
                    ]));
                }
            });

        StockTransaction::query()
            ->with(['inventoryItem.asset.office', 'inventoryItem.asset.location', 'inventoryItem.asset.custodian', 'user', 'sourceLocation', 'destinationLocation'])
            ->whereHas('inventoryItem', fn ($query) => $query->whereIn('asset_id', $assetIds))
            ->get()
            ->each(function (StockTransaction $transaction) use ($events): void {
                $asset = $transaction->inventoryItem?->asset;
                if (! $asset) {
                    return;
                }

                $events->push($this->assetHistoryEvent([
                    'source' => 'stock_transactions',
                    'source_id' => $transaction->id,
                    'asset' => $asset,
                    'event_type' => str_contains((string) $transaction->type, 'transfer') ? 'Transferred' : 'Inventory Movement',
                    'event_at' => $transaction->created_at,
                    'current_status' => $this->stringValue($asset->status),
                    'previous_location' => $transaction->sourceLocation?->name,
                    'new_location' => $transaction->destinationLocation?->name,
                    'performed_by' => $this->userName($transaction->user),
                    'reason' => $transaction->reason,
                    'remarks' => $transaction->remarks,
                    'reference' => $transaction->transfer_uuid ?: 'stock_transaction:'.$transaction->id,
                ]));
            });

        $filtered = $this->filterAssetHistoryEvents($events, $filters)
            ->sortBy([
                ['event_at', 'asc'],
                ['source_id', 'asc'],
            ])
            ->values();

        return $this->assetHistoryPayload($filtered, $filters, $paginate);
    }

    /**
     * Determine asset ids matching the provided filters.
     */
    private function assetHistoryAssetIds(array $filters): SupportCollection
    {
        // If an explicit asset_id is provided, return it directly
        if (isset($filters['asset_id']) && $filters['asset_id']) {
            return collect([(int) $filters['asset_id']]);
        }

        $query = Asset::query();

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['office_id'])) {
            $query->where('office_id', $filters['office_id']);
        }

        if (! empty($filters['location_id'])) {
            $query->where('location_id', $filters['location_id']);
        }

        if (! empty($filters['search'])) {
            $s = trim((string) $filters['search']);
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                    ->orWhere('asset_number', 'like', "%{$s}%")
                    ->orWhere('property_number', 'like', "%{$s}%");
            });
        }

        return $query->pluck('id');
    }

    /**
     * Compose the final payload (items, summary, meta) for asset history
     * @param SupportCollection $events
     */
    private function assetHistoryPayload(SupportCollection $events, array $filters, bool $paginate): array
    {
        $items = $events->map(fn ($e) => [
            'event_id' => $e['event_id'] ?? ($e['source'].'_'.$e['source_id'].'_'.$e['asset']->id),
            'source' => $e['source'] ?? null,
            'source_id' => $e['source_id'] ?? null,
            'asset_id' => $e['asset']->id ?? null,
            'asset_number' => $e['asset']->asset_number ?? null,
            'property_number' => $e['asset']->property_number ?? null,
            'asset_name' => $e['asset']->name ?? null,
            'event_type' => $e['event_type'] ?? null,
            'previous_status' => $e['previous_status'] ?? null,
            'new_status' => $e['new_status'] ?? null,
            'current_status' => $e['current_status'] ?? null,
            'previous_custodian' => $e['previous_custodian'] ?? null,
            'new_custodian' => $e['new_custodian'] ?? null,
            'previous_location' => $e['previous_location'] ?? null,
            'new_location' => $e['new_location'] ?? null,
            'event_at' => isset($e['event_at']) ? ($e['event_at'] instanceof \DateTimeInterface ? $e['event_at']->format('Y-m-d H:i:s') : (string) $e['event_at']) : null,
            'performed_by' => $e['performed_by'] ?? null,
            'reason' => $e['reason'] ?? null,
            'remarks' => $e['remarks'] ?? null,
            'reference' => $e['reference'] ?? null,
        ])->values();

        $summary = [
            'total_events' => $items->count(),
            'assets_included' => $events->pluck('asset')->unique(fn ($a) => $a->id)->count(),
            'event_types' => $events->countBy(fn ($e) => $e['event_type'] ?? 'Unknown')->toArray(),
        ];

        if (! $paginate) {
            return [
                'items' => $items->toArray(),
                'summary' => $summary,
                'meta' => [
                    'current_page' => 1,
                    'per_page' => $items->count(),
                    'total' => $items->count(),
                    'last_page' => 1,
                ],
            ];
        }

        $page = max(1, (int) ($filters['page'] ?? 1));
        $perPage = max(1, (int) ($filters['per_page'] ?? 15));
        $total = $items->count();
        $slice = $items->forPage($page, $perPage)->values();

        $meta = [
            'current_page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'last_page' => (int) ceil($total / $perPage),
        ];

        return [
            'items' => $slice->toArray(),
            'summary' => $summary,
            'meta' => $meta,
        ];
    }

    /**
     * Normalize a single raw event array into the internal event shape.
     */
    private function assetHistoryEvent(array $data): array
    {
        // Ensure event_at is a DateTime instance where possible
        $eventAt = $data['event_at'] ?? null;
        if ($eventAt && ! $eventAt instanceof \DateTimeInterface) {
            try {
                $eventAt = new \DateTimeImmutable($eventAt);
            } catch (\Throwable $e) {
                $eventAt = null;
            }
        }

        return array_merge($data, [
            'event_at' => $eventAt,
            'event_id' => $data['event_id'] ?? null,
        ]);
    }

    /**
     * Apply filters (event_type, date range, user_id, location_id, status, search)
     */
    private function filterAssetHistoryEvents(SupportCollection $events, array $filters): SupportCollection
    {
        return $events->filter(function ($e) use ($filters) {
            if (! empty($filters['event_type']) && isset($e['event_type']) && (string) $filters['event_type'] !== (string) $e['event_type']) {
                return false;
            }

            if (! empty($filters['from_date'])) {
                $from = new \DateTimeImmutable($filters['from_date']);
                if (! isset($e['event_at']) || $e['event_at'] < $from) return false;
            }

            if (! empty($filters['to_date'])) {
                $to = new \DateTimeImmutable($filters['to_date']);
                if (! isset($e['event_at']) || $e['event_at'] > $to) return false;
            }

            if (! empty($filters['user_id'])) {
                $uid = (int) $filters['user_id'];
                // match asset custodian or issued_to_user where available
                $asset = $e['asset'] ?? null;
                if ($asset) {
                    if (($asset->custodian?->id ?? null) === $uid) return true;
                    if (($asset->issued_to_user_id ?? null) === $uid) return true;
                }
                return false;
            }

            if (! empty($filters['location_id'])) {
                $lid = (int) $filters['location_id'];
                $asset = $e['asset'] ?? null;
                if ($asset && ($asset->location_id ?? null) !== $lid) return false;
            }

            if (! empty($filters['status'])) {
                if (($e['current_status'] ?? null) !== $filters['status'] && ($e['new_status'] ?? null) !== $filters['status']) return false;
            }

            if (! empty($filters['search'])) {
                $s = Str::lower(trim((string) $filters['search']));
                $asset = $e['asset'] ?? null;
                if ($asset) {
                    $hay = Str::lower($asset->name.' '.$asset->asset_number.' '.$asset->property_number);
                    if (Str::contains($hay, $s)) return true;
                }
                return false;
            }

            return true;
        })->values();
    }

    private function userName(?User $user): ?string
    {
        if ($user === null) return null;
        if (is_string($user)) return trim($user) ?: null;
        if (isset($user->full_name) && $user->full_name) return trim($user->full_name);
        if (isset($user->name) && $user->name) return trim($user->name);
        if (isset($user->email)) return $user->email;
        return null;
    }

    private function stringValue(mixed $value): ?string
    {
        if ($value === null) return null;
        // Support PHP 8.1 enums (BackedEnum, UnitEnum)
        if (interface_exists('\\BackedEnum') && $value instanceof \BackedEnum) {
            return (string) $value->value;
        }
        if (interface_exists('\\UnitEnum') && $value instanceof \UnitEnum) {
            return (string) $value->name;
        }
        if (is_object($value) && method_exists($value, '__toString')) {
            return (string) $value;
        }
        return (string) $value;
    }

    public function getAssetReport(array $filters = []): Collection
    {
        // Eager-load asset sub-relations (identifiers, inventoryItem.itemType, custodian)
        // so the report consumer can access serial numbers, item types, and custodian info
        // without triggering N+1 queries.
        $query = Asset::query()->with(['category', 'manufacturer', 'office', 'location', 'identifiers', 'custodian', 'inventoryItem.itemType']);

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['category_id'])) {
            $query->where('asset_category_id', $filters['category_id']);
        }

        if (isset($filters['office_id'])) {
            $query->where('office_id', $filters['office_id']);
        }

        if (isset($filters['location_id'])) {
            $query->where('location_id', $filters['location_id']);
        }

        if (isset($filters['manufacturer_id'])) {
            $query->where('manufacturer_id', $filters['manufacturer_id']);
        }

        return $query->orderByDesc('created_at')->get();
    }

    public function getBorrowingReport(array $filters = []): Collection
    {
        // Eager-load asset sub-relations (identifiers, inventoryItem.itemType, custodian)
        // so the report consumer can access serial numbers, item types, and custodian info
        // without triggering N+1 queries.
        $query = Borrowing::query()->with(['user', 'asset.identifiers', 'asset.inventoryItem.itemType', 'asset.custodian']);

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
        // Load asset identifiers and related inventory item/type and custodian to
        // surface serial numbers and item types in reservation reports.
        $query = Reservation::query()->with(['user', 'assets.identifiers', 'assets.inventoryItem.itemType', 'assets.custodian']);

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
        $query = InventoryItem::query()->with(['unit', 'manufacturer', 'office', 'location']);

        if (isset($filters['low_stock'])) {
            $query->whereColumn('quantity', '<=', 'reorder_level');
        }

        if (isset($filters['office_id'])) {
            $query->where('office_id', $filters['office_id']);
        }

        if (isset($filters['location_id'])) {
            $query->where('location_id', $filters['location_id']);
        }

        if (isset($filters['manufacturer_id'])) {
            $query->where('manufacturer_id', $filters['manufacturer_id']);
        }

        if (isset($filters['type'])) {
            $query->where('type', $filters['type']);
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
            ->with(['unit', 'manufacturer', 'office', 'location'])
            ->whereColumn('quantity', '<=', 'reorder_level')
            ->where('reorder_level', '>', 0)
            ->orderBy('quantity', 'asc')
            ->get();
    }

    public function getUserActivityReport(array $filters = []): Collection
    {
        $query = Borrowing::query()->with(['user', 'asset.identifiers', 'asset.inventoryItem.itemType', 'asset.custodian']);

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
