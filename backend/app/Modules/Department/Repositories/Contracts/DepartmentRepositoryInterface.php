<?php

namespace App\Modules\Department\Repositories\Contracts;

use App\Modules\Department\Models\Department;

interface DepartmentRepositoryInterface
{
    public function all();

    public function find(int $id): ?Department;

    public function create(array $data): Department;

    public function update(Department $department, array $data): Department;

    public function delete(Department $department): bool;

    public function hasUsers(Department $department): bool;
}
