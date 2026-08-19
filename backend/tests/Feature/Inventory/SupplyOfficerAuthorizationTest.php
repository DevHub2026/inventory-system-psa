<?php

namespace Tests\Feature\Inventory;

use App\Enums\UserRole;
use App\Modules\Inventory\Models\InventoryItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SupplyOfficerAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_supply_officer_only_can_view_all_categories(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole(UserRole::SUPER_ADMINISTRATOR->value);
        $tokenAdmin = $admin->createToken('auth')->plainTextToken;

        // create one of each classification via API as admin
        $resp = $this->withToken($tokenAdmin)->postJson('/api/v1/inventory', [
            'name' => 'Paper', 'sku' => 'SUP-001', 'quantity' => 10, 'unit' => 'ream', 'classification' => 'SUPPLY'
        ])->decodeResponseJson();
        $supply = $resp['data'];

        $resp = $this->withToken($tokenAdmin)->postJson('/api/v1/inventory', [
            'name' => 'Laptop', 'sku' => 'PPE-001', 'quantity' => 1, 'unit' => 'pcs', 'classification' => 'PPE', 'unit_cost' => 60000
        ])->decodeResponseJson();
        $ppe = $resp['data'];

        $resp = $this->withToken($tokenAdmin)->postJson('/api/v1/inventory', [
            'name' => 'Lamp', 'sku' => 'SE-001', 'quantity' => 2, 'unit' => 'pcs', 'classification' => 'SE', 'unit_cost' => 1000
        ])->decodeResponseJson();
        $se = $resp['data'];

        $user = User::factory()->create();
        $user->roles()->sync([]);
        $user->assignRole(UserRole::SUPPLY_OFFICER->value);
        $token = $user->createToken('auth')->plainTextToken;

        // list all (no classification filter) should be allowed
        $res = $this->actingAs($user, 'sanctum')->getJson('/api/v1/inventory');
        $res->assertStatus(200);

        // show each should be allowed
                $this->actingAs($user, 'sanctum')->getJson('/api/v1/inventory/'.$supply['id'])->assertStatus(200);
                $this->actingAs($user, 'sanctum')->getJson('/api/v1/inventory/'.$ppe['id'])->assertStatus(200);
                $this->actingAs($user, 'sanctum')->getJson('/api/v1/inventory/'.$se['id'])->assertStatus(200);
    }

    public function test_supply_officer_only_cannot_create_ppe_or_se_but_can_create_supply(): void
    {
        $user = User::factory()->create();
        $user->roles()->sync([]);
        $user->assignRole(UserRole::SUPPLY_OFFICER->value);
        $token = $user->createToken('auth')->plainTextToken;

        // Attempt create PPE
        $resPpe = $this->actingAs($user, 'sanctum')->postJson('/api/v1/inventory', [
            'name' => 'Expensive Device',
            'sku' => 'PPE-01',
            'quantity' => 1,
            'unit' => 'pcs',
            'classification' => 'PPE',
        ]);
        $resPpe->assertStatus(403);

        // Attempt create SE
        $resSe = $this->actingAs($user, 'sanctum')->postJson('/api/v1/inventory', [
            'name' => 'Semi Item',
            'sku' => 'SE-01',
            'quantity' => 5,
            'unit' => 'pcs',
            'classification' => 'SE',
        ]);
        $resSe->assertStatus(403);

        // Attempt create SUPPLY
        $resSupply = $this->actingAs($user, 'sanctum')->postJson('/api/v1/inventory', [
            'name' => 'Printer Paper',
            'sku' => 'SUP-001',
            'quantity' => 100,
            'unit' => 'ream',
            'classification' => 'SUPPLY',
        ]);
        $resSupply->assertStatus(201);
    }

    public function test_supply_officer_only_cannot_update_or_delete_ppe_or_se_but_can_update_delete_supply(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole(UserRole::SUPER_ADMINISTRATOR->value);
        $tokenAdmin = $admin->createToken('auth')->plainTextToken;

        $resp = $this->withToken($tokenAdmin)->postJson('/api/v1/inventory', [
            'name' => 'Paper', 'sku' => 'SUP-100', 'quantity' => 10, 'unit' => 'ream', 'classification' => 'SUPPLY'
        ])->decodeResponseJson();
        $supply = $resp['data'];

        $resp = $this->withToken($tokenAdmin)->postJson('/api/v1/inventory', [
            'name' => 'Laptop', 'sku' => 'PPE-100', 'quantity' => 1, 'unit' => 'pcs', 'classification' => 'PPE', 'unit_cost' => 60000
        ])->decodeResponseJson();
        $ppe = $resp['data'];

        $resp = $this->withToken($tokenAdmin)->postJson('/api/v1/inventory', [
            'name' => 'Projector Lamp', 'sku' => 'SE-100', 'quantity' => 2, 'unit' => 'pcs', 'classification' => 'SE', 'unit_cost' => 1000
        ])->decodeResponseJson();
        $se = $resp['data'];

        $user = User::factory()->create();
        $user->roles()->sync([]);
        $user->assignRole(UserRole::SUPPLY_OFFICER->value);
        $token = $user->createToken('auth')->plainTextToken;

        // Update supply (allowed)
        $upd = $this->actingAs($user, 'sanctum')->putJson('/api/v1/inventory/'.$supply['id'], ['name' => 'Paper (A4)']);
        $upd->assertStatus(200);

        // Delete supply (allowed)
                $del = $this->actingAs($user, 'sanctum')->deleteJson('/api/v1/inventory/'.$supply['id']);
        $del->assertStatus(200);

        // Update PPE (denied)
        $this->actingAs($user, 'sanctum')->putJson('/api/v1/inventory/'.$ppe['id'], ['name' => 'Laptop Pro'])->assertStatus(403);

        // Delete PPE (denied)
                $this->actingAs($user, 'sanctum')->deleteJson('/api/v1/inventory/'.$ppe['id'])->assertStatus(403);

        // Update SE (denied)
                $this->actingAs($user, 'sanctum')->putJson('/api/v1/inventory/'.$se['id'], ['name' => 'Lamp X'])->assertStatus(403);

        // Delete SE (denied)
                $this->actingAs($user, 'sanctum')->deleteJson('/api/v1/inventory/'.$se['id'])->assertStatus(403);
    }

    public function test_supply_officer_only_cannot_change_classification_from_supply_to_ppe_or_from_ppe_to_supply(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole(UserRole::SUPER_ADMINISTRATOR->value);
        $tokenAdmin = $admin->createToken('auth')->plainTextToken;

        $resp = $this->withToken($tokenAdmin)->postJson('/api/v1/inventory', [
            'name' => 'Paper', 'sku' => 'SUP-200', 'quantity' => 10, 'unit' => 'ream', 'classification' => 'SUPPLY'
        ])->decodeResponseJson();
        $supply = $resp['data'];

        $resp = $this->withToken($tokenAdmin)->postJson('/api/v1/inventory', [
            'name' => 'Desktop', 'sku' => 'PPE-200', 'quantity' => 1, 'unit' => 'pcs', 'classification' => 'PPE', 'unit_cost' => 80000
        ])->decodeResponseJson();
        $ppe = $resp['data'];

        $user = User::factory()->create();
        $user->roles()->sync([]);
        $user->assignRole(UserRole::SUPPLY_OFFICER->value);
        $token = $user->createToken('auth')->plainTextToken;

        // Attempt change SUPPLY -> PPE (denied)
        $this->actingAs($user, 'sanctum')->putJson('/api/v1/inventory/'.$supply['id'], ['classification' => 'PPE'])->assertStatus(403);

        // Attempt change PPE -> SUPPLY (denied)
                $this->actingAs($user, 'sanctum')->putJson('/api/v1/inventory/'.$ppe['id'], ['classification' => 'SUPPLY'])->assertStatus(403);
    }

    public function test_supply_officer_plus_inventory_officer_has_inventory_management_rights(): void
    {
        // User with both roles should inherit inventory management ability
        $user = User::factory()->create();
        // Remove default testing role (UserFactory assigns SUPER_ADMINISTRATOR in tests)
        $user->roles()->sync([]);
        $user->assignRole(UserRole::SUPPLY_OFFICER->value);
        $user->assignRole(UserRole::INVENTORY_OFFICER->value);
        $token = $user->createToken('auth')->plainTextToken;

        // Can create a PPE item
        $res = $this->actingAs($user, 'sanctum')->postJson('/api/v1/inventory', [
            'name' => 'New Laptop',
            'sku' => 'PPE-X1',
            'quantity' => 1,
            'unit' => 'pcs',
            'classification' => 'PPE',
            'unit_cost' => 60000,
        ]);
        $res->assertStatus(201);
    }
}
