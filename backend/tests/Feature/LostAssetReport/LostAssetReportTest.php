<?php

namespace Tests\Feature\LostAssetReport;

use App\Models\User;
use App\Modules\Asset\Enums\AssetStatus;
use App\Modules\Asset\Models\Asset;
use App\Modules\Asset\Models\Location;
use App\Modules\Asset\Models\Manufacturer;
use App\Modules\Asset\Models\Office;
use App\Modules\AssetCategory\Models\AssetCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LostAssetReportTest extends TestCase
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
        $category = AssetCategory::create(['name' => 'Tablet', 'code' => 'TAB', 'description' => 'Tablet']);
        $manufacturer = Manufacturer::create(['name' => 'Apple', 'code' => 'APL', 'description' => 'Apple']);

        $this->asset = Asset::create([
            'asset_number'      => 'AST-8888',
            'name'              => 'Employee iPad',
            'description'       => 'Test lost asset',
            'asset_category_id' => $category->id,
            'manufacturer_id'   => $manufacturer->id,
            'office_id'         => $office->id,
            'location_id'       => $location->id,
            'model'             => 'iPad Pro',
            'status'            => AssetStatus::AVAILABLE->value,
            'condition_status'  => 'GOOD',
            'purchase_date'     => '2026-01-01',
            'purchase_cost'     => 999.00,
        ]);
    }

    public function test_employee_can_report_lost_asset(): void
    {
        $response = $this->withToken($this->employeeToken)
            ->postJson("/api/v1/assets/{$this->asset->id}/report-lost", [
                'description'         => 'Left on the conference table during annual meeting.',
                'last_known_location' => 'Conference Room B',
                'date_lost'           => '2026-07-28',
                'remarks'             => 'Searched the area twice with security.',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Lost asset report submitted successfully.',
            ]);

        $this->assertDatabaseHas('lost_asset_reports', [
            'asset_id'    => $this->asset->id,
            'reporter_id' => $this->employee->id,
            'status'      => 'PENDING',
        ]);
    }

    public function test_employee_can_list_own_lost_reports(): void
    {
        $this->withToken($this->employeeToken)
            ->postJson("/api/v1/assets/{$this->asset->id}/report-lost", [
                'description' => 'Missing after field assignment in Cebu office.',
            ]);

        $response = $this->withToken($this->employeeToken)
            ->getJson('/api/v1/lost-asset-reports/mine');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);
    }
}
