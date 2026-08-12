<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\UserSession;

class EnsureSessionTokenActive
{
    /**
     * If the request uses a bearer token that maps to a UserSession record, ensure
     * the session is active. If the UserSession does not exist for the token, do
     * not block (preserve backward compatibility for legacy tokens).
     */
    public function handle(Request $request, Closure $next)
    {
        $bearer = $request->bearerToken();
        if (! $bearer) {
            return $next($request);
        }

        $parts = explode('|', $bearer, 2);
        if (count($parts) < 1) {
            return $next($request);
        }

        $tokenId = intval($parts[0]);
        if ($tokenId <= 0) {
            return $next($request);
        }

        // If the token id points to a deleted/non-existent PersonalAccessToken entry,
        // treat it as revoked to ensure revocation by deletion is effective even when
        // there is no mapped UserSession (legacy tokens or missing session rows).
        try {
            $pat = \Laravel\Sanctum\PersonalAccessToken::find($tokenId);
            if ($pat === null) {
                return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
            }
        } catch (\Throwable $e) {
            // If Sanctum model is unavailable, preserve backward-compat by not blocking
            // (this should not happen in normal deployments).
        }

        $session = UserSession::where('personal_access_token_id', $tokenId)->first();
        if ($session !== null && ! $session->is_active) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        return $next($request);
    }
}
