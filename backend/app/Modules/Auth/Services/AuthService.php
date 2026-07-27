<?php

namespace App\Modules\Auth\Services;

use App\Models\User;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Password;

class AuthService
{
    public function login(string $login, string $password): User
    {
        // Support login via email, username, or employee_number
        $field = match (true) {
            filter_var($login, FILTER_VALIDATE_EMAIL) !== false => 'email',
            default => 'employee_number',
        };

        // First attempt with the detected field (email or employee_number)
        if (Auth::attempt([$field => $login, 'password' => $password])) {
            /** @var User $user */
            return Auth::user();
        }

        // If employee_number login fails, try username field as fallback
        if ($field === 'employee_number') {
            if (Auth::attempt(['username' => $login, 'password' => $password])) {
                /** @var User $user */
                return Auth::user();
            }
        }

        throw new AuthenticationException('Invalid credentials');
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
