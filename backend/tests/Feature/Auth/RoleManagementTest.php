<?php

namespace Tests\Feature\Auth;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleManagementTest extends TestCase
{
    use RefreshDatabase;

    public function setUp(): void
    {
        parent::setUp();
        // Seed roles so we have Super Administrator
        $this->seed(\Database\Seeders\RoleSeeder::class);
        $this->seed(\Database\Seeders\PermissionSeeder::class);
    }

    private function getAdminUser(): User
    {
        $admin = User::factory()->create();
        $role = Role::where('name', \App\Enums\UserRole::SUPER_ADMINISTRATOR->value)->first();
        $admin->roles()->sync([$role->id]);
        return $admin;
    }

    private function getManagerUser(): User
    {
        $manager = User::factory()->create();
        $role = Role::where('name', \App\Enums\UserRole::SYSTEM_ADMINISTRATOR->value)->first();
        $manager->roles()->sync([$role->id]);
        return $manager;
    }

    public function test_authenticated_user_can_list_roles(): void
    {
        $admin = $this->getAdminUser();
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
                'meta',
            ]);
    }

    public function test_authenticated_user_can_search_roles(): void
    {
        $admin = $this->getAdminUser();
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
        $admin = $this->getAdminUser();
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->postJson('/api/v1/roles', [
                'name' => 'Test Role',
                'description' => 'A test role',
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('roles', [
            'name' => 'Test Role',
        ]);
    }

    public function test_authenticated_user_can_view_role(): void
    {
        $admin = $this->getAdminUser();
        $role = Role::factory()->create();
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->getJson("/api/v1/roles/{$role->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'id',
                    'name',
                    'description',
                    'permissions'
                ],
            ]);
    }

    public function test_authenticated_user_can_update_role(): void
    {
        $admin = $this->getAdminUser();
        $role = Role::factory()->create(['name' => 'Old Name']);
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->putJson("/api/v1/roles/{$role->id}", [
                'name' => 'New Name',
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('roles', [
            'id' => $role->id,
            'name' => 'New Name',
        ]);
    }

    public function test_unauthorized_users_cannot_modify_super_admin_role(): void
    {
        $manager = $this->getManagerUser();
        $role = Role::where('name', \App\Enums\UserRole::SUPER_ADMINISTRATOR->value)->first();
        $token = $manager->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->putJson("/api/v1/roles/{$role->id}", [
                'name' => 'Hacked Role',
            ]);

        $response->assertStatus(403);
    }

    public function test_authenticated_user_can_delete_role(): void
    {
        $admin = $this->getAdminUser();
        $role = Role::factory()->create();
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->deleteJson("/api/v1/roles/{$role->id}");

        $response->assertStatus(200);

        $this->assertSoftDeleted('roles', [
            'id' => $role->id,
        ]);
    }

    public function test_super_admin_role_cannot_be_deleted(): void
    {
        $admin = $this->getAdminUser();
        $role = Role::where('name', \App\Enums\UserRole::SUPER_ADMINISTRATOR->value)->first();
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->deleteJson("/api/v1/roles/{$role->id}");

        $response->assertStatus(403);
    }

    public function test_unauthenticated_user_cannot_access_role_management(): void
    {
        $response = $this->getJson('/api/v1/roles');
        $response->assertStatus(401);
    }

    public function test_role_creation_requires_validation(): void
    {
        $admin = $this->getAdminUser();
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->postJson('/api/v1/roles', [
                'description' => 'A test role',
            ]);

        $response->assertStatus(422);
    }

    public function test_role_can_be_created_with_permissions(): void
    {
        $admin = $this->getAdminUser();
        $permission = \App\Models\Permission::first();
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->postJson('/api/v1/roles', [
                'name' => 'Test Role',
                'description' => 'A test role',
                'permissions' => [$permission->id],
            ]);

        $response->assertStatus(201);

        $role = Role::where('name', 'Test Role')->first();
        $this->assertTrue($role->permissions()->where('permission_id', $permission->id)->exists());
    }

    public function test_role_name_must_be_unique(): void
    {
        $admin = $this->getAdminUser();
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->postJson('/api/v1/roles', [
                'name' => \App\Enums\UserRole::SYSTEM_ADMINISTRATOR->value,
                'description' => 'Duplicate role',
            ]);

        $response->assertStatus(422);
    }
}
