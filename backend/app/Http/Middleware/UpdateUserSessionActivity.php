<?php

namespace App\Http\Middleware;

use App\Models\UserSession;
use Closure;
use Illuminate\Http\Request;

class UpdateUserSessionActivity
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if ($user) {
            try {
                $ip = $request->ip();

                // Best-effort: update the most recent active session for this user+IP
                $session = UserSession::where('user_id', $user->id)
                    ->where('is_active', true)
                    ->where('ip_address', $ip)
                    ->orderByDesc('login_at')
                    ->first();

                if ($session) {
                    $session->updateLastActivity();
                }
            } catch (\Throwable $e) {
                // Don't break requests if session update fails; just log silently.
                logger()->warning('Failed to update UserSession last_activity: '.$e->getMessage());
            }
        }

        return $next($request);
    }
}
