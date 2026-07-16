<?php

namespace Tests\Feature\Dashboard;

use App\Models\User;
use App\Modules\Asset\Models\Asset;
use App\Modules\Asset\Models\Location;
use App\Modules\Asset\Models\Manufacturer;
use App\Modules\Asset\Models\Office;
use App\Modules\AssetCategory\Models\AssetCategory;
use App\Modules\Borrowing\Models\Borrowing;
use App\Modules\Inventory\Models\InventoryItem;
use App\Modules\Reservation\Models\Reservation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_get_dashboard_stats(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $this->createAsset('AVAILABLE', 1);
        $this->createAsset('BORROWED', 2);
        $this->createAsset('RESERVED', 3);
        $this->createAsset('MAINTENANCE', 4);

        $response = $this->withToken($token)
            ->getJson('/api/v1/dashboard/stats');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Dashboard statistics retrieved successfully.',
            ]);

        $data = $response->json('data');
        $this->assertEquals(4, $data['total_assets']);
        $this->assertEquals(1, $data['available']);
        $this->assertEquals(1, $data['borrowed']);
        $this->assertEquals(1, $data['reserved']);
        $this->assertEquals(1, $data['maintenance']);
    }

    public function test_authenticated_user_can_get_recent_activity(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $asset = $this->createAsset('AVAILABLE', 1);

        Borrowing::create([
            'user_id' => $user->id,
            'asset_id' => $asset->id,
            'borrow_date' => now()->subDays(2),
            'due_date' => now()->addDays(5),
            'status' => 'BORROWED',
        ]);

        Reservation::create([
            'user_id' => $user->id,
            'status' => 'PENDING',
            'start_date' => now()->addDay(),
            'end_date' => now()->addDays(3),
        ]);

        $response = $this->withToken($token)
            ->getJson('/api/v1/dashboard/recent-activity');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Recent activity retrieved successfully.',
            ]);

        $data = $response->json('data');
        $this->assertIsArray($data);
        $this->assertNotEmpty($data);
    }

    public function test_authenticated_user_can_get_low_stock_items(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        InventoryItem::create([
            'name' => 'Printer Paper',
            'sku' => 'PP-001',
            'quantity' => 3,
            'unit' => 'ream',
            'reorder_level' => 5,
        ]);

        InventoryItem::create([
            'name' => 'Toner Cartridge',
            'sku' => 'TC-001',
            'quantity' => 10,
            'unit' => 'piece',
            'reorder_level' => 5,
        ]);

        $response = $this->withToken($token)
            ->getJson('/api/v1/dashboard/low-stock');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Low stock items retrieved successfully.',
            ]);

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('Printer Paper', $data[0]['name']);
    }

    public function test_authenticated_user_can_get_overdue_assets(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $asset = $this->createAsset('AVAILABLE', 1);

        Borrowing::create([
            'user_id' => $user->id,
            'asset_id' => $asset->id,
            'borrow_date' => now()->subDays(10),
            'due_date' => now()->subDays(2),
            'status' => 'BORROWED',
        ]);

        Borrowing::create([
            'user_id' => $user->id,
            'asset_id' => $this->createAsset('AVAILABLE', 2)->id,
            'borrow_date' => now()->subDays(1),
            'due_date' => now()->addDays(5),
            'status' => 'BORROWED',
        ]);

        $response = $this->withToken($token)
            ->getJson('/api/v1/dashboard/overdue-assets');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Overdue assets retrieved successfully.',
            ]);

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertArrayHasKey('days_overdue', $data[0]);
        $this->assertGreaterThan(0, $data[0]['days_overdue']);
    }

    private function createAsset(string $status, int $uniqueId = 0): Asset
    {
        $office = Office::firstOrCreate(
            ['code' => 'MO-'.$uniqueId],
            [
                'name' => 'Main Office '.$uniqueId,
                'description' => 'Main office',
            ]
        );

        $location = Location::firstOrCreate(
            ['code' => 'SR-'.$uniqueId],
            [
                'office_id' => $office->id,
                'name' => 'Storage Room '.$uniqueId,
                'description' => 'Storage room',
            ]
        );

        $category = AssetCategory::firstOrCreate(
            ['code' => 'LAP-'.$uniqueId],
            [
                'name' => 'Laptop '.$uniqueId,
                'description' => 'Laptops',
            ]
        );

        $manufacturer = Manufacturer::firstOrCreate(
            ['code' => 'DEL-'.$uniqueId],
            [
                'name' => 'Dell '.$uniqueId,
                'description' => 'Dell computers',
            ]
        );

        return Asset::create([
            'asset_number' => 'AST-'.rand(1000, 9999).'-'.$uniqueId,
            'name' => 'Laptop 14-'.$uniqueId,
            'description' => 'Test asset',
            'asset_category_id' => $category->id,
            'manufacturer_id' => $manufacturer->id,
            'office_id' => $office->id,
            'location_id' => $location->id,
            'model' => 'Pro',
            'status' => $status,
            'condition_status' => 'GOOD',
            'purchase_date' => '2026-01-01',
            'purchase_cost' => 1200.00,
            'warranty_until' => '2027-01-01',
            'remarks' => 'Test asset',
        ]);
    }
}
