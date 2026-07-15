<?php

namespace App\Modules\Auth\Repositories;

use App\Models\Role;
use App\Modules\Auth\Repositories\Contracts\RoleRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class RoleRepository implements RoleRepositoryInterface
{
    public function all(array $filters = []): LengthAwarePaginator
    {
        $query = Role::query();

        if (isset($filters['search'])) {
            $search = $filters['search'];
            $query->where('name', 'like', "%{$search}%");
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    public function find(int $id): Role
    {
        return Role::findOrFail($id);
    }

    public function create(array $data): Role
    {
        return Role::create($data);
    }

    public function update(Role $role, array $data): Role
    {
        $role->update($data);

        return $role->fresh();
    }

    public function delete(Role $role): void
    {
        $role->delete();
    }

    public function findByName(string $name): ?Role
    {
        return Role::where('name', $name)->first();
    }
}
