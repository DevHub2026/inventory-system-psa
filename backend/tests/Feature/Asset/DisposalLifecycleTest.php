<?php

namespace Tests\Feature\Asset;

use App\Enums\UserRole;
use App\Models\Role;
use App\Models\User;
use App\Modules\Asset\Enums\AssetStatus;
use App\Modules\Asset\Models\Asset;
use App\Modules\Borrowing\Models\Borrowing;
use App\Modules\Reservation\Models\Reservation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DisposalLifecycleTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private string $token;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create();
        $role = Role::firstOrCreate(['name' => UserRole::SUPER_ADMINISTRATOR->value]);
        $this->admin->roles()->sync([$role->id]);
        $this->token = $this->admin->createToken('auth')->plainTextToken;
    }

    private function createEligibleAsset(array $overrides = []): Asset
    {
        return Asset::factory()->create(array_merge([
            'status' => AssetStatus::AVAILABLE,
        ], $overrides));
    }

    public function test_eligible_asset_can_be_marked_for_disposal(): void
    {
        $asset = $this->createEligibleAsset();

        $response = $this->withToken($this->token)
            ->postJson("/api/v1/assets/{$asset->id}/dispose", [
                'disposal_reason' => 'End of useful life',
                'disposal_date' => '2026-08-04',
                'disposal_method' => 'Public Auction',
                'disposal_approval_ref' => 'COA-2026-001',
            ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $fresh = $asset->fresh();
        $this->assertSame(AssetStatus::FOR_DISPOSAL, $fresh->status);
        $this->assertSame('End of useful life', $fresh->disposal_reason);
        $this->assertSame('Public Auction', $fresh->disposal_method);
        $this->assertSame('COA-2026-001', $fresh->disposal_approval_ref);
        $this->assertSame($this->admin->id, $fresh->disposal_approved_by);
    }

    public function test_cannot_mark_borrowed_asset_for_disposal(): void
    {
        $asset = $this->createEligibleAsset();
        $employee = User::factory()->create();
        Borrowing::create([
            'user_id' => $employee->id,
            'asset_id' => $asset->id,
            'borrow_date' => now()->toDateString(),
            'borrowed_at' => now(),
            'due_date' => now()->addDays(7)->toDateString(),
            'status' => 'BORROWED',
        ]);

        $response = $this->withToken($this->token)
            ->postJson("/api/v1/assets/{$asset->id}/dispose", [
                'disposal_reason' => 'Test borrowed asset',
                'disposal_date' => '2026-08-04',
            ]);

        $response->assertStatus(422);
        $this->assertSame(AssetStatus::AVAILABLE, $asset->fresh()->status);
    }

    public function test_cannot_mark_reserved_asset_for_disposal(): void
    {
        $asset = $this->createEligibleAsset();
        $employee = User::factory()->create();

        $reservation = Reservation::create([
            'user_id' => $employee->id,
            'status' => 'PENDING',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(7)->toDateString(),
        ]);
        $reservation->assets()->attach($asset->id);
        $asset->update(['status' => AssetStatus::RESERVED]);

        $response = $this->withToken($this->token)
            ->postJson("/api/v1/assets/{$asset->id}/dispose", [
                'disposal_reason' => 'Test reserved asset',
                'disposal_date' => '2026-08-04',
            ]);

        $response->assertStatus(422);
        $this->assertSame(AssetStatus::RESERVED, $asset->fresh()->status);
    }

    public function test_cannot_mark_permanently_issued_asset_for_disposal(): void
    {
        $employee = User::factory()->create();
        $asset = $this->createEligibleAsset([
            'issued_to_user_id' => $employee->id,
            'issued_to' => $employee->full_name,
            'date_issued' => now()->toDateString(),
        ]);

        $response = $this->withToken($this->token)
            ->postJson("/api/v1/assets/{$asset->id}/dispose", [
                'disposal_reason' => 'Test issued asset',
                'disposal_date' => '2026-08-04',
            ]);

        $response->assertStatus(422);
        $this->assertSame(AssetStatus::AVAILABLE, $asset->fresh()->status);
    }

    public function test_unauthorized_user_cannot_mark_for_disposal(): void
    {
        $asset = $this->createEligibleAsset();
        $employee = User::factory()->create();
        $employeeToken = $employee->createToken('auth')->plainTextToken;

        $response = $this->withToken($employeeToken)
            ->postJson("/api/v1/assets/{$asset->id}/dispose", [
                'disposal_reason' => 'No permission',
                'disposal_date' => '2026-08-04',
            ]);

        $response->assertStatus(403);
        $this->assertSame(AssetStatus::AVAILABLE, $asset->fresh()->status);
    }

    public function test_for_disposal_can_be_finalized_as_disposed(): void
    {
        $asset = $this->createEligibleAsset([
            'status' => AssetStatus::FOR_DISPOSAL,
            'disposal_reason' => 'End of useful life',
            'disposal_date' => now()->toDateString(),
        ]);

        $response = $this->withToken($this->token)
            ->postJson("/api/v1/assets/{$asset->id}/dispose/finalize", [
                'disposal_date' => '2026-08-04',
                'disposal_method' => 'Public Auction',
                'disposal_approval_ref' => 'COA-2026-002',
            ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertSame(AssetStatus::DISPOSED, $asset->fresh()->status);
    }

    public function test_disposed_asset_cannot_be_modified(): void
    {
        $asset = $this->createEligibleAsset([
            'status' => AssetStatus::DISPOSED,
        ]);

        $response = $this->withToken($this->token)
            ->postJson("/api/v1/assets/{$asset->id}/dispose", [
                'disposal_reason' => 'Already disposed',
                'disposal_date' => '2026-08-04',
            ]);

        $response->assertStatus(422);
        $this->assertSame(AssetStatus::DISPOSED, $asset->fresh()->status);
    }

    public function test_for_disposal_can_be_cancelled_with_authorization_and_reason(): void
    {
        $asset = $this->createEligibleAsset([
            'status' => AssetStatus::FOR_DISPOSAL,
            'disposal_reason' => 'Initial proposal',
            'disposal_date' => now()->toDateString(),
            'disposal_approved_by' => $this->admin->id,
        ]);

        $response = $this->withToken($this->token)
            ->postJson("/api/v1/assets/{$asset->id}/dispose/cancel", [
                'disposal_cancel_reason' => 'Asset is still needed by the department',
            ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $fresh = $asset->fresh();
        $this->assertSame(AssetStatus::AVAILABLE, $fresh->status);
        $this->assertNotNull($fresh->disposal_cancelled_at);
        $this->assertSame('Asset is still needed by the department', $fresh->disposal_cancel_reason);
    }

    public function test_disposed_asset_remains_in_history(): void
    {
        $asset = $this->createEligibleAsset([
            'status' => AssetStatus::DISPOSED,
            'disposal_reason' => 'Beyond economic repair',
            'disposal_date' => now()->toDateString(),
            'disposal_method' => 'Destruction',
        ]);

        $this->assertDatabaseHas('assets', [
            'id' => $asset->id,
            'status' => AssetStatus::DISPOSED->value,
            'disposal_reason' => 'Beyond economic repair',
        ]);
    }
}