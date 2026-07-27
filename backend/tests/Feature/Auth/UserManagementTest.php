<?php

namespace Tests\Feature\Auth;

use App\Enums\UserRole;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
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
                'username' => 'john.doe',
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
                'username' => 'john.doe',
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

    public function test_employee_import_accepts_file_without_department_and_hashes_default_password(): void
    {
        $admin = User::factory()->create();
        $employeeRole = Role::query()->firstOrCreate(
            ['name' => UserRole::EMPLOYEE->value],
            ['description' => UserRole::EMPLOYEE->name],
        );
        $existingPassword = $admin->password;
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->post('/api/v1/users/import', [
                'file' => $this->csvUpload(
                    "first_name,middle_name,last_name,id_number,email,role\n".
                    "Maria,,Santos,1234-5678,maria.santos@example.com,Employee\n",
                ),
            ], ['Accept' => 'application/json']);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'imported' => 1,
                    'failed' => 0,
                    'initial_password' => 'psagens9500',
                ],
            ]);

        $importedUser = User::query()->where('email', 'maria.santos@example.com')->firstOrFail();

        $this->assertNull($importedUser->department_id);
        $this->assertNotSame('psagens9500', $importedUser->password);
        $this->assertTrue(Hash::check('psagens9500', $importedUser->password));
        $this->assertTrue($importedUser->roles()->whereKey($employeeRole->id)->exists());
        $this->assertSame($existingPassword, $admin->fresh()->password);

        $this->assertTrue(Auth::guard('web')->attempt([
            'email' => 'maria.santos@example.com',
            'password' => 'psagens9500',
        ]));
    }

    public function test_employee_import_ignores_unknown_department_column(): void
    {
        $admin = User::factory()->create();
        Role::query()->firstOrCreate(
            ['name' => UserRole::EMPLOYEE->value],
            ['description' => UserRole::EMPLOYEE->name],
        );

        $response = $this->withToken($admin->createToken('auth')->plainTextToken)
            ->post('/api/v1/users/import', [
                'file' => $this->csvUpload(
                    "first_name,last_name,id_number,email,role,department\n".
                    "Pedro,Reyes,1111-2222,pedro.reyes@example.com,Employee,Unknown Department\n",
                ),
            ], ['Accept' => 'application/json']);

        $response->assertOk()
            ->assertJsonPath('data.imported', 1)
            ->assertJsonPath('data.failed', 0);

        $this->assertDatabaseHas('users', [
            'email' => 'pedro.reyes@example.com',
            'department_id' => null,
        ]);
    }

    public function test_employee_import_still_reports_duplicate_email_and_invalid_role(): void
    {
        $admin = User::factory()->create();
        User::factory()->create(['email' => 'duplicate@example.com']);

        $response = $this->withToken($admin->createToken('auth')->plainTextToken)
            ->post('/api/v1/users/import', [
                'file' => $this->csvUpload(
                    "first_name,last_name,id_number,email,role\n".
                    "Juan,Cruz,2222-3333,duplicate@example.com,Employee\n".
                    "Ana,Dela Cruz,3333-4444,ana.delacruz@example.com,Not A Role\n",
                ),
            ], ['Accept' => 'application/json']);

        $response->assertOk()
            ->assertJsonPath('data.imported', 0)
            ->assertJsonPath('data.skipped', 1)
            ->assertJsonPath('data.failed', 1);

        $reasons = collect($response->json('data.rows'))->pluck('reason')->implode(' ');

        $this->assertStringContainsString('Email already exists.', $reasons);
        $this->assertStringContainsString('Role was not found.', $reasons);
    }

    private function csvUpload(string $contents): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'psa-user-import-');
        file_put_contents($path, $contents);

        return new UploadedFile($path, 'employees.csv', 'text/csv', null, true);
    }
}
