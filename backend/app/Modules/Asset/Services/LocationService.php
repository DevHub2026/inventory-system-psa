<?php

namespace App\Modules\Asset\Services;

use App\Modules\Asset\Models\Location;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class LocationService
{
    public function list(array $filters = []): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 20);

        $query = Location::query()->with('office');

        if (! empty($filters['office_id'])) {
            $query->where('office_id', $filters['office_id']);
        }

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

    public function create(array $data): Location
    {
        $data['created_by'] = Auth::id();
        return Location::query()->create($data);
    }

    public function update(Location $location, array $data): Location
    {
        $data['updated_by'] = Auth::id();
        $location->update($data);
        return $location->fresh()->load('office');
    }

    public function delete(Location $location): void
    {
        if ($location->assets()->exists()) {
            throw new \InvalidArgumentException('Cannot delete location with assigned assets.');
        }

        $location->delete();
    }

    private function searchOperator(): string
    {
        return DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
    }
}
