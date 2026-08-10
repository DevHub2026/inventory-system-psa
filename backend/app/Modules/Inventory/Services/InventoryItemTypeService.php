<?php

namespace App\Modules\Inventory\Services;

use App\Modules\Inventory\Models\InventoryItemType;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;

class InventoryItemTypeService
{
    public function list(array $filters = []): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 20);

        $query = InventoryItemType::query()->withCount('inventoryItems');

        if (! empty($filters['search'])) {
            $term = '%'.$filters['search'].'%';
            $query->where(function ($builder) use ($term) {
                $builder->where('name', 'like', $term)
                    ->orWhere('code', 'like', $term);
            });
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
        }

        return $query->orderBy('name')->paginate($perPage);
    }

    public function create(array $data): InventoryItemType
    {
        $data['created_by'] = Auth::id();
        return InventoryItemType::query()->create($data);
    }

    public function update(InventoryItemType $type, array $data): InventoryItemType
    {
        $data['updated_by'] = Auth::id();
        $type->update($data);
        return $type->fresh();
    }

    public function delete(InventoryItemType $type): void
    {
        if ($type->inventoryItems()->exists()) {
            throw new \InvalidArgumentException('Cannot delete item type that is currently used by inventory items.');
        }

        $type->delete();
    }
}