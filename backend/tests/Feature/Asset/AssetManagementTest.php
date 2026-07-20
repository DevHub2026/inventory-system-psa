<?php

namespace Tests\Feature\Asset;

use App\Models\Asset;
use App\Models\AssetCategory;
use App\Models\Manufacturer;
use App\Models\Office;
use App\Models\Location;
use App\Models\User;
use App\Enums\AssetStatus;
use App\Enums\ConditionStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AssetManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $regularUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create();
        $this->admin->assignRole('Super Administrator');

        $this->regularUser = User::factory()->create();
    }

    public function test_admin_can_list_assets(): void
    {
        Asset::factory()->count(5)->create();

        $response = $this->actingAs($this->admin)
            ->getJson('/api/assets');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'data' => [],
                    'current_page',
                    'per_page',
                    'total'
                ]
            ]);
    }

    public function test_admin_can_create_asset(): void
    {
        $category = AssetCategory::factory()->create();
        $manufacturer = Manufacturer::factory()->create();
        $office = Office::factory()->create();
        $location = Location::factory()->create();

        $assetData = [
            'asset_number' => 'AST-001',
            'name' => 'Test Asset',
            'description' => 'Test description',
            'asset_category_id' => $category->id,
            'manufacturer_id' => $manufacturer->id,
            'office_id' => $office->id,
            'location_id' => $location->id,
            'model' => 'Model X',
            'serial_number' => 'SN12345',
            'purchase_date' => '2024-01-01',
            'purchase_cost' => 10000.00,
            'status' => AssetStatus::AVAILABLE->value,
            'condition' => ConditionStatus::GOOD->value,
        ];

        $response = $this->actingAs($this->admin)
            ->postJson('/api/assets', $assetData);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Asset created successfully'
            ]);

        $this->assertDatabaseHas('assets', [
            'asset_number' => 'AST-001',
            'name' => 'Test Asset',
        ]);
    }

    public function test_admin_can_view_asset(): void
    {
        $asset = Asset::factory()->create();

        $response = $this->actingAs($this->admin)
            ->getJson("/api/assets/{$asset->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $asset->id,
                    'asset_number' => $asset->asset_number,
                ]
            ]);
    }

    public function test_admin_can_update_asset(): void
    {
        $asset = Asset::factory()->create();

        $updateData = [
            'name' => 'Updated Asset Name',
            'description' => 'Updated description',
            'status' => AssetStatus::MAINTENANCE->value,
        ];

        $response = $this->actingAs($this->admin)
            ->putJson("/api/assets/{$asset->id}", $updateData);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Asset updated successfully'
            ]);

        $this->assertDatabaseHas('assets', [
            'id' => $asset->id,
            'name' => 'Updated Asset Name',
        ]);
    }

    public function test_admin_can_delete_asset(): void
    {
        $asset = Asset::factory()->create();

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/assets/{$asset->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Asset deleted successfully'
            ]);

        $this->assertSoftDeleted('assets', [
            'id' => $asset->id,
        ]);
    }

    public function test_regular_user_cannot_create_asset(): void
    {
        $assetData = [
            'asset_number' => 'AST-002',
            'name' => 'Test Asset',
        ];

        $response = $this->actingAs($this->regularUser)
            ->postJson('/api/assets', $assetData);

        $response->assertStatus(403);
    }

    public function test_search_assets_by_name(): void
    {
        Asset::factory()->create(['name' => 'Laptop']);
        Asset::factory()->create(['name' => 'Desktop']);
        Asset::factory()->create(['name' => 'Monitor']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/assets?search=Laptop');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data.data'));
    }

    public function test_filter_assets_by_status(): void
    {
        Asset::factory()->create(['status' => AssetStatus::AVAILABLE->value]);
        Asset::factory()->create(['status' => AssetStatus::BORROWED->value]);
        Asset::factory()->create(['status' => AssetStatus::MAINTENANCE->value]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/assets?status=available');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data.data'));
    }

    public function test_asset_number_must_be_unique(): void
    {
        Asset::factory()->create(['asset_number' => 'AST-001']);

        $assetData = [
            'asset_number' => 'AST-001',
            'name' => 'Test Asset',
        ];

        $response = $this->actingAs($this->admin)
            ->postJson('/api/assets', $assetData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['asset_number']);
    }
}
