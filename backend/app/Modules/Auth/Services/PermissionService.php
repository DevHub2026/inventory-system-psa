<?php

namespace App\Modules\Auth\Services;

use App\Models\Permission;
use App\Modules\Auth\Repositories\Contracts\PermissionRepositoryInterface;
use Illuminate\Support\Facades\Auth;

class PermissionService
{
    public function __construct(
        private readonly PermissionRepositoryInterface $permissionRepository,
    ) {}

    public function create(array $data): Permission
    {
        $data['created_by'] = Auth::id();
        return $this->permissionRepository->create($data);
    }

    public function update(Permission $permission, array $data): Permission
    {
        $data['updated_by'] = Auth::id();
        return $this->permissionRepository->update($permission, $data);
    }

    public function delete(Permission $permission): void
    {
        $permission->update(['deleted_by' => Auth::id()]);
        $this->permissionRepository->delete($permission);
    }
}
