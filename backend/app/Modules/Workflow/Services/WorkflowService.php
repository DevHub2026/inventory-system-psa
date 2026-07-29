<?php

namespace App\Modules\Workflow\Services;

use App\Models\User;
use App\Modules\Workflow\Models\Workflow;
use App\Modules\Workflow\Models\WorkflowApprovalLevel;
use App\Modules\Workflow\Models\WorkflowAuditLog;
use App\Modules\Workflow\Models\WorkflowVersion;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class WorkflowService
{
    public function list(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return Workflow::query()
            ->with(['currentVersion.approvalLevels.office', 'currentVersion.approvalLevels.department', 'creator'])
            ->when(! empty($filters['search']), function ($q) use ($filters) {
                $search = $filters['search'];
                $q->where(function ($sub) use ($search) {
                    $sub->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when(! empty($filters['module_type']), fn ($q) => $q->where('module_type', $filters['module_type']))
            ->when(isset($filters['is_active']), fn ($q) => $q->where('is_active', (bool) $filters['is_active']))
            ->when(isset($filters['is_archived']), fn ($q) => $q->where('is_archived', (bool) $filters['is_archived']))
            ->orderByDesc('updated_at')
            ->paginate($perPage);
    }

    public function create(User $user, array $data): Workflow
    {
        return DB::transaction(function () use ($user, $data) {
            $workflow = Workflow::create([
                'name' => $data['name'],
                'module_type' => $data['module_type'],
                'description' => $data['description'] ?? null,
                'is_active' => $data['is_active'] ?? true,
                'is_archived' => false,
                'options' => $data['options'] ?? $this->defaultOptions(),
                'created_by' => $user->id,
                'updated_by' => $user->id,
            ]);

            $version = WorkflowVersion::create([
                'workflow_id' => $workflow->id,
                'version_number' => 1,
                'options' => $workflow->options,
                'change_summary' => 'Initial workflow creation',
                'created_by' => $user->id,
            ]);

            if (! empty($data['approval_levels']) && is_array($data['approval_levels'])) {
                $this->createLevels($version->id, $data['approval_levels']);
            }

            $workflow->update(['current_version_id' => $version->id]);

            $this->logAudit($workflow->id, $user->id, 'CREATE', null, $workflow->load('currentVersion.approvalLevels')->toArray());

            return $workflow->fresh(['currentVersion.approvalLevels', 'creator']);
        });
    }

    public function update(Workflow $workflow, User $user, array $data): Workflow
    {
        return DB::transaction(function () use ($workflow, $user, $data) {
            $oldData = $workflow->load('currentVersion.approvalLevels')->toArray();

            $latestVersion = WorkflowVersion::where('workflow_id', $workflow->id)->max('version_number') ?? 0;
            $newVersionNumber = $latestVersion + 1;

            $options = $data['options'] ?? $workflow->options ?? $this->defaultOptions();

            $workflow->update([
                'name' => $data['name'] ?? $workflow->name,
                'module_type' => $data['module_type'] ?? $workflow->module_type,
                'description' => $data['description'] ?? $workflow->description,
                'is_active' => isset($data['is_active']) ? (bool) $data['is_active'] : $workflow->is_active,
                'options' => $options,
                'updated_by' => $user->id,
            ]);

            $version = WorkflowVersion::create([
                'workflow_id' => $workflow->id,
                'version_number' => $newVersionNumber,
                'options' => $options,
                'change_summary' => $data['change_summary'] ?? "Updated workflow to version {$newVersionNumber}",
                'created_by' => $user->id,
            ]);

            if (! empty($data['approval_levels']) && is_array($data['approval_levels'])) {
                $this->createLevels($version->id, $data['approval_levels']);
            }

            $workflow->update(['current_version_id' => $version->id]);

            $newData = $workflow->fresh(['currentVersion.approvalLevels'])->toArray();
            $this->logAudit($workflow->id, $user->id, 'PUBLISH_VERSION', $oldData, $newData);

            return $workflow->fresh(['currentVersion.approvalLevels', 'creator']);
        });
    }

    public function duplicate(Workflow $workflow, User $user): Workflow
    {
        return DB::transaction(function () use ($workflow, $user) {
            $workflow->load('currentVersion.approvalLevels');

            $duplicate = Workflow::create([
                'name' => $workflow->name . ' (Copy)',
                'module_type' => $workflow->module_type,
                'description' => $workflow->description,
                'is_active' => false,
                'is_archived' => false,
                'options' => $workflow->options,
                'created_by' => $user->id,
                'updated_by' => $user->id,
            ]);

            $version = WorkflowVersion::create([
                'workflow_id' => $duplicate->id,
                'version_number' => 1,
                'options' => $workflow->options,
                'change_summary' => "Duplicated from '{$workflow->name}'",
                'created_by' => $user->id,
            ]);

            if ($workflow->currentVersion?->approvalLevels) {
                $levelsData = $workflow->currentVersion->approvalLevels->map(function ($lvl) {
                    return [
                        'level_order' => $lvl->level_order,
                        'name' => $lvl->name,
                        'roles' => $lvl->roles,
                        'user_ids' => $lvl->user_ids,
                        'office_id' => $lvl->office_id,
                        'department_id' => $lvl->department_id,
                        'approval_type' => $lvl->approval_type,
                        'is_enabled' => $lvl->is_enabled,
                        'execution_type' => $lvl->execution_type,
                        'parallel_group_id' => $lvl->parallel_group_id,
                        'conditions' => $lvl->conditions,
                        'escalation_hours' => $lvl->escalation_hours,
                        'escalate_to_roles' => $lvl->escalate_to_roles,
                        'escalate_to_user_ids' => $lvl->escalate_to_user_ids,
                        'allow_delegation' => $lvl->allow_delegation,
                    ];
                })->toArray();

                $this->createLevels($version->id, $levelsData);
            }

            $duplicate->update(['current_version_id' => $version->id]);

            $this->logAudit($duplicate->id, $user->id, 'DUPLICATE', null, $duplicate->load('currentVersion.approvalLevels')->toArray());

            return $duplicate->fresh(['currentVersion.approvalLevels', 'creator']);
        });
    }

    public function archive(Workflow $workflow, User $user): Workflow
    {
        $workflow->update(['is_archived' => true, 'is_active' => false, 'updated_by' => $user->id]);
        $this->logAudit($workflow->id, $user->id, 'ARCHIVE', null, ['is_archived' => true]);
        return $workflow->fresh();
    }

    public function restore(Workflow $workflow, User $user): Workflow
    {
        $workflow->update(['is_archived' => false, 'is_active' => true, 'updated_by' => $user->id]);
        $this->logAudit($workflow->id, $user->id, 'RESTORE', null, ['is_archived' => false]);
        return $workflow->fresh();
    }

    public function toggleActive(Workflow $workflow, User $user): Workflow
    {
        $newState = ! $workflow->is_active;
        $workflow->update(['is_active' => $newState, 'updated_by' => $user->id]);
        $this->logAudit($workflow->id, $user->id, 'TOGGLE_STATUS', ['is_active' => ! $newState], ['is_active' => $newState]);
        return $workflow->fresh();
    }

    public function getVersionHistory(Workflow $workflow): array
    {
        return WorkflowVersion::query()
            ->with(['approvalLevels.office', 'approvalLevels.department', 'creator'])
            ->where('workflow_id', $workflow->id)
            ->orderByDesc('version_number')
            ->get()
            ->toArray();
    }

    public function getAuditLogs(Workflow $workflow): array
    {
        return WorkflowAuditLog::query()
            ->with('user')
            ->where('workflow_id', $workflow->id)
            ->orderByDesc('created_at')
            ->get()
            ->toArray();
    }

    private function createLevels(int $versionId, array $levels): void
    {
        foreach ($levels as $index => $lvl) {
            WorkflowApprovalLevel::create([
                'workflow_version_id' => $versionId,
                'level_order' => $lvl['level_order'] ?? ($index + 1),
                'name' => $lvl['name'] ?? 'Level ' . ($index + 1),
                'roles' => $lvl['roles'] ?? [],
                'user_ids' => $lvl['user_ids'] ?? [],
                'office_id' => $lvl['office_id'] ?? null,
                'department_id' => $lvl['department_id'] ?? null,
                'approval_type' => $lvl['approval_type'] ?? 'single',
                'is_enabled' => isset($lvl['is_enabled']) ? (bool) $lvl['is_enabled'] : true,
                'execution_type' => $lvl['execution_type'] ?? 'sequential',
                'parallel_group_id' => $lvl['parallel_group_id'] ?? null,
                'conditions' => $lvl['conditions'] ?? null,
                'escalation_hours' => $lvl['escalation_hours'] ?? null,
                'escalate_to_roles' => $lvl['escalate_to_roles'] ?? null,
                'escalate_to_user_ids' => $lvl['escalate_to_user_ids'] ?? null,
                'allow_delegation' => isset($lvl['allow_delegation']) ? (bool) $lvl['allow_delegation'] : false,
            ]);
        }
    }

    private function logAudit(?int $workflowId, ?int $userId, string $action, ?array $prev, ?array $next): void
    {
        WorkflowAuditLog::create([
            'workflow_id' => $workflowId,
            'user_id' => $userId,
            'action' => $action,
            'previous_value' => $prev,
            'new_value' => $next,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'created_at' => now(),
        ]);
    }

    public function defaultOptions(): array
    {
        return [
            'auto_approve_no_approver' => true,
            'skip_disabled_levels' => true,
            'allow_rejection_any_level' => true,
            'allow_request_cancellation' => true,
            'allow_requester_withdrawal' => true,
            'require_remarks_on_rejection' => true,
            'require_remarks_on_approval' => false,
        ];
    }
}
