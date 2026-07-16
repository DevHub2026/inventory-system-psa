<?php

namespace Tests\Feature\Reservation;

use App\Models\User;
use App\Modules\Asset\Models\Asset;
use App\Modules\Asset\Models\Location;
use App\Modules\Asset\Models\Manufacturer;
use App\Modules\Asset\Models\Office;
use App\Modules\AssetCategory\Models\AssetCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReservationManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_create_a_reservation(): void
    {
        $user = User::factory()->create();
        $asset = $this->createAsset();
        $token = $user->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->postJson('/api/v1/reservations', [
                'asset_ids' => [$asset->id],
                'start_date' => '2026-07-20',
                'end_date' => '2026-07-22',
                'remarks' => 'Requested for a meeting',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Reservation created successfully.',
            ]);

        $this->assertDatabaseHas('reservations', [
            'user_id' => $user->id,
            'status' => 'PENDING',
        ]);
    }

    public function test_authenticated_user_can_list_reservations(): void
    {
        $user = User::factory()->create();
        $asset = $this->createAsset();
        $token = $user->createToken('auth')->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/v1/reservations', [
                'asset_ids' => [$asset->id],
                'start_date' => '2026-07-20',
                'end_date' => '2026-07-22',
            ]);

        $response = $this->withToken($token)
            ->getJson('/api/v1/reservations');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Reservations retrieved successfully.',
            ]);
    }

    public function test_authenticated_user_can_approve_a_reservation(): void
    {
        $user = User::factory()->create();
        $asset = $this->createAsset();
        $token = $user->createToken('auth')->plainTextToken;

        $reservation = $this->withToken($token)
            ->postJson('/api/v1/reservations', [
                'asset_ids' => [$asset->id],
                'start_date' => '2026-07-20',
                'end_date' => '2026-07-22',
            ])
            ->decodeResponseJson()['data'];

        $response = $this->withToken($token)
            ->postJson('/api/v1/reservations/'.$reservation['id'].'/approve');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Reservation approved successfully.',
            ]);

        $this->assertDatabaseHas('reservations', [
            'id' => $reservation['id'],
            'status' => 'APPROVED',
        ]);
    }

    private function createAsset(): Asset
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

        return Asset::create([
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
        ]);
    }
}
