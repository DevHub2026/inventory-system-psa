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
            ->with(['category', 'manufacturer', 'office', 'location', 'identifiers', 'issuedToUser', 'issuedByUser', 'inventoryItem'])
            ->search($filters['search'] ?? null);

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
            'purchase_date',
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
            ->with(['category', 'manufacturer', 'office', 'location', 'identifiers', 'issuedToUser', 'issuedByUser', 'inventoryItem'])
            ->search($term)
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
            'inventoryItem',
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

            return $asset->load(['category', 'manufacturer', 'office', 'location', 'identifiers']);
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
        $inventoryOwned = [
            'name', 'description', 'asset_number', 'property_number',
            'asset_category_id', 'manufacturer_id', 'office_id', 'location_id', 'model',
        ];
        foreach ($inventoryOwned as $field) {
            unset($data[$field]);
        }

        // Permanent-issuance fields are managed by PermanentIssuanceController only.
        unset($data['issued_to'], $data['issued_to_user_id'], $data['issued_by_user_id'], $data['date_issued']);

        $this->assetLifecycleCoordinator->validateManualStatusTransition($asset, $data['status'] ?? null);

        $asset->update($data);

        return $asset->fresh()->load(['category', 'manufacturer', 'office', 'location', 'identifiers']);
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

        // Also soft-delete the linked inventory item so the counts stay consistent.
        // The inventory item's deletion is NOT permanent — it can be restored via
        // InventoryItem::withTrashed()->find($id)->restore() if needed.
        \App\Modules\Inventory\Models\InventoryItem::query()
            ->where('asset_id', $asset->id)
            ->whereNull('deleted_at')
            ->update(['deleted_at' => now()]);

        return $asset;
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

        return $asset->fresh()->load(['category', 'manufacturer', 'office', 'location', 'identifiers']);
    }

    public function findByIdentifier(string $value): ?Asset
    {
        $identifier = $this->assetIdentifierService->findByValue($value);

        if (! $identifier) {
            return null;
        }

        return $identifier->asset()
            ->with(['category', 'manufacturer', 'office', 'location', 'identifiers'])
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
