<?php

namespace App\Modules\Asset\Services;

use App\Modules\Asset\Enums\AssetStatus;
use App\Modules\Asset\Enums\IdentifierType;
use App\Modules\Asset\Exceptions\AssetNotAvailableException;
use App\Modules\Asset\Models\Asset;
use App\Modules\AssetIdentifier\Models\AssetIdentifier;
use App\Modules\AssetIdentifier\Services\AssetIdentifierService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class AssetService
{
    public function __construct(
        private readonly AssetIdentifierService $assetIdentifierService,
        private readonly AssetLifecycleCoordinator $assetLifecycleCoordinator,
    ) {}

    public function list(array $filters = []): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 20);

        $query = Asset::query()
            ->with(['category', 'manufacturer', 'office', 'location', 'identifiers', 'issuedToUser', 'issuedByUser', 'inventoryItem', 'custodian'])
            ->search($filters['search'] ?? null);

        // ── track_as_asset visibility filter ────────────────────────────────
        // Inventory-linked assets are only surfaced in Asset Management when their
        // parent InventoryItem has track_as_asset = true.
        // Standalone assets (no linked InventoryItem) are always shown — they were
        // created directly in the Asset module and have no Inventory parent.
        $query->where(function ($q): void {
            $q->whereDoesntHave('inventoryItem')
              ->orWhereHas('inventoryItem', fn ($inv) => $inv->where('track_as_asset', true));
        });

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['office_id'])) {
            $query->where('office_id', $filters['office_id']);
        }

        if (! empty($filters['location_id'])) {
            $query->where('location_id', $filters['location_id']);
        }

        if (! empty($filters['asset_category_id'])) {
            $query->where('asset_category_id', $filters['asset_category_id']);
        }

        if (! empty($filters['manufacturer_id'])) {
            $query->where('manufacturer_id', $filters['manufacturer_id']);
        }

        $sort = $filters['sort'] ?? '-created_at';
        $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';
        $column = ltrim($sort, '-');

        $allowed = [
            'asset_number',
            'name',
            'status',
            'created_at',
            'updated_at',
        ];

        if (! in_array($column, $allowed, true)) {
            $column = 'created_at';
            $direction = 'desc';
        }

        return $query->orderBy($column, $direction)->paginate($perPage);
    }

    public function search(string $term, int $perPage = 20): LengthAwarePaginator
    {
        return Asset::query()
            ->with(['category', 'manufacturer', 'office', 'location', 'identifiers', 'issuedToUser', 'issuedByUser', 'inventoryItem', 'custodian'])
            ->search($term)
            // Same visibility rule as list() — honour track_as_asset on linked items.
            ->where(function ($q): void {
                $q->whereDoesntHave('inventoryItem')
                  ->orWhereHas('inventoryItem', fn ($inv) => $inv->where('track_as_asset', true));
            })
            ->orderBy('asset_number')
            ->paginate($perPage);
    }

    public function find(Asset $asset): Asset
    {
        return $asset->load([
            'category',
            'manufacturer',
            'office',
            'location',
            'identifiers',
            'issuedToUser.department',
            'issuedToUser.office',
            'issuedToUser.roles',
            'issuedByUser',
            'inventoryItem.supplier',
            'custodian',
        ]);
    }

    public function create(array $data): Asset
    {
        return DB::transaction(function () use ($data) {
            $identifiers = $data['identifiers'] ?? [];
            unset($data['identifiers']);

            $data['status'] = $data['status'] ?? AssetStatus::AVAILABLE->value;

            $asset = Asset::query()->create($data);

            $this->ensurePsaQrIdentifier($asset);

            foreach ($identifiers as $identifier) {
                if ($identifier['identifier_type'] === IdentifierType::PSA_QR->value) {
                    continue;
                }

                $asset->identifiers()->create([
                    'identifier_type' => $identifier['identifier_type'],
                    'identifier_value' => $identifier['identifier_value'],
                    'is_primary' => false,
                ]);
            }

            return $asset->load(['category', 'manufacturer', 'office', 'location', 'identifiers', 'custodian']);
        });
    }

    public function update(Asset $asset, array $data): Asset
    {
        if ($asset->status === AssetStatus::DISPOSED) {
            throw new AssetNotAvailableException('A disposed asset cannot be modified.');
        }

        // ── Strip all inventory-owned fields ────────────────────────────────
        // The Inventory module is the single source of truth for these columns.
        // Allowing them to be written here would create a conflicting write path.
        // The UpdateAssetRequest already rejects them with 422; this is a
        // defence-in-depth guard in case the service is called directly.
        //
        // property_number is intentionally NOT stripped — it is ASSET-OWNED
        // (identifies one physical instance) and is editable via the Asset module.
        $inventoryOwned = [
            'name', 'description', 'asset_number',
            'asset_category_id', 'manufacturer_id', 'office_id', 'location_id', 'model',
        ];
        foreach ($inventoryOwned as $field) {
            unset($data[$field]);
        }

        // ── Strip deprecated procurement fields ──────────────────────────────
        // purchase_date, purchase_cost, warranty_until are now owned by Inventory.
        // The DB columns still exist for historical data but must not be written
        // via this path.  Inventory's values are the authoritative source;
        // the Asset record's copies are kept read-only until the columns are dropped.
        unset($data['purchase_date'], $data['purchase_cost'], $data['warranty_until']);

        // Permanent-issuance fields are managed by PermanentIssuanceController only.
        unset($data['issued_to'], $data['issued_to_user_id'], $data['issued_by_user_id'], $data['date_issued']);

        $this->assetLifecycleCoordinator->validateManualStatusTransition($asset, $data['status'] ?? null);

        $asset->update($data);

        return $asset->fresh()->load(['category', 'manufacturer', 'office', 'location', 'identifiers', 'custodian']);
    }

    public function delete(Asset $asset): void
    {
        $asset->delete();
    }

    public function archive(Asset $asset): Asset
    {
        if (in_array($asset->status, [AssetStatus::BORROWED, AssetStatus::RESERVED], true)) {
            throw new AssetNotAvailableException('Cannot archive an asset that is borrowed or reserved.');
        }

        $asset->update(['status' => AssetStatus::RETIRED]);
        $asset->delete();

        // The InventoryItem is NOT soft-deleted. Inventory owns the Inventory Item;
        // Asset owns the Asset instance. Archiving the Asset must not destroy the
        // Inventory to Asset relationship nor hide the Inventory Item from active
        // Inventory lists.
        return Asset::withTrashed()->findOrFail($asset->id);
    }

    public function restore(Asset $asset): Asset
    {
        // Only restore assets that are currently soft-deleted.
        if ($asset->trashed()) {
            $asset->restore();
        }

        // If the asset was RETIRED as part of archiving, bring it back to
        // AVAILABLE so it surfaces in active Asset Management again.
        if ($asset->status === AssetStatus::RETIRED) {
            $asset->update(['status' => AssetStatus::AVAILABLE]);
        }

        return $asset->fresh()->load(['category', 'manufacturer', 'office', 'location', 'identifiers', 'inventoryItem', 'custodian']);
    }

    public function listArchived(array $filters = []): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 20);

        $query = Asset::query()
            ->onlyTrashed()
            ->with(['category', 'manufacturer', 'office', 'location', 'identifiers', 'issuedToUser', 'issuedByUser', 'inventoryItem', 'custodian']);

        if (! empty($filters['search'])) {
            $like = '%'.$filters['search'].'%';
            $operator = $query->getConnection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
            $query->where(function ($q) use ($like, $operator) {
                $q->where('asset_number', $operator, $like)
                    ->orWhere('property_number', $operator, $like)
                    ->orWhere('name', $operator, $like)
                    ->orWhere('model', $operator, $like)
                    ->orWhereHas('identifiers', function ($identifiers) use ($like, $operator) {
                        $identifiers->where('identifier_value', $operator, $like);
                    })
                    ->orWhereHas('inventoryItem', function ($inv) use ($like, $operator) {
                        $inv->where('name', $operator, $like)
                            ->orWhere('sku', $operator, $like);
                    });
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['office_id'])) {
            $query->where('office_id', $filters['office_id']);
        }

        if (! empty($filters['location_id'])) {
            $query->where('location_id', $filters['location_id']);
        }

        if (! empty($filters['asset_category_id'])) {
            $query->where('asset_category_id', $filters['asset_category_id']);
        }

        if (! empty($filters['manufacturer_id'])) {
            $query->where('manufacturer_id', $filters['manufacturer_id']);
        }

        $sort = $filters['sort'] ?? '-created_at';
        $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';
        $column = ltrim($sort, '-');

        $allowed = [
            'asset_number',
            'name',
            'status',
            'created_at',
            'updated_at',
        ];

        if (! in_array($column, $allowed, true)) {
            $column = 'created_at';
            $direction = 'desc';
        }

        // Only trashed Assets are returned - never active ones.
        return $query->orderBy($column, $direction)->paginate($perPage);
    }

    public function transfer(Asset $asset, array $data): Asset
    {
        if (in_array($asset->status, [AssetStatus::DISPOSED, AssetStatus::RETIRED], true)) {
            throw new AssetNotAvailableException('Cannot transfer a retired or disposed asset.');
        }

        $payload = [
            'office_id' => $data['office_id'],
            'location_id' => $data['location_id'] ?? null,
        ];

        if (array_key_exists('remarks', $data)) {
            $payload['remarks'] = $data['remarks'];
        }

        $asset->update($payload);

        return $asset->fresh()->load(['category', 'manufacturer', 'office', 'location', 'identifiers', 'custodian']);
    }

    public function findByIdentifier(string $value): ?Asset
    {
        $identifier = $this->assetIdentifierService->findByValue($value);

        if (! $identifier) {
            return null;
        }

        return $identifier->asset()
            ->with(['category', 'manufacturer', 'office', 'location', 'identifiers', 'custodian'])
            ->first();
    }

    public function ensurePsaQrIdentifier(Asset $asset): AssetIdentifier
    {
        return AssetIdentifier::query()->firstOrCreate(
            [
                'asset_id' => $asset->id,
                'identifier_type' => IdentifierType::PSA_QR->value,
            ],
            [
                'identifier_value' => $this->psaQrValue($asset),
                'is_primary' => true,
            ],
        );
    }

    private function psaQrValue(Asset $asset): string
    {
        return 'PSA-ASSET-'.str_pad((string) $asset->id, 6, '0', STR_PAD_LEFT);
    }
}
