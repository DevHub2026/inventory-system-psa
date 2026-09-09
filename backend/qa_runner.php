<?php

use App\Models\User;
use App\Models\Role;
use App\Modules\Inventory\Models\InventoryItem;
use App\Modules\Inventory\Models\StockTransaction;
use App\Modules\SupplyRequest\Models\SupplyRequest;
use App\Modules\SupplyRequest\Models\SupplyRequestItem;
use App\Modules\Workflow\Models\WorkflowInstance;
use Illuminate\Support\Facades\DB;
use App\Enums\UserRole;
use App\Modules\Audit\Models\AuditLog;
use Illuminate\Http\Request;

echo "Starting E2E QA...\n\n";

function verify($condition, $message) {
    if ($condition) {
        echo "[PASS] $message\n";
        return true;
    } else {
        echo "[FAIL] $message\n";
        return false;
    }
}

DB::beginTransaction();

try {
    // Ensure roles exist
    $employeeRole = Role::firstOrCreate(['name' => 'Employee']);
    $supplyOfficerRole = Role::firstOrCreate(['name' => 'Supply Officer']);
    $adminRole = Role::firstOrCreate(['name' => 'Super Administrator']);

    // Create test users
    $employee = User::factory()->create(['first_name' => 'QA', 'last_name' => 'Employee']);
    $employee->roles()->sync([$employeeRole->id]);

    $approver = User::factory()->create(['first_name' => 'QA', 'last_name' => 'Approver']);
    $approver->roles()->sync([$adminRole->id]);

    $supplyOfficer = User::factory()->create(['first_name' => 'QA', 'last_name' => 'Supply Officer']);
    $supplyOfficer->roles()->sync([$supplyOfficerRole->id]);

    // Create Test Items
    $supply1 = InventoryItem::create(['name' => 'QA Pen', 'sku' => 'QAP-001', 'classification' => 'SUPPLY', 'quantity' => 100, 'unit' => 'pcs']);
    $supply2 = InventoryItem::create(['name' => 'QA Paper', 'sku' => 'QAP-002', 'classification' => 'SUPPLY', 'quantity' => 50, 'unit' => 'reams']);
    $equipment1 = InventoryItem::create(['name' => 'QA Laptop', 'sku' => 'QAL-001', 'classification' => 'EQUIPMENT', 'quantity' => 10, 'unit' => 'pcs']);

    // ---------------------------------------------------------
    // Scenario 1: Employee Request Creation & Validation
    // ---------------------------------------------------------
    try {
        $request = Request::create('/api/v1/supply-requests', 'POST', [
            'items' => [
                ['inventory_item_id' => $supply1->id, 'quantity_requested' => 10],
                ['inventory_item_id' => $equipment1->id, 'quantity_requested' => 1], // invalid
            ]
        ]);
        $request->setUserResolver(function () use ($employee) { return $employee; });
        $response = app()->handle($request);
        verify($response->status() === 422, "Employee cannot request equipment (PPE/SE must be rejected server-side)");
    } catch (\Exception $e) {
        verify(false, "Employee cannot request equipment");
    }

    try {
        $request = Request::create('/api/v1/supply-requests', 'POST', [
            'items' => [
                ['inventory_item_id' => $supply1->id, 'quantity_requested' => -5], // invalid
            ]
        ]);
        $request->setUserResolver(function () use ($employee) { return $employee; });
        $response = app()->handle($request);
        verify($response->status() === 422, "Employee cannot request negative quantities");
    } catch (\Exception $e) {}

    // Valid Request
    $request = Request::create('/api/v1/supply-requests', 'POST', [
        'items' => [
            ['inventory_item_id' => $supply1->id, 'quantity_requested' => 10],
            ['inventory_item_id' => $supply2->id, 'quantity_requested' => 20],
        ],
        'remarks' => 'Office supplies for QA'
    ]);
    $request->headers->set('Accept', 'application/json');
    $request->setUserResolver(function () use ($employee) { return $employee; });
    $response = app()->handle($request);
    verify($response->status() === 201, "Employee can create valid multi-item supply request (Status: " . $response->status() . ")");

    $createdData = json_decode($response->getContent(), true)['data'];
    $supplyRequestId = $createdData['id'] ?? null;
    $supplyRequest = SupplyRequest::find($supplyRequestId);
    verify($supplyRequest && $supplyRequest->status === 'PENDING', "Initial status is PENDING");
    verify($supplyRequest->items()->count() === 2, "Request items are saved correctly");
    verify($supply1->fresh()->quantity === 100, "Creating request does not decrease stock");

    // ---------------------------------------------------------
    // Scenario 2: Workflow Approval
    // ---------------------------------------------------------
    $approveRequest = Request::create("/api/v1/supply-requests/$supplyRequestId/approve", 'POST');
    $approveRequest->headers->set('Accept', 'application/json');
    $approveRequest->setUserResolver(function () use ($approver) { return $approver; });
    $response = app()->handle($approveRequest);
    verify($response->status() === 200, "Authorized approver can approve request");

    $supplyRequest->refresh();
    verify($supplyRequest->status === 'APPROVED', "SupplyRequest.status becomes APPROVED");
    verify($supply1->fresh()->quantity === 100, "Approval does not decrease stock");

    // ---------------------------------------------------------
    // Scenario 3: Full Fulfillment
    // ---------------------------------------------------------
    $fulfillRequest = Request::create("/api/v1/supply-requests/$supplyRequestId/fulfill", 'POST', [
        'items' => [
            ['supply_request_item_id' => $supplyRequest->items[0]->id, 'quantity_issued' => 10],
            ['supply_request_item_id' => $supplyRequest->items[1]->id, 'quantity_issued' => 20],
        ]
    ]);
    $fulfillRequest->headers->set('Accept', 'application/json');
    $fulfillRequest->setUserResolver(function () use ($supplyOfficer) { return $supplyOfficer; });
    $response = app()->handle($fulfillRequest);
    verify($response->status() === 200, "Supply Officer can fulfill APPROVED request");

    $supplyRequest->refresh();
    verify($supplyRequest->status === 'FULFILLED', "SupplyRequest.status becomes FULFILLED");
    verify($supplyRequest->fulfilled_by === $supplyOfficer->id, "fulfilled_by is recorded");
    verify($supplyRequest->fulfilled_at !== null, "fulfilled_at is populated");

    $supply1->refresh();
    $supply2->refresh();
    verify($supply1->quantity === 90, "Stock decrements correctly for Item 1");
    verify($supply2->quantity === 30, "Stock decrements correctly for Item 2");

    $txn = StockTransaction::where('inventory_item_id', $supply1->id)->latest()->first();
    verify($txn && $txn->quantity === 10 && $txn->type === 'OUT' && $txn->quantity_after === 90, "StockTransaction is created");

    $audit = AuditLog::where('user_id', $supplyOfficer->id)->where('module', 'Supply Requests')->latest()->first();
    verify($audit !== null, "Audit trail generated for fulfillment");

    // ---------------------------------------------------------
    // Scenario 4: Partial Fulfillment
    // ---------------------------------------------------------
    $req2 = SupplyRequest::create([
        'user_id' => $employee->id,
        'status' => 'APPROVED',
        'office_id' => null
    ]);
    $req2Item = SupplyRequestItem::create([
        'supply_request_id' => $req2->id,
        'inventory_item_id' => $supply1->id, // has 90
        'quantity_requested' => 10
    ]);

    $fulfillReq2 = Request::create("/api/v1/supply-requests/$req2->id/fulfill", 'POST', [
        'items' => [
            ['supply_request_item_id' => $req2Item->id, 'quantity_issued' => 5], // partial
        ]
    ]);
    $fulfillReq2->headers->set('Accept', 'application/json');
    $fulfillReq2->setUserResolver(function () use ($supplyOfficer) { return $supplyOfficer; });
    $response = app()->handle($fulfillReq2);

    $req2->refresh();
    verify($req2->status === 'PARTIALLY_FULFILLED', "Status becomes PARTIALLY_FULFILLED for partial issue");
    verify($supply1->fresh()->quantity === 85, "Stock decrements by partial amount");

    // ---------------------------------------------------------
    // Scenario 5: Rejection
    // ---------------------------------------------------------
    $req3 = SupplyRequest::create([
        'user_id' => $employee->id,
        'status' => 'PENDING',
        'office_id' => null
    ]);
    $rejectReq = Request::create("/api/v1/supply-requests/$req3->id/reject", 'POST', ['remarks' => 'No']);
    $rejectReq->headers->set('Accept', 'application/json');
    $rejectReq->setUserResolver(function () use ($approver) { return $approver; });
    $response = app()->handle($rejectReq);
    verify($req3->fresh()->status === 'REJECTED', "Approver can reject PENDING request");

    // ---------------------------------------------------------
    // Scenario 6: Cancellation
    // ---------------------------------------------------------
    $req4 = SupplyRequest::create([
        'user_id' => $employee->id,
        'status' => 'PENDING',
        'office_id' => null
    ]);
    $cancelReq = Request::create("/api/v1/supply-requests/$req4->id/cancel", 'POST');
    $cancelReq->headers->set('Accept', 'application/json');
    $cancelReq->setUserResolver(function () use ($employee) { return $employee; });
    $response = app()->handle($cancelReq);
    verify($req4->fresh()->status === 'CANCELLED', "Employee can cancel their PENDING request");

    // ---------------------------------------------------------
    // Scenario 7: Insufficient Stock Rollback
    // ---------------------------------------------------------
    $req5 = SupplyRequest::create([
        'user_id' => $employee->id,
        'status' => 'APPROVED',
        'office_id' => null
    ]);
    $req5Item = SupplyRequestItem::create([
        'supply_request_id' => $req5->id,
        'inventory_item_id' => $supply1->id, // has 85
        'quantity_requested' => 100 // exceeds stock!
    ]);

    $fulfillReq5 = Request::create("/api/v1/supply-requests/$req5->id/fulfill", 'POST', [
        'items' => [
            ['supply_request_item_id' => $req5Item->id, 'quantity_issued' => 100], 
        ]
    ]);
    $fulfillReq5->headers->set('Accept', 'application/json');
    $fulfillReq5->setUserResolver(function () use ($supplyOfficer) { return $supplyOfficer; });
    $response = app()->handle($fulfillReq5);

    verify($response->status() === 422, "Fulfillment fails safely when stock is insufficient (Status: " . $response->status() . ")");
    verify($req5->fresh()->status === 'APPROVED', "SupplyRequest status does not change");
    verify($supply1->fresh()->quantity === 85, "No partial stock deduction remains");

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}

DB::rollBack();
echo "\nE2E QA Script Completed.\n";


