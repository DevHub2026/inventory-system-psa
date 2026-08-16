<?php

namespace Tests\Feature\Asset;

use App\Models\Asset;
use App\Models\AssetCategory;
use App\Models\Manufacturer;
use App\Models\Office;
use App\Models\Location;
use App\Models\User;
use App\Modules\Asset\Enums\AssetStatus;
use App\Modules\Asset\Enums\ConditionStatus;
use App\Modules\Asset\Enums\IdentifierType;
use App\Modules\AssetIdentifier\Models\AssetIdentifier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
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
        $this->regularUser->roles()->detach();
    }

    public function test_admin_can_list_assets(): void
    {
        Asset::factory()->count(5)->create();

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/assets');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'items',
                    'meta' => [
                        'current_page',
                        'per_page',
                        'total',
                    ],
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
            'condition_status' => ConditionStatus::GOOD->value,
        ];

        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/assets', $assetData);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Asset created successfully.'
            ]);

        $this->assertDatabaseHas('assets', [
            'asset_number' => 'AST-001',
            'name' => 'Test Asset',
        ]);
    }

    public function test_admin_can_view_asset(): void
    {
        $asset = Asset::factory()->create([
            'asset_number' => 'AST-100',
            'property_number' => 'PROP-100',
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson("/api/v1/assets/{$asset->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $asset->id,
                    'asset_number' => $asset->asset_number,
                    'property_number' => $asset->property_number,
                ]
            ]);
    }

    public function test_asset_search_matches_property_number_without_copying_asset_number(): void
    {
        $matching = Asset::factory()->create([
            'asset_number' => 'AST-SEARCH-1',
            'property_number' => 'PROP-SEARCH-1',
            'name' => 'Searchable Asset',
        ]);

        Asset::factory()->create([
            'asset_number' => 'AST-SEARCH-2',
            'property_number' => null,
            'name' => 'Different Asset',
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/assets?search=PROP-SEARCH-1');

        $response->assertOk();
        $this->assertCount(1, $response->json('data.items'));
        $this->assertSame($matching->id, $response->json('data.items.0.id'));
        $this->assertSame('AST-SEARCH-1', $response->json('data.items.0.asset_number'));
        $this->assertSame('PROP-SEARCH-1', $response->json('data.items.0.property_number'));
    }

    public function test_asset_update_cannot_set_workflow_owned_statuses_manually(): void
    {
        $asset = Asset::factory()->create([
            'status' => AssetStatus::AVAILABLE->value,
        ]);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/v1/assets/{$asset->id}", [
                'status' => AssetStatus::BORROWED->value,
            ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('cannot be set manually', (string) $response->json('message'));
        $this->assertDatabaseHas('assets', [
            'id' => $asset->id,
            'status' => AssetStatus::AVAILABLE->value,
        ]);
    }

    public function test_admin_can_update_asset(): void
    {
        $asset = Asset::factory()->create();

        // Only asset-operational fields are accepted via the update endpoint.
        // Inventory-owned fields (name, description, model, etc.) must be
        // changed through the Inventory module.
        $response = $this->actingAs($this->admin)
            ->putJson("/api/v1/assets/{$asset->id}", [
                'status'           => AssetStatus::MAINTENANCE->value,
                'condition_status' => 'GOOD',
                'remarks'          => 'Sent for annual servicing.',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Asset updated successfully.',
            ]);

        $this->assertDatabaseHas('assets', [
            'id'               => $asset->id,
            'status'           => AssetStatus::MAINTENANCE->value,
            'condition_status' => 'GOOD',
        ]);
    }

    public function test_asset_update_rejects_inventory_owned_fields(): void
    {
        $asset = Asset::factory()->create(['name' => 'Original Name']);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/v1/assets/{$asset->id}", [
                'name'        => 'Attempted Override',
                'description' => 'Attempted override',
            ]);

        $response->assertStatus(422);

        // The name in the database must not have changed
        $this->assertDatabaseHas('assets', [
            'id'   => $asset->id,
            'name' => 'Original Name',
        ]);
    }

    public function test_admin_can_delete_asset(): void
    {
        $asset = Asset::factory()->create();

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/v1/assets/{$asset->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Asset archived successfully.'
            ]);

        $this->assertSoftDeleted('assets', [
            'id' => $asset->id,
        ]);
    }

    public function test_regular_user_cannot_create_asset(): void
    {
        $category = AssetCategory::factory()->create();
        $office = Office::factory()->create();

        $assetData = [
            'asset_number' => 'AST-002',
            'name' => 'Test Asset',
            'asset_category_id' => $category->id,
            'office_id' => $office->id,
        ];

        $response = $this->actingAs($this->regularUser)
            ->postJson('/api/v1/assets', $assetData);

        $response->assertStatus(403);
    }

    public function test_search_assets_by_name(): void
    {
        Asset::factory()->create(['name' => 'Laptop']);
        Asset::factory()->create(['name' => 'Desktop']);
        Asset::factory()->create(['name' => 'Monitor']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/assets?search=Laptop');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data.items'));
    }

    public function test_filter_assets_by_status(): void
    {
        Asset::factory()->create(['status' => AssetStatus::AVAILABLE->value]);
        Asset::factory()->create(['status' => AssetStatus::BORROWED->value]);
        Asset::factory()->create(['status' => AssetStatus::MAINTENANCE->value]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/assets?status='.AssetStatus::AVAILABLE->value);

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data.items'));
    }

    public function test_scan_resolves_unpadded_psa_asset_qr_to_stored_identifier(): void
    {
        $asset = Asset::factory()->create(['id' => 125]);
        AssetIdentifier::create([
            'asset_id' => $asset->id,
            'identifier_type' => IdentifierType::PSA_QR->value,
            'identifier_value' => 'PSA-ASSET-000125',
            'is_primary' => true,
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/assets/scan?value=PSA-ASSET-125');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $asset->id,
                    'psa_qr_identifier' => 'PSA-ASSET-000125',
                ],
            ]);
    }

    public function test_asset_number_must_be_unique(): void
    {
        Asset::factory()->create(['asset_number' => 'AST-001']);

        $assetData = [
            'asset_number' => 'AST-001',
            'name' => 'Test Asset',
        ];

        $response = $this->actingAs($this->admin)
            ->postJson('/api/v1/assets', $assetData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['asset_number']);
    }

    public function test_admin_can_upload_and_download_asset_attachment(): void
    {
        Storage::fake('local');
        $asset = Asset::factory()->create();
        $file = UploadedFile::fake()->image('asset-photo.jpg', 640, 480);

        $attachmentId = $this->actingAs($this->admin)
            ->postJson("/api/v1/assets/{$asset->id}/attachments", [
                'file' => $file,
                'description' => 'Front view',
            ])
            ->assertCreated()
            ->assertJsonPath('data.kind', 'image')
            ->json('data.id');

        $attachment = \App\Modules\Asset\Models\AssetAttachment::query()->findOrFail($attachmentId);
        Storage::disk('local')->assertExists($attachment->path);

        $this->actingAs($this->admin)
            ->get("/api/v1/assets/{$asset->id}/attachments/{$attachmentId}/download")
            ->assertOk();
    }

    public function test_regular_user_cannot_upload_asset_attachment(): void
    {
        Storage::fake('local');
        $asset = Asset::factory()->create();

        $this->actingAs($this->regularUser)
            ->postJson("/api/v1/assets/{$asset->id}/attachments", [
                'file' => UploadedFile::fake()->image('asset-photo.jpg'),
            ])
            ->assertStatus(403);
    }
}
