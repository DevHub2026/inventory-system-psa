<?php

namespace App\Modules\Auth\Services;

use App\Models\User;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Password;

class AuthService
{
    public function login(string $email, string $password): User
    {
        $field = filter_var($email, FILTER_VALIDATE_EMAIL) ? 'email' : 'employee_number';

        if (! Auth::attempt([$field => $email, 'password' => $password])) {
            throw new AuthenticationException('Invalid credentials');
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

    public function forgotPassword(string $email): string
    {
        $status = Password::sendResetLink(['email' => $email]);

        if ($status !== Password::RESET_LINK_SENT) {
            throw new \Exception('Failed to send password reset link.');
        }

        return $status;
    }

    public function resetPassword(array $credentials): void
    {
        $status = Password::reset($credentials, function (User $user, string $password) {
            $user->update([
                'password' => $password,
            ]);
        });

        if ($status !== Password::PASSWORD_RESET) {
            throw new \Exception('Failed to reset password.');
        }
    }
}
