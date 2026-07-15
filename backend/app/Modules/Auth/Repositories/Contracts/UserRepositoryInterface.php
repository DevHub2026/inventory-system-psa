<?php

namespace App\Modules\Auth\Repositories\Contracts;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface UserRepositoryInterface
{
    public function all(array $filters = []): LengthAwarePaginator;

    public function find(int $id): User;

    public function create(array $data): User;

    public function update(User $user, array $data): User;

    public function delete(User $user): void;

    public function findByEmail(string $email): ?User;

    public function findByEmployeeNumber(string $employeeNumber): ?User;
}
