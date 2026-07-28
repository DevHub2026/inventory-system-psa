<?php

namespace App\Modules\Unit\Services;

use App\Modules\Unit\Models\Unit;
use App\Modules\Unit\Repositories\Contracts\UnitRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class UnitService
{
    public function __construct(private readonly UnitRepositoryInterface $unitRepository) {}

    public function list(array $filters = []): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 20);

        $query = Unit::query()->withCount('inventoryItems');

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

    public function create(array $data): Unit
    {
        return $this->unitRepository->create($data);
    }

    public function update(Unit $unit, array $data): Unit
    {
        return $this->unitRepository->update($unit, $data);
    }

    public function delete(Unit $unit): void
    {
        if ($this->unitRepository->hasInventoryItems($unit)) {
            throw new \InvalidArgumentException('Cannot delete unit with assigned inventory items.');
        }

        $this->unitRepository->delete($unit);
    }

    private function searchOperator(): string
    {
        return DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
    }
}
