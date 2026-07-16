<?php

namespace Tests\Feature\Maintenance;

use App\Models\User;
use App\Modules\Asset\Models\Asset;
use App\Modules\Asset\Models\Location;
use App\Modules\Asset\Models\Manufacturer;
use App\Modules\Asset\Models\Office;
use App\Modules\AssetCategory\Models\AssetCategory;
use App\Modules\Maintenance\Models\Maintenance;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MaintenanceApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_create_maintenance(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $asset = $this->createAsset('AVAILABLE', 1);

        $response = $this->withToken($token)
            ->postJson('/api/v1/maintenances', [
                'asset_id' => $asset->id,
                'type' => 'corrective',
                'status' => 'scheduled',
                'scheduled_date' => now()->addDays(5)->format('Y-m-d'),
                'description' => 'Fix broken screen',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Maintenance created successfully.',
            ]);

        $this->assertDatabaseHas('maintenances', [
            'asset_id' => $asset->id,
            'type' => 'corrective',
            'status' => 'scheduled',
        ]);
    }

    public function test_authenticated_user_can_list_maintenances(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $asset = $this->createAsset('AVAILABLE', 1);

        Maintenance::create([
            'asset_id' => $asset->id,
            'type' => 'corrective',
            'status' => 'scheduled',
            'scheduled_date' => now()->addDays(5),
        ]);

        $response = $this->withToken($token)
            ->getJson('/api/v1/maintenances');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Maintenances retrieved successfully.',
            ]);

        $data = $response->json('data');
        $this->assertCount(1, $data);
    }

    public function test_authenticated_user_can_update_maintenance(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $asset = $this->createAsset('AVAILABLE', 1);

        $maintenance = Maintenance::create([
            'asset_id' => $asset->id,
            'type' => 'corrective',
            'status' => 'scheduled',
            'scheduled_date' => now()->addDays(5),
        ]);

        $response = $this->withToken($token)
            ->putJson('/api/v1/maintenances/'.$maintenance->id, [
                'status' => 'in_progress',
                'description' => 'Started repair',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Maintenance updated successfully.',
            ]);

        $this->assertDatabaseHas('maintenances', [
            'id' => $maintenance->id,
            'status' => 'in_progress',
        ]);
    }

    public function test_authenticated_user_can_delete_maintenance(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $asset = $this->createAsset('AVAILABLE', 1);

        $maintenance = Maintenance::create([
            'asset_id' => $asset->id,
            'type' => 'corrective',
            'status' => 'scheduled',
            'scheduled_date' => now()->addDays(5),
        ]);

        $response = $this->withToken($token)
            ->deleteJson('/api/v1/maintenances/'.$maintenance->id);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Maintenance deleted successfully.',
            ]);

        $this->assertSoftDeleted('maintenances', [
            'id' => $maintenance->id,
        ]);
    }

    public function test_authenticated_user_can_complete_maintenance(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $asset = $this->createAsset('AVAILABLE', 1);

        $maintenance = Maintenance::create([
            'asset_id' => $asset->id,
            'type' => 'corrective',
            'status' => 'in_progress',
            'scheduled_date' => now()->subDays(1),
        ]);

        $response = $this->withToken($token)
            ->postJson('/api/v1/maintenances/'.$maintenance->id.'/complete');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Maintenance completed successfully.',
            ]);

        $this->assertDatabaseHas('maintenances', [
            'id' => $maintenance->id,
            'status' => 'completed',
        ]);
    }

    public function test_authenticated_user_can_get_scheduled_maintenances(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $asset = $this->createAsset('AVAILABLE', 1);

        Maintenance::create([
            'asset_id' => $asset->id,
            'type' => 'corrective',
            'status' => 'scheduled',
            'scheduled_date' => now()->addDays(5),
        ]);

        Maintenance::create([
            'asset_id' => $asset->id,
            'type' => 'preventive',
            'status' => 'completed',
            'scheduled_date' => now()->subDays(5),
        ]);

        $response = $this->withToken($token)
            ->getJson('/api/v1/maintenances/scheduled');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Scheduled maintenances retrieved successfully.',
            ]);

        $data = $response->json('data');
        $this->assertCount(1, $data);
    }

    public function test_authenticated_user_can_get_overdue_maintenances(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $asset = $this->createAsset('AVAILABLE', 1);

        Maintenance::create([
            'asset_id' => $asset->id,
            'type' => 'corrective',
            'status' => 'scheduled',
            'scheduled_date' => now()->subDays(5),
        ]);

        Maintenance::create([
            'asset_id' => $asset->id,
            'type' => 'preventive',
            'status' => 'scheduled',
            'scheduled_date' => now()->addDays(5),
        ]);

        $response = $this->withToken($token)
            ->getJson('/api/v1/maintenances/overdue');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Overdue maintenances retrieved successfully.',
            ]);

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertArrayHasKey('days_overdue', $data[0]);
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
