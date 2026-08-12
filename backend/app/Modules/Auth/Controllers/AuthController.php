<?php

namespace App\Modules\Auth\Controllers;

use App\Modules\Auth\Requests\ChangePasswordRequest;
use App\Modules\Auth\Requests\ForgotPasswordRequest;
use App\Modules\Auth\Requests\LoginRequest;
use App\Modules\Auth\Requests\ResetPasswordRequest;
use App\Modules\Auth\Requests\UpdateProfileRequest;
use App\Modules\Auth\Resources\UserResource;
use App\Modules\Auth\Services\AuthService;
use App\Models\UserSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuthService $authService,
    ) {}

    public function login(LoginRequest $request): JsonResponse
    {
        $user = $this->authService->login(
            $request->validated('email'),
            $request->validated('password'),
        );

        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        $tokenResult = $user->createToken('auth');
        $token = $tokenResult->plainTextToken;

        // Record a UserSession for this login so the Active Sessions UI can show it.
        try {
            $ua = (string) $request->userAgent();
            $deviceName = $request->header('x-device-name') ?: (strlen($ua) > 100 ? substr($ua, 0, 100) : $ua);

            UserSession::create([
                'user_id' => $user->id,
                'device_name' => $deviceName,
                'browser' => $ua,
                'platform' => null,
                'ip_address' => $request->ip(),
                'login_at' => now(),
                'last_activity' => now(),
                'is_active' => true,
                // Store the personal access token id when available so session
                // revocation can also revoke the underlying token.
                'personal_access_token_id' => $tokenResult->accessToken->id ?? null,
            ]);
        } catch (\Throwable $e) {
            // Do not fail login if session recording fails; log for diagnostics.
            logger()->warning('Failed to create UserSession on login: '.$e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'user' => (new UserResource($user->load(['department', 'roles'])))->resolve(),
            'token' => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout(
            $request->user(),
            $request->bearerToken() !== null,
        );

        // Mark the most recent active UserSession from this IP as inactive so it
        // no longer appears as an active session in the UI. This is best-effort
        // and must not break logout flow if the DB operation fails.
        try {
            $user = $request->user();
            if ($user) {
                \App\Models\UserSession::where('user_id', $user->id)
                    ->where('is_active', true)
                    ->where('ip_address', $request->ip())
                    ->orderByDesc('login_at')
                    ->limit(1)
                    ->update(['is_active' => false]);
            }
        } catch (\Throwable $e) {
            logger()->warning('Failed to deactivate UserSession on logout: '.$e->getMessage());
        }

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json([
            'success' => true,
            'message' => 'Logout successful.',
            'data' => null,
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Authenticated user retrieved successfully.',
            'data' => new UserResource($request->user()->load(['department', 'roles'])),
        ]);
    }

    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = $this->authService->updateProfile(
            $request->user(),
            $request->validated(),
        );

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'data' => new UserResource($user->load(['department', 'roles'])),
        ]);
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $this->authService->changePassword(
            $request->user(),
            $request->validated('password'),
        );

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully.',
            'data' => null,
        ]);
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $this->authService->forgotPassword($request->validated('email'));

        return response()->json([
            'success' => true,
            'message' => 'Password reset link sent successfully.',
            'data' => null,
        ]);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $this->authService->resetPassword($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Password reset successfully.',
            'data' => null,
        ]);
    }
}
