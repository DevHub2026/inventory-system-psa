<?php

namespace Tests\Feature\Reservation;

use App\Models\User;
use App\Modules\Asset\Models\Asset;
use App\Modules\Inventory\Models\InventoryItem;
use App\Modules\Asset\Models\Location;
use App\Modules\Asset\Models\Manufacturer;
use App\Modules\Asset\Models\Office;
use App\Modules\AssetCategory\Models\AssetCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReservationValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_cannot_reserve_non_borrowable_asset(): void
    {
        $user = User::factory()->create();
        $asset = $this->createAsset();

        // Create an inventory item linked to the asset and mark it non-borrowable
        InventoryItem::create([
            'asset_id' => $asset->id,
            'name' => $asset->name,
            'quantity' => 1,
            'unit' => 'pcs',
            'is_borrowable' => false,
            'track_as_asset' => true,
        ]);

        $token = $user->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->postJson('/api/v1/reservations', [
                'asset_ids' => [$asset->id],
                'start_date' => '2026-07-20',
                'end_date' => '2026-07-22',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);
    }

    public function test_cannot_reserve_unavailable_asset(): void
    {
        $user = User::factory()->create();
        $asset = $this->createAsset(['status' => 'MAINTENANCE']);
        $token = $user->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->postJson('/api/v1/reservations', [
                'asset_ids' => [$asset->id],
                'start_date' => '2026-07-20',
                'end_date' => '2026-07-22',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);
    }

    public function test_prevent_duplicate_pending_reservation_by_same_user(): void
    {
        $user = User::factory()->create();
        $asset = $this->createAsset();
        $token = $user->createToken('auth')->plainTextToken;

        // Create first reservation
        $this->withToken($token)
            ->postJson('/api/v1/reservations', [
                'asset_ids' => [$asset->id],
                'start_date' => '2026-07-20',
                'end_date' => '2026-07-22',
            ])
            ->assertStatus(201);

        // Attempt duplicate
        $response = $this->withToken($token)
            ->postJson('/api/v1/reservations', [
                'asset_ids' => [$asset->id],
                'start_date' => '2026-07-25',
                'end_date' => '2026-07-26',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);
    }

    private function createAsset(array $overrides = []): Asset
    {
        $office = Office::create([
            'name' => 'Main Office',
            'code' => 'MO',
            'description' => 'Main office',
        ]);

        $location = Location::create([
            'office_id' => $office->id,
            'name' => 'Storage Room',
            'code' => 'SR',
            'description' => 'Storage room',
        ]);

        $category = AssetCategory::create([
            'name' => 'Laptop',
            'code' => 'LAP',
            'description' => 'Laptops',
        ]);

        $manufacturer = Manufacturer::create([
            'name' => 'Dell',
            'code' => 'DEL',
            'description' => 'Dell computers',
        ]);

        return Asset::create(array_merge([
            'asset_number' => 'AST-'.rand(1000, 9999),
            'name' => 'Laptop 14',
            'description' => 'Test asset',
            'asset_category_id' => $category->id,
            'manufacturer_id' => $manufacturer->id,
            'office_id' => $office->id,
            'location_id' => $location->id,
            'model' => 'Pro',
            'status' => 'AVAILABLE',
            'condition_status' => 'GOOD',
            'purchase_date' => '2026-01-01',
            'purchase_cost' => 1200.00,
            'warranty_until' => '2027-01-01',
            'remarks' => 'Test asset',
        ], $overrides));
    }
}
