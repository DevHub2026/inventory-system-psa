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
                'first_name'      => 'John',
                'last_name'       => 'Doe',
                'email'           => 'john@example.com',
                'password'        => 'password123',
                'status'          => 'active',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'User created successfully.',
            ]);

        $this->assertDatabaseHas('users', [
            'employee_number' => 'EMP001',
            'email'           => 'john@example.com',
            'username'        => 'doeEMP001',   // auto-generated: lowercase(last_name)+employee_number
        ]);
    }

    public function test_authenticated_user_can_create_user_without_employee_number_or_names(): void
    {
        $admin = User::factory()->create();
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->postJson('/api/v1/users', [
                'email' => 'anon@example.com',
                'password' => 'password123',
                'status' => 'active',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'User created successfully.',
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'anon@example.com',
            'employee_number' => null,
            'username' => null,
        ]);
    }

    public function test_authenticated_user_can_create_user_without_password_uses_default_password(): void
    {
        $admin = User::factory()->create();
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->postJson('/api/v1/users', [
                'email' => 'defaultpass@example.com',
                'status' => 'active',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'User created successfully.',
            ]);

        $user = User::query()->where('email', 'defaultpass@example.com')->first();
        $this->assertNotNull($user);
        $this->assertTrue(Hash::check('psasargen9500', $user->password));
    }

    public function test_username_is_auto_generated_from_last_name_and_employee_number(): void
    {
        $admin = User::factory()->create();
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->postJson('/api/v1/users', [
                'employee_number' => '20250012',
                'first_name'      => 'Maria',
                'last_name'       => 'Santos',
                'email'           => 'maria.santos@psa.gov.ph',
                'password'        => 'password123',
            ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('users', [
            'username' => 'santos20250012',
        ]);
    }

    public function test_username_uses_last_name_only_when_employee_number_is_blank(): void
    {
        $admin = User::factory()->create();
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->postJson('/api/v1/users', [
                'first_name' => 'Maria',
                'last_name'  => 'Santos',
                'email'      => 'maria.santos.only@psa.gov.ph',
                'password'   => 'password123',
            ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('users', [
            'email'    => 'maria.santos.only@psa.gov.ph',
            'username' => 'santos',
        ]);
    }

    public function test_username_strips_spaces_and_special_chars(): void
    {
        $admin = User::factory()->create();
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->postJson('/api/v1/users', [
                'employee_number' => '20250099',
                'first_name'      => 'Ana',
                'last_name'       => 'De La Cruz',
                'email'           => 'ana.delacruz@psa.gov.ph',
                'password'        => 'password123',
            ]);

        $response->assertStatus(201);

        // Spaces and uppercase removed: "De La Cruz" -> "delacruz"
        $this->assertDatabaseHas('users', [
            'username' => 'delacruz20250099',
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

    public function test_unauthorized_users_cannot_assign_super_admin_role(): void
    {
        $this->seed(\Database\Seeders\RoleSeeder::class);
        $manager = User::factory()->create();
        // Give manager a role that usually can update users
        $managerRole = \App\Models\Role::where('name', \App\Enums\UserRole::SYSTEM_ADMINISTRATOR->value)->first();
        $manager->roles()->sync([$managerRole->id]);

        $superAdminRole = \App\Models\Role::where('name', \App\Enums\UserRole::SUPER_ADMINISTRATOR->value)->first();
        
        $targetUser = User::factory()->create();

        $token = $manager->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->putJson("/api/v1/users/{$targetUser->id}", [
                'first_name' => 'Hacked',
                'roles' => [$superAdminRole->id],
            ]);

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'You do not have permission to assign the Super Administrator role.',
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
                'first_name'      => 'John',
                'last_name'       => 'Doe',
                'email'           => 'john@example.com',
                'password'        => 'password123',
                'roles'           => [$role->id],
            ]);

        $response->assertStatus(201);

        $user = User::where('email', 'john@example.com')->first();
        $this->assertTrue($user->roles()->where('id', $role->id)->exists());
        // Username was auto-generated
        $this->assertSame('doeEMP001', $user->username);
    }

    public function test_employee_import_can_import_user_without_id_number(): void
    {
        $admin = User::factory()->create();
        Role::query()->firstOrCreate(
            ['name' => UserRole::EMPLOYEE->value],
            ['description' => UserRole::EMPLOYEE->name],
        );
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->post('/api/v1/users/import', [
                'file' => $this->csvUpload(
                    "first_name,last_name,id_number,email,role\n" .
                    ",Garcia,,garcia@example.com,Employee\n",
                ),
            ], ['Accept' => 'application/json']);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'imported' => 1,
                    'failed' => 0,
                ],
            ])
            ->assertJsonMissing(['initial_password' => 'psasargen9500']);

        $importedUser = User::query()->where('email', 'garcia@example.com')->first();
        $this->assertNotNull($importedUser);
        $this->assertNull($importedUser->employee_number);
        $this->assertTrue(Hash::check('psasargen9500', $importedUser->password));
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
                ],
            ])
            ->assertJsonMissing(['initial_password' => 'psasargen9500']);

        $importedUser = User::query()->where('email', 'maria.santos@example.com')->firstOrFail();

        $this->assertNull($importedUser->department_id);
        $this->assertNotSame('psasargen9500', $importedUser->password);
        $this->assertTrue(Hash::check('psasargen9500', $importedUser->password));
        $this->assertTrue($importedUser->roles()->whereKey($employeeRole->id)->exists());
        $this->assertSame($existingPassword, $admin->fresh()->password);

        $this->assertTrue(Auth::guard('web')->attempt([
            'email' => 'maria.santos@example.com',
            'password' => 'psasargen9500',
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

    public function test_user_search_is_case_insensitive_and_partial_matches(): void
    {
        $admin = User::factory()->create([
            'first_name' => 'SearchAdminUser',
            'last_name' => 'Controller',
            'email' => 'search.admin.controller@example.com',
            'employee_number' => 'EMP-ADMIN-SEARCH-01',
        ]);

        // Use a unique, deterministic value so the test is not accidentally
        // polluted by generic factory names or previous test data.
        User::factory()->create([
            'first_name' => 'ZyPhErCaSeUsEr',
            'last_name' => 'Target',
            'email' => 'zypher.case.user.target@example.com',
            'employee_number' => 'EMP-SEARCH-CASE-01',
        ]);

        $token = $admin->createToken('auth')->plainTextToken;

        // lowercase search
        $response = $this->withToken($token)->getJson('/api/v1/users?search=zyphercaseuser');
        $response->assertStatus(200);
        $this->assertSame(1, $response->json('meta.total'));

        // uppercase search
        $response = $this->withToken($token)->getJson('/api/v1/users?search=ZYPHERCASEUSER');
        $response->assertStatus(200);
        $this->assertSame(1, $response->json('meta.total'));

        // mixed-case search
        $response = $this->withToken($token)->getJson('/api/v1/users?search=zYpHeRcAsEuSeR');
        $response->assertStatus(200);
        $this->assertSame(1, $response->json('meta.total'));

        // partial search
        $response = $this->withToken($token)->getJson('/api/v1/users?search=zypher');
        $response->assertStatus(200);
        $this->assertSame(1, $response->json('meta.total'));

        // employee number search lower/upper variants should match too
        $response = $this->withToken($token)->getJson('/api/v1/users?search=emp-search-case-01');
        $this->assertSame(1, $response->json('meta.total'));

        $response = $this->withToken($token)->getJson('/api/v1/users?search=EMP-SEARCH-CASE-01');
        $this->assertSame(1, $response->json('meta.total'));

        // Ensure a non-matching user is excluded.
        User::factory()->create([
            'first_name' => 'NoMatchName',
            'last_name' => 'Only',
            'email' => 'nomatch.only@example.com',
            'employee_number' => 'EMP-NO-MATCH-99',
        ]);

        $response = $this->withToken($token)->getJson('/api/v1/users?search=zyphercaseuser');
        $this->assertSame(1, $response->json('meta.total'));

        // pagination preserved
        $response = $this->withToken($token)->getJson('/api/v1/users?search=zyphercaseuser&per_page=1&page=1');
        $response->assertStatus(200);
        $this->assertSame(1, $response->json('meta.per_page'));
    }

    public function test_existing_username_is_not_regenerated_when_user_data_changes(): void
    {
        $admin = User::factory()->create();
        $user = User::factory()->create([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'employee_number' => 'EMP-1001',
            'username' => 'custom_doe',
        ]);
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->putJson('/api/v1/users/'.$user->id, [
                'last_name' => 'Dorian',
                'email' => $user->email,
            ]);

        $response->assertStatus(200);
        $this->assertSame('custom_doe', $user->fresh()->username);

        $response = $this->withToken($token)
            ->putJson('/api/v1/users/'.$user->id, [
                'employee_number' => 'EMP-9999',
                'email' => $user->email,
            ]);

        $response->assertStatus(200);
        $this->assertSame('custom_doe', $user->fresh()->username);
    }

    public function test_admin_can_manually_override_username_and_duplicate_is_rejected(): void
    {
        $admin = User::factory()->create();
        $user = User::factory()->create([
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'employee_number' => 'EMP-2002',
            'username' => 'smith_legacy',
        ]);
        $otherUser = User::factory()->create([
            'username' => 'already_taken',
        ]);
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->putJson('/api/v1/users/'.$user->id, [
                'username' => 'smith_updated',
                'email' => $user->email,
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'username' => 'smith_updated',
        ]);

        $duplicateResponse = $this->withToken($token)
            ->putJson('/api/v1/users/'.$user->id, [
                'username' => 'already_taken',
                'email' => $user->email,
            ]);

        $duplicateResponse->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_non_admin_user_cannot_edit_another_users_username(): void
    {
        $other = User::factory()->create([
            'username' => 'targetuser',
            'email' => 'target@example.com',
        ]);

        $user = User::factory()->create([
            'email' => 'regular@example.com',
        ]);
        $user->roles()->detach();

        $token = $user->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->putJson('/api/v1/users/'.$other->id, [
                'username' => 'hijacked',
                'email' => $other->email,
            ]);

        $response->assertStatus(403);
        $this->assertSame('targetuser', $other->fresh()->username);
    }

    public function test_admin_can_create_user_with_explicit_username_and_preserve_it(): void
    {
        $admin = User::factory()->create();
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->postJson('/api/v1/users', [
                'employee_number' => 'EMP-5001',
                'first_name' => 'Explicit',
                'last_name' => 'User',
                'email' => 'explicit.username@example.com',
                'password' => 'password123',
                'username' => 'manual_username',
                'status' => 'active',
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('users', [
            'email' => 'explicit.username@example.com',
            'username' => 'manual_username',
        ]);
    }

    public function test_import_preserves_explicit_username_and_generates_blank_username(): void
    {
        $admin = User::factory()->create();
        Role::query()->firstOrCreate(
            ['name' => UserRole::EMPLOYEE->value],
            ['description' => UserRole::EMPLOYEE->name],
        );
        $token = $admin->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->post('/api/v1/users/import', [
                'file' => $this->csvUpload(
                    "first_name,last_name,id_number,email,role,username\n".
                    "Maria,Santos,20250012,maria.santos@example.com,Employee,\n".
                    "Ana,Lopez,20250013,ana.lopez@example.com,Employee,custom_unique\n",
                ),
            ], ['Accept' => 'application/json']);

        $response->assertOk();
        $this->assertDatabaseHas('users', [
            'email' => 'maria.santos@example.com',
            'username' => 'santos20250012',
        ]);
        $this->assertDatabaseHas('users', [
            'email' => 'ana.lopez@example.com',
            'username' => 'custom_unique',
        ]);
    }

    private function csvUpload(string $contents): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'psa-user-import-');
        file_put_contents($path, $contents);

        return new UploadedFile($path, 'employees.csv', 'text/csv', null, true);
    }
}
