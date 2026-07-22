<?php

namespace Tests\Feature\Borrowing;

use App\Models\User;
use App\Enums\UserRole;
use App\Modules\Asset\Models\Asset;
use App\Modules\Asset\Models\Location;
use App\Modules\Asset\Models\Manufacturer;
use App\Modules\Asset\Models\Office;
use App\Modules\AssetCategory\Models\AssetCategory;
use App\Modules\Reservation\Models\Reservation;
use App\Modules\AssetIdentifier\Models\AssetIdentifier;
use App\Modules\Asset\Enums\IdentifierType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BorrowingManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_create_a_borrowing(): void
    {
        $user = $this->staffUser();
        $asset = $this->createAsset();
        $this->authorizeAsset($user, $asset);
        $token = $user->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->postJson('/api/v1/borrowings', [
                'asset_id' => $asset->id,
                'borrow_date' => '2026-07-20',
                'due_date' => '2026-07-24',
                'remarks' => 'For field work',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Borrowing created successfully.',
            ]);

        $this->assertDatabaseHas('borrowings', [
            'user_id' => $user->id,
            'asset_id' => $asset->id,
            'status' => 'BORROWED',
        ]);
    }

    public function test_legacy_asset_borrow_route_delegates_to_canonical_service(): void
    {
        User::factory()->count(3)->create();
        $user = $this->staffUser(['id' => 4]);
        $asset = $this->createAsset(['id' => 10, 'asset_number' => 'AST-0010']);
        $this->authorizeAsset($user, $asset);
        $token = $user->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->postJson('/api/v1/assets/10/borrow', [
                'due_date' => 7,
                'notes' => 'Phone QR test borrow',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Asset borrowed successfully.',
                'data' => [
                    'user_id' => 4,
                    'asset_id' => 10,
                    'status' => 'BORROWED',
                    'asset_number' => 'AST-0010',
                    'remarks' => 'Phone QR test borrow',
                    'returned_at' => null,
                ],
            ]);

        $this->assertDatabaseHas('borrowings', [
            'user_id' => 4,
            'asset_id' => 10,
            'status' => 'BORROWED',
            'remarks' => 'Phone QR test borrow',
        ]);

        $this->assertDatabaseHas('assets', [
            'id' => 10,
            'status' => 'BORROWED',
        ]);
    }

    public function test_legacy_asset_borrow_route_requires_authentication(): void
    {
        $asset = $this->createAsset();

        $response = $this->postJson("/api/v1/assets/{$asset->id}/borrow", [
            'due_date' => 7,
        ]);

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_return_a_borrowing(): void
    {
        $user = $this->staffUser();
        $asset = $this->createAsset();
        $this->authorizeAsset($user, $asset);
        $token = $user->createToken('auth')->plainTextToken;

        $borrowing = $this->withToken($token)
            ->postJson('/api/v1/borrowings', [
                'asset_id' => $asset->id,
                'borrow_date' => '2026-07-20',
                'due_date' => '2026-07-24',
            ])
            ->decodeResponseJson()['data'];

        $response = $this->withToken($token)
            ->postJson('/api/v1/borrowings/'.$borrowing['id'].'/return');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Borrowing returned successfully.',
            ]);

        $this->assertDatabaseHas('borrowings', [
            'id' => $borrowing['id'],
            'status' => 'RETURNED',
        ]);

        $this->assertDatabaseMissing('borrowings', [
            'id' => $borrowing['id'],
            'returned_at' => null,
        ]);

        $this->assertDatabaseHas('assets', [
            'id' => $asset->id,
            'status' => 'AVAILABLE',
        ]);
    }

    public function test_borrowing_cannot_be_returned_twice(): void
    {
        $user = $this->staffUser();
        $asset = $this->createAsset();
        $this->authorizeAsset($user, $asset);
        $token = $user->createToken('auth')->plainTextToken;

        $borrowing = $this->withToken($token)
            ->postJson('/api/v1/borrowings', [
                'asset_id' => $asset->id,
                'borrow_date' => '2026-07-20',
                'due_date' => '2026-07-24',
            ])
            ->decodeResponseJson()['data'];

        $this->withToken($token)
            ->postJson('/api/v1/borrowings/'.$borrowing['id'].'/return')
            ->assertStatus(200);

        $this->withToken($token)
            ->postJson('/api/v1/borrowings/'.$borrowing['id'].'/return')
            ->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Borrowing has already been returned.',
            ]);
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

    public function test_employee_cannot_bypass_authorization_with_borrow_api(): void
    {
        $employee = User::factory()->create();
        $employee->roles()->sync([
            \App\Models\Role::query()->firstOrCreate(['name' => UserRole::EMPLOYEE->value])->id,
        ]);
        $asset = $this->createAsset();
        $this->authorizeAsset($employee, $asset);

        $this->withToken($employee->createToken('auth')->plainTextToken)
            ->postJson('/api/v1/borrowings', [
                'asset_id' => $asset->id,
                'borrow_date' => '2026-07-20',
                'due_date' => '2026-07-24',
            ])
            ->assertStatus(422)
            ->assertJson(['success' => false, 'message' => 'You are not authorized to complete this borrowing transaction.']);
    }

    public function test_qr_scan_borrows_then_returns_the_same_authorized_asset(): void
    {
        $staff = $this->staffUser();
        $asset = $this->createAsset();
        $this->authorizeAsset($staff, $asset);
        $identifier = 'PSA-ASSET-TEST-'.$asset->id;
        AssetIdentifier::create([
            'asset_id' => $asset->id,
            'identifier_type' => IdentifierType::PSA_QR->value,
            'identifier_value' => $identifier,
            'is_primary' => true,
        ]);
        $token = $staff->createToken('auth')->plainTextToken;

        $this->withToken($token)->postJson('/api/v1/assets/scan', ['value' => $identifier])
            ->assertOk()
            ->assertJson(['success' => true, 'message' => 'Borrowing marked as borrowed successfully.']);

        $this->assertDatabaseHas('borrowings', ['asset_id' => $asset->id, 'status' => 'BORROWED']);
        $this->assertDatabaseHas('assets', ['id' => $asset->id, 'status' => 'BORROWED']);

        $this->withToken($token)->postJson('/api/v1/assets/scan', ['value' => $identifier])
            ->assertOk()
            ->assertJson(['success' => true, 'message' => 'Asset successfully returned.']);

        $this->assertDatabaseHas('borrowings', ['asset_id' => $asset->id, 'status' => 'RETURNED']);
        $this->assertDatabaseHas('assets', ['id' => $asset->id, 'status' => 'AVAILABLE']);
        $this->assertDatabaseHas('asset_identifiers', ['asset_id' => $asset->id, 'identifier_value' => $identifier]);
    }

    public function test_qr_scan_accepts_unpadded_psa_asset_identifier(): void
    {
        $staff = $this->staffUser();
        $asset = $this->createAsset(['id' => 125]);
        $this->authorizeAsset($staff, $asset);
        AssetIdentifier::create([
            'asset_id' => $asset->id,
            'identifier_type' => IdentifierType::PSA_QR->value,
            'identifier_value' => 'PSA-ASSET-000125',
            'is_primary' => true,
        ]);

        $this->withToken($staff->createToken('auth')->plainTextToken)
            ->postJson('/api/v1/assets/scan', ['value' => 'PSA-ASSET-125'])
            ->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Borrowing marked as borrowed successfully.',
                'data' => [
                    'asset_id' => 125,
                    'status' => 'BORROWED',
                ],
            ]);

        $this->assertDatabaseHas('borrowings', ['asset_id' => $asset->id, 'status' => 'BORROWED']);
        $this->assertDatabaseHas('assets', ['id' => $asset->id, 'status' => 'BORROWED']);
        $this->assertDatabaseHas('asset_identifiers', [
            'asset_id' => $asset->id,
            'identifier_value' => 'PSA-ASSET-000125',
        ]);
    }

    public function test_staff_can_authorize_a_pending_request_from_receipt_qr(): void
    {
        $employee = User::factory()->create();
        $staff = $this->staffUser();
        $asset = $this->createAsset();
        $reservation = $this->pendingReservation($employee, $asset);
        $receiptPayload = 'PSA-RES-'.$reservation->id.'|'.$asset->asset_number.'|'.$employee->id;

        $this->withToken($staff->createToken('auth')->plainTextToken)
            ->postJson('/api/v1/reservations/scan-authorize', ['value' => $receiptPayload])
            ->assertOk()
            ->assertJson(['success' => true, 'message' => 'Borrow request authorized successfully.']);

        $this->assertDatabaseHas('reservations', [
            'id' => $reservation->id,
            'status' => 'APPROVED',
            'authorized_by' => $staff->id,
        ]);

        $this->withToken($staff->createToken('auth')->plainTextToken)
            ->postJson('/api/v1/reservations/scan-authorize', ['value' => $receiptPayload])
            ->assertStatus(422)
            ->assertJson(['success' => false, 'message' => 'Borrow request is already authorized or completed.']);
    }

    public function test_staff_receipt_scan_marks_pending_borrow_request_as_borrowed(): void
    {
        $employee = User::factory()->create();
        $staff = $this->staffUser();
        $asset = $this->createAsset(['status' => 'RESERVED']);
        $reservation = $this->pendingReservation($employee, $asset);
        $receiptPayload = 'PSA-RES-'.$reservation->id.'|'.$asset->asset_number.'|'.$employee->id;

        $response = $this->withToken($staff->createToken('auth')->plainTextToken)
            ->postJson('/api/v1/assets/scan', ['value' => $receiptPayload])
            ->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Borrowing marked as borrowed successfully.',
                'data' => [
                    'user_id' => $employee->id,
                    'asset_id' => $asset->id,
                    'asset_number' => $asset->asset_number,
                    'status' => 'BORROWED',
                    'authorized_by' => $staff->id,
                ],
            ]);

        $borrowingId = $response->decodeResponseJson()['data']['id'];

        $this->assertDatabaseHas('reservations', [
            'id' => $reservation->id,
            'status' => 'APPROVED',
            'authorized_by' => $staff->id,
        ]);
        $this->assertDatabaseHas('reservation_items', [
            'reservation_id' => $reservation->id,
            'asset_id' => $asset->id,
        ]);
        $this->assertDatabaseMissing('reservation_items', [
            'reservation_id' => $reservation->id,
            'asset_id' => $asset->id,
            'fulfilled_at' => null,
        ]);
        $this->assertDatabaseHas('borrowings', [
            'id' => $borrowingId,
            'user_id' => $employee->id,
            'asset_id' => $asset->id,
            'reservation_id' => $reservation->id,
            'status' => 'BORROWED',
            'authorized_by' => $staff->id,
        ]);
        $this->assertDatabaseHas('assets', ['id' => $asset->id, 'status' => 'BORROWED']);
    }

    public function test_duplicate_receipt_scan_does_not_create_second_borrowing(): void
    {
        $employee = User::factory()->create();
        $staff = $this->staffUser();
        $asset = $this->createAsset(['status' => 'RESERVED']);
        $reservation = $this->pendingReservation($employee, $asset);
        $receiptPayload = 'PSA-RES-'.$reservation->id.'|'.$asset->asset_number.'|'.$employee->id;
        $token = $staff->createToken('auth')->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/v1/assets/scan', ['value' => $receiptPayload])
            ->assertOk();

        $this->withToken($token)
            ->postJson('/api/v1/assets/scan', ['value' => $receiptPayload])
            ->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Borrowing is already marked as borrowed.',
            ]);

        $this->assertDatabaseCount('borrowings', 1);
        $this->assertDatabaseHas('assets', ['id' => $asset->id, 'status' => 'BORROWED']);
    }

    public function test_returned_receipt_scan_reports_completed_transaction(): void
    {
        $employee = User::factory()->create();
        $staff = $this->staffUser();
        $asset = $this->createAsset(['status' => 'RESERVED']);
        $reservation = $this->pendingReservation($employee, $asset);
        $receiptPayload = 'PSA-RES-'.$reservation->id.'|'.$asset->asset_number.'|'.$employee->id;
        $token = $staff->createToken('auth')->plainTextToken;

        $borrowResponse = $this->withToken($token)
            ->postJson('/api/v1/assets/scan', ['value' => $receiptPayload])
            ->assertOk();

        $borrowingId = $borrowResponse->decodeResponseJson()['data']['id'];

        $this->withToken($token)
            ->postJson('/api/v1/borrowings/'.$borrowingId.'/return')
            ->assertOk();

        $this->withToken($token)
            ->postJson('/api/v1/assets/scan', ['value' => $receiptPayload])
            ->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'This borrowing transaction has already been returned.',
            ]);

        $this->assertDatabaseCount('borrowings', 1);
        $this->assertDatabaseHas('borrowings', ['id' => $borrowingId, 'status' => 'RETURNED']);
        $this->assertDatabaseHas('assets', ['id' => $asset->id, 'status' => 'AVAILABLE']);
    }

    public function test_employee_cannot_mark_pending_receipt_as_borrowed(): void
    {
        $employee = User::factory()->create();
        $employee->roles()->sync([
            \App\Models\Role::query()->firstOrCreate(['name' => UserRole::EMPLOYEE->value])->id,
        ]);
        $asset = $this->createAsset(['status' => 'RESERVED']);
        $reservation = $this->pendingReservation($employee, $asset);
        $receiptPayload = 'PSA-RES-'.$reservation->id.'|'.$asset->asset_number.'|'.$employee->id;

        $this->withToken($employee->createToken('auth')->plainTextToken)
            ->postJson('/api/v1/assets/scan', ['value' => $receiptPayload])
            ->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'You are not authorized to complete this borrowing transaction.',
            ]);

        $this->assertDatabaseMissing('borrowings', [
            'reservation_id' => $reservation->id,
        ]);
        $this->assertDatabaseHas('reservations', [
            'id' => $reservation->id,
            'status' => 'PENDING',
        ]);
    }

    public function test_receipt_qr_borrows_then_return_receipt_qr_returns_and_preserves_history(): void
    {
        $employee = User::factory()->create();
        $staff = $this->staffUser();
        $asset = $this->createAsset();
        $reservation = $this->pendingReservation($employee, $asset);
        $reservation = $reservation->fresh();

        $this->withToken($staff->createToken('auth')->plainTextToken)
            ->postJson('/api/v1/reservations/scan-authorize', [
                'value' => 'PSA-RES-'.$reservation->id.'|'.$asset->asset_number.'|'.$employee->id,
            ])
            ->assertOk();

        $borrowResponse = $this->withToken($staff->createToken('auth')->plainTextToken)
            ->postJson('/api/v1/assets/scan', [
                'value' => 'PSA-RES-'.$reservation->id.'|'.$asset->asset_number.'|'.$employee->id,
            ])
            ->assertOk()
            ->assertJson(['success' => true, 'message' => 'Borrowing marked as borrowed successfully.']);

        $borrowingId = $borrowResponse->decodeResponseJson()['data']['id'];

        $this->assertDatabaseHas('borrowings', [
            'id' => $borrowingId,
            'user_id' => $employee->id,
            'asset_id' => $asset->id,
            'reservation_id' => $reservation->id,
            'status' => 'BORROWED',
            'authorized_by' => $staff->id,
        ]);
        $this->assertDatabaseHas('assets', ['id' => $asset->id, 'status' => 'BORROWED']);

        $this->withToken($staff->createToken('auth')->plainTextToken)
            ->postJson('/api/v1/assets/scan', [
                'value' => 'PSA-BOR-'.$borrowingId.'|'.$asset->asset_number.'|'.$employee->id,
            ])
            ->assertOk()
            ->assertJson(['success' => true, 'message' => 'Asset successfully returned.']);

        $this->assertDatabaseHas('borrowings', [
            'id' => $borrowingId,
            'status' => 'RETURNED',
        ]);
        $this->assertDatabaseMissing('borrowings', [
            'id' => $borrowingId,
            'returned_at' => null,
        ]);
        $this->assertDatabaseHas('assets', ['id' => $asset->id, 'status' => 'AVAILABLE']);
        $this->assertDatabaseCount('borrowings', 1);
    }

    public function test_qr_scan_fulfills_an_approved_reservation_left_in_reserved_state(): void
    {
        $staff = $this->staffUser();
        $asset = $this->createAsset(['status' => 'RESERVED']);
        $this->authorizeAsset($staff, $asset);
        $identifier = 'PSA-ASSET-RESERVED-'.$asset->id;
        AssetIdentifier::create([
            'asset_id' => $asset->id,
            'identifier_type' => IdentifierType::PSA_QR->value,
            'identifier_value' => $identifier,
            'is_primary' => true,
        ]);

        $this->withToken($staff->createToken('auth')->plainTextToken)
            ->postJson('/api/v1/assets/scan', ['value' => $identifier])
            ->assertOk()
            ->assertJson(['success' => true, 'message' => 'Borrowing marked as borrowed successfully.']);

        $this->assertDatabaseHas('assets', ['id' => $asset->id, 'status' => 'BORROWED']);
        $this->assertDatabaseHas('borrowings', ['asset_id' => $asset->id, 'status' => 'BORROWED']);
    }

    public function test_authorized_borrow_cannot_create_a_duplicate_active_record(): void
    {
        $staff = $this->staffUser();
        $asset = $this->createAsset();
        $this->authorizeAsset($staff, $asset);
        $token = $staff->createToken('auth')->plainTextToken;
        $payload = ['asset_id' => $asset->id, 'borrow_date' => '2026-07-20', 'due_date' => '2026-07-24'];

        $this->withToken($token)->postJson('/api/v1/borrowings', $payload)->assertCreated();
        $this->withToken($token)->postJson('/api/v1/borrowings', $payload)
            ->assertStatus(409)
            ->assertJson(['success' => false, 'message' => 'Asset is not available for borrowing.']);

        $this->assertDatabaseCount('borrowings', 1);
    }

    public function test_return_without_an_active_borrowing_is_rejected(): void
    {
        $staff = $this->staffUser();
        $asset = $this->createAsset();

        $this->withToken($staff->createToken('auth')->plainTextToken)
            ->postJson("/api/v1/assets/{$asset->id}/return")
            ->assertStatus(400)
            ->assertJson(['success' => false, 'message' => 'No active borrow record found for this asset.']);
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
