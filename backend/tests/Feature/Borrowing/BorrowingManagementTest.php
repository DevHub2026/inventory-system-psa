<?php

namespace Tests\Feature\Borrowing;

use App\Models\User;
use App\Modules\Asset\Models\Asset;
use App\Modules\Asset\Models\Location;
use App\Modules\Asset\Models\Manufacturer;
use App\Modules\Asset\Models\Office;
use App\Modules\AssetCategory\Models\AssetCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BorrowingManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_create_a_borrowing(): void
    {
        $user = User::factory()->create();
        $asset = $this->createAsset();
        $token = $user->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->postJson('/api/v1/borrowings', [
                'asset_id' => $asset->id,
                'borrow_date' => '2026-07-20',
                'due_date' => '2026-07-24',
                'remarks' => 'For field work',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Borrowing created successfully.',
            ]);

        $this->assertDatabaseHas('borrowings', [
            'user_id' => $user->id,
            'asset_id' => $asset->id,
            'status' => 'BORROWED',
        ]);
    }

    public function test_authenticated_user_can_return_a_borrowing(): void
    {
        $user = User::factory()->create();
        $asset = $this->createAsset();
        $token = $user->createToken('auth')->plainTextToken;

        $borrowing = $this->withToken($token)
            ->postJson('/api/v1/borrowings', [
                'asset_id' => $asset->id,
                'borrow_date' => '2026-07-20',
                'due_date' => '2026-07-24',
            ])
            ->decodeResponseJson()['data'];

        $response = $this->withToken($token)
            ->postJson('/api/v1/borrowings/'.$borrowing['id'].'/return');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Borrowing returned successfully.',
            ]);

        $this->assertDatabaseHas('borrowings', [
            'id' => $borrowing['id'],
            'status' => 'RETURNED',
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
