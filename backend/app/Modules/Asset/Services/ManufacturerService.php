<?php

namespace App\Modules\Asset\Services;

use App\Modules\Asset\Models\Manufacturer;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
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
        $data['created_by'] = Auth::id();
        return Manufacturer::query()->create($data);
    }

    public function update(Manufacturer $manufacturer, array $data): Manufacturer
    {
        $data['updated_by'] = Auth::id();
        $manufacturer->update($data);
        return $manufacturer->fresh();
    }

    public function delete(Manufacturer $manufacturer): void
    {
        if ($manufacturer->assets()->exists()) {
            throw new \InvalidArgumentException('Cannot delete manufacturer with assigned assets.');
        }

        $manufacturer->delete();
    }

    private function searchOperator(): string
    {
        return DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
    }
}
