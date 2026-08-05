<?php

namespace App\Modules\Auth\Controllers;

use App\Models\UserSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class SessionController extends Controller
{
    /**
     * List all active sessions for the authenticated user.
     *
     * "Current session" detection: with Sanctum token auth the PHP session
     * driver is not used, so $request->session()->getId() is unavailable.
     * We instead compare by the Sanctum token's last_used_at timestamp and
     * the request's IP/user-agent against the most recent UserSession record.
     * The safest portable heuristic is to mark the newest active session for
     * this user+IP combination as the current one.
     */
    public function index(Request $request): JsonResponse
    {
        $user      = $request->user();
        $currentIp = $request->ip();

        // Best-effort: the most recently active session from this IP is current.
        $latestFromIp = UserSession::where('user_id', $user->id)
            ->where('is_active', true)
            ->where('ip_address', $currentIp)
            ->orderByDesc('last_activity')
            ->value('id');

        $sessions = UserSession::where('user_id', $user->id)
            ->orderByDesc('login_at')
            ->get()
            ->map(function (UserSession $session) use ($latestFromIp) {
                return [
                    'id'            => $session->id,
                    'device_name'   => $session->device_name,
                    'browser'       => $session->browser,
                    'platform'      => $session->platform,
                    'ip_address'    => $session->ip_address,
                    'login_at'      => $session->login_at?->toIso8601String(),
                    'last_activity' => $session->last_activity?->toIso8601String(),
                    'is_active'     => $session->is_active,
                    'is_current'    => $latestFromIp !== null && $session->id === $latestFromIp,
                ];
            });

        return response()->json([
            'success' => true,
            'message' => 'Sessions retrieved successfully.',
            'data'    => [
                'items' => $sessions,
            ],
        ]);
    }

    /**
     * Revoke a specific session.
     */
    public function revoke(Request $request, int $id): JsonResponse
    {
        $session = UserSession::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->firstOrFail();

        $session->deactivate();

        return response()->json([
            'success' => true,
            'message' => 'Session revoked successfully.',
            'data'    => null,
        ]);
    }

    /**
     * Revoke all sessions except the most recent one from the current IP
     * (a reasonable proxy for "current session" in Sanctum token auth).
     */
    public function revokeAll(Request $request): JsonResponse
    {
        $user      = $request->user();
        $currentIp = $request->ip();

        // Identify the current session the same way index() does.
        $currentSessionId = UserSession::where('user_id', $user->id)
            ->where('is_active', true)
            ->where('ip_address', $currentIp)
            ->orderByDesc('last_activity')
            ->value('id');

        $query = UserSession::where('user_id', $user->id);

        if ($currentSessionId !== null) {
            $query->where('id', '!=', $currentSessionId);
        }

        $query->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'All other sessions revoked successfully.',
            'data'    => null,
        ]);
    }
}
