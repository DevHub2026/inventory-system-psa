<?php

namespace App\Modules\Department\Repositories;

use App\Modules\Department\Models\Department;
use App\Modules\Department\Repositories\Contracts\DepartmentRepositoryInterface;

class DepartmentRepository implements DepartmentRepositoryInterface
{
    public function all()
    {
        return Department::all();
    }

    public function find(int $id): ?Department
    {
        return Department::find($id);
    }

    public function create(array $data): Department
    {
        return Department::create($data);
    }

    public function update(Department $department, array $data): Department
    {
        $department->update($data);
        return $department->fresh();
    }

    public function delete(Department $department): bool
    {
        return $department->delete();
    }

    public function hasUsers(Department $department): bool
    {
        return $department->users()->exists();
    }
}
