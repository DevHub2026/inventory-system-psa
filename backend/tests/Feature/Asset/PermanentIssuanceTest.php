<?php

namespace Tests\Feature\Asset;

use App\Enums\UserRole;
use App\Models\Asset;
use App\Models\User;
use App\Modules\Asset\Enums\AssetStatus;
use App\Modules\Asset\Enums\IssuanceType;
use App\Modules\Asset\Models\AssetIssuanceHistory;
use App\Modules\Borrowing\Models\Borrowing;
use App\Modules\Reservation\Models\Reservation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PermanentIssuanceTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $custodian;

    private User $employee;

    private User $deptHead;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create();
        $this->admin->roles()->detach();
        $this->admin->assignRole(UserRole::SUPER_ADMINISTRATOR->value);

        $this->custodian = User::factory()->create();
        $this->custodian->roles()->detach();
        $this->custodian->assignRole(UserRole::PROPERTY_CUSTODIAN->value);

        $this->employee = User::factory()->create();
        $this->employee->roles()->detach();
        $this->employee->assignRole(UserRole::EMPLOYEE->value);

        $this->deptHead = User::factory()->create();
        $this->deptHead->roles()->detach();
        $this->deptHead->assignRole(UserRole::DEPARTMENT_HEAD->value);
    }

    public function test_admin_can_permanently_issue_asset_and_derives_holder_name(): void
    {
        $asset = Asset::factory()->create([
            'status' => AssetStatus::AVAILABLE->value,
            'issued_to' => null,
            'issued_to_user_id' => null,
        ]);

        $response = $this->actingAs($this->admin)->postJson("/api/v1/assets/{$asset->id}/permanent-issue", [
            'issued_to_user_id' => $this->employee->id,
            'date_issued' => '2026-07-30',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.issued_to_user_id', $this->employee->id);

        $asset->refresh();

        $this->assertSame($this->employee->id, $asset->issued_to_user_id);
        $this->assertSame($this->employee->full_name, $asset->issued_to);
        $this->assertSame($this->admin->id, $asset->issued_by_user_id);

        $this->assertDatabaseHas('asset_issuance_histories', [
            'asset_id' => $asset->id,
            'issuance_type' => IssuanceType::INITIAL->value,
            'previous_employee_id' => null,
            'new_employee_id' => $this->employee->id,
        ]);
    }

    public function test_property_custodian_can_perform_initial_issuance(): void
    {
        $asset = Asset::factory()->create([
            'status' => AssetStatus::AVAILABLE->value,
        ]);

        $response = $this->actingAs($this->custodian)->postJson("/api/v1/assets/{$asset->id}/permanent-issue", [
            'issued_to_user_id' => $this->employee->id,
            'date_issued' => '2026-07-30',
        ]);

        $response->assertOk();
    }

    public function test_cannot_issue_already_issued_asset(): void
    {
        $holder = User::factory()->create();
        $holder->roles()->detach();

        $asset = Asset::factory()->create([
            'issued_to_user_id' => $holder->id,
            'issued_to' => $holder->full_name,
            'date_issued' => '2026-01-01',
        ]);

        $response = $this->actingAs($this->admin)->postJson("/api/v1/assets/{$asset->id}/permanent-issue", [
            'issued_to_user_id' => $this->employee->id,
            'date_issued' => '2026-07-30',
        ]);

        $response->assertStatus(422);
    }

    public function test_employee_cannot_access_directory(): void
    {
        $response = $this->actingAs($this->employee)->getJson('/api/v1/permanent-issuances/users');

        $response->assertStatus(403);
    }

    public function test_employee_can_view_only_own_permanent_issuances(): void
    {
        $asset = Asset::factory()->create([
            'asset_number' => 'AST-EMP-001',
            'property_number' => 'PROP-EMP-001',
            'issued_to_user_id' => $this->employee->id,
            'issued_to' => $this->employee->full_name,
            'date_issued' => '2026-07-01',
        ]);

        $other = User::factory()->create();
        $other->roles()->detach();

        $this->actingAs($this->employee)
            ->getJson("/api/v1/permanent-issuances/users/{$this->employee->id}/assets")
            ->assertOk()
            ->assertJsonPath('data.items.0.asset_id', $asset->id)
            ->assertJsonPath('data.items.0.asset_number', 'AST-EMP-001')
            ->assertJsonPath('data.items.0.property_number', 'PROP-EMP-001');

        $this->actingAs($this->employee)
            ->getJson("/api/v1/permanent-issuances/users/{$other->id}/assets")
            ->assertStatus(403);
    }

    public function test_department_head_cannot_access_directory(): void
    {
        $this->actingAs($this->deptHead)
            ->getJson('/api/v1/permanent-issuances/users')
            ->assertStatus(403);
    }

    public function test_repeated_issue_does_not_duplicate_initial_history(): void
    {
        $asset = Asset::factory()->create([
            'status' => AssetStatus::AVAILABLE->value,
        ]);

        $payload = [
            'issued_to_user_id' => $this->employee->id,
            'date_issued' => '2026-07-30',
        ];

        $this->actingAs($this->admin)->postJson("/api/v1/assets/{$asset->id}/permanent-issue", $payload)->assertOk();

        $this->actingAs($this->admin)->postJson("/api/v1/assets/{$asset->id}/permanent-issue", $payload)->assertStatus(422);

        $this->assertSame(1, AssetIssuanceHistory::query()->where('asset_id', $asset->id)->count());
    }

    public function test_asset_update_strips_issuance_fields(): void
    {
        $asset = Asset::factory()->create([
            'name' => 'Original Name',
        ]);

        $this->actingAs($this->admin)->putJson("/api/v1/assets/{$asset->id}", [
            'name' => 'Updated Name',
            'issued_to' => 'Manual Name',
            'issued_to_user_id' => $this->employee->id,
            'date_issued' => '2026-07-30',
        ])->assertOk();

        $asset->refresh();

        $this->assertSame('Updated Name', $asset->name);
        $this->assertNull($asset->issued_to_user_id);
        $this->assertNull($asset->issued_to);
    }

    public function test_permanently_issued_asset_remains_visible_in_assets_listing_without_status_change(): void
    {
        $asset = Asset::factory()->create([
            'asset_number' => 'AST-VISIBLE-001',
            'property_number' => 'PROP-VISIBLE-001',
            'status' => AssetStatus::AVAILABLE->value,
            'issued_to_user_id' => $this->employee->id,
            'issued_to' => $this->employee->full_name,
            'date_issued' => '2026-07-15',
            'issued_by_user_id' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/assets?search=AST-VISIBLE-001');

        $response->assertOk()
            ->assertJsonPath('data.items.0.id', $asset->id)
            ->assertJsonPath('data.items.0.status', AssetStatus::AVAILABLE->value)
            ->assertJsonPath('data.items.0.issued_to_user_id', $this->employee->id)
            ->assertJsonPath('data.items.0.issued_to_user.full_name', $this->employee->full_name)
            ->assertJsonPath('data.items.0.property_number', 'PROP-VISIBLE-001');
    }

    public function test_legacy_unlinked_holder_is_exposed_as_fallback_not_verified_user_relationship(): void
    {
        $asset = Asset::factory()->create([
            'issued_to_user_id' => null,
            'issued_to' => 'Legacy Holder',
            'date_issued' => '2026-06-01',
        ]);

        $this->actingAs($this->admin)
            ->getJson("/api/v1/assets/{$asset->id}")
            ->assertOk()
            ->assertJsonPath('data.issued_to', 'Legacy Holder')
            ->assertJsonPath('data.issued_to_user_id', null)
            ->assertJsonPath('data.is_unlinked_holder', true);
    }

    public function test_active_borrowing_blocks_permanent_issuance(): void
    {
        $asset = Asset::factory()->create([
            'status' => AssetStatus::BORROWED->value,
        ]);

        Borrowing::query()->create([
            'user_id' => $this->employee->id,
            'asset_id' => $asset->id,
            'borrow_date' => now()->toDateString(),
            'borrowed_at' => now(),
            'due_date' => now()->addDay()->toDateString(),
            'status' => 'BORROWED',
        ]);

        $response = $this->actingAs($this->admin)->postJson("/api/v1/assets/{$asset->id}/permanent-issue", [
            'issued_to_user_id' => $this->employee->id,
            'date_issued' => '2026-07-30',
        ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('active borrowing transaction', (string) $response->json('message'));
    }

    public function test_pending_reservation_blocks_permanent_issuance(): void
    {
        $asset = Asset::factory()->create([
            'status' => AssetStatus::AVAILABLE->value,
        ]);

        $reservation = Reservation::query()->create([
            'user_id' => $this->employee->id,
            'status' => 'PENDING',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDay()->toDateString(),
        ]);

        DB::table('reservation_items')->insert([
            'reservation_id' => $reservation->id,
            'asset_id' => $asset->id,
            'fulfilled_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($this->admin)->postJson("/api/v1/assets/{$asset->id}/permanent-issue", [
            'issued_to_user_id' => $this->employee->id,
            'date_issued' => '2026-07-30',
        ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('open borrow request', (string) $response->json('message'));
    }
}
