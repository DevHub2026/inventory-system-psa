<?php

namespace App\Modules\Auth\Controllers;

use App\Modules\Auth\Requests\ChangePasswordRequest;
use App\Modules\Auth\Requests\ForgotPasswordRequest;
use App\Modules\Auth\Requests\LoginRequest;
use App\Modules\Auth\Requests\ResetPasswordRequest;
use App\Modules\Auth\Requests\UpdateProfileRequest;
use App\Modules\Auth\Resources\UserResource;
use App\Modules\Auth\Services\AuthService;
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

        $token = $user->createToken('auth')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'user' => (new UserResource($user))->resolve(),
            'token' => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout(
            $request->user(),
            $request->bearerToken() !== null,
        );

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
            'data' => new UserResource($request->user()),
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
            'data' => new UserResource($user),
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
