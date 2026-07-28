<?php

namespace Tests\Feature\SystemSetup;

use App\Enums\UserRole;
use App\Models\Role;
use App\Models\User;
use App\Modules\SystemSetup\Models\DocumentTemplate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DocumentTemplateTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private string $adminToken;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');

        $this->admin = User::factory()->create();
        $adminRole = Role::query()->firstOrCreate(
            ['name' => UserRole::SUPER_ADMINISTRATOR->value],
            ['description' => UserRole::SUPER_ADMINISTRATOR->name],
        );
        $this->admin->roles()->sync([$adminRole->id]);
        $this->adminToken = $this->admin->createToken('auth')->plainTextToken;
    }

    public function test_admin_can_list_document_templates(): void
    {
        DocumentTemplate::query()->create([
            'name' => 'Inventory Excel',
            'document_type' => 'excel_export',
            'version' => '1.0',
            'status' => 'active',
            'is_default' => true,
            'file_path' => 'templates/excel_export/test.xlsx',
            'file_name' => 'test.xlsx',
            'file_size' => 1024,
            'mime_type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'extension' => 'xlsx',
            'upload_date' => now(),
        ]);

        $response = $this->withToken($this->adminToken)
            ->getJson('/api/v1/document-templates');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Document templates retrieved successfully.',
            ]);

        $this->assertCount(1, $response->json('data.items'));
    }

    public function test_admin_can_upload_template(): void
    {
        $file = UploadedFile::fake()->create('template.xlsx', 100, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        $response = $this->withToken($this->adminToken)
            ->postJson('/api/v1/document-templates', [
                'name' => 'Inventory Export',
                'document_type' => 'excel_export',
                'description' => 'Default inventory export template',
                'version' => '1.0',
                'is_default' => true,
                'file' => $file,
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Template uploaded successfully.',
            ]);

        $this->assertDatabaseHas('document_templates', [
            'name' => 'Inventory Export',
            'document_type' => 'excel_export',
            'is_default' => true,
        ]);

        Storage::disk('local')->assertExists(
            $response->json('data.file_path')
        );
    }

    public function test_admin_can_update_template(): void
    {
        $template = DocumentTemplate::query()->create([
            'name' => 'Old Name',
            'document_type' => 'excel_export',
            'version' => '1.0',
            'status' => 'active',
            'is_default' => false,
            'file_path' => 'templates/excel_export/test.xlsx',
            'file_name' => 'test.xlsx',
            'file_size' => 1024,
            'upload_date' => now(),
        ]);

        $response = $this->withToken($this->adminToken)
            ->putJson("/api/v1/document-templates/{$template->id}", [
                'name' => 'Updated Name',
                'description' => 'Updated description',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Template updated successfully.',
            ]);

        $this->assertDatabaseHas('document_templates', [
            'id' => $template->id,
            'name' => 'Updated Name',
            'description' => 'Updated description',
        ]);
    }

    public function test_admin_can_delete_template(): void
    {
        $template = DocumentTemplate::query()->create([
            'name' => 'To Delete',
            'document_type' => 'excel_export',
            'version' => '1.0',
            'status' => 'active',
            'is_default' => false,
            'file_path' => 'templates/excel_export/test.xlsx',
            'file_name' => 'test.xlsx',
            'file_size' => 1024,
            'upload_date' => now(),
        ]);

        $response = $this->withToken($this->adminToken)
            ->deleteJson("/api/v1/document-templates/{$template->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Template deleted successfully.',
            ]);

        $this->assertSoftDeleted('document_templates', [
            'id' => $template->id,
        ]);
    }

    public function test_admin_can_set_default_template(): void
    {
        $template1 = DocumentTemplate::query()->create([
            'name' => 'Template 1',
            'document_type' => 'excel_export',
            'version' => '1.0',
            'status' => 'active',
            'is_default' => true,
            'file_path' => 'templates/excel_export/test1.xlsx',
            'file_name' => 'test1.xlsx',
            'file_size' => 1024,
            'upload_date' => now(),
        ]);

        $template2 = DocumentTemplate::query()->create([
            'name' => 'Template 2',
            'document_type' => 'excel_export',
            'version' => '1.0',
            'status' => 'active',
            'is_default' => false,
            'file_path' => 'templates/excel_export/test2.xlsx',
            'file_name' => 'test2.xlsx',
            'file_size' => 1024,
            'upload_date' => now(),
        ]);

        $response = $this->withToken($this->adminToken)
            ->postJson("/api/v1/document-templates/{$template2->id}/set-default");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Default template set successfully.',
            ]);

        $this->assertDatabaseHas('document_templates', [
            'id' => $template2->id,
            'is_default' => true,
        ]);

        $this->assertDatabaseHas('document_templates', [
            'id' => $template1->id,
            'is_default' => false,
        ]);
    }

    public function test_admin_can_toggle_status(): void
    {
        $template = DocumentTemplate::query()->create([
            'name' => 'Status Test',
            'document_type' => 'excel_export',
            'version' => '1.0',
            'status' => 'active',
            'is_default' => false,
            'file_path' => 'templates/excel_export/test.xlsx',
            'file_name' => 'test.xlsx',
            'file_size' => 1024,
            'upload_date' => now(),
        ]);

        $response = $this->withToken($this->adminToken)
            ->postJson("/api/v1/document-templates/{$template->id}/toggle-status");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Template status toggled successfully.',
            ]);

        $this->assertDatabaseHas('document_templates', [
            'id' => $template->id,
            'status' => 'inactive',
        ]);
    }

    public function test_admin_can_duplicate_template(): void
    {
        $template = DocumentTemplate::query()->create([
            'name' => 'Original',
            'document_type' => 'excel_export',
            'version' => '1.0',
            'status' => 'active',
            'is_default' => false,
            'file_path' => 'templates/excel_export/test.xlsx',
            'file_name' => 'test.xlsx',
            'file_size' => 1024,
            'upload_date' => now(),
        ]);

        $response = $this->withToken($this->adminToken)
            ->postJson("/api/v1/document-templates/{$template->id}/duplicate");

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Template duplicated successfully.',
            ]);

        $this->assertDatabaseHas('document_templates', [
            'name' => 'Original (Copy)',
            'document_type' => 'excel_export',
            'version' => '1.1',
        ]);
    }

    public function test_admin_can_get_document_types(): void
    {
        $response = $this->withToken($this->adminToken)
            ->getJson('/api/v1/document-templates/types');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Document types retrieved successfully.',
            ]);

        $types = $response->json('data');
        $this->assertNotEmpty($types);
        $this->assertContains(['value' => 'excel_export', 'label' => 'Excel Export', 'category' => 'Exports'], $types);
    }

    public function test_non_admin_cannot_upload_template(): void
    {
        $employee = User::factory()->create();
        $employeeRole = Role::query()->firstOrCreate(
            ['name' => UserRole::EMPLOYEE->value],
            ['description' => UserRole::EMPLOYEE->name],
        );
        $employee->roles()->sync([$employeeRole->id]);
        $token = $employee->createToken('auth')->plainTextToken;

        $file = UploadedFile::fake()->create('template.xlsx', 100);

        $response = $this->withToken($token)
            ->postJson('/api/v1/document-templates', [
                'name' => 'Test',
                'document_type' => 'excel_export',
                'file' => $file,
            ]);

        $response->assertStatus(403);
    }

    public function test_non_admin_can_list_templates(): void
    {
        $response = $this->withToken($this->adminToken)
            ->getJson('/api/v1/document-templates');

        $response->assertStatus(200);
    }

    public function test_guest_cannot_access_templates(): void
    {
        $response = $this->getJson('/api/v1/document-templates');

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Unauthenticated.',
            ]);
    }

    public function test_inventory_export_still_works_without_template(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        \App\Modules\Inventory\Models\InventoryItem::query()->create([
            'name' => 'Test Item',
            'sku' => 'TEST-001',
            'quantity' => 10,
            'unit' => 'piece',
            'reorder_level' => 5,
        ]);

        $response = $this->withToken($token)
            ->get('/api/v1/inventory/export/download');

        $response->assertOk();
        $this->assertStringContainsString(
            'attachment; filename=inventory-export-',
            $response->headers->get('content-disposition'),
        );
    }
}
