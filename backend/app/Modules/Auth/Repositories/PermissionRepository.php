<?php

namespace App\Modules\Auth\Repositories;

use App\Models\Permission;
use App\Modules\Auth\Repositories\Contracts\PermissionRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class PermissionRepository implements PermissionRepositoryInterface
{
    public function all(array $filters = []): LengthAwarePaginator
    {
        $query = Permission::query();

        if (isset($filters['search'])) {
            $search = $filters['search'];
            $query->where('name', 'like', "%{$search}%")
                ->orWhere('module', 'like', "%{$search}%");
        }

        if (isset($filters['module'])) {
            $query->where('module', $filters['module']);
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    public function find(int $id): Permission
    {
        return Permission::findOrFail($id);
    }

    public function create(array $data): Permission
    {
        return Permission::create($data);
    }

    public function update(Permission $permission, array $data): Permission
    {
        $permission->update($data);

        return $permission->fresh();
    }

    public function delete(Permission $permission): void
    {
        $permission->delete();
    }

    public function findByName(string $name): ?Permission
    {
        return Permission::where('name', $name)->first();
    }
}
