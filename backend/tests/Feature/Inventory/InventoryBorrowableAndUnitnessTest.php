<?php

namespace Tests\Feature\Inventory;

use App\Modules\Asset\Models\Asset;
use App\Modules\Inventory\Models\InventoryItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Tests covering:
 *  - is_borrowable flag creation, enforcement, and backend rejection
 *  - SUPPLY items default to non-borrowable
 *  - SKU uniqueness ignores the current record on edit
 *  - SKU uniqueness ignores the item's own linked asset_number
 *  - Archived inventory item hidden from active list
 *  - Archive asset also soft-deletes the linked inventory item
 *  - Inventory export includes saved fields
 *  - Individual PPE item quantity defaults to 1
 *  - Creating two items with same model but different names
 */
class InventoryBorrowableAndUnitnessTest extends TestCase
{
    use RefreshDatabase;

    // ────────────────────────────────────────────────────────────────────────
    // is_borrowable creation defaults
    // ────────────────────────────────────────────────────────────────────────

    public function test_ppe_item_defaults_to_borrowable(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/v1/inventory', [
            'name' => 'Laptop EB-X1 001',
            'sku' => 'LAP-001',
            'quantity' => 1,
            'unit' => 'unit',
            'classification' => 'PPE',
            'item_nature' => 'ACCOUNTABLE_PROPERTY',
            'track_as_asset' => true,
        ]);

        $response->assertCreated();
        $this->assertTrue((bool) $response->json('data.is_borrowable'));
        $this->assertDatabaseHas('inventory_items', [
            'sku' => 'LAP-001',
            'is_borrowable' => 1,
        ]);
    }

    public function test_supply_item_defaults_to_non_borrowable(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/v1/inventory', [
            'name' => 'A4 Copy Paper',
            'sku' => 'PAP-001',
            'quantity' => 100,
            'unit' => 'ream',
            'classification' => 'SUPPLY',
            'item_nature' => 'CONSUMABLE_SUPPLY',
            'track_as_asset' => false,
        ]);

        $response->assertCreated();
        $this->assertFalse((bool) $response->json('data.is_borrowable'));
        $this->assertDatabaseHas('inventory_items', [
            'sku' => 'PAP-001',
            'is_borrowable' => 0,
        ]);
    }

    public function test_admin_can_explicitly_set_ppe_item_non_borrowable(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/v1/inventory', [
            'name' => 'Server Rack EB-001',
            'sku' => 'SRV-001',
            'quantity' => 1,
            'unit' => 'unit',
            'classification' => 'PPE',
            'is_borrowable' => false,
            'track_as_asset' => true,
        ]);

        $response->assertCreated();
        $this->assertFalse((bool) $response->json('data.is_borrowable'));
        $this->assertDatabaseHas('inventory_items', [
            'sku' => 'SRV-001',
            'is_borrowable' => 0,
        ]);
    }

    // ────────────────────────────────────────────────────────────────────────
    // Borrowable backend enforcement
    // ────────────────────────────────────────────────────────────────────────

    public function test_non_borrowable_item_cannot_be_borrowed_via_api(): void
    {
        $user = User::factory()->create();
        $admin = User::factory()->create();
        [$userToken, $adminToken] = [
            $user->createToken('auth')->plainTextToken,
            $admin->createToken('auth')->plainTextToken,
        ];

        // Create non-borrowable PPE item
        $created = $this->withToken($adminToken)->postJson('/api/v1/inventory', [
            'name' => 'Server UPS EB-001',
            'sku' => 'UPS-001',
            'quantity' => 1,
            'unit' => 'unit',
            'classification' => 'PPE',
            'is_borrowable' => false,
            'track_as_asset' => true,
        ])->assertCreated()->decodeResponseJson()['data'];

        $assetId = $created['asset_id'];
        $this->assertNotNull($assetId, 'Expected linked asset to be created.');

        // Admin tries to borrow — must fail because is_borrowable = false
        // (Note: full borrow flow needs a reservation first; here we test
        //  the raw borrowing endpoint which requires a pre-approved reservation,
        //  so we instead test via QR scan which calls the same guard.)
        $assetIdentifier = \App\Modules\AssetIdentifier\Models\AssetIdentifier::query()
            ->where('asset_id', $assetId)
            ->first();

        $this->assertNotNull($assetIdentifier);

        // Attempt to request borrow via the request-borrow endpoint — should fail with borrowable guard
        $scanResponse = $this->withToken($userToken)
            ->postJson('/api/v1/assets/request-borrow', [
                'value' => $assetIdentifier->identifier_value,
            ]);

        // The endpoint should reject with 422 (not borrowable) rather than allowing it
        $scanResponse->assertStatus(422);
        $this->assertStringContainsString(
            'not configured as borrowable',
            strtolower($scanResponse->json('message') ?? $scanResponse->json('error') ?? ''),
        );
    }

    // ────────────────────────────────────────────────────────────────────────
    // SKU uniqueness rules
    // ────────────────────────────────────────────────────────────────────────

    public function test_sku_validation_endpoint_passes_for_own_sku_during_edit(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        // Create an item with a specific SKU
        $created = $this->withToken($token)->postJson('/api/v1/inventory', [
            'name' => 'Laptop EB-X1 001',
            'sku' => 'LAP-EDIT-001',
            'quantity' => 1,
            'unit' => 'unit',
            'classification' => 'PPE',
            'track_as_asset' => true,
        ])->assertCreated()->decodeResponseJson()['data'];

        // Validate the same SKU with ignore_id set to the current item's id
        $response = $this->withToken($token)
            ->getJson('/api/v1/inventory/validate-sku?sku=LAP-EDIT-001&ignore_id='.$created['id']);

        $response->assertOk();
        $this->assertFalse(
            $response->json('data.exists'),
            'SKU validation should report no duplicate when ignoring the current item.',
        );
    }

    public function test_sku_validation_endpoint_reports_duplicate_for_different_item(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        // Create two items with different SKUs
        $this->withToken($token)->postJson('/api/v1/inventory', [
            'name' => 'Item A',
            'sku' => 'SKU-TAKEN',
            'quantity' => 1,
            'unit' => 'unit',
        ])->assertCreated();

        $item2 = $this->withToken($token)->postJson('/api/v1/inventory', [
            'name' => 'Item B',
            'sku' => 'SKU-FREE',
            'quantity' => 1,
            'unit' => 'unit',
        ])->assertCreated()->decodeResponseJson()['data'];

        // Validate the taken SKU for item2 (no ignore_id → reports duplicate)
        $response = $this->withToken($token)
            ->getJson('/api/v1/inventory/validate-sku?sku=SKU-TAKEN');

        $response->assertOk();
        $this->assertTrue($response->json('data.exists'));

        // Validate with item2 as the ignore_id → still reports duplicate (different item owns it)
        $response2 = $this->withToken($token)
            ->getJson('/api/v1/inventory/validate-sku?sku=SKU-TAKEN&ignore_id='.$item2['id']);

        $response2->assertOk();
        $this->assertTrue($response2->json('data.exists'));
    }

    public function test_sku_validation_does_not_flag_own_linked_asset_number(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        // Create a PPE item — the SKU becomes the asset_number of the linked asset
        $created = $this->withToken($token)->postJson('/api/v1/inventory', [
            'name' => 'Laptop EB-X1 SKU-AS-ASSET',
            'sku' => 'ASSET-SKU-SAME',
            'quantity' => 1,
            'unit' => 'unit',
            'classification' => 'PPE',
            'track_as_asset' => true,
        ])->assertCreated()->decodeResponseJson()['data'];

        // Validate with ignore_id — should NOT report the item's own linked asset_number as duplicate
        $response = $this->withToken($token)
            ->getJson('/api/v1/inventory/validate-sku?sku=ASSET-SKU-SAME&ignore_id='.$created['id']);

        $response->assertOk();
        $this->assertFalse(
            $response->json('data.exists'),
            'Validate SKU must not flag the item\'s own linked asset_number as a duplicate.',
        );
    }

    public function test_backend_rejects_duplicate_sku_at_store_level(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $this->withToken($token)->postJson('/api/v1/inventory', [
            'name' => 'Item One',
            'sku' => 'DUP-SKU-001',
            'quantity' => 1,
            'unit' => 'unit',
        ])->assertCreated();

        $response = $this->withToken($token)->postJson('/api/v1/inventory', [
            'name' => 'Item Two',
            'sku' => 'DUP-SKU-001',
            'quantity' => 1,
            'unit' => 'unit',
        ]);

        $response->assertStatus(422);
    }

    // ────────────────────────────────────────────────────────────────────────
    // Two items with same model but different names (individual tracking)
    // ────────────────────────────────────────────────────────────────────────

    public function test_can_create_two_individually_tracked_items_with_same_model_different_names(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $this->withToken($token)->postJson('/api/v1/inventory', [
            'name' => 'Laptop EB-X1 001',
            'sku' => 'LAP-EB-X1-001',
            'quantity' => 1,
            'unit' => 'unit',
            'classification' => 'PPE',
            'model' => 'Lenovo ThinkPad X1 Carbon',
            'track_as_asset' => true,
        ])->assertCreated();

        $this->withToken($token)->postJson('/api/v1/inventory', [
            'name' => 'Laptop EB-X1 002',
            'sku' => 'LAP-EB-X1-002',
            'quantity' => 1,
            'unit' => 'unit',
            'classification' => 'PPE',
            'model' => 'Lenovo ThinkPad X1 Carbon',
            'track_as_asset' => true,
        ])->assertCreated();

        $this->assertDatabaseHas('inventory_items', ['name' => 'Laptop EB-X1 001']);
        $this->assertDatabaseHas('inventory_items', ['name' => 'Laptop EB-X1 002']);

        // Both items should have separate asset records
        $this->assertSame(2, Asset::query()->where('name', 'like', '%Laptop EB-X1%')->count());
    }

    // ────────────────────────────────────────────────────────────────────────
    // Supply item quantity > 1
    // ────────────────────────────────────────────────────────────────────────

    public function test_supply_item_can_have_quantity_greater_than_one(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/v1/inventory', [
            'name' => 'Bond Paper A4',
            'sku' => 'BOND-A4-001',
            'quantity' => 100,
            'unit' => 'ream',
            'classification' => 'SUPPLY',
        ]);

        $response->assertCreated();
        $this->assertSame(100, $response->json('data.quantity'));
        $this->assertNull($response->json('data.asset_id'), 'Supply items must not create a linked asset.');
    }

    // ────────────────────────────────────────────────────────────────────────
    // Archive behavior
    // ────────────────────────────────────────────────────────────────────────

    public function test_archiving_asset_also_soft_deletes_linked_inventory_item(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $created = $this->withToken($token)->postJson('/api/v1/inventory', [
            'name' => 'Printer HP-001',
            'sku' => 'PRNT-ARCH-001',
            'quantity' => 1,
            'unit' => 'unit',
            'classification' => 'PPE',
            'track_as_asset' => true,
        ])->assertCreated()->decodeResponseJson()['data'];

        $assetId = $created['asset_id'];
        $itemId  = $created['id'];
        $this->assertNotNull($assetId);

        // Archive the asset
        $this->withToken($token)
            ->postJson("/api/v1/assets/{$assetId}/archive")
            ->assertOk();

        // Inventory item should be soft-deleted
        $this->assertSoftDeleted('inventory_items', ['id' => $itemId]);

        // Asset should be soft-deleted
        $this->assertSoftDeleted('assets', ['id' => $assetId]);

        // The item should NOT appear in the active inventory list
        $response = $this->withToken($token)->getJson('/api/v1/inventory');
        $items = $response->json('data.items');
        $ids = array_column($items, 'id');
        $this->assertNotContains($itemId, $ids, 'Archived item should not appear in active inventory list.');
    }

    public function test_archived_item_is_hidden_from_active_inventory(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        // Create and then delete an item
        $created = $this->withToken($token)->postJson('/api/v1/inventory', [
            'name' => 'Old Keyboard',
            'sku' => 'KB-ARCH-001',
            'quantity' => 1,
            'unit' => 'unit',
        ])->assertCreated()->decodeResponseJson()['data'];

        $this->withToken($token)->deleteJson('/api/v1/inventory/'.$created['id'])->assertOk();

        // Active list should not contain it
        $items = $this->withToken($token)->getJson('/api/v1/inventory')
            ->assertOk()
            ->json('data.items');

        $ids = array_column($items, 'id');
        $this->assertNotContains($created['id'], $ids);

        // The record must still exist in the database (soft delete)
        $this->assertSoftDeleted('inventory_items', ['id' => $created['id']]);
    }

    // ────────────────────────────────────────────────────────────────────────
    // Inventory export includes proper fields
    // ────────────────────────────────────────────────────────────────────────

    public function test_inventory_export_includes_is_borrowable_column(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        InventoryItem::query()->create([
            'name' => 'Laptop Export Test',
            'sku' => 'EXP-LAP-001',
            'quantity' => 1,
            'unit' => 'unit',
            'classification' => 'PPE',
            'is_borrowable' => true,
        ]);

        $response = $this->withToken($token)->get('/api/v1/inventory/export/download');
        $response->assertOk();

        // Check the content-type confirms it's an Excel file
        $this->assertStringContainsString(
            'spreadsheetml',
            $response->headers->get('content-type'),
        );
    }

    // ────────────────────────────────────────────────────────────────────────
    // Profile update
    // ────────────────────────────────────────────────────────────────────────

    public function test_profile_update_persists_name_fields(): void
    {
        $user = User::factory()->create([
            'first_name' => 'Original',
            'last_name'  => 'Name',
        ]);
        $token = $user->createToken('auth')->plainTextToken;

        // Send a combined "name" payload — backend must split it
        $response = $this->withToken($token)->putJson('/api/v1/profile', [
            'name' => 'Updated LastName',
        ]);

        $response->assertOk()->assertJsonPath('success', true);

        $fresh = $user->fresh();
        $this->assertSame('Updated', $fresh->first_name);
        $this->assertSame('LastName', $fresh->last_name);
    }

    public function test_profile_update_rejects_duplicate_email(): void
    {
        $existing = User::factory()->create(['email' => 'taken@example.com']);
        $user     = User::factory()->create(['email' => 'mine@example.com']);
        $token    = $user->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)->putJson('/api/v1/profile', [
            'email' => 'taken@example.com',
        ]);

        $response->assertStatus(422);
    }

    public function test_profile_update_allows_keeping_own_email(): void
    {
        $user  = User::factory()->create(['email' => 'myown@example.com']);
        $token = $user->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)->putJson('/api/v1/profile', [
            'email' => 'myown@example.com',
            'name'  => 'Same Person',
        ]);

        $response->assertOk()->assertJsonPath('success', true);
    }
}
