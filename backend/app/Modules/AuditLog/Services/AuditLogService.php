<?php

namespace App\Modules\AuditLog\Services;

use App\Modules\AuditLog\Models\AuditLog;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;

class AuditLogService
{
    public function log(string $action, string $module, ?string $description = null, ?array $oldValues = null, ?array $newValues = null, ?int $userId = null, ?string $ipAddress = null, ?string $userAgent = null): AuditLog
    {
        $currentUserId = $userId;
        if ($currentUserId === null && auth()->check()) {
            $currentUserId = auth()->user()->id;
        }

        return AuditLog::create([
            'user_id' => $currentUserId,
            'action' => $action,
            'module' => $module,
            'description' => $description,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => $ipAddress ?? request()->ip(),
            'user_agent' => $userAgent ?? request()->userAgent(),
        ]);
    }

    public function list(array $filters = []): Collection
    {
        $query = AuditLog::query()->with('user');

        if (isset($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (isset($filters['module'])) {
            $query->where('module', $filters['module']);
        }

        if (isset($filters['action'])) {
            $query->where('action', $filters['action']);
        }

        if (isset($filters['from_date'])) {
            $query->where('created_at', '>=', $filters['from_date']);
        }

        if (isset($filters['to_date'])) {
            $query->where('created_at', '<=', $filters['to_date']);
        }

        return $query->orderByDesc('created_at')->get();
    }

    public function getActivityByUser(int $userId): Collection
    {
        return AuditLog::query()
            ->where('user_id', $userId)
            ->orderByDesc('created_at')
            ->get();
    }

    public function getActivityByModule(string $module): Collection
    {
        return AuditLog::query()
            ->where('module', $module)
            ->orderByDesc('created_at')
            ->get();
    }
}
