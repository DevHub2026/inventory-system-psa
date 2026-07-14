<?php

namespace App\Modules\AssetIdentifier\Services;

use App\Modules\AssetIdentifier\Models\AssetIdentifier;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class AssetIdentifierService
{
    public function list(array $filters = []): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 20);

        $query = AssetIdentifier::query()->with('asset');

        if (! empty($filters['asset_id'])) {
            $query->where('asset_id', $filters['asset_id']);
        }

        if (! empty($filters['identifier_type'])) {
            $query->where('identifier_type', $filters['identifier_type']);
        }

        if (! empty($filters['search'])) {
            $term = '%'.$filters['search'].'%';
            $operator = DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
            $query->where('identifier_value', $operator, $term);
        }

        return $query->orderByDesc('created_at')->paginate($perPage);
    }

    public function create(array $data): AssetIdentifier
    {
        return DB::transaction(function () use ($data) {
            if (! empty($data['is_primary'])) {
                AssetIdentifier::query()
                    ->where('asset_id', $data['asset_id'])
                    ->update(['is_primary' => false]);
            }

            return AssetIdentifier::query()->create($data);
        });
    }

    public function update(AssetIdentifier $assetIdentifier, array $data): AssetIdentifier
    {
        return DB::transaction(function () use ($assetIdentifier, $data) {
            if (! empty($data['is_primary'])) {
                AssetIdentifier::query()
                    ->where('asset_id', $data['asset_id'] ?? $assetIdentifier->asset_id)
                    ->where('id', '!=', $assetIdentifier->id)
                    ->update(['is_primary' => false]);
            }

            $assetIdentifier->update($data);

            return $assetIdentifier->fresh()->load('asset');
        });
    }

    public function delete(AssetIdentifier $assetIdentifier): void
    {
        $assetIdentifier->delete();
    }

    public function findByValue(string $value): ?AssetIdentifier
    {
        return AssetIdentifier::query()
            ->with('asset')
            ->where('identifier_value', $value)
            ->first();
    }
}
