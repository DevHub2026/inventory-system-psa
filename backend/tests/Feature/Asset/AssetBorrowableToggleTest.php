<?php

namespace Tests\Feature\Asset;

use App\Enums\UserRole;
use App\Models\Role;
use App\Models\User;
use App\Modules\Asset\Enums\AssetStatus;
use App\Modules\Asset\Models\Asset;
use App\Modules\Borrowing\Models\Borrowing;
use App\Modules\Inventory\Models\InventoryItem;
use App\Modules\Reservation\Models\Reservation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Tests for PATCH /api/v1/assets/{asset}/borrowable
 *
 * Covers:
 *  - enable / disable happy-paths
 *  - guard: cannot disable while actively borrowed
 *  - guard: cannot disable while open reservation exists
 *  - guard: cannot enable a SUPPLY item
 *  - guard: no linked inventory item → 422
 *  - idempotency: same value returns 200 without error
 *  - update endpoint still rejects inventory-owned fields
 */
class AssetBorrowableToggleTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create();
        $adminRole = Role::query()->firstOrCreate(
            ['name' => UserRole::SUPER_ADMINISTRATOR->value],
            ['description' => 'Super Administrator'],
        );
        $this->admin->roles()->syncWithoutDetaching([$adminRole->id]);
    }

    // ────────────────────────────────────────────────────────────────────────
    // Helper: create an inventory item + linked asset
    // ────────────────────────────────────────────────────────────────────────

    private function makeInventoryAsset(array $itemOverrides = [], array $assetOverrides = []): array
    {
        $token = $this->admin->createToken('auth')->plainTextToken;

        $created = $this->withToken($token)
            ->postJson('/api/v1/inventory', array_merge([
                'name'           => 'Test Laptop 001',
                'sku'            => 'TST-LAP-'.uniqid(),
                'quantity'       => 1,
                'unit'           => 'unit',
                'classification' => 'PPE',
                'track_as_asset' => true,
            ], $itemOverrides))
            ->assertCreated()
            ->decodeResponseJson()['data'];

        $item  = InventoryItem::query()->findOrFail($created['id']);
        $asset = Asset::query()->findOrFail($created['asset_id']);

        if (! empty($assetOverrides)) {
            $asset->update($assetOverrides);
        }

        return [$item, $asset, $token];
    }

    // ────────────────────────────────────────────────────────────────────────
    // Disable borrowing — happy path
    // ────────────────────────────────────────────────────────────────────────

    public function test_admin_can_disable_borrowing_on_available_ppe_item(): void
    {
        [$item, $asset, $token] = $this->makeInventoryAsset();

        $this->assertTrue((bool) $item->fresh()->is_borrowable, 'PPE item should default to borrowable.');

        $response = $this->withToken($token)
            ->patchJson("/api/v1/assets/{$asset->id}/borrowable", ['is_borrowable' => false]);

        $response->assertOk()
            ->assertJsonPath('data.is_borrowable', false);

        $this->assertFalse((bool) $item->fresh()->is_borrowable);
    }

    // ────────────────────────────────────────────────────────────────────────
    // Enable borrowing — happy path
    // ────────────────────────────────────────────────────────────────────────

    public function test_admin_can_re_enable_borrowing(): void
    {
        [$item, $asset, $token] = $this->makeInventoryAsset();
        $item->update(['is_borrowable' => false]);

        $response = $this->withToken($token)
            ->patchJson("/api/v1/assets/{$asset->id}/borrowable", ['is_borrowable' => true]);

        $response->assertOk()
            ->assertJsonPath('data.is_borrowable', true);

        $this->assertTrue((bool) $item->fresh()->is_borrowable);
    }

    // ────────────────────────────────────────────────────────────────────────
    // Idempotency
    // ────────────────────────────────────────────────────────────────────────

    public function test_setting_same_borrowable_value_is_idempotent(): void
    {
        [$item, $asset, $token] = $this->makeInventoryAsset();
        // already borrowable=true by default

        $this->withToken($token)
            ->patchJson("/api/v1/assets/{$asset->id}/borrowable", ['is_borrowable' => true])
            ->assertOk();

        $this->assertTrue((bool) $item->fresh()->is_borrowable, 'Value must not have changed.');
    }

    // ────────────────────────────────────────────────────────────────────────
    // Guard: active borrowing blocks disable
    // ────────────────────────────────────────────────────────────────────────

    public function test_cannot_disable_borrowing_while_asset_is_actively_borrowed(): void
    {
        [$item, $asset, $token] = $this->makeInventoryAsset();

        // Simulate an active borrowing record
        Borrowing::query()->create([
            'user_id'     => $this->admin->id,
            'asset_id'    => $asset->id,
            'borrow_date' => now()->toDateString(),
            'borrowed_at' => now(),
            'due_date'    => now()->addDays(7)->toDateString(),
            'status'      => 'BORROWED',
        ]);

        $response = $this->withToken($token)
            ->patchJson("/api/v1/assets/{$asset->id}/borrowable", ['is_borrowable' => false]);

        $response->assertStatus(422);
        $this->assertStringContainsString('active borrowing', strtolower($response->json('message') ?? ''));

        // Flag must be unchanged
        $this->assertTrue((bool) $item->fresh()->is_borrowable);
    }

    // ────────────────────────────────────────────────────────────────────────
    // Guard: open reservation blocks disable
    // ────────────────────────────────────────────────────────────────────────

    public function test_cannot_disable_borrowing_while_open_reservation_exists(): void
    {
        [$item, $asset, $token] = $this->makeInventoryAsset();

        $reservation = Reservation::query()->create([
            'user_id'    => $this->admin->id,
            'status'     => 'PENDING',
            'start_date' => now()->toDateString(),
            'end_date'   => now()->addDays(3)->toDateString(),
        ]);
        $reservation->assets()->attach($asset->id);

        $response = $this->withToken($token)
            ->patchJson("/api/v1/assets/{$asset->id}/borrowable", ['is_borrowable' => false]);

        $response->assertStatus(422);
        $this->assertStringContainsString('borrow request', strtolower($response->json('message') ?? ''));

        $this->assertTrue((bool) $item->fresh()->is_borrowable);
    }

    // ────────────────────────────────────────────────────────────────────────
    // Guard: SUPPLY items cannot be made borrowable
    // ────────────────────────────────────────────────────────────────────────

    public function test_supply_item_cannot_be_made_borrowable(): void
    {
        $token = $this->admin->createToken('auth')->plainTextToken;

        // Create a PPE item/asset pair first, then downgrade the classification
        // on the inventory item to SUPPLY so the guard fires.
        $created = $this->withToken($token)
            ->postJson('/api/v1/inventory', [
                'name'           => 'Supply Test Item',
                'sku'            => 'SUP-GUARD-'.uniqid(),
                'quantity'       => 1,
                'unit'           => 'unit',
                'classification' => 'PPE',
                'track_as_asset' => true,
            ])
            ->assertCreated()
            ->decodeResponseJson()['data'];

        $item  = InventoryItem::query()->findOrFail($created['id']);
        $assetId = $item->asset_id;
        $this->assertNotNull($assetId);

        // Directly update the classification to SUPPLY in the DB
        $item->update(['classification' => 'SUPPLY', 'is_borrowable' => false]);

        $response = $this->withToken($token)
            ->patchJson("/api/v1/assets/{$assetId}/borrowable", ['is_borrowable' => true]);

        $response->assertStatus(422);
        $this->assertStringContainsString('supply', strtolower($response->json('message') ?? ''));
    }

    // ────────────────────────────────────────────────────────────────────────
    // Guard: standalone asset (no inventory item)
    // ────────────────────────────────────────────────────────────────────────

    public function test_standalone_asset_without_inventory_item_returns_422(): void
    {
        $token = $this->admin->createToken('auth')->plainTextToken;

        // Build a minimal asset directly in the DB (bypassing inventory)
        $standaloneAsset = \App\Modules\Asset\Models\Asset::query()->create([
            'asset_number'      => 'STANDALONE-'.uniqid(),
            'name'              => 'Standalone Asset',
            'asset_category_id' => \App\Modules\AssetCategory\Models\AssetCategory::query()
                ->firstOrCreate(['code' => 'TEST'], ['name' => 'Test Category', 'is_active' => true])
                ->id,
            'office_id' => \App\Modules\Asset\Models\Office::query()
                ->firstOrCreate(['code' => 'MAIN'], ['name' => 'Main Office', 'is_active' => true])
                ->id,
            'status' => \App\Modules\Asset\Enums\AssetStatus::AVAILABLE->value,
        ]);

        $response = $this->withToken($token)
            ->patchJson("/api/v1/assets/{$standaloneAsset->id}/borrowable", ['is_borrowable' => false]);

        $response->assertStatus(422);
        $this->assertStringContainsString('no linked inventory item', strtolower($response->json('message') ?? ''));
    }

    // ────────────────────────────────────────────────────────────────────────
    // Unauthenticated request is rejected
    // ────────────────────────────────────────────────────────────────────────

    public function test_unauthenticated_request_is_rejected(): void
    {
        // Build the asset directly (no actingAs / withToken in this scope)
        $asset = \App\Modules\Asset\Models\Asset::query()->create([
            'asset_number'      => 'UNAUTH-TEST-'.uniqid(),
            'name'              => 'Auth Test Asset',
            'asset_category_id' => \App\Modules\AssetCategory\Models\AssetCategory::query()
                ->firstOrCreate(['code' => 'TEST2'], ['name' => 'Test Category 2', 'is_active' => true])
                ->id,
            'office_id' => \App\Modules\Asset\Models\Office::query()
                ->firstOrCreate(['code' => 'MAIN'], ['name' => 'Main Office', 'is_active' => true])
                ->id,
            'status' => \App\Modules\Asset\Enums\AssetStatus::AVAILABLE->value,
        ]);

        // No actingAs / withToken — raw unauthenticated request
        $this->patchJson("/api/v1/assets/{$asset->id}/borrowable", ['is_borrowable' => false])
            ->assertStatus(401);
    }

    // ────────────────────────────────────────────────────────────────────────
    // Asset update endpoint rejects inventory-owned fields
    // ────────────────────────────────────────────────────────────────────────

    public function test_asset_update_endpoint_rejects_name_field(): void
    {
        [$item, $asset, $token] = $this->makeInventoryAsset();
        $originalName = $asset->name;

        $this->withToken($token)
            ->putJson("/api/v1/assets/{$asset->id}", ['name' => 'Should Not Save'])
            ->assertStatus(422)
            ->assertJsonPath('errors.name.0',
                'This field is managed by the Inventory module and cannot be edited here. Open the linked Inventory Item to change it.'
            );

        $this->assertSame($originalName, $asset->fresh()->name);
    }

    public function test_asset_update_endpoint_rejects_model_field(): void
    {
        [$item, $asset, $token] = $this->makeInventoryAsset();

        $this->withToken($token)
            ->putJson("/api/v1/assets/{$asset->id}", ['model' => 'Should Not Save'])
            ->assertStatus(422);
    }

    public function test_asset_update_endpoint_accepts_operational_fields(): void
    {
        [$item, $asset, $token] = $this->makeInventoryAsset();

        $this->withToken($token)
            ->putJson("/api/v1/assets/{$asset->id}", [
                'status'           => AssetStatus::MAINTENANCE->value,
                'condition_status' => 'FAIR',
                'remarks'          => 'Sent to technician.',
                // purchase_cost, purchase_date, warranty_until are now owned by Inventory
                // and are prohibited on the Asset update endpoint — removed from this test.
            ])
            ->assertOk();

        $fresh = $asset->fresh();
        $this->assertSame(AssetStatus::MAINTENANCE->value, $fresh->status->value);
        $this->assertSame('FAIR', $fresh->condition_status->value);
        $this->assertSame('Sent to technician.', $fresh->remarks);
    }

    // ────────────────────────────────────────────────────────────────────────
    // AssetResource exposes inventory_item_id and is_borrowable
    // ────────────────────────────────────────────────────────────────────────

    public function test_asset_resource_exposes_inventory_item_id_and_is_borrowable(): void
    {
        [$item, $asset, $token] = $this->makeInventoryAsset();

        $response = $this->withToken($token)
            ->getJson("/api/v1/assets/{$asset->id}")
            ->assertOk();

        $this->assertSame($item->id, $response->json('data.inventory_item_id'));
        $this->assertTrue($response->json('data.is_borrowable'));
    }

    public function test_asset_resource_exposes_is_borrowable_false_after_toggle(): void
    {
        [$item, $asset, $token] = $this->makeInventoryAsset();
        $item->update(['is_borrowable' => false]);

        $response = $this->withToken($token)
            ->getJson("/api/v1/assets/{$asset->id}")
            ->assertOk();

        $this->assertFalse($response->json('data.is_borrowable'));
    }
}
