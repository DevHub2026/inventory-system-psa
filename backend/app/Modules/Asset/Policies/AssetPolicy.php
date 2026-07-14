<?php

namespace App\Modules\Asset\Policies;

use App\Models\User;
use App\Modules\Asset\Models\Asset;

/**
 * Temporary permissive policy so Asset APIs can be developed
 * in parallel with Auth/RBAC (Eman). Replace body with permission
 * checks such as $user->can('asset.view') once RBAC is ready.
 */
class AssetPolicy
{
    public function viewAny(?User $user): bool
    {
        return true;
    }

    public function view(?User $user, Asset $asset): bool
    {
        return true;
    }

    public function create(?User $user): bool
    {
        return true;
    }

    public function update(?User $user, Asset $asset): bool
    {
        return true;
    }

    public function delete(?User $user, Asset $asset): bool
    {
        return true;
    }

    public function archive(?User $user, Asset $asset): bool
    {
        return true;
    }

    public function transfer(?User $user, Asset $asset): bool
    {
        return true;
    }
}
