<?php

namespace App\Modules\Maintenance\Controllers;

use App\Modules\Asset\Models\Asset;
use App\Modules\Asset\Traits\RespondsWithJson;
use App\Modules\AuditLog\Services\AuditLogService;
use App\Modules\Maintenance\Models\Maintenance;
use App\Modules\Maintenance\Services\MaintenanceService;
use App\Modules\Workflow\Services\WorkflowEngineService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class MaintenanceController extends Controller
{
    use RespondsWithJson;

    public function __construct(
        private readonly MaintenanceService $maintenanceService,
        private readonly WorkflowEngineService $workflowEngineService,
        private readonly AuditLogService $auditLogService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 20);
        $maintenances = $this->maintenanceService->list($request->all(), $perPage);

        $items = collect($maintenances->items())->map(fn ($maintenance) => [
            'id'             => $maintenance->id,
            'asset_name'     => $maintenance->asset->name ?? 'N/A',
            'assigned_to'    => $maintenance->user->name ?? 'Unassigned',
            'reported_by'    => $maintenance->reportedByUser?->full_name,
            'type'           => $maintenance->type,
            'severity'       => $maintenance->severity,
            'status'         => $maintenance->status,
            'scheduled_date' => $maintenance->scheduled_date?->format('Y-m-d'),
            'completed_date' => $maintenance->completed_date?->format('Y-m-d'),
            'description'    => $maintenance->description,
            'cost'           => $maintenance->cost,
            'workflow_status' => $maintenance->workflow_status,
        ])->values();

        return $this->success([
            'items' => $items,
            'meta'  => [
                'current_page' => $maintenances->currentPage(),
                'per_page'     => $maintenances->perPage(),
                'total'        => $maintenances->total(),
                'last_page'    => $maintenances->lastPage(),
            ],
            'links' => [
                'first' => $maintenances->url(1),
                'last'  => $maintenances->url($maintenances->lastPage()),
                'prev'  => $maintenances->previousPageUrl(),
                'next'  => $maintenances->nextPageUrl(),
            ],
        ], 'Maintenances retrieved successfully.');
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'asset_id'       => 'required|exists:assets,id',
            'user_id'        => 'nullable|exists:users,id',
            'type'           => 'required|in:corrective,preventive',
            'status'         => 'required|in:scheduled,in_progress,completed,cancelled',
            'scheduled_date' => 'required|date',
            'description'    => 'nullable|string',
            'notes'          => 'nullable|string',
            'cost'           => 'nullable|numeric',
        ]);

        $maintenance = $this->maintenanceService->create($request->all());

        return $this->success([
            'id'             => $maintenance->id,
            'asset_id'       => $maintenance->asset_id,
            'type'           => $maintenance->type,
            'status'         => $maintenance->status,
            'scheduled_date' => $maintenance->scheduled_date?->format('Y-m-d'),
        ], 'Maintenance created successfully.', 201);
    }

    public function update(Maintenance $maintenance, Request $request): JsonResponse
    {
        $request->validate([
            'asset_id'       => 'sometimes|exists:assets,id',
            'user_id'        => 'sometimes|nullable|exists:users,id',
            'type'           => 'sometimes|in:corrective,preventive',
            'status'         => 'sometimes|in:scheduled,in_progress,completed,cancelled',
            'scheduled_date' => 'sometimes|date',
            'completed_date' => 'sometimes|nullable|date',
            'description'    => 'sometimes|nullable|string',
            'notes'          => 'sometimes|nullable|string',
            'cost'           => 'sometimes|nullable|numeric',
        ]);

        $maintenance = $this->maintenanceService->update($maintenance, $request->all());

        return $this->success([
            'id'             => $maintenance->id,
            'type'           => $maintenance->type,
            'status'         => $maintenance->status,
            'scheduled_date' => $maintenance->scheduled_date?->format('Y-m-d'),
        ], 'Maintenance updated successfully.');
    }

    public function destroy(Maintenance $maintenance): JsonResponse
    {
        $this->maintenanceService->delete($maintenance);
        return $this->success(null, 'Maintenance deleted successfully.');
    }

    public function complete(Maintenance $maintenance): JsonResponse
    {
        $maintenance = $this->maintenanceService->complete($maintenance);

        return $this->success([
            'id'             => $maintenance->id,
            'status'         => $maintenance->status,
            'completed_date' => $maintenance->completed_date?->format('Y-m-d'),
        ], 'Maintenance completed successfully.');
    }

    public function scheduled(): JsonResponse
    {
        $maintenances = $this->maintenanceService->getScheduled();

        return $this->success($maintenances->map(fn ($maintenance) => [
            'id'             => $maintenance->id,
            'asset_name'     => $maintenance->asset->name ?? 'N/A',
            'assigned_to'    => $maintenance->user->name ?? 'Unassigned',
            'scheduled_date' => $maintenance->scheduled_date?->format('Y-m-d'),
            'description'    => $maintenance->description,
        ])->values(), 'Scheduled maintenances retrieved successfully.');
    }

    public function overdue(): JsonResponse
    {
        $maintenances = $this->maintenanceService->getOverdue();

        return $this->success($maintenances->map(fn ($maintenance) => [
            'id'             => $maintenance->id,
            'asset_name'     => $maintenance->asset->name ?? 'N/A',
            'assigned_to'    => $maintenance->user->name ?? 'Unassigned',
            'scheduled_date' => $maintenance->scheduled_date?->format('Y-m-d'),
            'days_overdue'   => now()->diffInDays($maintenance->scheduled_date),
        ])->values(), 'Overdue maintenances retrieved successfully.');
    }

    /**
     * POST /api/v1/assets/{asset}/report-damage
     * Any authenticated employee can report asset damage.
     * Creates a maintenance entry and starts the workflow engine.
     */
    public function reportDamage(Request $request, Asset $asset): JsonResponse
    {
        $request->validate([
            'type'        => ['required', 'in:minor_damage,major_damage,needs_maintenance'],
            'description' => ['required', 'string', 'min:10'],
            'severity'    => ['nullable', 'in:low,medium,high,critical'],
            'remarks'     => ['nullable', 'string', 'max:1000'],
        ]);

        $user = $request->user();

        $maintenance = $this->maintenanceService->create([
            'asset_id'       => $asset->id,
            'reported_by'    => $user->id,
            'type'           => $request->input('type'),
            'severity'       => $request->input('severity', 'medium'),
            'status'         => 'scheduled',
            'scheduled_date' => now()->addDay()->toDateString(),
            'description'    => $request->input('description'),
            'notes'          => $request->input('remarks'),
        ]);

        // Start workflow engine for maintenance_request
        $this->workflowEngineService->startWorkflow(
            $maintenance,
            'maintenance_request',
            $user,
            $request->input('remarks'),
        );

        $this->auditLogService->log(
            'DAMAGE_REPORTED',
            'Maintenance',
            "Asset #{$asset->id} ({$asset->name}) damage reported by user #{$user->id}. Type: {$request->input('type')}",
            null,
            ['asset_id' => $asset->id, 'maintenance_id' => $maintenance->id, 'type' => $request->input('type')],
        );

        return $this->success([
            'id'             => $maintenance->id,
            'asset_id'       => $asset->id,
            'asset_name'     => $asset->name,
            'type'           => $maintenance->type,
            'severity'       => $maintenance->severity,
            'status'         => $maintenance->status,
            'workflow_status' => $maintenance->workflow_status,
            'description'    => $maintenance->description,
            'created_at'     => $maintenance->created_at?->format('Y-m-d H:i:s'),
        ], 'Damage report submitted successfully. Maintenance request has been created.', 201);
    }
}
