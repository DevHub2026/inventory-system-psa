<?php

namespace App\Modules\Auth\Services;

use App\Models\Role;
use App\Models\User;
use App\Modules\Auth\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Support\Facades\Auth;

class UserService
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
    ) {}

    public function create(array $data): User
    {
        $data['created_by'] = Auth::id();
        $user = $this->userRepository->create($data);

        if (isset($data['roles']) && is_array($data['roles'])) {
            $user->roles()->sync($data['roles']);
        }

        return $user->fresh();
    }

    public function update(User $user, array $data): User
    {
        $data['updated_by'] = Auth::id();
        $user = $this->userRepository->update($user, $data);

        if (isset($data['roles']) && is_array($data['roles'])) {
            $user->roles()->sync($data['roles']);
        }

        return $user->fresh();
    }

    public function delete(User $user): void
    {
        $user->update(['deleted_by' => Auth::id()]);
        $this->userRepository->delete($user);
    }

    public function assignRole(User $user, Role $role): void
    {
        $user->roles()->syncWithoutDetaching([$role->id]);
    }

    public function removeRole(User $user, Role $role): void
    {
        $user->roles()->detach($role->id);
    }

    public function syncRoles(User $user, array $roleIds): void
    {
        $user->roles()->sync($roleIds);
    }
}
