<?php

namespace App\Modules\Auth\Services;

use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserService
{
    public function create(array $data): User
    {
        $user = User::create([
            'employee_number' => $data['employee_number'],
            'first_name' => $data['first_name'],
            'middle_name' => $data['middle_name'] ?? null,
            'last_name' => $data['last_name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'department_id' => $data['department_id'] ?? null,
            'status' => $data['status'] ?? 'active',
        ]);

        if (isset($data['roles']) && is_array($data['roles'])) {
            $user->roles()->sync($data['roles']);
        }

        return $user->fresh();
    }

    public function update(User $user, array $data): User
    {
        $updateData = [
            'employee_number' => $data['employee_number'] ?? $user->employee_number,
            'first_name' => $data['first_name'] ?? $user->first_name,
            'middle_name' => $data['middle_name'] ?? $user->middle_name,
            'last_name' => $data['last_name'] ?? $user->last_name,
            'email' => $data['email'] ?? $user->email,
            'department_id' => $data['department_id'] ?? $user->department_id,
            'status' => $data['status'] ?? $user->status,
        ];

        if (isset($data['password'])) {
            $updateData['password'] = Hash::make($data['password']);
        }

        $user->update($updateData);

        if (isset($data['roles']) && is_array($data['roles'])) {
            $user->roles()->sync($data['roles']);
        }

        return $user->fresh();
    }

    public function delete(User $user): void
    {
        $user->delete();
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
