<?php

namespace App\Modules\SupplyRequest\Services;

use App\Models\User;
use App\Modules\AuditLog\Models\AuditLog;
use App\Modules\Inventory\Models\InventoryItem;
use App\Modules\Inventory\Services\InventoryService;
use App\Modules\SupplyRequest\Models\SupplyRequest;
use App\Modules\SupplyRequest\Models\SupplyRequestItem;
use App\Modules\Workflow\Enums\WorkflowModuleType;
use App\Modules\Workflow\Services\WorkflowEngineService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class SupplyRequestService
{
    public function __construct(
        private readonly WorkflowEngineService $workflowEngineService,
        private readonly InventoryService $inventoryService
    ) {}

    public function list(array $filters = [], int $perPage = 15, ?User $user = null): LengthAwarePaginator
    {
        return SupplyRequest::query()
            ->with(['user', 'office', 'fulfiller', 'items.inventoryItem.unit'])
            ->when($user && !$user->hasPermission('supply_requests.fulfill'), function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->when(!empty($filters['status']), fn ($q) => $q->where('status', $filters['status']))
            ->when(!empty($filters['workflow_status']), fn ($q) => $q->where('workflow_status', $filters['workflow_status']))
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    public function create(User $user, array $data): SupplyRequest
    {
        return DB::transaction(function () use ($user, $data) {
            foreach ($data['items'] as $item) {
                $inv = InventoryItem::findOrFail($item['inventory_item_id']);
                if ($inv->classification !== 'SUPPLY') {
                    throw new \InvalidArgumentException('Only items with SUPPLY classification can be requested.');
                }
            }

            $request = SupplyRequest::create([
                'user_id' => $user->id,
                'office_id' => $user->office_id,
                'status' => 'PENDING',
                'remarks' => $data['remarks'] ?? null,
            ]);

            foreach ($data['items'] as $itemData) {
                SupplyRequestItem::create([
                    'supply_request_id' => $request->id,
                    'inventory_item_id' => $itemData['inventory_item_id'],
                    'quantity_requested' => $itemData['quantity_requested'],
                ]);
            }

            $activeWorkflow = $this->workflowEngineService->resolveActiveWorkflow(WorkflowModuleType::SUPPLY_REQUEST->value);

            if ($activeWorkflow) {
                $request->update([
                    'workflow_version_id' => $activeWorkflow->id,
                    'current_level_order' => $activeWorkflow->approvalLevels->where('is_enabled', true)->min('level_order') ?? 1,
                    'workflow_status' => 'PENDING_APPROVAL',
                ]);
            } else {
                $request->update([
                    'status' => 'APPROVED',
                    'workflow_status' => 'APPROVED',
                ]);
            }

            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'CREATED',
                'module' => 'Supply Request',
                'description' => "Supply request #$request->id created.",
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);

            return $request->fresh(['items.inventoryItem.unit']);
        });
    }

    public function approve(SupplyRequest $supplyRequest, User $authorizer, ?string $remarks = null): SupplyRequest
    {
        return DB::transaction(function () use ($supplyRequest, $authorizer, $remarks) {
            if ($supplyRequest->status !== 'PENDING') {
                throw new \InvalidArgumentException('Only pending supply requests can be approved.');
            }

            $supplyRequest = $this->workflowEngineService->approveCurrentLevel($supplyRequest, $authorizer, $remarks);

            if ($supplyRequest->workflow_status === 'APPROVED') {
                $supplyRequest->update(['status' => 'APPROVED']);
                
                AuditLog::create([
                    'user_id' => $authorizer->id,
                    'action' => 'APPROVED',
                    'module' => 'Supply Request',
                    'description' => "Supply request #$supplyRequest->id fully approved.",
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                ]);
            }

            return $supplyRequest->fresh(['user', 'items', 'fulfiller']);
        });
    }

    public function reject(SupplyRequest $supplyRequest, User $authorizer, ?string $remarks = null): SupplyRequest
    {
        return DB::transaction(function () use ($supplyRequest, $authorizer, $remarks) {
            if ($supplyRequest->status !== 'PENDING') {
                throw new \InvalidArgumentException('Only pending supply requests can be rejected.');
            }

            $supplyRequest = $this->workflowEngineService->rejectCurrentLevel($supplyRequest, $authorizer, $remarks);

            $supplyRequest->update(['status' => 'REJECTED']);

            AuditLog::create([
                'user_id' => $authorizer->id,
                'action' => 'REJECTED',
                'module' => 'Supply Request',
                'description' => "Supply request #$supplyRequest->id rejected.",
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);

            return $supplyRequest->fresh(['user', 'items', 'fulfiller']);
        });
    }

    public function cancel(SupplyRequest $supplyRequest, User $actor, ?string $remarks = null): SupplyRequest
    {
        return DB::transaction(function () use ($supplyRequest, $actor, $remarks) {
            if (!in_array($supplyRequest->status, ['PENDING', 'APPROVED'])) {
                throw new \InvalidArgumentException('This supply request cannot be cancelled in its current state.');
            }

            $supplyRequest = $this->workflowEngineService->cancelRequest($supplyRequest, $actor, $remarks);
            
            $supplyRequest->update(['status' => 'CANCELLED']);

            AuditLog::create([
                'user_id' => $actor->id,
                'action' => 'CANCELLED',
                'module' => 'Supply Request',
                'description' => "Supply request #$supplyRequest->id cancelled.",
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);

            return $supplyRequest->fresh(['user', 'items', 'fulfiller']);
        });
    }

    public function fulfill(SupplyRequest $request, array $issuedQuantities, User $fulfiller): SupplyRequest
    {
        return DB::transaction(function () use ($request, $issuedQuantities, $fulfiller) {
            // 1. Lock the SupplyRequest
            $lockedRequest = SupplyRequest::lockForUpdate()->findOrFail($request->id);

            // 2. Verify status
            if ($lockedRequest->status !== 'APPROVED') {
                throw new \InvalidArgumentException('Only approved supply requests can be fulfilled.');
            }

            $itemsMap = collect($issuedQuantities)->keyBy('supply_request_item_id');
            $totalIssued = 0;
            $totalRequested = 0;

            foreach ($lockedRequest->items as $reqItem) {
                $qtyIssued = (int) ($itemsMap->get($reqItem->id)['quantity_issued'] ?? 0);
                
                if ($qtyIssued < 0 || $qtyIssued > $reqItem->quantity_requested) {
                    throw new \InvalidArgumentException('Issued quantity cannot be negative or exceed requested quantity.');
                }

                if ($qtyIssued > 0) {
                    // 3. Lock InventoryItem
                    $inventoryItem = InventoryItem::lockForUpdate()->findOrFail($reqItem->inventory_item_id);

                    // 4. Call stockOut (will throw if insufficient)
                    $this->inventoryService->stockOut($inventoryItem, $qtyIssued, "Supply request #$lockedRequest->id fulfilled", $fulfiller);
                }

                $reqItem->update(['quantity_issued' => $qtyIssued]);

                $totalIssued += $qtyIssued;
                $totalRequested += $reqItem->quantity_requested;
            }

            // 5. Determine final status
            $finalStatus = ($totalIssued === $totalRequested) ? 'FULFILLED' : 'PARTIALLY_FULFILLED';

            $lockedRequest->update([
                'status' => $finalStatus,
                'fulfilled_by' => $fulfiller->id,
                'fulfilled_at' => now(),
            ]);

            // 6. Audit
            AuditLog::create([
                'user_id' => $fulfiller->id,
                'action' => $finalStatus,
                'module' => 'Supply Request',
                'description' => "Supply request #$lockedRequest->id fulfilled ($totalIssued / $totalRequested items).",
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);

            return $lockedRequest->fresh(['user', 'items.inventoryItem.unit', 'fulfiller']);
        });
    }
}
