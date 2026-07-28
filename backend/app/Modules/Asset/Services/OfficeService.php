<?php

namespace App\Modules\Asset\Services;

use App\Modules\Asset\Models\Office;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
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
        $data['created_by'] = Auth::id();
        return Office::query()->create($data);
    }

    public function update(Office $office, array $data): Office
    {
        $data['updated_by'] = Auth::id();
        $office->update($data);
        return $office->fresh();
    }

    public function delete(Office $office): void
    {
        if ($office->assets()->exists()) {
            throw new \InvalidArgumentException('Cannot delete office with assigned assets.');
        }
        if ($office->locations()->exists()) {
            throw new \InvalidArgumentException('Cannot delete office with assigned locations.');
        }
        if (\App\Models\User::where('office_id', $office->id)->exists()) {
            throw new \InvalidArgumentException('Cannot delete office with assigned users.');
        }

        $office->delete();
    }

    private function searchOperator(): string
    {
        return DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
    }
}
