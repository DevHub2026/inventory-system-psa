<?php

namespace App\Modules\Workflow\Controllers;

use App\Modules\Asset\Traits\RespondsWithJson;
use App\Modules\Workflow\Enums\ApprovalType;
use App\Modules\Workflow\Enums\WorkflowModuleType;
use App\Modules\Workflow\Models\Workflow;
use App\Modules\Workflow\Services\WorkflowEngineService;
use App\Modules\Workflow\Services\WorkflowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class WorkflowController extends Controller
{
    use RespondsWithJson;

    public function __construct(
        private readonly WorkflowService $workflowService,
        private readonly WorkflowEngineService $workflowEngineService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['search', 'module_type', 'is_active', 'is_archived']);
        $perPage = (int) $request->get('per_page', 15);

        $paginated = $this->workflowService->list($filters, $perPage);
        return $this->success($paginated);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'module_type' => 'required|string',
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
            'options' => 'nullable|array',
            'approval_levels' => 'required|array|min:1',
            'approval_levels.*.name' => 'required|string|max:255',
            'approval_levels.*.roles' => 'nullable|array',
            'approval_levels.*.user_ids' => 'nullable|array',
            'approval_levels.*.office_id' => 'nullable|exists:offices,id',
            'approval_levels.*.department_id' => 'nullable|exists:departments,id',
            'approval_levels.*.approval_type' => 'nullable|string',
            'approval_levels.*.is_enabled' => 'nullable|boolean',
            'approval_levels.*.execution_type' => 'nullable|string',
            'approval_levels.*.allow_delegation' => 'nullable|boolean',
        ]);

        $workflow = $this->workflowService->create($request->user(), $validated);
        return $this->success($workflow, 'Workflow created successfully.', 201);
    }

    public function show(Workflow $workflow): JsonResponse
    {
        $workflow->load(['currentVersion.approvalLevels.office', 'currentVersion.approvalLevels.department', 'creator', 'updater']);
        return $this->success($workflow);
    }

    public function update(Request $request, Workflow $workflow): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'module_type' => 'nullable|string',
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
            'options' => 'nullable|array',
            'change_summary' => 'nullable|string',
            'approval_levels' => 'nullable|array',
            'approval_levels.*.name' => 'required|string|max:255',
            'approval_levels.*.roles' => 'nullable|array',
            'approval_levels.*.user_ids' => 'nullable|array',
            'approval_levels.*.office_id' => 'nullable|exists:offices,id',
            'approval_levels.*.department_id' => 'nullable|exists:departments,id',
            'approval_levels.*.approval_type' => 'nullable|string',
            'approval_levels.*.is_enabled' => 'nullable|boolean',
            'approval_levels.*.execution_type' => 'nullable|string',
            'approval_levels.*.allow_delegation' => 'nullable|boolean',
        ]);

        $updated = $this->workflowService->update($workflow, $request->user(), $validated);
        return $this->success($updated, 'Workflow updated and new version published successfully.');
    }

    public function duplicate(Request $request, Workflow $workflow): JsonResponse
    {
        $duplicate = $this->workflowService->duplicate($workflow, $request->user());
        return $this->created($duplicate, 'Workflow duplicated successfully.');
    }

    public function archive(Request $request, Workflow $workflow): JsonResponse
    {
        $archived = $this->workflowService->archive($workflow, $request->user());
        return $this->success($archived, 'Workflow archived successfully.');
    }

    public function restore(Request $request, Workflow $workflow): JsonResponse
    {
        $restored = $this->workflowService->restore($workflow, $request->user());
        return $this->success($restored, 'Workflow restored successfully.');
    }

    public function toggleStatus(Request $request, Workflow $workflow): JsonResponse
    {
        $toggled = $this->workflowService->toggleActive($workflow, $request->user());
        return $this->success($toggled, 'Workflow status updated.');
    }

    public function versions(Workflow $workflow): JsonResponse
    {
        $history = $this->workflowService->getVersionHistory($workflow);
        return $this->success($history);
    }

    public function auditLogs(Workflow $workflow): JsonResponse
    {
        $logs = $this->workflowService->getAuditLogs($workflow);
        return $this->success($logs);
    }

    public function modules(): JsonResponse
    {
        $modules = array_map(fn ($m) => [
            'value' => $m->value,
            'label' => $m->label(),
        ], WorkflowModuleType::cases());

        $approvalTypes = array_map(fn ($a) => [
            'value' => $a->value,
            'label' => $a->label(),
        ], ApprovalType::cases());

        return $this->success([
            'modules' => $modules,
            'approval_types' => $approvalTypes,
            'default_options' => $this->workflowService->defaultOptions(),
        ]);
    }

    public function requestHistory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'request_type' => 'required|string',
            'request_id' => 'required|integer',
        ]);

        $histories = \App\Modules\Workflow\Models\WorkflowApprovalHistory::query()
            ->with(['user', 'approvalLevel', 'office', 'department'])
            ->where('request_type', $validated['request_type'])
            ->where('request_id', $validated['request_id'])
            ->orderBy('created_at')
            ->get();

        return $this->success($histories);
    }
}
