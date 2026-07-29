<?php

namespace Tests\Feature\QrScan;

use App\Models\User;
use App\Modules\Asset\Enums\AssetStatus;
use App\Modules\Asset\Models\Asset;
use App\Modules\Asset\Models\Location;
use App\Modules\Asset\Models\Manufacturer;
use App\Modules\Asset\Models\Office;
use App\Modules\AssetCategory\Models\AssetCategory;
use App\Modules\AssetIdentifier\Models\AssetIdentifier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QrScanTest extends TestCase
{
    use RefreshDatabase;

    private User $employee;
    private string $employeeToken;
    private Asset $asset;

    protected function setUp(): void
    {
        parent::setUp();

        $this->employee = User::factory()->create();
        $this->employeeToken = $this->employee->createToken('auth')->plainTextToken;

        $office = Office::create(['name' => 'HQ Office', 'code' => 'HQ', 'description' => 'HQ']);
        $location = Location::create(['office_id' => $office->id, 'name' => 'Room 101', 'code' => 'R101', 'description' => 'R101']);
        $category = AssetCategory::create(['name' => 'Laptop', 'code' => 'LAP', 'description' => 'Laptop']);
        $manufacturer = Manufacturer::create(['name' => 'Dell', 'code' => 'DEL', 'description' => 'Dell']);

        $this->asset = Asset::create([
            'asset_number'      => 'AST-9999',
            'name'              => 'Employee Test Laptop',
            'description'       => 'Test QR asset',
            'asset_category_id' => $category->id,
            'manufacturer_id'   => $manufacturer->id,
            'office_id'         => $office->id,
            'location_id'       => $location->id,
            'model'             => 'Latitude 5420',
            'status'            => AssetStatus::AVAILABLE->value,
            'condition_status'  => 'GOOD',
            'purchase_date'     => '2026-01-01',
            'purchase_cost'     => 1500.00,
        ]);

        AssetIdentifier::create([
            'asset_id'         => $this->asset->id,
            'identifier_type'  => 'PSA_QR',
            'identifier_value' => 'PSA-ASSET-009999',
            'is_primary'        => true,
        ]);
    }

    public function test_authenticated_user_can_resolve_asset_by_qr_code(): void
    {
        $response = $this->withToken($this->employeeToken)
            ->getJson('/api/v1/qr/asset/PSA-ASSET-009999');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data'    => [
                    'asset' => [
                        'id'           => $this->asset->id,
                        'name'         => 'Employee Test Laptop',
                        'asset_number' => 'AST-9999',
                        'status'       => 'AVAILABLE',
                    ],
                    'actions' => [
                        'can_request_borrow' => true,
                    ],
                ],
            ]);

        $this->assertDatabaseHas('qr_scan_histories', [
            'asset_id'         => $this->asset->id,
            'user_id'          => $this->employee->id,
            'action_performed' => 'VIEW',
        ]);
    }

    public function test_unrecognized_qr_code_returns_404(): void
    {
        $response = $this->withToken($this->employeeToken)
            ->getJson('/api/v1/qr/asset/PSA-ASSET-INVALID');

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'No asset found for the provided QR code.',
            ]);
    }

    public function test_employee_can_record_scan_action(): void
    {
        $response = $this->withToken($this->employeeToken)
            ->postJson('/api/v1/qr/scan-action', [
                'asset_id'        => $this->asset->id,
                'action_performed' => 'BORROW_REQUESTED',
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('qr_scan_histories', [
            'asset_id'         => $this->asset->id,
            'user_id'          => $this->employee->id,
            'action_performed' => 'BORROW_REQUESTED',
        ]);
    }

    public function test_employee_can_view_own_scan_history(): void
    {
        $this->withToken($this->employeeToken)
            ->getJson('/api/v1/qr/asset/PSA-ASSET-009999');

        $response = $this->withToken($this->employeeToken)
            ->getJson('/api/v1/qr/my-history');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);
    }

    public function test_resolving_asset_with_structured_pipe_payload_and_scan_source(): void
    {
        $response = $this->withToken($this->employeeToken)
            ->getJson('/api/v1/qr/asset/PSA-RES-7%7CPSA-ASSET-009999%7C3?scan_source=assets_page_scanner');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'asset' => [
                        'id' => $this->asset->id,
                    ],
                ],
            ]);

        $this->assertDatabaseHas('qr_scan_histories', [
            'asset_id' => $this->asset->id,
            'user_id' => $this->employee->id,
            'scan_source' => 'assets_page_scanner',
        ]);
    }

    public function test_resolving_asset_with_direct_asset_number(): void
    {
        $response = $this->withToken($this->employeeToken)
            ->getJson('/api/v1/qr/asset/AST-9999?scan_source=sidebar_scanner');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'asset' => [
                        'id' => $this->asset->id,
                    ],
                ],
            ]);

        $this->assertDatabaseHas('qr_scan_histories', [
            'asset_id' => $this->asset->id,
            'user_id' => $this->employee->id,
            'scan_source' => 'sidebar_scanner',
        ]);
    }
}
