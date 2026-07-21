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

    public function test_legacy_asset_borrow_route_delegates_to_canonical_service(): void
    {
        User::factory()->count(3)->create();
        $user = User::factory()->create(['id' => 4]);
        $asset = $this->createAsset(['id' => 10, 'asset_number' => 'AST-0010']);
        $token = $user->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->postJson('/api/v1/assets/10/borrow', [
                'due_date' => 7,
                'notes' => 'Phone QR test borrow',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Asset borrowed successfully.',
                'data' => [
                    'user_id' => 4,
                    'asset_id' => 10,
                    'status' => 'BORROWED',
                    'asset_number' => 'AST-0010',
                    'remarks' => 'Phone QR test borrow',
                    'returned_at' => null,
                ],
            ]);

        $this->assertDatabaseHas('borrowings', [
            'user_id' => 4,
            'asset_id' => 10,
            'status' => 'BORROWED',
            'remarks' => 'Phone QR test borrow',
        ]);

        $this->assertDatabaseHas('assets', [
            'id' => 10,
            'status' => 'BORROWED',
        ]);
    }

    public function test_legacy_asset_borrow_route_requires_authentication(): void
    {
        $asset = $this->createAsset();

        $response = $this->postJson("/api/v1/assets/{$asset->id}/borrow", [
            'due_date' => 7,
        ]);

        $response->assertStatus(401);
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

        $this->assertDatabaseMissing('borrowings', [
            'id' => $borrowing['id'],
            'returned_at' => null,
        ]);

        $this->assertDatabaseHas('assets', [
            'id' => $asset->id,
            'status' => 'AVAILABLE',
        ]);
    }

    public function test_borrowing_cannot_be_returned_twice(): void
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

        $this->withToken($token)
            ->postJson('/api/v1/borrowings/'.$borrowing['id'].'/return')
            ->assertStatus(200);

        $this->withToken($token)
            ->postJson('/api/v1/borrowings/'.$borrowing['id'].'/return')
            ->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Borrowing has already been returned.',
            ]);
    }

    private function createAsset(array $overrides = []): Asset
    {
        $unique = fake()->unique()->numerify('####');

        $office = Office::create([
            'name' => 'Main Office '.$unique,
            'code' => 'MO-'.$unique,
            'description' => 'Main office',
        ]);

        $location = Location::create([
            'office_id' => $office->id,
            'name' => 'Storage Room '.$unique,
            'code' => 'SR-'.$unique,
            'description' => 'Storage room',
        ]);

        $category = AssetCategory::create([
            'name' => 'Laptop '.$unique,
            'code' => 'LAP-'.$unique,
            'description' => 'Laptops',
        ]);

        $manufacturer = Manufacturer::create([
            'name' => 'Dell '.$unique,
            'code' => 'DEL-'.$unique,
            'description' => 'Dell computers',
        ]);

        return Asset::unguarded(fn () => Asset::create(array_merge([
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
        ], $overrides)));
    }
}
