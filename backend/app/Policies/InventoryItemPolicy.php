<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;
use App\Modules\Inventory\Models\InventoryItem;
use App\Modules\Inventory\Services\InventoryClassificationService;

class InventoryItemPolicy
{
    /**
     * View any inventory item.
     * Inventory listing and detail viewing is allowed for all roles that
     * have route-level access. Route middleware gates that.
     */
    public function view(User $user, ?InventoryItem $item = null): bool
    {
        return true; // Viewing control is handled by route middleware
    }

    /**
     * Determine if the user can create an inventory item.
     * For Supply Officer-only users: allow only when classification == 'SUPPLY'.
     * For other staff/admin roles: allow.
     *
     * @param User $user
     * @param string|null $classification
     * @return bool
     */
    public function create(User $user, ?string $classification = null): bool
    {
        // Roles that historically manage inventory beyond Supply Officer
        $managerRoles = [
            UserRole::SUPER_ADMINISTRATOR->value,
            UserRole::SYSTEM_ADMINISTRATOR->value,
            UserRole::PROPERTY_CUSTODIAN->value,
            UserRole::INVENTORY_OFFICER->value,
            UserRole::DEPARTMENT_HEAD->value,
            UserRole::AUDITOR->value,
        ];

        if ($user->hasAnyRole($managerRoles)) {
            return true;
        }

        // If the user has any role other than Supply Officer, allow (defers to RBAC)
        if ($user->hasAnyRole(['Employee']) || $user->hasAnyRole(['Supply Officer']) === false) {
            // This branch is conservative: if user is not Supply Officer-only, do not deny here
            return true;
        }

        // At this point we consider the user to be Supply Officer (or mostly Supply Officer).
        // If user has multiple roles (including a manager role) the earlier check returned true.
        // For Supply Officer-only users, only allow creation of SUPPLY items.
        return strtoupper((string) ($classification ?? '')) === InventoryClassificationService::CLASSIFICATION_SUPPLY;
    }

    /**
     * Determine if the user can update the inventory item.
     * For Supply Officer-only users: allow only when the existing item is SUPPLY
     * and the resulting classification is SUPPLY (no moving items across categories).
     * For manager roles: allow.
     *
     * @param User $user
     * @param InventoryItem $item
     * @param string|null $requestedClassification
     */
    public function update(User $user, InventoryItem $item, ?string $requestedClassification = null): bool
    {
        $managerRoles = [
            UserRole::SUPER_ADMINISTRATOR->value,
            UserRole::SYSTEM_ADMINISTRATOR->value,
            UserRole::PROPERTY_CUSTODIAN->value,
            UserRole::INVENTORY_OFFICER->value,
            UserRole::DEPARTMENT_HEAD->value,
            UserRole::AUDITOR->value,
        ];

        if ($user->hasAnyRole($managerRoles)) {
            return true;
        }

        // If the user is not Supply Officer or has other roles, allow
        if (! $user->hasRole(UserRole::SUPPLY_OFFICER->value)) {
            return true;
        }

        // Only Supply Officer remains. Allow update only if existing classification
        // is SUPPLY and requested (resulting) classification is SUPPLY as well.
        $existing = strtoupper((string) ($item->classification ?? ''));
        $requested = strtoupper((string) ($requestedClassification ?? $item->classification ?? ''));

        return $existing === InventoryClassificationService::CLASSIFICATION_SUPPLY && $requested === InventoryClassificationService::CLASSIFICATION_SUPPLY;
    }

    /**
     * Determine if the user can delete the inventory item.
     * Supply Officer-only users may delete only SUPPLY items.
     */
    public function delete(User $user, InventoryItem $item): bool
    {
        $managerRoles = [
            UserRole::SUPER_ADMINISTRATOR->value,
            UserRole::SYSTEM_ADMINISTRATOR->value,
            UserRole::PROPERTY_CUSTODIAN->value,
            UserRole::INVENTORY_OFFICER->value,
            UserRole::DEPARTMENT_HEAD->value,
            UserRole::AUDITOR->value,
        ];

        if ($user->hasAnyRole($managerRoles)) {
            return true;
        }

        if (! $user->hasRole(UserRole::SUPPLY_OFFICER->value)) {
            return true;
        }

        return strtoupper((string) ($item->classification ?? '')) === InventoryClassificationService::CLASSIFICATION_SUPPLY;
    }
}
