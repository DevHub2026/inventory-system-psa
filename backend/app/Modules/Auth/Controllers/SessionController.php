<?php

namespace App\Modules\Auth\Controllers;

use App\Models\UserSession;
use App\Modules\Asset\Traits\RespondsWithJson;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class SessionController extends Controller
{
    use RespondsWithJson;

    public function index(Request $request): JsonResponse
    {
        $sessions = $request->user()->sessions()->orderByDesc('login_at')->get();

        return $this->success([
            'items' => $sessions->map(fn ($session) => [
                'id' => $session->id,
                'device_name' => $session->device_name,
                'browser' => $session->browser,
                'platform' => $session->platform,
                'ip_address' => $session->ip_address,
                'login_at' => $session->login_at?->format('Y-m-d H:i:s'),
                'last_activity' => $session->last_activity?->format('Y-m-d H:i:s'),
                'is_active' => $session->is_active,
                'is_current' => $this->isCurrentSession($request, $session),
            ]),
        ], 'Sessions retrieved successfully.');
    }

    public function revoke(Request $request, UserSession $session): JsonResponse
    {
        $this->authorize('delete', $session);

        $session->deactivate();

        return $this->success(null, 'Session revoked successfully.');
    }

    public function revokeAll(Request $request): JsonResponse
    {
        $user = $request->user();
        $currentSessionId = $this->getCurrentSessionId($request);

        $revoked = $user->sessions()
            ->where('id', '!=', $currentSessionId)
            ->active()
            ->update(['is_active' => false]);

        return $this->success(['revoked' => $revoked], 'All other sessions revoked successfully.');
    }

    private function isCurrentSession(Request $request, UserSession $session): bool
    {
        return $session->id === $this->getCurrentSessionId($request);
    }

    private function getCurrentSessionId(Request $request): ?int
    {
        // In a real implementation, this would track the current session ID
        // For now, we'll use a simple approach based on IP and user agent
        $userAgent = $request->userAgent();
        $ipAddress = $request->ip();

        return $request->user()->sessions()
            ->where('ip_address', $ipAddress)
            ->where('browser', $userAgent)
            ->where('is_active', true)
            ->latest('login_at')
            ->value('id');
    }
}
