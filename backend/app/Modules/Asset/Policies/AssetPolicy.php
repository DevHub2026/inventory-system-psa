<?php

namespace App\Modules\Asset\Policies;

use App\Enums\UserRole;
use App\Models\User;
use App\Modules\Asset\Models\Asset;

/**
 * A minimal auth guard for asset operations until the RBAC layer is fully
 * wired for the inventory domain. Authenticated users may access the API,
 * and explicit permission checks can be introduced later when roles are seeded.
 */
class AssetPolicy
{
    public function viewAny(?User $user): bool
    {
        return $user !== null;
    }

    public function view(?User $user, Asset $asset): bool
    {
        return $user !== null;
    }

    public function create(?User $user): bool
    {
        return $this->canManageAssets($user);
    }

    public function update(?User $user, Asset $asset): bool
    {
        return $this->canManageAssets($user);
    }

    public function delete(?User $user, Asset $asset): bool
    {
        return $this->canManageAssets($user);
    }

    public function archive(?User $user, Asset $asset): bool
    {
        return $this->canManageAssets($user);
    }

    public function transfer(?User $user, Asset $asset): bool
    {
        return $this->canManageAssets($user);
    }

    public function borrow(?User $user, Asset $asset): bool
    {
        return $user !== null;
    }

    public function return(?User $user, Asset $asset): bool
    {
        return $user !== null;
    }

    private function canManageAssets(?User $user): bool
    {
        return $user?->hasRole(UserRole::SUPER_ADMINISTRATOR->value) === true
            || $user?->hasRole(UserRole::SYSTEM_ADMINISTRATOR->value) === true;
    }
}
