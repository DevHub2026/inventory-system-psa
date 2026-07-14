<?php

namespace App\Modules\Auth\Services;

use App\Models\User;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Facades\Auth;

class AuthService
{
    public function login(string $email, string $password): User
    {
        if (! Auth::attempt(['email' => $email, 'password' => $password])) {
            throw new AuthenticationException('The provided credentials are incorrect.');
        }

        /** @var User $user */
        $user = Auth::user();

        return $user;
    }

    public function logout(?User $user = null, bool $revokeToken = false): void
    {
        if ($user !== null && $revokeToken) {
            $user->currentAccessToken()?->delete();
        }

        Auth::guard('web')->logout();
    }

    public function updateProfile(User $user, array $data): User
    {
        $user->update($data);

        return $user->fresh();
    }

    public function changePassword(User $user, string $newPassword): void
    {
        $user->update([
            'password' => $newPassword,
        ]);
    }
}
