<?php

namespace App\Modules\Asset\Repositories\Contracts;

use App\Models\AssetCategory;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface AssetCategoryRepositoryInterface
{
    public function all(array $filters = []): LengthAwarePaginator;

    public function find(int $id): AssetCategory;

    public function create(array $data): AssetCategory;

    public function update(AssetCategory $category, array $data): AssetCategory;

    public function delete(AssetCategory $category): void;

    public function findByCode(string $code): ?AssetCategory;
}
