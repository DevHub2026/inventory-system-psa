<?php

namespace App\Modules\Asset\Policies;

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
        return $user !== null;
    }

    public function update(?User $user, Asset $asset): bool
    {
        return $user !== null;
    }

    public function delete(?User $user, Asset $asset): bool
    {
        return $user !== null;
    }

    public function archive(?User $user, Asset $asset): bool
    {
        return $user !== null;
    }

    public function transfer(?User $user, Asset $asset): bool
    {
        return $user !== null;
    }
}
