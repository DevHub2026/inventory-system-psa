<?php

namespace Tests\Feature\Report;

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

class ReportApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_get_asset_report(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $this->createAsset('AVAILABLE', 1);
        $this->createAsset('BORROWED', 2);

        $response = $this->withToken($token)
            ->getJson('/api/v1/reports/assets');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Asset report generated successfully.',
            ]);

        $data = $response->json('data');
        $this->assertCount(2, $data);
    }

    public function test_authenticated_user_can_filter_asset_report_by_status(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $this->createAsset('AVAILABLE', 1);
        $this->createAsset('BORROWED', 2);

        $response = $this->withToken($token)
            ->getJson('/api/v1/reports/assets?status=AVAILABLE');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Asset report generated successfully.',
            ]);

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('AVAILABLE', $data[0]['status']);
    }

    public function test_authenticated_user_can_get_borrowing_report(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $asset = $this->createAsset('AVAILABLE', 1);

        Borrowing::create([
            'user_id' => $user->id,
            'asset_id' => $asset->id,
            'borrow_date' => now()->subDays(5),
            'due_date' => now()->addDays(5),
            'status' => 'BORROWED',
        ]);

        $response = $this->withToken($token)
            ->getJson('/api/v1/reports/borrowings');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Borrowing report generated successfully.',
            ]);

        $data = $response->json('data');
        $this->assertCount(1, $data);
    }

    public function test_authenticated_user_can_get_reservation_report(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $asset = $this->createAsset('AVAILABLE', 1);

        $reservation = Reservation::create([
            'user_id' => $user->id,
            'status' => 'PENDING',
            'start_date' => now()->addDay(),
            'end_date' => now()->addDays(3),
        ]);

        $reservation->assets()->sync([$asset->id]);

        $response = $this->withToken($token)
            ->getJson('/api/v1/reports/reservations');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Reservation report generated successfully.',
            ]);

        $data = $response->json('data');
        $this->assertCount(1, $data);
    }

    public function test_authenticated_user_can_get_inventory_report(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        InventoryItem::create([
            'name' => 'Printer Paper',
            'sku' => 'PP-001',
            'quantity' => 10,
            'unit' => 'ream',
            'reorder_level' => 5,
        ]);

        $response = $this->withToken($token)
            ->getJson('/api/v1/reports/inventory');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Inventory report generated successfully.',
            ]);

        $data = $response->json('data');
        $this->assertCount(1, $data);
    }

    public function test_authenticated_user_can_get_overdue_report(): void
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

        $response = $this->withToken($token)
            ->getJson('/api/v1/reports/overdue');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Overdue items report generated successfully.',
            ]);

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertArrayHasKey('days_overdue', $data[0]);
    }

    public function test_authenticated_user_can_get_low_stock_report(): void
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
            ->getJson('/api/v1/reports/low-stock');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Low stock report generated successfully.',
            ]);

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('Printer Paper', $data[0]['name']);
    }

    public function test_authenticated_user_can_get_user_activity_report(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $asset = $this->createAsset('AVAILABLE', 1);

        Borrowing::create([
            'user_id' => $user->id,
            'asset_id' => $asset->id,
            'borrow_date' => now()->subDays(5),
            'due_date' => now()->addDays(5),
            'status' => 'BORROWED',
        ]);

        $response = $this->withToken($token)
            ->getJson('/api/v1/reports/user-activity');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'User activity report generated successfully.',
            ]);

        $data = $response->json('data');
        $this->assertCount(1, $data);
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
