<?php

namespace Tests\Feature\Auth;

use App\Models\Permission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PermissionManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_list_permissions(): void
    {
        $admin = User::factory()->create();
        Permission::factory()->count(3)->create();
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->getJson('/api/v1/permissions');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Permissions retrieved successfully.',
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data',
                'meta' => [
                    'current_page',
                    'per_page',
                    'total',
                    'last_page',
                ],
            ]);
    }

    public function test_authenticated_user_can_search_permissions(): void
    {
        $admin = User::factory()->create();
        Permission::factory()->create(['name' => 'create user']);
        Permission::factory()->create(['name' => 'delete user']);
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->getJson('/api/v1/permissions?search=create');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);
    }

    public function test_authenticated_user_can_filter_permissions_by_module(): void
    {
        $admin = User::factory()->create();
        Permission::factory()->create(['name' => 'create user', 'module' => 'users']);
        Permission::factory()->create(['name' => 'create asset', 'module' => 'assets']);
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->getJson('/api/v1/permissions?module=users');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);
    }

    public function test_authenticated_user_can_create_permission(): void
    {
        $admin = User::factory()->create();
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->postJson('/api/v1/permissions', [
                'name' => 'create user',
                'module' => 'users',
                'description' => 'Can create users',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Permission created successfully.',
            ]);

        $this->assertDatabaseHas('permissions', [
            'name' => 'create user',
            'module' => 'users',
        ]);
    }

    public function test_authenticated_user_can_view_permission(): void
    {
        $admin = User::factory()->create();
        $permission = Permission::factory()->create();
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->getJson("/api/v1/permissions/{$permission->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Permission retrieved successfully.',
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'id',
                    'name',
                    'module',
                    'description',
                ],
            ]);
    }

    public function test_authenticated_user_can_update_permission(): void
    {
        $admin = User::factory()->create();
        $permission = Permission::factory()->create(['name' => 'old name']);
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->putJson("/api/v1/permissions/{$permission->id}", [
                'name' => 'new name',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Permission updated successfully.',
            ]);

        $this->assertDatabaseHas('permissions', [
            'id' => $permission->id,
            'name' => 'new name',
        ]);
    }

    public function test_authenticated_user_can_delete_permission(): void
    {
        $admin = User::factory()->create();
        $permission = Permission::factory()->create();
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->deleteJson("/api/v1/permissions/{$permission->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Permission deleted successfully.',
            ]);

        $this->assertSoftDeleted('permissions', [
            'id' => $permission->id,
        ]);
    }

    public function test_unauthenticated_user_cannot_access_permission_management(): void
    {
        $response = $this->getJson('/api/v1/permissions');

        $response->assertStatus(401);
    }

    public function test_permission_creation_requires_validation(): void
    {
        $admin = User::factory()->create();
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->postJson('/api/v1/permissions', [
                'description' => 'A test permission',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Validation failed.',
            ]);
    }

    public function test_permission_name_must_be_unique(): void
    {
        $admin = User::factory()->create();
        Permission::factory()->create(['name' => 'create user']);
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->postJson('/api/v1/permissions', [
                'name' => 'create user',
                'module' => 'users',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Validation failed.',
            ]);
    }

    public function test_permission_module_is_required(): void
    {
        $admin = User::factory()->create();
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->postJson('/api/v1/permissions', [
                'name' => 'create user',
                'description' => 'Can create users',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Validation failed.',
            ]);
    }
}
