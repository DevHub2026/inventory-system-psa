<?php

namespace Tests\Feature\Integration;

use App\Enums\UserRole;
use App\Models\Notification;
use App\Models\Role;
use App\Models\User;
use App\Modules\Asset\Enums\AssetStatus;
use App\Modules\Asset\Models\Asset;
use App\Modules\Asset\Models\Location;
use App\Modules\Asset\Models\Manufacturer;
use App\Modules\Asset\Models\Office;
use App\Modules\AssetCategory\Models\AssetCategory;
use App\Modules\AssetIdentifier\Models\AssetIdentifier;
use App\Modules\Borrowing\Enums\ExtensionRequestStatus;
use App\Modules\Borrowing\Models\BorrowExtensionRequest;
use App\Modules\Borrowing\Models\Borrowing;
use App\Modules\Reservation\Models\Reservation;
use App\Modules\Workflow\Models\Workflow;
use App\Modules\Workflow\Models\WorkflowApprovalLevel;
use App\Modules\Workflow\Models\WorkflowVersion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BorrowingLifecycleIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_full_reservation_borrowing_extension_and_return_lifecycle_works(): void
    {
        $employee = $this->employeeUser();
        $staff = $this->staffUser();
        $employeeToken = $employee->createToken('auth')->plainTextToken;
        $staffToken = $staff->createToken('auth')->plainTextToken;

        $asset = $this->createAsset();
        AssetIdentifier::create([
            'asset_id' => $asset->id,
            'identifier_type' => 'PSA_QR',
            'identifier_value' => 'PSA-ASSET-009999',
            'is_primary' => true,
        ]);

        $this->createSingleLevelBorrowWorkflow();

        $reservationResponse = $this->withToken($employeeToken)
            ->postJson('/api/v1/reservations', [
                'asset_ids' => [$asset->id],
                'start_date' => now()->subDay()->toDateString(),
                'end_date' => now()->addDays(2)->toDateString(),
                'remarks' => 'Project access request',
            ]);

        $reservationResponse->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Reservation created successfully.',
            ]);

        $reservationId = $reservationResponse->json('data.id');
        $reservation = Reservation::findOrFail($reservationId);
        $this->assertSame('PENDING', $reservation->status);
        $this->assertTrue($reservation->assets()->whereKey($asset->id)->exists());
        $this->assertTrue($staff->hasRole(UserRole::PROPERTY_CUSTODIAN->value));

        $qrResponse = $this->withToken($employeeToken)
            ->getJson('/api/v1/qr/resolve/PSA-RES-'.$reservationId);
        $qrResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $approveResult = app(\App\Modules\Reservation\Services\ReservationService::class)
            ->approve($reservation, $staff);

        $this->assertSame('APPROVED', $reservation->fresh()->status);
        $this->assertTrue($approveResult['auto_released'] || ! empty($approveResult['borrowing_ids']));

        $this->assertDatabaseHas('reservations', [
            'id' => $reservationId,
            'status' => 'APPROVED',
        ]);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $employee->id,
            'type' => 'request_approved',
        ]);

        $borrowing = Borrowing::query()->where('reservation_id', $reservationId)->firstOrFail();
        $this->assertSame($employee->id, $borrowing->user_id);
        $this->assertSame($asset->id, $borrowing->asset_id);
        $this->assertSame('BORROWED', $borrowing->status);
        $this->assertSame(AssetStatus::BORROWED->value, $asset->fresh()->status instanceof \BackedEnum ? $asset->fresh()->status->value : $asset->fresh()->status);

        $extensionResponse = $this->withToken($employeeToken)
            ->postJson('/api/v1/borrowings/'.$borrowing->id.'/extension-requests', [
                'requested_due_date' => $borrowing->due_date->copy()->addDays(7)->toDateString(),
                'reason' => 'Need additional time to complete the project.',
            ]);

        $extensionResponse->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Extension request submitted successfully.',
            ]);

        $extensionId = $extensionResponse->json('data.id');
        $this->assertDatabaseHas('borrow_extension_requests', [
            'id' => $extensionId,
            'borrowing_id' => $borrowing->id,
            'status' => ExtensionRequestStatus::PENDING->value,
        ]);

        $listResponse = $this->withToken($employeeToken)
            ->getJson('/api/v1/borrowings?per_page=10');

        $listResponse->assertStatus(200)
            ->assertJsonPath('data.items.0.has_pending_extension', true);

        $approvalResult = app(\App\Modules\Borrowing\Services\BorrowExtensionService::class)
            ->approve($staff, BorrowExtensionRequest::findOrFail($extensionId));

        $this->assertDatabaseHas('borrow_extension_requests', [
            'id' => $extensionId,
            'status' => ExtensionRequestStatus::APPROVED->value,
            'reviewed_by' => $staff->id,
        ]);

        $this->assertNotNull($approvalResult);

        $borrowing->refresh();
        $this->assertSame(
            $extensionResponse->json('data.requested_due_date'),
            $borrowing->due_date->format('Y-m-d')
        );

        $afterApprovalListResponse = $this->withToken($employeeToken)
            ->getJson('/api/v1/borrowings?per_page=10');
        $afterApprovalListResponse->assertStatus(200)
            ->assertJsonPath('data.items.0.has_pending_extension', false);

        $returnResponse = $this->withToken($staffToken)
            ->postJson('/api/v1/borrowings/'.$borrowing->id.'/return');

        $returnResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Borrowing returned successfully.',
            ]);

        $this->assertDatabaseHas('borrowings', [
            'id' => $borrowing->id,
            'status' => 'RETURNED',
        ]);

        $freshAssetStatus = $asset->fresh()->status;
        $this->assertSame(AssetStatus::AVAILABLE->value, $freshAssetStatus instanceof \BackedEnum ? $freshAssetStatus->value : $freshAssetStatus);
    }

    public function test_unauthorized_users_cannot_approve_reservations_or_extension_requests(): void
    {
        $employee = $this->employeeUser();
        $employeeToken = $employee->createToken('auth')->plainTextToken;

        $asset = $this->createAsset();
        $reservation = Reservation::create([
            'user_id' => $employee->id,
            'status' => 'PENDING',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(3)->toDateString(),
        ]);
        $reservation->assets()->attach($asset->id);

        $this->withToken($employeeToken)
            ->postJson('/api/v1/reservations/'.$reservation->id.'/approve')
            ->assertStatus(403);

        $borrowing = Borrowing::create([
            'user_id' => $employee->id,
            'asset_id' => $asset->id,
            'borrow_date' => now()->toDateString(),
            'borrowed_at' => now(),
            'due_date' => now()->addDays(7)->toDateString(),
            'status' => 'BORROWED',
            'remarks' => 'Baseline borrowing',
        ]);

        $extension = BorrowExtensionRequest::create([
            'borrowing_id' => $borrowing->id,
            'current_due_date' => now()->addDays(7)->toDateString(),
            'requested_due_date' => now()->addDays(10)->toDateString(),
            'reason' => 'Need more time',
            'status' => ExtensionRequestStatus::PENDING,
        ]);

        $this->withToken($employeeToken)
            ->patchJson('/api/v1/extension-requests/'.$extension->id.'/approve')
            ->assertStatus(403);
    }

    public function test_pending_extension_boolean_tracks_only_pending_requests_and_rejected_extension_keeps_due_date_stable(): void
    {
        $employee = $this->employeeUser();
        $staff = $this->staffUser();
        $employeeToken = $employee->createToken('auth')->plainTextToken;
        $staffToken = $staff->createToken('auth')->plainTextToken;

        $assetA = $this->createAsset();
        $assetB = $this->createAsset();
        $assetC = $this->createAsset();
        $assetD = $this->createAsset();

        $borrowingWithoutExtension = Borrowing::create([
            'user_id' => $employee->id,
            'asset_id' => $assetA->id,
            'borrow_date' => now()->toDateString(),
            'borrowed_at' => now(),
            'due_date' => now()->addDays(5)->toDateString(),
            'status' => 'BORROWED',
            'remarks' => 'No extension',
        ]);

        $pendingBorrowing = Borrowing::create([
            'user_id' => $employee->id,
            'asset_id' => $assetB->id,
            'borrow_date' => now()->toDateString(),
            'borrowed_at' => now(),
            'due_date' => now()->addDays(6)->toDateString(),
            'status' => 'BORROWED',
            'remarks' => 'Pending extension',
        ]);
        BorrowExtensionRequest::create([
            'borrowing_id' => $pendingBorrowing->id,
            'current_due_date' => $pendingBorrowing->due_date,
            'requested_due_date' => now()->addDays(10),
            'reason' => 'Pending review',
            'status' => ExtensionRequestStatus::PENDING,
        ]);

        $approvedBorrowing = Borrowing::create([
            'user_id' => $employee->id,
            'asset_id' => $assetC->id,
            'borrow_date' => now()->toDateString(),
            'borrowed_at' => now(),
            'due_date' => now()->addDays(7)->toDateString(),
            'status' => 'BORROWED',
            'remarks' => 'Approved extension',
        ]);
        BorrowExtensionRequest::create([
            'borrowing_id' => $approvedBorrowing->id,
            'current_due_date' => $approvedBorrowing->due_date,
            'requested_due_date' => now()->addDays(12),
            'reason' => 'Already approved',
            'status' => ExtensionRequestStatus::APPROVED,
            'reviewed_by' => $staff->id,
            'reviewed_at' => now(),
        ]);

        $rejectedBorrowing = Borrowing::create([
            'user_id' => $employee->id,
            'asset_id' => $assetD->id,
            'borrow_date' => now()->toDateString(),
            'borrowed_at' => now(),
            'due_date' => now()->addDays(8)->toDateString(),
            'status' => 'BORROWED',
            'remarks' => 'Rejected extension',
        ]);
        BorrowExtensionRequest::create([
            'borrowing_id' => $rejectedBorrowing->id,
            'current_due_date' => $rejectedBorrowing->due_date,
            'requested_due_date' => now()->addDays(13),
            'reason' => 'Rejected request',
            'status' => ExtensionRequestStatus::REJECTED,
            'reviewed_by' => $staff->id,
            'reviewed_at' => now(),
        ]);

        $response = $this->withToken($employeeToken)
            ->getJson('/api/v1/borrowings?per_page=20');

        $response->assertStatus(200);

        $items = $response->json('data.items');
        $map = collect($items)->keyBy('id');

        $this->assertFalse($map[$borrowingWithoutExtension->id]['has_pending_extension']);
        $this->assertTrue($map[$pendingBorrowing->id]['has_pending_extension']);
        $this->assertFalse($map[$approvedBorrowing->id]['has_pending_extension']);
        $this->assertFalse($map[$rejectedBorrowing->id]['has_pending_extension']);

        $originalDueDate = $rejectedBorrowing->due_date->format('Y-m-d');
        $rejectedExtension = BorrowExtensionRequest::query()
            ->where('borrowing_id', $rejectedBorrowing->id)
            ->where('status', ExtensionRequestStatus::REJECTED)
            ->firstOrFail();

        $rejectedBorrowing->refresh();
        $this->assertSame($originalDueDate, $rejectedBorrowing->due_date->format('Y-m-d'));
    }

    private function employeeUser(array $attributes = []): User
    {
        $user = User::factory()->create($attributes);
        $user->roles()->sync([]);
        $user->assignRole(UserRole::EMPLOYEE->value);

        return $user;
    }

    private function staffUser(array $attributes = []): User
    {
        $user = User::factory()->create($attributes);
        $user->roles()->sync([]);
        $user->assignRole(UserRole::PROPERTY_CUSTODIAN->value);

        return $user;
    }

    private function createAsset(array $overrides = []): Asset
    {
        $unique = fake()->unique()->numerify('####');
        $office = Office::create([
            'name' => 'Main Office '.$unique,
            'code' => 'MO-'.$unique,
            'description' => 'Main office',
        ]);

        $location = Location::create([
            'office_id' => $office->id,
            'name' => 'Storage Room '.$unique,
            'code' => 'SR-'.$unique,
            'description' => 'Storage room',
        ]);

        $category = AssetCategory::create([
            'name' => 'Laptop '.$unique,
            'code' => 'LAP-'.$unique,
            'description' => 'Laptops',
        ]);

        $manufacturer = Manufacturer::create([
            'name' => 'Dell '.$unique,
            'code' => 'DEL-'.$unique,
            'description' => 'Dell computers',
        ]);

        return Asset::unguarded(fn () => Asset::create(array_merge([
            'asset_number' => 'AST-'.rand(1000, 9999),
            'name' => 'Laptop '.$unique,
            'description' => 'Test asset',
            'asset_category_id' => $category->id,
            'manufacturer_id' => $manufacturer->id,
            'office_id' => $office->id,
            'location_id' => $location->id,
            'model' => 'Pro',
            'status' => AssetStatus::AVAILABLE->value,
            'condition_status' => 'GOOD',
            'purchase_date' => '2026-01-01',
            'purchase_cost' => 1200.00,
            'warranty_until' => '2027-01-01',
            'remarks' => 'Test asset',
        ], $overrides)));
    }

    private function createSingleLevelBorrowWorkflow(): void
    {
        $creator = User::factory()->create();
        $creator->assignRole(UserRole::PROPERTY_CUSTODIAN->value);

        $workflow = Workflow::create([
            'name' => 'Borrow workflow',
            'module_type' => 'borrow_request',
            'description' => 'Workflow for borrow request tests',
            'is_active' => true,
            'is_archived' => false,
            'created_by' => $creator->id,
            'updated_by' => $creator->id,
            'options' => [],
        ]);

        $version = WorkflowVersion::create([
            'workflow_id' => $workflow->id,
            'version_number' => 1,
            'options' => [],
            'change_summary' => 'Initial test workflow version',
            'created_by' => $creator->id,
        ]);

        WorkflowApprovalLevel::create([
            'workflow_version_id' => $version->id,
            'level_order' => 1,
            'name' => 'Level 1',
            'roles' => [UserRole::PROPERTY_CUSTODIAN->value],
            'user_ids' => [],
            'approval_type' => 'single',
            'is_enabled' => true,
            'execution_type' => 'sequential',
        ]);

        $workflow->update(['current_version_id' => $version->id]);
    }
}
