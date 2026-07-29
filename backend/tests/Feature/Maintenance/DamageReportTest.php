<?php

namespace Tests\Feature\Maintenance;

use App\Models\User;
use App\Modules\Asset\Enums\AssetStatus;
use App\Modules\Asset\Models\Asset;
use App\Modules\Asset\Models\Location;
use App\Modules\Asset\Models\Manufacturer;
use App\Modules\Asset\Models\Office;
use App\Modules\AssetCategory\Models\AssetCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DamageReportTest extends TestCase
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
        $category = AssetCategory::create(['name' => 'Monitor', 'code' => 'MON', 'description' => 'Monitor']);
        $manufacturer = Manufacturer::create(['name' => 'LG', 'code' => 'LGE', 'description' => 'LG']);

        $this->asset = Asset::create([
            'asset_number'      => 'AST-7777',
            'name'              => 'Employee Monitor',
            'description'       => 'Test damage asset',
            'asset_category_id' => $category->id,
            'manufacturer_id'   => $manufacturer->id,
            'office_id'         => $office->id,
            'location_id'       => $location->id,
            'model'             => 'UltraFine 27',
            'status'            => AssetStatus::AVAILABLE->value,
            'condition_status'  => 'GOOD',
            'purchase_date'     => '2026-01-01',
            'purchase_cost'     => 450.00,
        ]);
    }

    public function test_employee_can_report_asset_damage(): void
    {
        $response = $this->withToken($this->employeeToken)
            ->postJson("/api/v1/assets/{$this->asset->id}/report-damage", [
                'type'        => 'minor_damage',
                'description' => 'Display screen flickers and lines appear when turned on.',
                'severity'    => 'medium',
                'remarks'     => 'Needs panel replacement.',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Damage report submitted successfully. Maintenance request has been created.',
            ]);

        $this->assertDatabaseHas('maintenances', [
            'asset_id'    => $this->asset->id,
            'reported_by' => $this->employee->id,
            'type'        => 'minor_damage',
            'severity'    => 'medium',
        ]);
    }
}
