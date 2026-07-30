<?php

namespace App\Modules\Auth\Controllers;

use App\Models\AuditLog;
use App\Modules\Asset\Traits\RespondsWithJson;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class AuditLogController extends Controller
{
    use RespondsWithJson;

    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 50);
        $query = AuditLog::with('user:id,first_name,last_name,email')
            ->orderByDesc('created_at');

        // Filter by action
        if ($request->has('action')) {
            $query->where('action', $request->query('action'));
        }

        // Filter by user
        if ($request->has('user_id')) {
            $query->where('user_id', $request->query('user_id'));
        }

        // Filter by date range
        if ($request->has('from_date')) {
            $query->where('created_at', '>=', $request->query('from_date'));
        }
        if ($request->has('to_date')) {
            $query->where('created_at', '<=', $request->query('to_date'));
        }

        $logs = $query->paginate($perPage);

        return $this->success([
            'items' => collect($logs->items())->map(fn ($log) => [
                'id' => $log->id,
                'user_id' => $log->user_id,
                'user_name' => $log->user?->getFullNameAttribute() ?? 'System',
                'user_email' => $log->user?->email,
                'action' => $log->action,
                'model_type' => $log->model_type,
                'model_id' => $log->model_id,
                'old_values' => $log->old_values,
                'new_values' => $log->new_values,
                'ip_address' => $log->ip_address,
                'user_agent' => $log->user_agent,
                'created_at' => $log->created_at?->format('Y-m-d H:i:s'),
            ]),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
                'last_page' => $logs->lastPage(),
            ],
        ], 'Audit logs retrieved successfully.');
    }

    public function show(Request $request, AuditLog $auditLog): JsonResponse
    {
        $auditLog->load('user:id,first_name,last_name,email');

        return $this->success([
            'id' => $auditLog->id,
            'user_id' => $auditLog->user_id,
            'user_name' => $auditLog->user?->getFullNameAttribute() ?? 'System',
            'user_email' => $auditLog->user?->email,
            'action' => $auditLog->action,
            'model_type' => $auditLog->model_type,
            'model_id' => $auditLog->model_id,
            'old_values' => $auditLog->old_values,
            'new_values' => $auditLog->new_values,
            'ip_address' => $auditLog->ip_address,
            'user_agent' => $auditLog->user_agent,
            'created_at' => $auditLog->created_at?->format('Y-m-d H:i:s'),
        ], 'Audit log retrieved successfully.');
    }
}
