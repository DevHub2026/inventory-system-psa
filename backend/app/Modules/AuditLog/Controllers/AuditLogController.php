<?php

namespace App\Modules\AuditLog\Controllers;

use App\Modules\Asset\Traits\RespondsWithJson;
use App\Modules\AuditLog\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class AuditLogController extends Controller
{
    use RespondsWithJson;

    public function __construct(private readonly AuditLogService $auditLogService) {}

    public function index(Request $request): JsonResponse
    {
        $logs = $this->auditLogService->list($request->all());

        return $this->success($logs->map(fn ($log) => [
            'id' => $log->id,
            'user' => $log->user->name ?? 'System',
            'action' => $log->action,
            'module' => $log->module,
            'description' => $log->description,
            'old_values' => $log->old_values,
            'new_values' => $log->new_values,
            'ip_address' => $log->ip_address,
            'created_at' => $log->created_at->format('Y-m-d H:i:s'),
        ])->values(), 'Audit logs retrieved successfully.');
    }

    public function userActivity(int $userId): JsonResponse
    {
        $logs = $this->auditLogService->getActivityByUser($userId);

        return $this->success($logs->map(fn ($log) => [
            'id' => $log->id,
            'action' => $log->action,
            'module' => $log->module,
            'description' => $log->description,
            'created_at' => $log->created_at->format('Y-m-d H:i:s'),
        ])->values(), 'User activity retrieved successfully.');
    }

    public function moduleActivity(string $module): JsonResponse
    {
        $logs = $this->auditLogService->getActivityByModule($module);

        return $this->success($logs->map(fn ($log) => [
            'id' => $log->id,
            'user' => $log->user->name ?? 'System',
            'action' => $log->action,
            'description' => $log->description,
            'created_at' => $log->created_at->format('Y-m-d H:i:s'),
        ])->values(), 'Module activity retrieved successfully.');
    }
}
