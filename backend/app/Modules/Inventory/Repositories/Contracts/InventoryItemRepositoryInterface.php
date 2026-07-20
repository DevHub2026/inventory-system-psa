<?php

namespace App\Modules\Inventory\Repositories\Contracts;

use App\Models\InventoryItem;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface InventoryItemRepositoryInterface
{
    public function all(array $filters = []): LengthAwarePaginator;

    public function find(int $id): InventoryItem;

    public function create(array $data): InventoryItem;

    public function update(InventoryItem $item, array $data): InventoryItem;

    public function delete(InventoryItem $item): void;

    public function findByCode(string $code): ?InventoryItem;

    public function findByStatus(string $status): LengthAwarePaginator;

    public function findLowStock(): LengthAwarePaginator;

    public function findOutOfStock(): LengthAwarePaginator;
}
