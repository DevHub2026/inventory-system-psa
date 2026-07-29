<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use Closure;
use Illuminate\Http\Request;

class AuditLog
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Log sensitive actions
        $sensitiveActions = [
            'login',
            'logout',
            'store',
            'update',
            'destroy',
            'delete',
            'import',
            'export',
            'borrow',
            'return',
            'approve',
            'reject',
        ];

        $action = $request->route()?->getActionMethod();

        if (in_array($action, $sensitiveActions, true)) {
            $user = $request->user();

            AuditLog::create([
                'user_id' => $user?->id,
                'action' => $action,
                'model_type' => $this->getModelType($request),
                'model_id' => $this->getModelId($request),
                'old_values' => $this->getOldValues($request),
                'new_values' => $this->getNewValues($request, $response),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        }

        return $response;
    }

    private function getModelType(Request $request): ?string
    {
        $path = $request->path();
        $segments = explode('/', $path);

        // Extract model type from path (e.g., /api/v1/assets -> Asset)
        if (isset($segments[2])) {
            return ucfirst(str_singular($segments[2]));
        }

        return null;
    }

    private function getModelId(Request $request): ?int
    {
        $id = $request->route('id') ?? $request->route('asset') ?? $request->route('user');
        return is_numeric($id) ? (int) $id : null;
    }

    private function getOldValues(Request $request): ?array
    {
        // For update actions, we could fetch old values from database
        // This is a simplified version - in production, you'd fetch actual old values
        if ($request->isMethod('PUT') || $request->isMethod('PATCH')) {
            return ['method' => $request->method(), 'path' => $request->path()];
        }

        return null;
    }

    private function getNewValues(Request $request, $response): ?array
    {
        // Log request data for create/update actions
        if ($request->isMethod('POST') || $request->isMethod('PUT') || $request->isMethod('PATCH')) {
            return array_merge(
                ['method' => $request->method(), 'path' => $request->path()],
                $request->except(['password', 'current_password', 'new_password'])
            );
        }

        return null;
    }
}
