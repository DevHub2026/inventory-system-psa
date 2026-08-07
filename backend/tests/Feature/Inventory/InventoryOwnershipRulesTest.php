<?php

namespace Tests\Feature\Inventory;

use App\Models\User;
use App\Modules\Asset\Models\Asset;
use App\Modules\Asset\Models\Manufacturer;
use App\Modules\Asset\Models\Office;
use App\Modules\Asset\Models\Location;
use App\Modules\AssetCategory\Models\AssetCategory;
use App\Modules\Inventory\Models\InventoryItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Tests for the final Inventory vs Asset ownership rules:
 *
 *  - condition_status and property_number are PROHIBITED in Inventory API
 *  - model, description, asset_category_id ARE accepted in Inventory API
 *  - Creating a PPE item creates a linked asset using the inventory's
 *    initial office/location/manufacturer
 *  - Editing office/location on an existing inventory item does NOT
 *    overwrite the linked asset's current office/location (sync bug fix)
 *  - model/description/asset_category_id edits ARE synced to the linked asset
 *  - Supply items do not create assets; borrowable is forced false
 *  - InventoryItem.assetCategory relationship works
 *  - Unit of measure FK is stored correctly
 */
class InventoryOwnershipRulesTest extends TestCase
{
    use RefreshDatabase;

    private function adminToken(): array
    {
        $user  = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        return [$user, $token];
    }

    // ── condition_status is PROHIBITED ───────────────────────────────────────

    public function test_condition_status_is_prohibited_in_inventory_create(): void
    {
        [, $token] = $this->adminToken();

        $response = $this->withToken($token)->postJson('/api/v1/inventory', [
            'name'             => 'Test Laptop',
            'sku'              => 'TEST-COND-001',
            'quantity'         => 1,
            'classification'   => 'PPE',
            'condition_status' => 'GOOD',  // ASSET-OWNED — must be rejected
        ]);

        $response->assertStatus(422);
        $this->assertArrayHasKey('condition_status', $response->json('errors'));
    }

    public function test_condition_status_is_prohibited_in_inventory_update(): void
    {
        [, $token] = $this->adminToken();

        $item = $this->withToken($token)->postJson('/api/v1/inventory', [
            'name' => 'Laptop', 'sku' => 'TEST-COND-UPD', 'quantity' => 1, 'classification' => 'PPE',
        ])->assertCreated()->decodeResponseJson()['data'];

        $response = $this->withToken($token)->putJson('/api/v1/inventory/' . $item['id'], [
            'condition_status' => 'DAMAGED',
        ]);

        $response->assertStatus(422);
        $this->assertArrayHasKey('condition_status', $response->json('errors'));
    }

    // ── property_number is PROHIBITED ────────────────────────────────────────

    public function test_property_number_is_prohibited_in_inventory_create(): void
    {
        [, $token] = $this->adminToken();

        $response = $this->withToken($token)->postJson('/api/v1/inventory', [
            'name'            => 'Test Laptop',
            'sku'             => 'TEST-PROP-001',
            'quantity'        => 1,
            'classification'  => 'PPE',
            'property_number' => 'PSA-001',  // ASSET-OWNED — must be rejected
        ]);

        $response->assertStatus(422);
        $this->assertArrayHasKey('property_number', $response->json('errors'));
    }

    // ── model, description, asset_category_id ARE accepted ───────────────────

    public function test_model_description_asset_category_accepted_in_create(): void
    {
        [, $token] = $this->adminToken();

        $category = AssetCategory::query()->firstOrCreate(
            ['code' => 'LAPTOP'],
            ['name' => 'Laptop', 'is_active' => true],
        );

        $response = $this->withToken($token)->postJson('/api/v1/inventory', [
            'name'             => 'Laptop EB-X1 001',
            'sku'              => 'LAP-MDL-001',
            'quantity'         => 1,
            'classification'   => 'PPE',
            'model'            => 'ThinkPad X1 Carbon',
            'description'      => 'Office laptop for engineering.',
            'asset_category_id' => $category->id,
            'track_as_asset'   => true,
        ]);

        $response->assertCreated();

        $this->assertDatabaseHas('inventory_items', [
            'sku'              => 'LAP-MDL-001',
            'model'            => 'ThinkPad X1 Carbon',
            'description'      => 'Office laptop for engineering.',
            'asset_category_id' => $category->id,
        ]);
    }

    // ── Initial office/location are used when creating the linked asset ───────

    public function test_initial_office_and_location_used_when_creating_linked_asset(): void
    {
        [, $token] = $this->adminToken();

        $office = Office::query()->firstOrCreate(['code' => 'MAIN'], [
            'name' => 'Main Office', 'is_active' => true,
        ]);
        $location = Location::query()->firstOrCreate(['code' => 'ROOM1'], [
            'name' => 'Room 101', 'office_id' => $office->id, 'is_active' => true,
        ]);

        $response = $this->withToken($token)->postJson('/api/v1/inventory', [
            'name'           => 'Printer HP-001',
            'sku'            => 'PRT-OFFICE-001',
            'quantity'       => 1,
            'classification' => 'PPE',
            'office_id'      => $office->id,
            'location_id'    => $location->id,
            'track_as_asset' => true,
        ]);

        $response->assertCreated();
        $assetId = $response->json('data.asset_id');
        $this->assertNotNull($assetId);

        $asset = Asset::query()->findOrFail($assetId);
        $this->assertSame($office->id, $asset->office_id);
        $this->assertSame($location->id, $asset->location_id);
    }

    // ── Editing office/location in Inventory does NOT move existing asset ─────

    public function test_editing_office_in_inventory_does_not_overwrite_asset_office(): void
    {
        [, $token] = $this->adminToken();

        $originalOffice = Office::query()->firstOrCreate(['code' => 'ORIG'], [
            'name' => 'Original Office', 'is_active' => true,
        ]);
        $newOffice = Office::query()->firstOrCreate(['code' => 'NEW'], [
            'name' => 'New Office', 'is_active' => true,
        ]);

        // Create item with original office
        $created = $this->withToken($token)->postJson('/api/v1/inventory', [
            'name'           => 'Server UPS',
            'sku'            => 'UPS-SYNC-001',
            'quantity'       => 1,
            'classification' => 'PPE',
            'office_id'      => $originalOffice->id,
            'track_as_asset' => true,
        ])->assertCreated()->decodeResponseJson()['data'];

        $assetId = $created['asset_id'];
        $itemId  = $created['id'];

        // Manually move the asset to a different office (simulating a transfer)
        Asset::query()->where('id', $assetId)->update(['office_id' => $newOffice->id]);

        // Edit the inventory item's office_id
        $this->withToken($token)->putJson("/api/v1/inventory/{$itemId}", [
            'office_id' => $originalOffice->id,  // change back on inventory side
        ])->assertOk();

        // Asset's office should remain at $newOffice — inventory edit must NOT overwrite it
        $asset = Asset::query()->findOrFail($assetId);
        $this->assertSame(
            $newOffice->id,
            $asset->office_id,
            'Editing office_id on the inventory item must not overwrite the asset\'s current office.',
        );
    }

    // ── Editing model/description/category DOES sync to the linked asset ─────

    public function test_editing_model_syncs_to_linked_asset(): void
    {
        [, $token] = $this->adminToken();

        $created = $this->withToken($token)->postJson('/api/v1/inventory', [
            'name'           => 'Monitor Dell 001',
            'sku'            => 'MON-SYNC-001',
            'quantity'       => 1,
            'classification' => 'PPE',
            'model'          => 'Original Model',
            'track_as_asset' => true,
        ])->assertCreated()->decodeResponseJson()['data'];

        $this->withToken($token)->putJson('/api/v1/inventory/' . $created['id'], [
            'model' => 'Updated Model P2722H',
        ])->assertOk();

        // The linked asset's model should be updated
        $asset = Asset::query()->findOrFail($created['asset_id']);
        $this->assertSame('Updated Model P2722H', $asset->model);

        // The inventory item's model should also be updated
        $this->assertDatabaseHas('inventory_items', [
            'id'    => $created['id'],
            'model' => 'Updated Model P2722H',
        ]);
    }

    // ── Supply items: no asset created, is_borrowable forced false ───────────

    public function test_supply_item_does_not_create_linked_asset(): void
    {
        [, $token] = $this->adminToken();

        $response = $this->withToken($token)->postJson('/api/v1/inventory', [
            'name'           => 'Bond Paper A4',
            'sku'            => 'PAP-SUPPLY-001',
            'quantity'       => 100,
            'classification' => 'SUPPLY',
        ]);

        $response->assertCreated();
        $this->assertNull($response->json('data.asset_id'));
        $this->assertFalse((bool) $response->json('data.is_borrowable'));
    }

    // ── Asset API still rejects inventory-owned fields ───────────────────────

    public function test_asset_update_still_rejects_inventory_owned_fields(): void
    {
        [, $token] = $this->adminToken();

        $created = $this->withToken($token)->postJson('/api/v1/inventory', [
            'name'           => 'Scanner Canon 001',
            'sku'            => 'SCN-LOCK-001',
            'quantity'       => 1,
            'classification' => 'PPE',
            'track_as_asset' => true,
        ])->assertCreated()->decodeResponseJson()['data'];

        $assetId = $created['asset_id'];
        $this->assertNotNull($assetId);

        // Attempt to change the asset's name via the Asset API — must be rejected
        $this->withToken($token)
            ->putJson("/api/v1/assets/{$assetId}", ['name' => 'Hijacked Name'])
            ->assertStatus(422);

        // Asset name must remain unchanged
        $asset = Asset::query()->findOrFail($assetId);
        $this->assertSame('Scanner Canon 001', $asset->name);
    }

    // ── Export does not contain condition column ──────────────────────────────

    public function test_inventory_export_does_not_include_condition_column(): void
    {
        [, $token] = $this->adminToken();

        InventoryItem::query()->create([
            'name' => 'Export Test Item', 'sku' => 'EXP-COND-001',
            'quantity' => 1, 'classification' => 'PPE',
        ]);

        $response = $this->withToken($token)->get('/api/v1/inventory/export/download');
        $response->assertOk();

        // The binary content should not contain the word "Condition" as a column header
        // (it's now an asset-owned field not exported from inventory)
        $content = $response->getContent();
        $this->assertStringNotContainsString('Condition', substr($content, 0, 2000));
    }

    // ── API response does not include condition_status ────────────────────────

    public function test_inventory_list_response_does_not_expose_condition_status(): void
    {
        [, $token] = $this->adminToken();

        $this->withToken($token)->postJson('/api/v1/inventory', [
            'name' => 'Condition Test', 'sku' => 'COND-RESP-001',
            'quantity' => 1, 'classification' => 'PPE',
        ])->assertCreated();

        $response = $this->withToken($token)->getJson('/api/v1/inventory');
        $response->assertOk();

        $firstItem = $response->json('data.items.0');
        $this->assertArrayNotHasKey(
            'condition_status',
            $firstItem,
            'condition_status must not appear in the Inventory API response — it belongs to the Asset.'
        );
    }

    // ── Asset Category relationship on InventoryItem ──────────────────────────

    public function test_inventory_item_asset_category_relationship(): void
    {
        [, $token] = $this->adminToken();

        $category = AssetCategory::query()->firstOrCreate(
            ['code' => 'IT-EQ'],
            ['name' => 'IT Equipment', 'is_active' => true],
        );

        $response = $this->withToken($token)->postJson('/api/v1/inventory', [
            'name'             => 'Keyboard',
            'sku'              => 'KB-CAT-001',
            'quantity'         => 1,
            'classification'   => 'SE',
            'asset_category_id' => $category->id,
        ]);

        $response->assertCreated();
        $this->assertSame($category->id, $response->json('data.asset_category_id'));
        $this->assertSame('IT Equipment', $response->json('data.asset_category_name'));
    }

    // ── Manufacturer FK is stored and returned correctly ─────────────────────

    public function test_manufacturer_id_is_stored_and_returned(): void
    {
        [, $token] = $this->adminToken();

        $manufacturer = Manufacturer::query()->firstOrCreate(
            ['name' => 'Lenovo', 'code' => 'LENOVO'],
            ['is_active' => true],
        );

        $response = $this->withToken($token)->postJson('/api/v1/inventory', [
            'name'            => 'ThinkPad Laptop 001',
            'sku'             => 'LAP-MFR-001',
            'quantity'        => 1,
            'classification'  => 'PPE',
            'manufacturer_id' => $manufacturer->id,
        ]);

        $response->assertCreated();
        $this->assertSame($manufacturer->id, $response->json('data.manufacturer_id'));
        $this->assertSame('Lenovo', $response->json('data.manufacturer_name'));
    }
}
