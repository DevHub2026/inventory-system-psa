<?php

namespace App\Modules\Asset\Repositories;

use App\Models\Location;
use App\Modules\Asset\Repositories\Contracts\LocationRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class LocationRepository implements LocationRepositoryInterface
{
    public function all(array $filters = []): LengthAwarePaginator
    {
        $query = Location::query();

        if (isset($filters['search'])) {
            $search = $filters['search'];
            $query->where('name', 'like', "%{$search}%");
        }

        if (isset($filters['office_id'])) {
            $query->where('office_id', $filters['office_id']);
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    public function find(int $id): Location
    {
        return Location::findOrFail($id);
    }

    public function create(array $data): Location
    {
        return Location::create($data);
    }

    public function update(Location $location, array $data): Location
    {
        $location->update($data);
        return $location->fresh();
    }

    public function delete(Location $location): void
    {
        $location->delete();
    }

    public function findByCode(string $code): ?Location
    {
        return Location::where('code', $code)->first();
    }
}
