<?php

namespace App\Modules\Inventory\Services;

use App\Modules\Inventory\Models\InventoryItem;
use Illuminate\Database\Eloquent\Collection;

class InventoryService
{
    public function list(array $filters = []): Collection
    {
        $query = InventoryItem::query();

        if (isset($filters['search'])) {
            $query->where('name', 'like', '%'.$filters['search'].'%')
                ->orWhere('sku', 'like', '%'.$filters['search'].'%');
        }

        if (isset($filters['low_stock'])) {
            $query->whereColumn('quantity', '<=', 'reorder_level');
        }

        return $query->orderByDesc('created_at')->get();
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

    public function stockIn(InventoryItem $item, int $quantity): InventoryItem
    {
        $item->update([
            'quantity' => $item->quantity + $quantity,
        ]);

        return $item->fresh();
    }

    public function stockOut(InventoryItem $item, int $quantity): InventoryItem
    {
        if ($item->quantity < $quantity) {
            throw new \InvalidArgumentException('Insufficient stock for stock-out operation.');
        }

        $item->update([
            'quantity' => $item->quantity - $quantity,
        ]);

        return $item->fresh();
    }
}
