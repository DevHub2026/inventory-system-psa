<?php

namespace Tests\Feature\Inventory;

use App\Models\User;
use App\Modules\Asset\Models\Asset;
use App\Modules\Asset\Models\Location;
use App\Modules\Asset\Models\Manufacturer;
use App\Modules\Asset\Models\Office;
use App\Modules\AssetCategory\Models\AssetCategory;
use App\Modules\Inventory\Models\InventoryItem;
use App\Modules\Inventory\Models\InventoryItemType;
use App\Modules\AssetIdentifier\Models\AssetIdentifier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryFilterSortTest extends TestCase
{
    use RefreshDatabase;

    private function createInventoryWithAsset(array $itemAttrs = [], array $assetAttrs = [], array $identifiers = []) : InventoryItem
    {
        $office = Office::firstOrCreate(['code' => 'OFF-1'], ['name' => 'Main Office', 'description' => '']);
        $location = Location::firstOrCreate(['code' => 'LOC-1'], ['office_id' => $office->id, 'name' => 'Storage', 'description' => '']);
        $category = AssetCategory::firstOrCreate(['code' => 'CAT-1'], ['name' => 'General', 'description' => '']);
        // Manufacturer table only enforces uniqueness on name; use name as lookup key in tests
        $manufacturer = Manufacturer::firstOrCreate(['name' => 'Acme'], ['description' => '']);

        $item = InventoryItem::create(array_merge([
            'name' => 'Test Item',
            'sku' => 'TI-'.uniqid(),
            'quantity' => 5,
            'unit' => 'pcs',
            'reorder_level' => 1,
            'classification' => 'PPE',
            'type' => 'non_expendable',
            'manufacturer_id' => $manufacturer->id,
            'asset_category_id' => $category->id,
            'office_id' => $office->id,
            'location_id' => $location->id,
        ], $itemAttrs));

        // create linked asset if needed
        $assetPayload = array_merge([
            'asset_number' => 'AST-'.uniqid(),
            'property_number' => 'PROP-'.uniqid(),
            'name' => $item->name,
            'asset_category_id' => $category->id,
            'office_id' => $office->id,
            'location_id' => $location->id,
            'manufacturer_id' => $manufacturer->id,
        ], $assetAttrs);

        $asset = Asset::create($assetPayload + ['is_active' => true, 'status' => 'AVAILABLE']);

        $item->update(['asset_id' => $asset->id]);

        foreach ($identifiers as $id) {
            AssetIdentifier::create([
                'asset_id' => $asset->id,
                'identifier_type' => $id['type'] ?? 'SERIAL_NUMBER',
                'identifier_value' => $id['value'],
            ]);
        }

        return $item->fresh('asset');
    }

    public function test_case_insensitive_name_search_matches_different_casing(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $this->createInventoryWithAsset(['name' => 'Laptop Pro'], [], []);

        $response = $this->withToken($token)->getJson('/api/v1/inventory?search=laptop');
        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data.items'));

        $response2 = $this->withToken($token)->getJson('/api/v1/inventory?search=LAPTOP');
        $response2->assertStatus(200);
        $this->assertCount(1, $response2->json('data.items'));
    }

    public function test_case_insensitive_asset_number_and_serial_search(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $item = $this->createInventoryWithAsset(['name' => 'Widget'], ['asset_number' => 'AST-XYZ-1'], [['type' => 'SERIAL_NUMBER', 'value' => 'SN-abc-123']]);

        $respA = $this->withToken($token)->getJson('/api/v1/inventory?search=ast-xyz');
        $respA->assertStatus(200);
        $this->assertCount(1, $respA->json('data.items'));

        $respB = $this->withToken($token)->getJson('/api/v1/inventory?search=sn-ABC');
        $respB->assertStatus(200);
        $this->assertCount(1, $respB->json('data.items'));
    }

    public function test_filters_office_location_manufacturer_and_assigned_user(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $secondUser = User::factory()->create();

        $item = $this->createInventoryWithAsset([], ['asset_number' => 'AST-1', 'issued_to_user_id' => $secondUser->id], []);

        $officeId = $item->office_id;
        $locationId = $item->location_id;
        $manufacturerId = $item->manufacturer_id;

        $resp = $this->withToken($token)->getJson('/api/v1/inventory?office_id='.$officeId.'&location_id='.$locationId.'&manufacturer_id='.$manufacturerId.'&assigned_user_id='.$secondUser->id);
        $resp->assertStatus(200);
        $this->assertCount(1, $resp->json('data.items'));
    }

    public function test_item_type_filter_matches_only_the_selected_inventory_type(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $laptopType = InventoryItemType::firstOrCreate(['name' => 'Laptop', 'code' => 'LAPTOP'], ['description' => 'Laptop type']);
        $monitorType = InventoryItemType::firstOrCreate(['name' => 'Monitor', 'code' => 'MONITOR'], ['description' => 'Monitor type']);

        $this->createInventoryWithAsset(['name' => 'Laptop Pro', 'item_type_id' => $laptopType->id], ['asset_number' => 'AST-LAP-1'], []);
        $this->createInventoryWithAsset(['name' => 'Monitor Pro', 'item_type_id' => $monitorType->id], ['asset_number' => 'AST-MON-1'], []);

        $response = $this->withToken($token)->getJson('/api/v1/inventory?item_type_id='.$laptopType->id.'&per_page=10');
        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data.items'));
        $this->assertSame('Laptop Pro', $response->json('data.items.0.name'));
    }

    public function test_sorting_name_asc_and_invalid_order_by_falls_back(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $this->createInventoryWithAsset(['name' => 'Alpha Item'], ['asset_number' => 'A-1'], []);
        $this->createInventoryWithAsset(['name' => 'Beta Item'], ['asset_number' => 'B-1'], []);

        $r = $this->withToken($token)->getJson('/api/v1/inventory?order_by=name&order_dir=ASC&per_page=10');
        $r->assertStatus(200);
        $items = $r->json('data.items');
        $this->assertEquals('Alpha Item', $items[0]['name']);

        // invalid order_by should fallback to created_at DESC (both created close together so ensure it returns 2)
        $r2 = $this->withToken($token)->getJson('/api/v1/inventory?order_by=nonexistent&per_page=10');
        $r2->assertStatus(200);
        $this->assertCount(2, $r2->json('data.items'));
    }
}
