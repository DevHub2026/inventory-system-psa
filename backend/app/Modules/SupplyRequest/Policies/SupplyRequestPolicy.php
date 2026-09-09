<?php

namespace App\Modules\SupplyRequest\Policies;

use App\Models\User;
use App\Modules\SupplyRequest\Models\SupplyRequest;
use Illuminate\Auth\Access\HandlesAuthorization;

class SupplyRequestPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasPermission('nav.supply_requests');
    }

    public function view(User $user, SupplyRequest $supplyRequest): bool
    {
        if ($user->hasPermission('supply_requests.fulfill')) {
            return true;
        }

        return $user->id === $supplyRequest->user_id;
    }

    public function create(User $user): bool
    {
        return true; // Any authenticated user can create a supply request
    }

    public function fulfill(User $user): bool
    {
        return $user->hasPermission('supply_requests.fulfill');
    }
}
