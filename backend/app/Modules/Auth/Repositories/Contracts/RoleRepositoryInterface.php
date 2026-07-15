<?php

namespace App\Modules\Auth\Repositories\Contracts;

use App\Models\Role;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface RoleRepositoryInterface
{
    public function all(array $filters = []): LengthAwarePaginator;

    public function find(int $id): Role;

    public function create(array $data): Role;

    public function update(Role $role, array $data): Role;

    public function delete(Role $role): void;

    public function findByName(string $name): ?Role;
}
