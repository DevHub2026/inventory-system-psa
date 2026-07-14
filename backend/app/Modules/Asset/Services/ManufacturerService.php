<?php

namespace App\Modules\Asset\Services;

use App\Modules\Asset\Models\Manufacturer;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ManufacturerService
{
    public function list(array $filters = []): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 20);

        $query = Manufacturer::query();

        if (! empty($filters['search'])) {
            $term = '%'.$filters['search'].'%';
            $operator = $this->searchOperator();
            $query->where('name', $operator, $term);
        }

        return $query->orderBy('name')->paginate($perPage);
    }

    public function create(array $data): Manufacturer
    {
        return Manufacturer::query()->create($data);
    }

    public function update(Manufacturer $manufacturer, array $data): Manufacturer
    {
        $manufacturer->update($data);

        return $manufacturer->fresh();
    }

    public function delete(Manufacturer $manufacturer): void
    {
        $manufacturer->delete();
    }

    private function searchOperator(): string
    {
        return DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
    }
}
