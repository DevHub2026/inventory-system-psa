<?php

namespace App\Modules\Asset\Services;

use App\Modules\Asset\Enums\AssetStatus;
use App\Modules\Asset\Exceptions\AssetNotAvailableException;
use App\Modules\Asset\Models\Asset;
use App\Modules\AssetIdentifier\Models\AssetIdentifier;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class AssetService
{
    public function list(array $filters = []): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 20);

        $query = Asset::query()
            ->with(['category', 'manufacturer', 'office', 'location', 'identifiers'])
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
            ->with(['category', 'manufacturer', 'office', 'location', 'identifiers'])
            ->search($term)
            ->orderBy('asset_number')
            ->paginate($perPage);
    }

    public function find(Asset $asset): Asset
    {
        return $asset->load(['category', 'manufacturer', 'office', 'location', 'identifiers']);
    }

    public function create(array $data): Asset
    {
        return DB::transaction(function () use ($data) {
            $identifiers = $data['identifiers'] ?? [];
            unset($data['identifiers']);

            $data['status'] = $data['status'] ?? AssetStatus::AVAILABLE->value;

            $asset = Asset::query()->create($data);

            foreach ($identifiers as $identifier) {
                $asset->identifiers()->create([
                    'identifier_type' => $identifier['identifier_type'],
                    'identifier_value' => $identifier['identifier_value'],
                    'is_primary' => (bool) ($identifier['is_primary'] ?? false),
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
        $identifier = AssetIdentifier::query()
            ->where('identifier_value', $value)
            ->first();

        if (! $identifier) {
            return null;
        }

        return $identifier->asset()
            ->with(['category', 'manufacturer', 'office', 'location', 'identifiers'])
            ->first();
    }
}
