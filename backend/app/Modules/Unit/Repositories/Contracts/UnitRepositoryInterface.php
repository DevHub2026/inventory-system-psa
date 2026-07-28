<?php

namespace App\Modules\Unit\Repositories\Contracts;

use App\Modules\Unit\Models\Unit;

interface UnitRepositoryInterface
{
    public function all();

    public function find(int $id): ?Unit;

    public function create(array $data): Unit;

    public function update(Unit $unit, array $data): Unit;

    public function delete(Unit $unit): bool;

    public function hasInventoryItems(Unit $unit): bool;
}
