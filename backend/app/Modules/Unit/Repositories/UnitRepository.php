<?php

namespace App\Modules\Unit\Repositories;

use App\Modules\Unit\Models\Unit;
use App\Modules\Unit\Repositories\Contracts\UnitRepositoryInterface;

class UnitRepository implements UnitRepositoryInterface
{
    public function all()
    {
        return Unit::all();
    }

    public function find(int $id): ?Unit
    {
        return Unit::find($id);
    }

    public function create(array $data): Unit
    {
        return Unit::create($data);
    }

    public function update(Unit $unit, array $data): Unit
    {
        $unit->update($data);
        return $unit->fresh();
    }

    public function delete(Unit $unit): bool
    {
        return $unit->delete();
    }

    public function hasInventoryItems(Unit $unit): bool
    {
        return $unit->inventoryItems()->exists();
    }
}
