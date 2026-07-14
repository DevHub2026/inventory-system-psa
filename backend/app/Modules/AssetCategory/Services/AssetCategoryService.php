<?php

namespace App\Modules\AssetCategory\Services;

use App\Modules\AssetCategory\Models\AssetCategory;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class AssetCategoryService
{
    public function list(array $filters = []): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 20);

        $query = AssetCategory::query();

        if (! empty($filters['search'])) {
            $term = '%'.$filters['search'].'%';
            $operator = $this->searchOperator();
            $query->where(function ($builder) use ($term, $operator) {
                $builder->where('name', $operator, $term)
                    ->orWhere('code', $operator, $term);
            });
        }

        return $query->orderBy('name')->paginate($perPage);
    }

    public function create(array $data): AssetCategory
    {
        return AssetCategory::query()->create($data);
    }

    public function update(AssetCategory $assetCategory, array $data): AssetCategory
    {
        $assetCategory->update($data);

        return $assetCategory->fresh();
    }

    public function delete(AssetCategory $assetCategory): void
    {
        $assetCategory->delete();
    }

    private function searchOperator(): string
    {
        return DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
    }
}
