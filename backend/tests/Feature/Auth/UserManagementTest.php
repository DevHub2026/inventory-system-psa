<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_list_users(): void
    {
        $admin = User::factory()->create();
        User::factory()->count(3)->create();
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->getJson('/api/v1/users');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Users retrieved successfully.',
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

    public function test_authenticated_user_can_search_users(): void
    {
        $admin = User::factory()->create();
        User::factory()->create(['first_name' => 'John']);
        User::factory()->create(['first_name' => 'Jane']);
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->getJson('/api/v1/users?search=John');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);
    }

    public function test_authenticated_user_can_create_user(): void
    {
        $admin = User::factory()->create();
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->postJson('/api/v1/users', [
                'employee_number' => 'EMP001',
                'first_name' => 'John',
                'last_name' => 'Doe',
                'email' => 'john@example.com',
                'password' => 'password123',
                'status' => 'active',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'User created successfully.',
            ]);

        $this->assertDatabaseHas('users', [
            'employee_number' => 'EMP001',
            'email' => 'john@example.com',
        ]);
    }

    public function test_authenticated_user_can_view_user(): void
    {
        $admin = User::factory()->create();
        $user = User::factory()->create();
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->getJson("/api/v1/users/{$user->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'User retrieved successfully.',
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'id',
                    'employee_number',
                    'first_name',
                    'last_name',
                    'email',
                ],
            ]);
    }

    public function test_authenticated_user_can_update_user(): void
    {
        $admin = User::factory()->create();
        $user = User::factory()->create(['first_name' => 'John']);
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->putJson("/api/v1/users/{$user->id}", [
                'first_name' => 'Jane',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'User updated successfully.',
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'first_name' => 'Jane',
        ]);
    }

    public function test_authenticated_user_can_delete_user(): void
    {
        $admin = User::factory()->create();
        $user = User::factory()->create();
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->deleteJson("/api/v1/users/{$user->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'User deleted successfully.',
            ]);

        $this->assertSoftDeleted('users', [
            'id' => $user->id,
        ]);
    }

    public function test_unauthenticated_user_cannot_access_user_management(): void
    {
        $response = $this->getJson('/api/v1/users');

        $response->assertStatus(401);
    }

    public function test_user_creation_requires_validation(): void
    {
        $admin = User::factory()->create();
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->postJson('/api/v1/users', [
                'first_name' => 'John',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Validation failed.',
            ]);
    }

    public function test_user_can_be_created_with_roles(): void
    {
        $admin = User::factory()->create();
        $role = \App\Models\Role::factory()->create();
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->postJson('/api/v1/users', [
                'employee_number' => 'EMP001',
                'first_name' => 'John',
                'last_name' => 'Doe',
                'email' => 'john@example.com',
                'password' => 'password123',
                'roles' => [$role->id],
            ]);

        $response->assertStatus(201);

        $user = User::where('email', 'john@example.com')->first();
        $this->assertTrue($user->roles()->where('id', $role->id)->exists());
    }
}
