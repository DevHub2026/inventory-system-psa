<?php

namespace App\Modules\Asset\Services;

use App\Modules\Asset\Models\Office;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class OfficeService
{
    public function list(array $filters = []): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 20);

        $query = Office::query();

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

    public function create(array $data): Office
    {
        return Office::query()->create($data);
    }

    public function update(Office $office, array $data): Office
    {
        $office->update($data);

        return $office->fresh();
    }

    public function delete(Office $office): void
    {
        $office->delete();
    }

    private function searchOperator(): string
    {
        return DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
    }
}
