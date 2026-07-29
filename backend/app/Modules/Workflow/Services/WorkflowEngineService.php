<?php

namespace App\Modules\Workflow\Services;

use App\Models\User;
use App\Modules\Workflow\Models\Workflow;
use App\Modules\Workflow\Models\WorkflowApprovalHistory;
use App\Modules\Workflow\Models\WorkflowApprovalLevel;
use App\Modules\Workflow\Models\WorkflowVersion;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class WorkflowEngineService
{
    public function resolveActiveWorkflow(string $moduleType): ?WorkflowVersion
    {
        $workflow = Workflow::query()
            ->with(['currentVersion.approvalLevels' => function ($q) {
                $q->orderBy('level_order');
            }])
            ->where('module_type', $moduleType)
            ->where('is_active', true)
            ->where('is_archived', false)
            ->first();

        return $workflow?->currentVersion;
    }

    public function startWorkflow(Model $request, string $moduleType, User $requester, ?string $remarks = null): Model
    {
        $version = $this->resolveActiveWorkflow($moduleType);

        if (! $version) {
            // If no workflow is configured, fallback to auto-approved or direct state
            $request->update([
                'workflow_status' => 'APPROVED',
                'current_level_order' => null,
            ]);

            $this->recordHistory(
                $request,
                null,
                null,
                null,
                null,
                'AUTO_APPROVED',
                $requester,
                $remarks ?? 'Auto-approved (No active workflow configured)'
            );

            return $request;
        }

        $options = $version->options ?? [];
        $levels = $version->approvalLevels->where('is_enabled', true)->sortBy('level_order')->values();

        if ($levels->isEmpty()) {
            $autoApprove = $options['auto_approve_no_approver'] ?? true;
            $request->update([
                'workflow_version_id' => $version->id,
                'workflow_status' => $autoApprove ? 'APPROVED' : 'PENDING_APPROVAL',
                'current_level_order' => null,
            ]);

            $this->recordHistory(
                $request,
                $version->workflow_id,
                $version->id,
                null,
                null,
                $autoApprove ? 'AUTO_APPROVED' : 'SUBMITTED',
                $requester,
                $remarks ?? ($autoApprove ? 'Auto-approved (No approval levels defined)' : 'Submitted request')
            );

            return $request;
        }

        $firstLevel = $levels->first();

        $request->update([
            'workflow_version_id' => $version->id,
            'workflow_status' => 'PENDING_APPROVAL',
            'current_level_order' => $firstLevel->level_order,
        ]);

        $this->recordHistory(
            $request,
            $version->workflow_id,
            $version->id,
            $firstLevel->id,
            $firstLevel->level_order,
            'SUBMITTED',
            $requester,
            $remarks ?? 'Request submitted for approval'
        );

        return $request;
    }

    /**
     * Check whether a user can approve the current level.
     *
     * If no workflow is attached to the request (legacy / direct creation),
     * we return TRUE and let the caller's controller middleware handle authorization.
     */
    public function canUserApproveCurrentLevel(Model $request, User $user): bool
    {
        // Super/System admins can always approve
        if ($user->hasRole('Super Administrator') || $user->hasRole('System Administrator')) {
            return true;
        }

        $versionId = $request->workflow_version_id ?? null;
        $currentLevelOrder = $request->current_level_order ?? null;

        // Legacy mode: no workflow attached — authorization handled by controller
        if (! $versionId || ! $currentLevelOrder) {
            return true;
        }

        // Workflow-governed request must be in PENDING_APPROVAL state
        if ($request->workflow_status !== 'PENDING_APPROVAL') {
            return false;
        }

        $level = WorkflowApprovalLevel::query()
            ->where('workflow_version_id', $versionId)
            ->where('level_order', $currentLevelOrder)
            ->where('is_enabled', true)
            ->first();

        if (! $level) {
            // No enabled level found — allow (all levels may be disabled → skip)
            return true;
        }

        // Check specific user assignment first
        if (! empty($level->user_ids) && is_array($level->user_ids)) {
            if (in_array($user->id, $level->user_ids)) {
                return $this->matchesScope($level, $user);
            }
        }

        // Check role assignment
        if (! empty($level->roles) && is_array($level->roles)) {
            $userRoles = $user->roles->pluck('name')->toArray();
            $hasMatchingRole = ! empty(array_intersect($level->roles, $userRoles));

            if ($hasMatchingRole) {
                return $this->matchesScope($level, $user);
            }
        }

        return false;
    }

    private function matchesScope(WorkflowApprovalLevel $level, User $user): bool
    {
        if ($level->office_id && $user->office_id && (int) $level->office_id !== (int) $user->office_id) {
            return false;
        }

        if ($level->department_id && $user->department_id && (int) $level->department_id !== (int) $user->department_id) {
            return false;
        }

        return true;
    }

    public function approveCurrentLevel(Model $request, User $user, ?string $remarks = null): Model
    {
        return DB::transaction(function () use ($request, $user, $remarks) {
            // Legacy mode: no workflow version attached — set approved directly
            if (! $request->workflow_version_id) {
                $request->update(['workflow_status' => 'APPROVED']);
                $this->recordHistory(
                    $request, null, null, null, null,
                    'APPROVED', $user,
                    $remarks ?? 'Approved (no workflow version assigned)'
                );
                return $request->fresh();
            }

            if (! $this->canUserApproveCurrentLevel($request, $user)) {
                throw new \InvalidArgumentException('You are not authorized to approve this request at the current approval level.');
            }

            $version = WorkflowVersion::with(['approvalLevels' => fn ($q) => $q->orderBy('level_order')])
                ->findOrFail($request->workflow_version_id);

            $currentLevelOrder = $request->current_level_order;
            $currentLevel = $version->approvalLevels
                ->where('level_order', $currentLevelOrder)
                ->first();

            $options = $version->options ?? [];
            if (! empty($options['require_remarks_on_approval']) && empty(trim($remarks ?? ''))) {
                throw new \InvalidArgumentException('Remarks are required for approving this request.');
            }

            // Log current approval action
            $this->recordHistory(
                $request,
                $version->workflow_id,
                $version->id,
                $currentLevel?->id,
                $currentLevelOrder,
                'APPROVED',
                $user,
                $remarks ?? 'Approved at Level ' . $currentLevelOrder
            );

            // Determine next enabled level
            $nextLevel = $version->approvalLevels
                ->where('is_enabled', true)
                ->where('level_order', '>', $currentLevelOrder)
                ->sortBy('level_order')
                ->first();

            if ($nextLevel) {
                $request->update([
                    'current_level_order' => $nextLevel->level_order,
                    'workflow_status' => 'PENDING_APPROVAL',
                ]);
            } else {
                // Final approval reached
                $request->update([
                    'workflow_status' => 'APPROVED',
                ]);
            }

            return $request->fresh();
        });
    }

    public function rejectCurrentLevel(Model $request, User $user, ?string $remarks = null): Model
    {
        return DB::transaction(function () use ($request, $user, $remarks) {
            // Legacy mode: no workflow version attached — set rejected directly
            if (! $request->workflow_version_id) {
                $request->update(['workflow_status' => 'REJECTED']);
                $this->recordHistory(
                    $request, null, null, null, null,
                    'REJECTED', $user,
                    $remarks ?? 'Rejected (no workflow version assigned)'
                );
                return $request->fresh();
            }

            if (! $this->canUserApproveCurrentLevel($request, $user)) {
                throw new \InvalidArgumentException('You are not authorized to reject this request.');
            }

            $version = WorkflowVersion::with(['approvalLevels'])->find($request->workflow_version_id);
            $options = $version?->options ?? [];

            if (! empty($options['require_remarks_on_rejection']) && empty(trim($remarks ?? ''))) {
                throw new \InvalidArgumentException('Remarks are required when rejecting a request.');
            }

            $currentLevelOrder = $request->current_level_order;
            $currentLevel = $version?->approvalLevels->where('level_order', $currentLevelOrder)->first();

            $request->update([
                'workflow_status' => 'REJECTED',
            ]);

            $this->recordHistory(
                $request,
                $version?->workflow_id,
                $version?->id,
                $currentLevel?->id,
                $currentLevelOrder,
                'REJECTED',
                $user,
                $remarks ?? 'Rejected request'
            );

            return $request->fresh();
        });
    }

    public function cancelRequest(Model $request, User $actor, ?string $remarks = null): Model
    {
        return DB::transaction(function () use ($request, $actor, $remarks) {
            $version = WorkflowVersion::find($request->workflow_version_id ?? null);

            $request->update([
                'workflow_status' => 'CANCELLED',
            ]);

            $this->recordHistory(
                $request,
                $version?->workflow_id,
                $version?->id,
                null,
                $request->current_level_order,
                'CANCELLED',
                $actor,
                $remarks ?? 'Cancelled request'
            );

            return $request->fresh();
        });
    }

    public function getApprovalHistory(Model $request): array
    {
        return WorkflowApprovalHistory::query()
            ->with(['user', 'approvalLevel', 'office', 'department'])
            ->where('request_type', get_class($request))
            ->where('request_id', $request->getKey())
            ->orderBy('created_at')
            ->get()
            ->toArray();
    }

    public function recordHistory(
        Model $request,
        ?int $workflowId,
        ?int $versionId,
        ?int $levelId,
        ?int $levelOrder,
        string $action,
        User $user,
        ?string $remarks = null,
        ?array $metadata = null
    ): WorkflowApprovalHistory {
        return WorkflowApprovalHistory::create([
            'request_type' => get_class($request),
            'request_id' => $request->getKey(),
            'workflow_id' => $workflowId,
            'workflow_version_id' => $versionId,
            'approval_level_id' => $levelId,
            'level_order' => $levelOrder,
            'action' => $action,
            'user_id' => $user->id,
            'role' => $user->roles->first()?->name ?? 'User',
            'office_id' => $user->office_id ?? null,
            'department_id' => $user->department_id ?? null,
            'remarks' => $remarks,
            'metadata' => $metadata,
        ]);
    }
}
