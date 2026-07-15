<?php

namespace Tests\Feature\Auth;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_list_roles(): void
    {
        $admin = User::factory()->create();
        Role::factory()->count(3)->create();
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->getJson('/api/v1/roles');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Roles retrieved successfully.',
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

    public function test_authenticated_user_can_search_roles(): void
    {
        $admin = User::factory()->create();
        Role::factory()->create(['name' => 'Administrator']);
        Role::factory()->create(['name' => 'Manager']);
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->getJson('/api/v1/roles?search=Administrator');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);
    }

    public function test_authenticated_user_can_create_role(): void
    {
        $admin = User::factory()->create();
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->postJson('/api/v1/roles', [
                'name' => 'Test Role',
                'description' => 'A test role',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Role created successfully.',
            ]);

        $this->assertDatabaseHas('roles', [
            'name' => 'Test Role',
        ]);
    }

    public function test_authenticated_user_can_view_role(): void
    {
        $admin = User::factory()->create();
        $role = Role::factory()->create();
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->getJson("/api/v1/roles/{$role->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Role retrieved successfully.',
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'id',
                    'name',
                    'description',
                ],
            ]);
    }

    public function test_authenticated_user_can_update_role(): void
    {
        $admin = User::factory()->create();
        $role = Role::factory()->create(['name' => 'Old Name']);
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->putJson("/api/v1/roles/{$role->id}", [
                'name' => 'New Name',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Role updated successfully.',
            ]);

        $this->assertDatabaseHas('roles', [
            'id' => $role->id,
            'name' => 'New Name',
        ]);
    }

    public function test_authenticated_user_can_delete_role(): void
    {
        $admin = User::factory()->create();
        $role = Role::factory()->create();
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->deleteJson("/api/v1/roles/{$role->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Role deleted successfully.',
            ]);

        $this->assertSoftDeleted('roles', [
            'id' => $role->id,
        ]);
    }

    public function test_unauthenticated_user_cannot_access_role_management(): void
    {
        $response = $this->getJson('/api/v1/roles');

        $response->assertStatus(401);
    }

    public function test_role_creation_requires_validation(): void
    {
        $admin = User::factory()->create();
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->postJson('/api/v1/roles', [
                'description' => 'A test role',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Validation failed.',
            ]);
    }

    public function test_role_can_be_created_with_permissions(): void
    {
        $admin = User::factory()->create();
        $permission = \App\Models\Permission::factory()->create();
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->postJson('/api/v1/roles', [
                'name' => 'Test Role',
                'description' => 'A test role',
                'permissions' => [$permission->id],
            ]);

        $response->assertStatus(201);

        $role = Role::where('name', 'Test Role')->first();
        $this->assertTrue($role->permissions()->where('id', $permission->id)->exists());
    }

    public function test_role_name_must_be_unique(): void
    {
        $admin = User::factory()->create();
        Role::factory()->create(['name' => 'Test Role']);
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->postJson('/api/v1/roles', [
                'name' => 'Test Role',
                'description' => 'Duplicate role',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Validation failed.',
            ]);
    }
}
