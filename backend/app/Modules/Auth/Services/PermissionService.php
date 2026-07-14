<?php

namespace App\Modules\Auth\Services;

use App\Models\Permission;

class PermissionService
{
    public function create(array $data): Permission
    {
        return Permission::create([
            'name' => $data['name'],
            'module' => $data['module'],
            'description' => $data['description'] ?? null,
        ]);
    }

    public function update(Permission $permission, array $data): Permission
    {
        $permission->update([
            'name' => $data['name'] ?? $permission->name,
            'module' => $data['module'] ?? $permission->module,
            'description' => $data['description'] ?? $permission->description,
        ]);

        return $permission->fresh();
    }

    public function delete(Permission $permission): void
    {
        $permission->delete();
    }
}
