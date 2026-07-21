<?php

namespace Tests\Feature\Inventory;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_create_inventory_item(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->postJson('/api/v1/inventory', [
                'name' => 'Printer Paper',
                'sku' => 'PP-001',
                'quantity' => 100,
                'unit' => 'ream',
                'reorder_level' => 20,
                'remarks' => 'Office supply',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Inventory item created successfully.',
            ]);

        $this->assertDatabaseHas('inventory_items', [
            'name' => 'Printer Paper',
            'sku' => 'PP-001',
        ]);
    }

    public function test_authenticated_user_can_stock_in_inventory_item(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $item = $this->withToken($token)
            ->postJson('/api/v1/inventory', [
                'name' => 'Printer Paper',
                'sku' => 'PP-001',
                'quantity' => 10,
                'unit' => 'ream',
                'reorder_level' => 5,
            ])->decodeResponseJson()['data'];

        $response = $this->withToken($token)
            ->postJson('/api/v1/inventory/'.$item['id'].'/stock-in', [
                'quantity' => 20,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Stock in completed successfully.',
            ]);
    }

    public function test_authenticated_user_can_update_inventory_item(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $item = $this->withToken($token)
            ->postJson('/api/v1/inventory', [
                'name' => 'Printer Paper',
                'sku' => 'PP-001',
                'quantity' => 10,
                'unit' => 'ream',
                'reorder_level' => 5,
            ])->decodeResponseJson()['data'];

        $response = $this->withToken($token)
            ->putJson('/api/v1/inventory/'.$item['id'], [
                'name' => 'Printer Paper Premium',
                'sku' => 'PP-001',
                'quantity' => 10,
                'unit' => 'ream',
                'reorder_level' => 10,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Inventory item updated successfully.',
            ]);

        $this->assertDatabaseHas('inventory_items', [
            'id' => $item['id'],
            'name' => 'Printer Paper Premium',
            'quantity' => 10,
        ]);
    }

    public function test_authenticated_user_can_delete_inventory_item(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $item = $this->withToken($token)
            ->postJson('/api/v1/inventory', [
                'name' => 'Printer Paper',
                'sku' => 'PP-001',
                'quantity' => 10,
                'unit' => 'ream',
            ])->decodeResponseJson()['data'];

        $response = $this->withToken($token)
            ->deleteJson('/api/v1/inventory/'.$item['id']);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Inventory item deleted successfully.',
            ]);

        $this->assertSoftDeleted('inventory_items', [
            'id' => $item['id'],
        ]);
    }

    public function test_authenticated_user_can_stock_out_inventory_item(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $item = $this->withToken($token)
            ->postJson('/api/v1/inventory', [
                'name' => 'Printer Paper',
                'sku' => 'PP-001',
                'quantity' => 30,
                'unit' => 'ream',
                'reorder_level' => 5,
            ])->decodeResponseJson()['data'];

        $response = $this->withToken($token)
            ->postJson('/api/v1/inventory/'.$item['id'].'/stock-out', [
                'quantity' => 10,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Stock out completed successfully.',
            ]);

        $this->assertDatabaseHas('inventory_items', [
            'id' => $item['id'],
            'quantity' => 20,
        ]);
    }

    public function test_authenticated_user_cannot_stock_out_insufficient_stock(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $item = $this->withToken($token)
            ->postJson('/api/v1/inventory', [
                'name' => 'Printer Paper',
                'sku' => 'PP-001',
                'quantity' => 5,
                'unit' => 'ream',
            ])->decodeResponseJson()['data'];

        $response = $this->withToken($token)
            ->postJson('/api/v1/inventory/'.$item['id'].'/stock-out', [
                'quantity' => 10,
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Insufficient stock for stock-out operation.',
            ]);
    }

    public function test_authenticated_user_can_filter_inventory_by_search(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/v1/inventory', [
                'name' => 'Printer Paper',
                'sku' => 'PP-001',
                'quantity' => 10,
                'unit' => 'ream',
            ]);

        $this->withToken($token)
            ->postJson('/api/v1/inventory', [
                'name' => 'Toner Cartridge',
                'sku' => 'TC-001',
                'quantity' => 5,
                'unit' => 'piece',
            ]);

        $response = $this->withToken($token)
            ->getJson('/api/v1/inventory?search=Printer');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Inventory items retrieved successfully.',
            ]);

        $data = $response->json('data.items');
        $this->assertCount(1, $data);
        $this->assertEquals('Printer Paper', $data[0]['name']);
    }

    public function test_authenticated_user_can_filter_inventory_by_low_stock(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/v1/inventory', [
                'name' => 'Printer Paper',
                'sku' => 'PP-001',
                'quantity' => 10,
                'unit' => 'ream',
                'reorder_level' => 5,
            ]);

        $this->withToken($token)
            ->postJson('/api/v1/inventory', [
                'name' => 'Toner Cartridge',
                'sku' => 'TC-001',
                'quantity' => 3,
                'unit' => 'piece',
                'reorder_level' => 5,
            ]);

        $response = $this->withToken($token)
            ->getJson('/api/v1/inventory?low_stock=1');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Inventory items retrieved successfully.',
            ]);

        $data = $response->json('data.items');
        $this->assertCount(1, $data);
        $this->assertEquals('Toner Cartridge', $data[0]['name']);
    }

    public function test_authenticated_user_can_adjust_inventory_quantity_with_reason(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $item = $this->withToken($token)
            ->postJson('/api/v1/inventory', [
                'name' => 'Printer Paper',
                'sku' => 'PP-001',
                'quantity' => 50,
                'unit' => 'ream',
                'reorder_level' => 5,
            ])->decodeResponseJson()['data'];

        $response = $this->withToken($token)
            ->postJson('/api/v1/inventory/'.$item['id'].'/adjust', [
                'quantity' => 47,
                'reason' => 'Physical count correction',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Stock quantity corrected successfully.',
                'data' => [
                    'quantity' => 47,
                ],
            ]);

        $this->assertDatabaseHas('stock_transactions', [
            'inventory_item_id' => $item['id'],
            'type' => 'adjustment',
            'quantity' => -3,
            'quantity_before' => 50,
            'quantity_after' => 47,
            'reason' => 'Physical count correction',
        ]);
    }

    public function test_authenticated_user_can_view_inventory_history(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $item = $this->withToken($token)
            ->postJson('/api/v1/inventory', [
                'name' => 'Printer Paper',
                'sku' => 'PP-001',
                'quantity' => 10,
                'unit' => 'ream',
                'reorder_level' => 5,
            ])->decodeResponseJson()['data'];

        $this->withToken($token)
            ->postJson('/api/v1/inventory/'.$item['id'].'/stock-in', [
                'quantity' => 5,
                'reason' => 'New supplies received',
            ]);

        $response = $this->withToken($token)
            ->getJson('/api/v1/inventory/'.$item['id'].'/history');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Stock movement history retrieved successfully.',
            ]);

        $this->assertGreaterThanOrEqual(1, count($response->json('data.items')));
    }
}
