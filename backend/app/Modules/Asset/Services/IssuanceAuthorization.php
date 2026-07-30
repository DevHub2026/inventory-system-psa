<?php

namespace App\Modules\Asset\Services;

use App\Enums\UserRole;
use App\Models\User;

class IssuanceAuthorization
{
    /**
     * Roles that may manage permanent issuance (assign, re-issue, directory, user search).
     *
     * @return list<string>
     */
    public static function managerRoleNames(): array
    {
        return [
            UserRole::SUPER_ADMINISTRATOR->value,
            UserRole::SYSTEM_ADMINISTRATOR->value,
            UserRole::PROPERTY_CUSTODIAN->value,
            UserRole::INVENTORY_OFFICER->value,
        ];
    }

    public function canManageIssuance(?User $user): bool
    {
        if ($user === null) {
            return false;
        }

        return $user->hasAnyRole(self::managerRoleNames());
    }

    public function canViewUserIssuances(?User $actor, User $subject): bool
    {
        if ($actor === null) {
            return false;
        }

        if ($actor->id === $subject->id) {
            return true;
        }

        return $this->canManageIssuance($actor);
    }
}
