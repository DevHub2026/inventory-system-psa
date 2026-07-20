<?php

namespace App\Modules\Inventory\Repositories;

use App\Models\InventoryItem;
use App\Modules\Inventory\Repositories\Contracts\InventoryItemRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class InventoryItemRepository implements InventoryItemRepositoryInterface
{
    public function all(array $filters = []): LengthAwarePaginator
    {
        $query = InventoryItem::query();

        if (isset($filters['search'])) {
            $search = $filters['search'];
            $query->where('name', 'like', "%{$search}%");
        }

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['inventory_category_id'])) {
            $query->where('inventory_category_id', $filters['inventory_category_id']);
        }

        if (isset($filters['supplier_id'])) {
            $query->where('supplier_id', $filters['supplier_id']);
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    public function find(int $id): InventoryItem
    {
        return InventoryItem::findOrFail($id);
    }

    public function create(array $data): InventoryItem
    {
        return InventoryItem::create($data);
    }

    public function update(InventoryItem $item, array $data): InventoryItem
    {
        $item->update($data);
        return $item->fresh();
    }

    public function delete(InventoryItem $item): void
    {
        $item->delete();
    }

    public function findByCode(string $code): ?InventoryItem
    {
        return InventoryItem::where('code', $code)->first();
    }

    public function findByStatus(string $status): LengthAwarePaginator
    {
        return InventoryItem::where('status', $status)->paginate(15);
    }

    public function findLowStock(): LengthAwarePaginator
    {
        return InventoryItem::where('status', 'low_stock')->paginate(15);
    }

    public function findOutOfStock(): LengthAwarePaginator
    {
        return InventoryItem::where('status', 'out_of_stock')->paginate(15);
    }
}
