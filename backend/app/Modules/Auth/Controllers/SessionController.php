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
     */
    public function index(Request $request): JsonResponse
    {
        $sessions = UserSession::where('user_id', $request->user()->id)
            ->orderBy('login_at', 'desc')
            ->get()
            ->map(function (UserSession $session) use ($request) {
                return [
                    'id' => $session->id,
                    'device_name' => $session->device_name,
                    'browser' => $session->browser,
                    'platform' => $session->platform,
                    'ip_address' => $session->ip_address,
                    'login_at' => $session->login_at?->toIso8601String(),
                    'last_activity' => $session->last_activity?->toIso8601String(),
                    'is_active' => $session->is_active,
                    'is_current' => $session->id === (int) $request->session()->getId(),
                ];
            });

        return response()->json([
            'success' => true,
            'message' => 'Sessions retrieved successfully.',
            'data' => [
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
            'data' => null,
        ]);
    }

    /**
     * Revoke all sessions except the current one.
     */
    public function revokeAll(Request $request): JsonResponse
    {
        $currentSessionId = (int) $request->session()->getId();

        UserSession::where('user_id', $request->user()->id)
            ->where('id', '!=', $currentSessionId)
            ->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'All other sessions revoked successfully.',
            'data' => null,
        ]);
    }
}
