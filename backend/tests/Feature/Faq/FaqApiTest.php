<?php

namespace Tests\Feature\Faq;

use App\Enums\UserRole;
use App\Models\Faq;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FaqApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);
        $this->seed(\Database\Seeders\PermissionSeeder::class);
    }

    private function makeAdmin(): User
    {
        $user = User::factory()->create();
        $role = Role::where('name', UserRole::SUPER_ADMINISTRATOR->value)->first();
        $user->roles()->sync([$role->id]);
        return $user;
    }

    private function makeSysAdmin(): User
    {
        $user = User::factory()->create();
        $role = Role::where('name', UserRole::SYSTEM_ADMINISTRATOR->value)->first();
        $user->roles()->sync([$role->id]);
        return $user;
    }

    private function makeEmployee(): User
    {
        $user = User::factory()->create();
        $role = Role::where('name', 'Employee')->first();
        $user->roles()->sync([$role->id]);
        return $user;
    }

    // ─── Visibility ─────────────────────────────────────────────────────────────

    public function test_active_faqs_are_visible_to_authorized_role(): void
    {
        $admin    = $this->makeAdmin();
        $employee = $this->makeEmployee();

        $faq = Faq::create([
            'question'    => 'Employee-visible FAQ',
            'answer'      => 'This FAQ is visible to employees.',
            'category'    => 'General',
            'roles'       => ['Employee'],
            'destination' => '/borrowings',
            'active'      => true,
        ]);

        $response = $this->withToken($employee->createToken('auth')->plainTextToken)
            ->getJson('/api/v1/faqs');

        $response->assertStatus(200);
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertTrue($ids->contains($faq->id));
    }

    public function test_faqs_restricted_to_admin_role_are_not_visible_to_employee(): void
    {
        $admin    = $this->makeAdmin();
        $employee = $this->makeEmployee();

        $faq = Faq::create([
            'question'    => 'Admin-only FAQ',
            'answer'      => 'Only admins should see this FAQ entry.',
            'category'    => 'Administration',
            'roles'       => ['System Administrator'],
            'destination' => '/system-setup',
            'active'      => true,
        ]);

        $response = $this->withToken($employee->createToken('auth')->plainTextToken)
            ->getJson('/api/v1/faqs');

        $response->assertStatus(200);
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertFalse($ids->contains($faq->id));
    }

    public function test_inactive_faqs_are_not_returned_by_public_index(): void
    {
        $employee = $this->makeEmployee();

        Faq::create([
            'question'    => 'Inactive FAQ question',
            'answer'      => 'This FAQ should not be visible because it is inactive.',
            'category'    => 'General',
            'roles'       => ['Employee'],
            'destination' => '/borrowings',
            'active'      => false,
        ]);

        $response = $this->withToken($employee->createToken('auth')->plainTextToken)
            ->getJson('/api/v1/faqs');

        $response->assertStatus(200);
        $questions = collect($response->json('data'))->pluck('question');
        $this->assertFalse($questions->contains('Inactive FAQ question'));
    }

    // ─── Admin index ────────────────────────────────────────────────────────────

    public function test_admin_can_list_all_faqs_including_inactive(): void
    {
        $admin = $this->makeAdmin();

        Faq::create([
            'question'    => 'Hidden inactive FAQ',
            'answer'      => 'This FAQ is inactive and should appear in admin listing.',
            'category'    => 'General',
            'roles'       => [],
            'destination' => '/dashboard',
            'active'      => false,
        ]);

        $response = $this->withToken($admin->createToken('auth')->plainTextToken)
            ->getJson('/api/v1/faqs/admin');

        $response->assertStatus(200);
        $questions = collect($response->json('data'))->pluck('question');
        $this->assertTrue($questions->contains('Hidden inactive FAQ'));
    }

    public function test_employee_cannot_access_admin_faq_index(): void
    {
        $employee = $this->makeEmployee();

        $response = $this->withToken($employee->createToken('auth')->plainTextToken)
            ->getJson('/api/v1/faqs/admin');

        $response->assertStatus(403);
    }

    // ─── Create ─────────────────────────────────────────────────────────────────

    public function test_user_with_manage_faqs_permission_can_create_faq(): void
    {
        $admin = $this->makeAdmin();

        $response = $this->withToken($admin->createToken('auth')->plainTextToken)
            ->postJson('/api/v1/faqs', [
                'question'    => 'How do I test FAQ creation?',
                'answer'      => 'Simply POST to the FAQ endpoint with valid data.',
                'category'    => 'Testing',
                'roles'       => ['Employee'],
                'destination' => '/borrowings',
                'active'      => true,
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('faqs', ['question' => 'How do I test FAQ creation?']);
    }

    public function test_system_administrator_can_create_faq(): void
    {
        $sysAdmin = $this->makeSysAdmin();

        $response = $this->withToken($sysAdmin->createToken('auth')->plainTextToken)
            ->postJson('/api/v1/faqs', [
                'question'    => 'Can system admins create FAQs?',
                'answer'      => 'Yes, they have the manage faqs permission by default.',
                'category'    => 'Testing',
                'roles'       => [],
                'destination' => '/dashboard',
                'active'      => true,
            ]);

        $response->assertStatus(201);
    }

    public function test_employee_cannot_create_faq(): void
    {
        $employee = $this->makeEmployee();

        $response = $this->withToken($employee->createToken('auth')->plainTextToken)
            ->postJson('/api/v1/faqs', [
                'question'    => 'Employee tries to create FAQ',
                'answer'      => 'This should be forbidden by the FaqPolicy.',
                'destination' => '/borrowings',
            ]);

        $response->assertStatus(403);
    }

    // ─── Update ─────────────────────────────────────────────────────────────────

    public function test_user_with_manage_faqs_permission_can_update_faq(): void
    {
        $admin = $this->makeAdmin();

        $faq = Faq::create([
            'question'    => 'Original question text',
            'answer'      => 'Original answer text that is long enough to pass validation.',
            'category'    => 'General',
            'roles'       => [],
            'destination' => '/dashboard',
            'active'      => true,
        ]);

        $response = $this->withToken($admin->createToken('auth')->plainTextToken)
            ->putJson("/api/v1/faqs/{$faq->id}", [
                'question'    => 'Updated question text',
                'answer'      => 'Original answer text that is long enough to pass validation.',
                'category'    => 'General',
                'destination' => '/dashboard',
                'active'      => true,
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('faqs', ['id' => $faq->id, 'question' => 'Updated question text']);
    }

    public function test_employee_cannot_update_faq(): void
    {
        $employee = $this->makeEmployee();

        $faq = Faq::create([
            'question'    => 'Question employee cannot update',
            'answer'      => 'Employees do not have the manage faqs permission.',
            'category'    => 'General',
            'roles'       => ['Employee'],
            'destination' => '/borrowings',
            'active'      => true,
        ]);

        $response = $this->withToken($employee->createToken('auth')->plainTextToken)
            ->putJson("/api/v1/faqs/{$faq->id}", [
                'question'    => 'Question employee cannot update',
                'answer'      => 'Employees do not have the manage faqs permission.',
                'destination' => '/inventory',
                'active'      => true,
            ]);

        $response->assertStatus(403);
    }

    // ─── Delete / Soft Delete ────────────────────────────────────────────────────

    public function test_user_with_manage_faqs_permission_can_soft_delete_faq(): void
    {
        $admin = $this->makeAdmin();

        $faq = Faq::create([
            'question'    => 'FAQ to be soft deleted',
            'answer'      => 'This record will be soft deleted, not permanently removed.',
            'category'    => 'General',
            'roles'       => [],
            'destination' => '/dashboard',
            'active'      => true,
        ]);

        $response = $this->withToken($admin->createToken('auth')->plainTextToken)
            ->deleteJson("/api/v1/faqs/{$faq->id}");

        $response->assertStatus(200);
        $this->assertSoftDeleted('faqs', ['id' => $faq->id]);
    }

    public function test_employee_cannot_delete_faq(): void
    {
        $employee = $this->makeEmployee();

        $faq = Faq::create([
            'question'    => 'FAQ that employee cannot delete',
            'answer'      => 'Deletion requires the manage faqs permission.',
            'category'    => 'General',
            'roles'       => ['Employee'],
            'destination' => '/borrowings',
            'active'      => true,
        ]);

        $response = $this->withToken($employee->createToken('auth')->plainTextToken)
            ->deleteJson("/api/v1/faqs/{$faq->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('faqs', ['id' => $faq->id, 'deleted_at' => null]);
    }

    // ─── Applicable roles persist ────────────────────────────────────────────────

    public function test_applicable_roles_are_stored_and_returned_correctly(): void
    {
        $admin = $this->makeAdmin();

        $response = $this->withToken($admin->createToken('auth')->plainTextToken)
            ->postJson('/api/v1/faqs', [
                'question'    => 'Role persistence FAQ test',
                'answer'      => 'The applicable roles should be stored as a JSON array.',
                'category'    => 'Testing',
                'roles'       => ['Employee', 'Department Head'],
                'destination' => '/borrowings',
                'active'      => true,
            ]);

        $response->assertStatus(201);
        $data = $response->json('data');
        $this->assertEquals(['Employee', 'Department Head'], $data['roles']);

        $faq = Faq::find($data['id']);
        $this->assertEquals(['Employee', 'Department Head'], $faq->roles);
    }

    // ─── Full flow ───────────────────────────────────────────────────────────────

    public function test_system_admin_can_create_faq_and_employee_can_read_it(): void
    {
        $sysAdmin = $this->makeSysAdmin();
        $employee = $this->makeEmployee();

        \Laravel\Sanctum\Sanctum::actingAs($sysAdmin, ['*']);
        $createResponse = $this->postJson('/api/v1/faqs', [
            'question'    => 'How do I borrow a test asset?',
            'answer'      => 'Open Borrowings and select the asset you need before continuing the borrowing flow.',
            'category'    => 'Borrowing',
            'roles'       => ['Employee'],
            'destination' => '/borrowings',
            'keywords'    => ['borrow', 'asset'],
        ]);

        $createResponse->assertStatus(201);
        $faqId = $createResponse->json('data.id');
        $this->assertNotNull($faqId, 'FAQ should have been created with an ID.');

        \Laravel\Sanctum\Sanctum::actingAs($employee, ['*']);
        $listResponse = $this->getJson('/api/v1/faqs');

        $listResponse->assertStatus(200);
        $data = collect($listResponse->json('data'));
        $this->assertTrue(
            $data->contains(fn ($faq) => (int) $faq['id'] === (int) $faqId),
            "Employee FAQ list (ids: {$data->pluck('id')->implode(',')}) should contain newly created FAQ id={$faqId}."
        );
    }
}
