<?php

namespace App\Modules\Maintenance\Controllers;

use App\Modules\Asset\Traits\RespondsWithJson;
use App\Modules\Maintenance\Models\Maintenance;
use App\Modules\Maintenance\Services\MaintenanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class MaintenanceController extends Controller
{
    use RespondsWithJson;

    public function __construct(private readonly MaintenanceService $maintenanceService) {}

    public function index(Request $request): JsonResponse
    {
        $maintenances = $this->maintenanceService->list($request->all());

        return $this->success($maintenances->map(fn ($maintenance) => [
            'id' => $maintenance->id,
            'asset_name' => $maintenance->asset->name ?? 'N/A',
            'assigned_to' => $maintenance->user->name ?? 'Unassigned',
            'type' => $maintenance->type,
            'status' => $maintenance->status,
            'scheduled_date' => $maintenance->scheduled_date?->format('Y-m-d'),
            'completed_date' => $maintenance->completed_date?->format('Y-m-d'),
            'description' => $maintenance->description,
            'cost' => $maintenance->cost,
        ])->values(), 'Maintenances retrieved successfully.');
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'asset_id' => 'required|exists:assets,id',
            'user_id' => 'nullable|exists:users,id',
            'type' => 'required|in:corrective,preventive',
            'status' => 'required|in:scheduled,in_progress,completed,cancelled',
            'scheduled_date' => 'required|date',
            'description' => 'nullable|string',
            'notes' => 'nullable|string',
            'cost' => 'nullable|numeric',
        ]);

        $maintenance = $this->maintenanceService->create($request->all());

        return $this->success([
            'id' => $maintenance->id,
            'asset_id' => $maintenance->asset_id,
            'type' => $maintenance->type,
            'status' => $maintenance->status,
            'scheduled_date' => $maintenance->scheduled_date?->format('Y-m-d'),
        ], 'Maintenance created successfully.', 201);
    }

    public function update(Maintenance $maintenance, Request $request): JsonResponse
    {
        $request->validate([
            'asset_id' => 'sometimes|exists:assets,id',
            'user_id' => 'sometimes|nullable|exists:users,id',
            'type' => 'sometimes|in:corrective,preventive',
            'status' => 'sometimes|in:scheduled,in_progress,completed,cancelled',
            'scheduled_date' => 'sometimes|date',
            'completed_date' => 'sometimes|nullable|date',
            'description' => 'sometimes|nullable|string',
            'notes' => 'sometimes|nullable|string',
            'cost' => 'sometimes|nullable|numeric',
        ]);

        $maintenance = $this->maintenanceService->update($maintenance, $request->all());

        return $this->success([
            'id' => $maintenance->id,
            'type' => $maintenance->type,
            'status' => $maintenance->status,
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
            'id' => $maintenance->id,
            'status' => $maintenance->status,
            'completed_date' => $maintenance->completed_date?->format('Y-m-d'),
        ], 'Maintenance completed successfully.');
    }

    public function scheduled(): JsonResponse
    {
        $maintenances = $this->maintenanceService->getScheduled();

        return $this->success($maintenances->map(fn ($maintenance) => [
            'id' => $maintenance->id,
            'asset_name' => $maintenance->asset->name ?? 'N/A',
            'assigned_to' => $maintenance->user->name ?? 'Unassigned',
            'scheduled_date' => $maintenance->scheduled_date?->format('Y-m-d'),
            'description' => $maintenance->description,
        ])->values(), 'Scheduled maintenances retrieved successfully.');
    }

    public function overdue(): JsonResponse
    {
        $maintenances = $this->maintenanceService->getOverdue();

        return $this->success($maintenances->map(fn ($maintenance) => [
            'id' => $maintenance->id,
            'asset_name' => $maintenance->asset->name ?? 'N/A',
            'assigned_to' => $maintenance->user->name ?? 'Unassigned',
            'scheduled_date' => $maintenance->scheduled_date?->format('Y-m-d'),
            'days_overdue' => now()->diffInDays($maintenance->scheduled_date),
        ])->values(), 'Overdue maintenances retrieved successfully.');
    }
}
