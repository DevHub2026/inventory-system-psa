<?php

namespace App\Modules\Asset\Repositories;

use App\Models\Asset;
use App\Modules\Asset\Repositories\Contracts\AssetRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class AssetRepository implements AssetRepositoryInterface
{
    public function all(array $filters = []): LengthAwarePaginator
    {
        $query = Asset::query();

        if (isset($filters['search'])) {
            $search = $filters['search'];
            $query->where(function (Builder $q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('asset_number', 'like', "%{$search}%")
                    ->orWhere('serial_number', 'like', "%{$search}%");
            });
        }

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['asset_category_id'])) {
            $query->where('asset_category_id', $filters['asset_category_id']);
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

        return $query->paginate($filters['per_page'] ?? 15);
    }

    public function find(int $id): Asset
    {
        return Asset::findOrFail($id);
    }

    public function create(array $data): Asset
    {
        return Asset::create($data);
    }

    public function update(Asset $asset, array $data): Asset
    {
        $asset->update($data);
        return $asset->fresh();
    }

    public function delete(Asset $asset): void
    {
        $asset->delete();
    }

    public function findByAssetNumber(string $assetNumber): ?Asset
    {
        return Asset::where('asset_number', $assetNumber)->first();
    }

    public function findByStatus(string $status): LengthAwarePaginator
    {
        return Asset::where('status', $status)->paginate(15);
    }
}
