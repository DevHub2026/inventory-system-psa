<?php

namespace App\Modules\Asset\Repositories;

use App\Models\AssetCategory;
use App\Modules\Asset\Repositories\Contracts\AssetCategoryRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class AssetCategoryRepository implements AssetCategoryRepositoryInterface
{
    public function all(array $filters = []): LengthAwarePaginator
    {
        $query = AssetCategory::query();

        if (isset($filters['search'])) {
            $search = $filters['search'];
            $query->where('name', 'like', "%{$search}%");
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    public function find(int $id): AssetCategory
    {
        return AssetCategory::findOrFail($id);
    }

    public function create(array $data): AssetCategory
    {
        return AssetCategory::create($data);
    }

    public function update(AssetCategory $category, array $data): AssetCategory
    {
        $category->update($data);
        return $category->fresh();
    }

    public function delete(AssetCategory $category): void
    {
        $category->delete();
    }

    public function findByCode(string $code): ?AssetCategory
    {
        return AssetCategory::where('code', $code)->first();
    }
}
