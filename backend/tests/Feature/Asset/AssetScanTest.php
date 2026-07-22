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
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AssetScanTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create();
        $this->admin->assignRole('Super Administrator');
    }

    public function test_scan_endpoint_finds_asset_by_psa_qr_identifier(): void
    {
        $category = AssetCategory::factory()->create();
        $manufacturer = Manufacturer::factory()->create();
        $office = Office::factory()->create();
        $location = Location::factory()->create();

        $asset = Asset::factory()->create([
            'asset_number' => 'AST-001',
            'name' => 'Test Asset',
            'asset_category_id' => $category->id,
            'manufacturer_id' => $manufacturer->id,
            'office_id' => $office->id,
            'location_id' => $location->id,
            'status' => AssetStatus::AVAILABLE->value,
            'condition_status' => ConditionStatus::GOOD->value,
        ]);

        // Manually create the PSA QR identifier as the service would
        $psaQrIdentifier = 'PSA-ASSET-'.str_pad((string) $asset->id, 6, '0', STR_PAD_LEFT);
        $asset->identifiers()->create([
            'identifier_type' => 'PSA_QR',
            'identifier_value' => $psaQrIdentifier,
            'is_primary' => true,
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/assets/scan?value='.$psaQrIdentifier);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $asset->id,
                    'asset_number' => 'AST-001',
                    'name' => 'Test Asset',
                ]
            ]);
    }

    public function test_scan_endpoint_returns_404_for_nonexistent_identifier(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/assets/scan?value=PSA-ASSET-PREST999');

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'Asset not found for the given identifier.'
            ]);
    }

    public function test_scan_endpoint_validates_required_value_parameter(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/assets/scan');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['value']);
    }

    public function test_scan_endpoint_validates_max_length(): void
    {
        $longValue = str_repeat('A', 256);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/assets/scan?value='.$longValue);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['value']);
    }

    public function test_scan_endpoint_trims_whitespace(): void
    {
        $category = AssetCategory::factory()->create();
        $office = Office::factory()->create();

        $asset = Asset::factory()->create([
            'asset_number' => 'AST-002',
            'name' => 'Test Asset 2',
            'asset_category_id' => $category->id,
            'office_id' => $office->id,
        ]);

        // Manually create the PSA QR identifier as the service would
        $psaQrIdentifier = 'PSA-ASSET-'.str_pad((string) $asset->id, 6, '0', STR_PAD_LEFT);
        $asset->identifiers()->create([
            'identifier_type' => 'PSA_QR',
            'identifier_value' => $psaQrIdentifier,
            'is_primary' => true,
        ]);

        $identifierWithSpaces = '  '.$psaQrIdentifier.'  ';

        $response = $this->actingAs($this->admin)
            ->getJson('/api/v1/assets/scan?value='.urlencode($identifierWithSpaces));

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $asset->id,
                ]
            ]);
    }
}
