<?php

namespace App\Modules\Auth\Services;

use App\Models\Permission;
use App\Models\Role;
use App\Modules\Auth\Repositories\Contracts\RoleRepositoryInterface;
use Illuminate\Support\Facades\Auth;

class RoleService
{
    public function __construct(
        private readonly RoleRepositoryInterface $roleRepository,
    ) {}

    public function create(array $data): Role
    {
        $data['created_by'] = Auth::id();
        $role = $this->roleRepository->create($data);

        if (isset($data['permissions']) && is_array($data['permissions'])) {
            $role->permissions()->sync($data['permissions']);
        }

        return $role->fresh();
    }

    public function update(Role $role, array $data): Role
    {
        $data['updated_by'] = Auth::id();
        $role = $this->roleRepository->update($role, $data);

        if (isset($data['permissions']) && is_array($data['permissions'])) {
            $role->permissions()->sync($data['permissions']);
        }

        return $role->fresh();
    }

    public function delete(Role $role): void
    {
        $role->update(['deleted_by' => Auth::id()]);
        $this->roleRepository->delete($role);
    }

    public function givePermission(Role $role, Permission $permission): void
    {
        $role->permissions()->syncWithoutDetaching([$permission->id]);
    }

    public function revokePermission(Role $role, Permission $permission): void
    {
        $role->permissions()->detach($permission->id);
    }

    public function syncPermissions(Role $role, array $permissionIds): void
    {
        $role->permissions()->sync($permissionIds);
    }
}
