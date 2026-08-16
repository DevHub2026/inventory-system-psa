<?php

namespace Tests\Feature\Inventory;

use App\Enums\UserRole;
use App\Models\Role;
use App\Models\User;
use App\Modules\Asset\Models\Asset;
use App\Modules\Inventory\Models\InventoryItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_create_inventory_item(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->postJson('/api/v1/inventory', [
                'name' => 'Printer Paper',
                'sku' => 'PP-001',
                'quantity' => 100,
                'unit' => 'ream',
                'reorder_level' => 20,
                'remarks' => 'Office supply',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Inventory item created successfully.',
            ]);

        $this->assertDatabaseHas('inventory_items', [
            'name' => 'Printer Paper',
            'sku' => 'PP-001',
        ]);
    }

    public function test_authenticated_user_can_stock_in_inventory_item(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $item = $this->withToken($token)
            ->postJson('/api/v1/inventory', [
                'name' => 'Printer Paper',
                'sku' => 'PP-001',
                'quantity' => 10,
                'unit' => 'ream',
                'reorder_level' => 5,
            ])->decodeResponseJson()['data'];

        $response = $this->withToken($token)
            ->postJson('/api/v1/inventory/'.$item['id'].'/stock-in', [
                'quantity' => 20,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Stock in completed successfully.',
            ]);
    }

    public function test_authenticated_user_can_update_inventory_item(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $item = $this->withToken($token)
            ->postJson('/api/v1/inventory', [
                'name' => 'Printer Paper',
                'sku' => 'PP-001',
                'quantity' => 10,
                'unit' => 'ream',
                'reorder_level' => 5,
            ])->decodeResponseJson()['data'];

        $response = $this->withToken($token)
            ->putJson('/api/v1/inventory/'.$item['id'], [
                'name' => 'Printer Paper Premium',
                'sku' => 'PP-001',
                'quantity' => 10,
                'unit' => 'ream',
                'reorder_level' => 10,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Inventory item updated successfully.',
            ]);

        $this->assertDatabaseHas('inventory_items', [
            'id' => $item['id'],
            'name' => 'Printer Paper Premium',
            'quantity' => 10,
        ]);
    }

    public function test_authenticated_user_can_delete_inventory_item(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $item = $this->withToken($token)
            ->postJson('/api/v1/inventory', [
                'name' => 'Printer Paper',
                'sku' => 'PP-001',
                'quantity' => 10,
                'unit' => 'ream',
            ])->decodeResponseJson()['data'];

        $response = $this->withToken($token)
            ->deleteJson('/api/v1/inventory/'.$item['id']);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Inventory item deleted successfully.',
            ]);

        $this->assertSoftDeleted('inventory_items', [
            'id' => $item['id'],
        ]);
    }

    public function test_authenticated_user_can_stock_out_inventory_item(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $item = $this->withToken($token)
            ->postJson('/api/v1/inventory', [
                'name' => 'Printer Paper',
                'sku' => 'PP-001',
                'quantity' => 30,
                'unit' => 'ream',
                'reorder_level' => 5,
            ])->decodeResponseJson()['data'];

        $response = $this->withToken($token)
            ->postJson('/api/v1/inventory/'.$item['id'].'/stock-out', [
                'quantity' => 10,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Stock out completed successfully.',
            ]);

        $this->assertDatabaseHas('inventory_items', [
            'id' => $item['id'],
            'quantity' => 20,
        ]);
    }

    public function test_authenticated_user_cannot_stock_out_insufficient_stock(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $item = $this->withToken($token)
            ->postJson('/api/v1/inventory', [
                'name' => 'Printer Paper',
                'sku' => 'PP-001',
                'quantity' => 5,
                'unit' => 'ream',
            ])->decodeResponseJson()['data'];

        $response = $this->withToken($token)
            ->postJson('/api/v1/inventory/'.$item['id'].'/stock-out', [
                'quantity' => 10,
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Insufficient stock for stock-out operation.',
            ]);
    }

    public function test_authenticated_user_can_filter_inventory_by_search(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/v1/inventory', [
                'name' => 'Printer Paper',
                'sku' => 'PP-001',
                'quantity' => 10,
                'unit' => 'ream',
            ]);

        $this->withToken($token)
            ->postJson('/api/v1/inventory', [
                'name' => 'Toner Cartridge',
                'sku' => 'TC-001',
                'quantity' => 5,
                'unit' => 'piece',
            ]);

        $response = $this->withToken($token)
            ->getJson('/api/v1/inventory?search=Printer');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Inventory items retrieved successfully.',
            ]);

        $data = $response->json('data.items');
        $this->assertCount(1, $data);
        $this->assertEquals('Printer Paper', $data[0]['name']);
    }

    public function test_authenticated_user_can_filter_inventory_by_low_stock(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/v1/inventory', [
                'name' => 'Printer Paper',
                'sku' => 'PP-001',
                'quantity' => 10,
                'unit' => 'ream',
                'reorder_level' => 5,
            ]);

        $this->withToken($token)
            ->postJson('/api/v1/inventory', [
                'name' => 'Toner Cartridge',
                'sku' => 'TC-001',
                'quantity' => 3,
                'unit' => 'piece',
                'reorder_level' => 5,
            ]);

        $response = $this->withToken($token)
            ->getJson('/api/v1/inventory?low_stock=1');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Inventory items retrieved successfully.',
            ]);

        $data = $response->json('data.items');
        $this->assertCount(1, $data);
        $this->assertEquals('Toner Cartridge', $data[0]['name']);
    }

    public function test_inventory_returns_linked_property_and_asset_numbers_independently_for_accountable_items(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $created = $this->withToken($token)
            ->postJson('/api/v1/inventory', [
                'name' => 'Office Laptop',
                'sku' => 'INV-LAP-001',
                'quantity' => 1,
                'unit' => 'unit',
                'classification' => 'PPE',
                'item_nature' => 'ACCOUNTABLE_PROPERTY',
                'track_as_asset' => true,
            ])
            ->assertCreated()
            ->decodeResponseJson()['data'];

        $assetId = $created['asset_id'];
        $asset = Asset::query()->findOrFail($assetId);
        $asset->update([
            'property_number' => 'PROP-LAP-001',
            'issued_to' => 'Legacy Holder',
        ]);

        $response = $this->withToken($token)->getJson('/api/v1/inventory');

        $response->assertOk()
            ->assertJsonPath('data.items.0.classification', 'PPE')
            ->assertJsonPath('data.items.0.asset_number', $asset->asset_number)
            ->assertJsonPath('data.items.0.property_number', 'PROP-LAP-001')
            ->assertJsonPath('data.items.0.accountability', 'Issued to Legacy Holder')
            ->assertJsonPath('data.items.0.is_unlinked_holder', true);
    }

    public function test_inventory_classification_filter_returns_only_matching_records(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $this->withToken($token)->postJson('/api/v1/inventory', [
            'name' => 'Desktop Computer',
            'sku' => 'INV-PPE-001',
            'quantity' => 1,
            'unit' => 'unit',
            'classification' => 'PPE',
            'item_nature' => 'ACCOUNTABLE_PROPERTY',
            'track_as_asset' => true,
        ])->assertCreated();

        $this->withToken($token)->postJson('/api/v1/inventory', [
            'name' => 'Cabinet',
            'sku' => 'INV-SE-001',
            'quantity' => 2,
            'unit' => 'unit',
            'classification' => 'SE',
            'item_nature' => 'ACCOUNTABLE_PROPERTY',
            'track_as_asset' => false,
        ])->assertCreated();

        $this->withToken($token)->postJson('/api/v1/inventory', [
            'name' => 'Bond Paper',
            'sku' => 'INV-SUP-001',
            'quantity' => 50,
            'unit' => 'ream',
            'classification' => 'SUPPLY',
            'item_nature' => 'CONSUMABLE_SUPPLY',
            'track_as_asset' => false,
        ])->assertCreated();

        $this->withToken($token)
            ->getJson('/api/v1/inventory?classification=PPE')
            ->assertOk();
        $this->assertSame(['Desktop Computer'], array_column($this->withToken($token)->getJson('/api/v1/inventory?classification=PPE')->json('data.items'), 'name'));

        $this->assertSame(['Cabinet'], array_column($this->withToken($token)->getJson('/api/v1/inventory?classification=SE')->json('data.items'), 'name'));
        $this->assertSame(['Bond Paper'], array_column($this->withToken($token)->getJson('/api/v1/inventory?classification=SUPPLY')->json('data.items'), 'name'));
    }

    public function test_supply_records_do_not_enter_asset_accountability_workflow(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->postJson('/api/v1/inventory', [
                'name' => 'Staples',
                'sku' => 'INV-SUP-ACC-001',
                'quantity' => 5,
                'unit' => 'box',
                'classification' => 'SUPPLY',
                'item_nature' => 'CONSUMABLE_SUPPLY',
                'track_as_asset' => false,
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.classification', 'SUPPLY')
            ->assertJsonPath('data.asset_id', null)
            ->assertJsonPath('data.asset_number', null)
            ->assertJsonPath('data.property_number', null)
            ->assertJsonPath('data.accountability', '—');
    }

    public function test_linked_accountable_inventory_item_cannot_be_reclassified_as_supply(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $created = $this->withToken($token)
            ->postJson('/api/v1/inventory', [
                'name' => 'Projector',
                'sku' => 'INV-PROJ-001',
                'quantity' => 1,
                'unit' => 'unit',
                'classification' => 'PPE',
                'item_nature' => 'ACCOUNTABLE_PROPERTY',
                'track_as_asset' => true,
            ])
            ->assertCreated()
            ->decodeResponseJson()['data'];

        $this->withToken($token)
            ->putJson('/api/v1/inventory/'.$created['id'], [
                'name' => 'Projector',
                'sku' => 'INV-PROJ-001',
                'quantity' => 1,
                'unit' => 'unit',
                'classification' => 'SUPPLY',
                'item_nature' => 'CONSUMABLE_SUPPLY',
                'track_as_asset' => false,
            ])
            ->assertStatus(422);
    }

    public function test_authenticated_user_can_adjust_inventory_quantity_with_reason(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $item = $this->withToken($token)
            ->postJson('/api/v1/inventory', [
                'name' => 'Printer Paper',
                'sku' => 'PP-001',
                'quantity' => 50,
                'unit' => 'ream',
                'reorder_level' => 5,
            ])->decodeResponseJson()['data'];

        $response = $this->withToken($token)
            ->postJson('/api/v1/inventory/'.$item['id'].'/adjust', [
                'quantity' => 47,
                'reason' => 'Physical count correction',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Stock quantity corrected successfully.',
                'data' => [
                    'quantity' => 47,
                ],
            ]);

        $this->assertDatabaseHas('stock_transactions', [
            'inventory_item_id' => $item['id'],
            'type' => 'adjustment',
            'quantity' => -3,
            'quantity_before' => 50,
            'quantity_after' => 47,
            'reason' => 'Physical count correction',
        ]);
    }

    public function test_authenticated_user_can_view_inventory_history(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $item = $this->withToken($token)
            ->postJson('/api/v1/inventory', [
                'name' => 'Printer Paper',
                'sku' => 'PP-001',
                'quantity' => 10,
                'unit' => 'ream',
                'reorder_level' => 5,
            ])->decodeResponseJson()['data'];

        $this->withToken($token)
            ->postJson('/api/v1/inventory/'.$item['id'].'/stock-in', [
                'quantity' => 5,
                'reason' => 'New supplies received',
            ]);

        $response = $this->withToken($token)
            ->getJson('/api/v1/inventory/'.$item['id'].'/history');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Stock movement history retrieved successfully.',
            ]);

        $this->assertGreaterThanOrEqual(1, count($response->json('data.items')));
    }

    public function test_authorized_user_can_transfer_partial_inventory_between_locations(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;
        $sourceLocation = \App\Models\Location::factory()->create();
        $destinationLocation = \App\Models\Location::factory()->create();

        $item = InventoryItem::query()->create([
            'name' => 'Bond Paper',
            'sku' => 'BP-TRANSFER',
            'quantity' => 20,
            'unit' => 'ream',
            'location_id' => $sourceLocation->id,
            'classification' => 'SUPPLY',
            'item_nature' => 'CONSUMABLE_SUPPLY',
            'track_as_asset' => false,
        ]);

        $response = $this->withToken($token)
            ->postJson("/api/v1/inventory/{$item->id}/transfer", [
                'quantity' => 5,
                'source_location_id' => $sourceLocation->id,
                'destination_location_id' => $destinationLocation->id,
                'reason' => 'Move to satellite office',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.source_item.quantity', 15)
            ->assertJsonPath('data.destination_item.quantity', 5);

        $this->assertDatabaseHas('stock_transactions', [
            'inventory_item_id' => $item->id,
            'type' => 'transfer_out',
            'quantity' => -5,
            'quantity_before' => 20,
            'quantity_after' => 15,
            'source_location_id' => $sourceLocation->id,
            'destination_location_id' => $destinationLocation->id,
        ]);
        $this->assertDatabaseHas('inventory_items', [
            'name' => 'Bond Paper',
            'quantity' => 5,
            'location_id' => $destinationLocation->id,
        ]);
    }

    public function test_transfer_rejects_more_than_available_quantity(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;
        $sourceLocation = \App\Models\Location::factory()->create();
        $destinationLocation = \App\Models\Location::factory()->create();

        $item = InventoryItem::query()->create([
            'name' => 'Ink Cartridge',
            'sku' => 'INK-TRANSFER',
            'quantity' => 3,
            'unit' => 'piece',
            'location_id' => $sourceLocation->id,
        ]);

        $this->withToken($token)
            ->postJson("/api/v1/inventory/{$item->id}/transfer", [
                'quantity' => 4,
                'source_location_id' => $sourceLocation->id,
                'destination_location_id' => $destinationLocation->id,
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Cannot transfer more stock than available.');

        $this->assertDatabaseHas('inventory_items', [
            'id' => $item->id,
            'quantity' => 3,
            'location_id' => $sourceLocation->id,
        ]);
    }

    public function test_employee_cannot_transfer_inventory(): void
    {
        $user = User::factory()->create();
        $employeeRole = Role::query()->firstOrCreate(
            ['name' => UserRole::EMPLOYEE->value],
            ['description' => UserRole::EMPLOYEE->name],
        );
        $user->roles()->sync([$employeeRole->id]);
        $token = $user->createToken('auth')->plainTextToken;
        $sourceLocation = \App\Models\Location::factory()->create();
        $destinationLocation = \App\Models\Location::factory()->create();
        $item = InventoryItem::query()->create([
            'name' => 'Envelope',
            'sku' => 'ENV-TRANSFER',
            'quantity' => 10,
            'unit' => 'pack',
            'location_id' => $sourceLocation->id,
        ]);

        $this->withToken($token)
            ->postJson("/api/v1/inventory/{$item->id}/transfer", [
                'quantity' => 1,
                'source_location_id' => $sourceLocation->id,
                'destination_location_id' => $destinationLocation->id,
            ])
            ->assertStatus(403);
    }

    public function test_authorized_user_can_complete_and_reconcile_inventory_count(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;
        $location = \App\Models\Location::factory()->create();
        $item = InventoryItem::query()->create([
            'name' => 'Folder',
            'sku' => 'FOLDER-COUNT',
            'quantity' => 12,
            'unit' => 'piece',
            'location_id' => $location->id,
        ]);

        $sessionId = $this->withToken($token)
            ->postJson('/api/v1/inventory/count-sessions', [
                'location_id' => $location->id,
                'notes' => 'Quarterly count',
            ])
            ->assertCreated()
            ->assertJsonPath('data.items.0.expected_quantity', 12)
            ->json('data.id');

        $this->withToken($token)
            ->postJson("/api/v1/inventory/count-sessions/{$sessionId}/items/{$item->id}", [
                'actual_quantity' => 10,
                'remarks' => 'Two missing',
            ])
            ->assertOk()
            ->assertJsonPath('data.items.0.variance', -2);

        $this->withToken($token)
            ->postJson("/api/v1/inventory/count-sessions/{$sessionId}/complete")
            ->assertOk()
            ->assertJsonPath('data.status', 'completed');

        $this->withToken($token)
            ->postJson("/api/v1/inventory/count-sessions/{$sessionId}/reconcile")
            ->assertOk()
            ->assertJsonPath('data.status', 'reconciled');

        $this->assertDatabaseHas('inventory_items', [
            'id' => $item->id,
            'quantity' => 10,
        ]);
        $this->assertDatabaseHas('stock_transactions', [
            'inventory_item_id' => $item->id,
            'type' => 'cycle_count_adjustment',
            'quantity' => -2,
            'quantity_before' => 12,
            'quantity_after' => 10,
        ]);
    }

    public function test_authorized_user_can_download_inventory_export(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        InventoryItem::query()->create([
            'name' => 'Printer Paper',
            'sku' => 'PP-EXPORT',
            'quantity' => 25,
            'unit' => 'ream',
            'reorder_level' => 5,
        ]);

        $response = $this->withToken($token)
            ->get('/api/v1/inventory/export/download');

        $response->assertOk();
        $this->assertSame(
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            $response->headers->get('content-type'),
        );
        $this->assertStringContainsString(
            'attachment; filename=inventory-export-',
            $response->headers->get('content-disposition'),
        );
    }

    public function test_inventory_export_guest_receives_json_401_without_login_route_redirect(): void
    {
        $response = $this->get('/api/v1/inventory/export/download');

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Unauthenticated.',
                'errors' => [],
            ]);
    }

    public function test_employee_cannot_download_inventory_export(): void
    {
        $user = User::factory()->create();
        $employeeRole = Role::query()->firstOrCreate(
            ['name' => UserRole::EMPLOYEE->value],
            ['description' => UserRole::EMPLOYEE->name],
        );
        $user->roles()->sync([$employeeRole->id]);
        $token = $user->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->getJson('/api/v1/inventory/export/download');

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'This action is not authorized for your role.',
                'errors' => [],
            ]);
    }
}
