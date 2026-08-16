<?php

namespace Tests\Feature\Borrowing;

use App\Enums\UserRole;
use App\Models\Role;
use App\Models\User;
use App\Modules\Asset\Enums\AssetStatus;
use App\Modules\Asset\Models\Asset;
use App\Modules\AssetCategory\Models\AssetCategory;
use App\Modules\Asset\Models\Location;
use App\Modules\Asset\Models\Manufacturer;
use App\Modules\Asset\Models\Office;
use App\Modules\Borrowing\Enums\ExtensionRequestStatus;
use App\Modules\Borrowing\Models\BorrowExtensionRequest;
use App\Modules\Borrowing\Models\Borrowing;
use App\Modules\Reservation\Models\Reservation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class BorrowExtensionTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $borrower;
    private string $adminToken;
    private string $borrowerToken;
    private Asset $asset;
    private Borrowing $borrowing;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = $this->staffUser();
        $this->adminToken = $this->admin->createToken('auth')->plainTextToken;

        $this->borrower = User::factory()->create();
        $borrowerRole = Role::query()->firstOrCreate(
            ['name' => UserRole::EMPLOYEE->value],
            ['description' => UserRole::EMPLOYEE->name],
        );
        $this->borrower->roles()->sync([$borrowerRole->id]);
        $this->borrowerToken = $this->borrower->createToken('auth')->plainTextToken;

        $this->asset = $this->createAsset();
        $this->authorizeAsset($this->borrower, $this->asset);

        $this->borrowing = Borrowing::query()->create([
            'user_id' => $this->borrower->id,
            'asset_id' => $this->asset->id,
            'borrow_date' => now()->subDays(5)->toDateString(),
            'borrowed_at' => now()->subDays(5),
            'due_date' => now()->addDays(2)->toDateString(),
            'status' => 'BORROWED',
            'remarks' => 'Test borrowing',
            'authorized_by' => $this->admin->id,
            'authorized_at' => now()->subDays(5),
        ]);
    }

    public function test_borrower_can_submit_extension_request(): void
    {
        $newDueDate = now()->addDays(10)->toDateString();

        $response = $this->withToken($this->borrowerToken)
            ->postJson("/api/v1/borrowings/{$this->borrowing->id}/extension-requests", [
                'requested_due_date' => $newDueDate,
                'reason' => 'Need more time for project completion.',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Extension request submitted successfully.',
            ]);

        $this->assertDatabaseHas('borrow_extension_requests', [
            'borrowing_id' => $this->borrowing->id,
            'status' => ExtensionRequestStatus::PENDING->value,
            'reason' => 'Need more time for project completion.',
        ]);
    }

    public function test_duplicate_pending_request_is_prevented(): void
    {
        BorrowExtensionRequest::query()->create([
            'borrowing_id' => $this->borrowing->id,
            'current_due_date' => $this->borrowing->due_date,
            'requested_due_date' => now()->addDays(10),
            'reason' => 'Need more time.',
            'status' => ExtensionRequestStatus::PENDING,
        ]);

        $response = $this->withToken($this->borrowerToken)
            ->postJson("/api/v1/borrowings/{$this->borrowing->id}/extension-requests", [
                'requested_due_date' => now()->addDays(15)->toDateString(),
                'reason' => 'Another extension.',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'A pending extension request already exists for this borrowing.',
            ]);
    }

    public function test_admin_can_approve_extension(): void
    {
        $extensionRequest = BorrowExtensionRequest::query()->create([
            'borrowing_id' => $this->borrowing->id,
            'current_due_date' => $this->borrowing->due_date,
            'requested_due_date' => now()->addDays(10),
            'reason' => 'Need more time.',
            'status' => ExtensionRequestStatus::PENDING,
        ]);

        $response = $this->withToken($this->adminToken)
            ->patchJson("/api/v1/extension-requests/{$extensionRequest->id}/approve");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Extension request approved successfully.',
            ]);

        $this->assertDatabaseHas('borrow_extension_requests', [
            'id' => $extensionRequest->id,
            'status' => ExtensionRequestStatus::APPROVED->value,
            'reviewed_by' => $this->admin->id,
        ]);

        // Verify borrowing due date was updated
        $this->borrowing->refresh();
        $this->assertEquals(
            $extensionRequest->requested_due_date->format('Y-m-d'),
            $this->borrowing->due_date->format('Y-m-d'),
        );
    }

    public function test_admin_can_reject_extension(): void
    {
        $extensionRequest = BorrowExtensionRequest::query()->create([
            'borrowing_id' => $this->borrowing->id,
            'current_due_date' => $this->borrowing->due_date,
            'requested_due_date' => now()->addDays(10),
            'reason' => 'Need more time.',
            'status' => ExtensionRequestStatus::PENDING,
        ]);

        $response = $this->withToken($this->adminToken)
            ->patchJson("/api/v1/extension-requests/{$extensionRequest->id}/reject", [
                'remarks' => 'Extension period exceeds policy limit.',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Extension request rejected.',
            ]);

        $this->assertDatabaseHas('borrow_extension_requests', [
            'id' => $extensionRequest->id,
            'status' => ExtensionRequestStatus::REJECTED->value,
            'reviewed_by' => $this->admin->id,
            'remarks' => 'Extension period exceeds policy limit.',
        ]);
    }

    public function test_extension_history_works(): void
    {
        // Create multiple extension requests to test history
        $req1 = BorrowExtensionRequest::query()->create([
            'borrowing_id' => $this->borrowing->id,
            'current_due_date' => $this->borrowing->due_date,
            'requested_due_date' => now()->addDays(10),
            'reason' => 'First extension.',
            'status' => ExtensionRequestStatus::APPROVED,
            'reviewed_by' => $this->admin->id,
            'reviewed_at' => now(),
        ]);

        $req2 = BorrowExtensionRequest::query()->create([
            'borrowing_id' => $this->borrowing->id,
            'current_due_date' => now()->addDays(10),
            'requested_due_date' => now()->addDays(20),
            'reason' => 'Second extension.',
            'status' => ExtensionRequestStatus::PENDING,
        ]);

        $response = $this->withToken($this->borrowerToken)
            ->getJson("/api/v1/borrowings/{$this->borrowing->id}/extension-requests");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Extension requests retrieved successfully.',
            ]);

        $this->assertCount(2, $response->json('data'));
    }

    public function test_due_date_updates_correctly_on_approval(): void
    {
        $originalDueDate = $this->borrowing->due_date->format('Y-m-d');
        $newDueDate = now()->addDays(15)->toDateString();

        $extensionRequest = BorrowExtensionRequest::query()->create([
            'borrowing_id' => $this->borrowing->id,
            'current_due_date' => $originalDueDate,
            'requested_due_date' => $newDueDate,
            'reason' => 'Test due date update.',
            'status' => ExtensionRequestStatus::PENDING,
        ]);

        $this->withToken($this->adminToken)
            ->patchJson("/api/v1/extension-requests/{$extensionRequest->id}/approve");

        $this->borrowing->refresh();
        $this->assertEquals($newDueDate, $this->borrowing->due_date->format('Y-m-d'));
    }

    public function test_pending_count_works(): void
    {
        // No pending requests yet
        $response = $this->withToken($this->adminToken)
            ->getJson('/api/v1/extension-requests/pending-count');

        $response->assertStatus(200);
        $this->assertEquals(0, $response->json('data.count'));

        // Create a pending request
        BorrowExtensionRequest::query()->create([
            'borrowing_id' => $this->borrowing->id,
            'current_due_date' => $this->borrowing->due_date,
            'requested_due_date' => now()->addDays(10),
            'reason' => 'Test pending count.',
            'status' => ExtensionRequestStatus::PENDING,
        ]);

        $response = $this->withToken($this->adminToken)
            ->getJson('/api/v1/extension-requests/pending-count');

        $response->assertStatus(200);
        $this->assertEquals(1, $response->json('data.count'));
    }

    public function test_borrower_cannot_submit_for_returned_borrowing(): void
    {
        $this->borrowing->update(['status' => 'RETURNED', 'returned_at' => now()]);

        $response = $this->withToken($this->borrowerToken)
            ->postJson("/api/v1/borrowings/{$this->borrowing->id}/extension-requests", [
                'requested_due_date' => now()->addDays(10)->toDateString(),
                'reason' => 'Need more time.',
            ]);

        $response->assertStatus(422);
    }

    public function test_borrower_cannot_submit_for_other_users_borrowing(): void
    {
        $otherUser = User::factory()->create();
        $otherToken = $otherUser->createToken('auth')->plainTextToken;

        $response = $this->withToken($otherToken)
            ->postJson("/api/v1/borrowings/{$this->borrowing->id}/extension-requests", [
                'requested_due_date' => now()->addDays(10)->toDateString(),
                'reason' => 'Need more time.',
            ]);

        $response->assertStatus(422);
    }

    public function test_employee_cannot_approve_extension(): void
    {
        $extensionRequest = BorrowExtensionRequest::query()->create([
            'borrowing_id' => $this->borrowing->id,
            'current_due_date' => $this->borrowing->due_date,
            'requested_due_date' => now()->addDays(10),
            'reason' => 'Need more time.',
            'status' => ExtensionRequestStatus::PENDING,
        ]);

        $response = $this->withToken($this->borrowerToken)
            ->patchJson("/api/v1/extension-requests/{$extensionRequest->id}/approve");

        $response->assertStatus(403);
    }

    public function test_employee_cannot_reject_extension(): void
    {
        $extensionRequest = BorrowExtensionRequest::query()->create([
            'borrowing_id' => $this->borrowing->id,
            'current_due_date' => $this->borrowing->due_date,
            'requested_due_date' => now()->addDays(10),
            'reason' => 'Need more time.',
            'status' => ExtensionRequestStatus::PENDING,
        ]);

        $response = $this->withToken($this->borrowerToken)
            ->patchJson("/api/v1/extension-requests/{$extensionRequest->id}/reject", [
                'remarks' => 'Not allowed.',
            ]);

        $response->assertStatus(403);
    }

    public function test_guest_cannot_approve_or_reject_extension(): void
    {
        $extensionRequest = BorrowExtensionRequest::query()->create([
            'borrowing_id' => $this->borrowing->id,
            'current_due_date' => $this->borrowing->due_date,
            'requested_due_date' => now()->addDays(10),
            'reason' => 'Need more time.',
            'status' => ExtensionRequestStatus::PENDING,
        ]);

        $this->patchJson("/api/v1/extension-requests/{$extensionRequest->id}/approve")
            ->assertStatus(401);

        $this->patchJson("/api/v1/extension-requests/{$extensionRequest->id}/reject")
            ->assertStatus(401);
    }

    public function test_guest_cannot_access_extension_endpoints(): void
    {
        $response = $this->getJson("/api/v1/borrowings/{$this->borrowing->id}/extension-requests");

        $response->assertStatus(401);
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
            'name' => 'Laptop 14',
            'description' => 'Test asset',
            'asset_category_id' => $category->id,
            'manufacturer_id' => $manufacturer->id,
            'office_id' => $office->id,
            'location_id' => $location->id,
            'model' => 'Pro',
            'status' => 'AVAILABLE',
            'condition_status' => 'GOOD',
            'purchase_date' => '2026-01-01',
            'purchase_cost' => 1200.00,
            'warranty_until' => '2027-01-01',
            'remarks' => 'Test asset',
        ], $overrides)));
    }

    private function staffUser(array $attributes = []): User
    {
        $user = User::factory()->create($attributes);
        $user->assignRole(UserRole::PROPERTY_CUSTODIAN->value);

        return $user;
    }

    private function authorizeAsset(User $borrower, Asset $asset): void
    {
        $reservation = $this->pendingReservation($borrower, $asset);
        $reservation->update([
            'status' => 'APPROVED',
            'authorized_by' => $borrower->id,
            'authorized_at' => now(),
        ]);
    }

    private function pendingReservation(User $borrower, Asset $asset): Reservation
    {
        $reservation = Reservation::create([
            'user_id' => $borrower->id,
            'status' => 'PENDING',
            'start_date' => '2026-07-20',
            'end_date' => '2026-07-24',
        ]);
        $reservation->assets()->attach($asset->id);

        return $reservation;
    }
}
