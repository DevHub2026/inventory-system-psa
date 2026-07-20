<?php

namespace App\Modules\Asset\Repositories;

use App\Models\Manufacturer;
use App\Modules\Asset\Repositories\Contracts\ManufacturerRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class ManufacturerRepository implements ManufacturerRepositoryInterface
{
    public function all(array $filters = []): LengthAwarePaginator
    {
        $query = Manufacturer::query();

        if (isset($filters['search'])) {
            $search = $filters['search'];
            $query->where('name', 'like', "%{$search}%");
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    public function find(int $id): Manufacturer
    {
        return Manufacturer::findOrFail($id);
    }

    public function create(array $data): Manufacturer
    {
        return Manufacturer::create($data);
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

    public function findByCode(string $code): ?Manufacturer
    {
        return Manufacturer::where('code', $code)->first();
    }
}
