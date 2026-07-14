<?php

namespace App\Modules\Auth\Services;

use App\Models\Permission;
use App\Models\Role;

class RoleService
{
    public function create(array $data): Role
    {
        $role = Role::create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
        ]);

        if (isset($data['permissions']) && is_array($data['permissions'])) {
            $role->permissions()->sync($data['permissions']);
        }

        return $role->fresh();
    }

    public function update(Role $role, array $data): Role
    {
        $role->update([
            'name' => $data['name'] ?? $role->name,
            'description' => $data['description'] ?? $role->description,
        ]);

        if (isset($data['permissions']) && is_array($data['permissions'])) {
            $role->permissions()->sync($data['permissions']);
        }

        return $role->fresh();
    }

    public function delete(Role $role): void
    {
        $role->delete();
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
