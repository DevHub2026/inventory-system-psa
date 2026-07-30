<?php

namespace App\Modules\SystemSetup\Policies;

use App\Enums\UserRole;
use App\Models\User;
use App\Modules\SystemSetup\Models\DocumentTemplate;

class DocumentTemplatePolicy
{
    public function viewAny(?User $user): bool
    {
        return $user !== null;
    }

    public function view(?User $user, DocumentTemplate $template): bool
    {
        return $user !== null;
    }

    public function create(?User $user): bool
    {
        return $this->isAdmin($user);
    }

    public function update(?User $user, DocumentTemplate $template): bool
    {
        return $this->isAdmin($user);
    }

    public function delete(?User $user, DocumentTemplate $template): bool
    {
        return $this->isAdmin($user);
    }

    public function setDefault(?User $user, DocumentTemplate $template): bool
    {
        return $this->isAdmin($user);
    }

    public function toggleStatus(?User $user, DocumentTemplate $template): bool
    {
        return $this->isAdmin($user);
    }

    public function download(?User $user, DocumentTemplate $template): bool
    {
        return $user !== null;
    }

    public function upload(?User $user, DocumentTemplate $template): bool
    {
        return $this->isAdmin($user);
    }

    public function activate(?User $user, DocumentTemplate $template): bool
    {
        return $this->isAdmin($user);
    }

    public function validateTemplate(?User $user, DocumentTemplate $template): bool
    {
        return $this->isAdmin($user);
    }

    public function duplicate(?User $user, DocumentTemplate $template): bool
    {
        return $this->isAdmin($user);
    }

    private function isAdmin(?User $user): bool
    {
        return $user?->hasRole(UserRole::SUPER_ADMINISTRATOR->value) === true
            || $user?->hasRole(UserRole::SYSTEM_ADMINISTRATOR->value) === true;
    }
}
