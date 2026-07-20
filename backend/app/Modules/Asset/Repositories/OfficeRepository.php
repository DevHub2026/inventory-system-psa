<?php

namespace App\Modules\Asset\Repositories;

use App\Models\Office;
use App\Modules\Asset\Repositories\Contracts\OfficeRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class OfficeRepository implements OfficeRepositoryInterface
{
    public function all(array $filters = []): LengthAwarePaginator
    {
        $query = Office::query();

        if (isset($filters['search'])) {
            $search = $filters['search'];
            $query->where('name', 'like', "%{$search}%");
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    public function find(int $id): Office
    {
        return Office::findOrFail($id);
    }

    public function create(array $data): Office
    {
        return Office::create($data);
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

    public function findByCode(string $code): ?Office
    {
        return Office::where('code', $code)->first();
    }
}
