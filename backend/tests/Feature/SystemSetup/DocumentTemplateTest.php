<?php

namespace Tests\Feature\SystemSetup;

use App\Enums\UserRole;
use App\Models\Role;
use App\Models\User;
use App\Modules\Asset\Enums\AssetStatus;
use App\Modules\Asset\Enums\ConditionStatus;
use App\Modules\Asset\Enums\IdentifierType;
use App\Modules\Asset\Models\Asset;
use App\Modules\Asset\Models\Manufacturer;
use App\Modules\Asset\Models\Office;
use App\Modules\AssetCategory\Models\AssetCategory;
use App\Modules\AssetIdentifier\Models\AssetIdentifier;
use App\Modules\Report\Services\DocumentDataResolver;
use App\Modules\SystemSetup\Models\DocumentTemplate;
use App\Modules\SystemSetup\Models\DocumentTemplateVersion;
use App\Modules\SystemSetup\Models\GeneratedDocument;
use App\Modules\SystemSetup\Services\PlaceholderRegistry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\IOFactory;
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

        $this->admin = User::factory()->create([
            'first_name' => 'Admin',
            'last_name' => 'User',
        ]);
        $adminRole = Role::query()->firstOrCreate(
            ['name' => UserRole::SUPER_ADMINISTRATOR->value],
            ['description' => UserRole::SUPER_ADMINISTRATOR->name],
        );
        $this->admin->roles()->sync([$adminRole->id]);
        $this->adminToken = $this->admin->createToken('auth')->plainTextToken;
    }

    private function makeDocx(string $text, string $name = 'template.docx'): UploadedFile
    {
        $phpWord = new PhpWord;
        $section = $phpWord->addSection();
        $section->addText($text);

        $temp = tempnam(sys_get_temp_dir(), 'docx_').'.docx';
        IOFactory::createWriter($phpWord, 'Word2007')->save($temp);

        return new UploadedFile($temp, $name, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', null, true);
    }

    public function test_admin_can_list_document_templates(): void
    {
        DocumentTemplate::query()->create([
            'name' => 'PAR Template',
            'document_type' => 'issuance',
            'version' => '1.0',
            'status' => 'inactive',
            'is_default' => false,
            'file_path' => null,
            'file_name' => null,
            'file_size' => 0,
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

    public function test_admin_can_create_docx_template_metadata(): void
    {
        $response = $this->withToken($this->adminToken)
            ->postJson('/api/v1/document-templates', [
                'name' => 'PAR Official',
                'document_type' => 'issuance',
                'description' => 'Official PAR DOCX',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Template created successfully.',
            ]);

        $this->assertDatabaseHas('document_templates', [
            'name' => 'PAR Official',
            'document_type' => 'issuance',
            'status' => 'inactive',
        ]);
    }

    public function test_admin_can_upload_valid_docx_and_validate_placeholders(): void
    {
        $template = DocumentTemplate::query()->create([
            'name' => 'PAR Official',
            'document_type' => 'issuance',
            'version' => '1.0',
            'status' => 'inactive',
            'is_default' => false,
        ]);

        $file = $this->makeDocx('Employee: {{employee_name}} Property: {{property_number}} Serial: {{serial_number}}');

        $response = $this->withToken($this->adminToken)
            ->post('/api/v1/document-templates/'.$template->id.'/upload', [
                'file' => $file,
                'change_notes' => 'Initial DOCX',
            ]);

        $response->assertStatus(200);
        $this->assertTrue($response->json('data.has_file'));
        $this->assertSame('valid', $response->json('data.validation_status'));
        $this->assertFalse($response->json('data.has_unknown_placeholders'));
        $this->assertNotEmpty($response->json('data.validation_result.valid'));
    }

    public function test_unknown_placeholders_are_detected_and_block_activation(): void
    {
        $template = DocumentTemplate::query()->create([
            'name' => 'PAR Official',
            'document_type' => 'issuance',
            'version' => '1.0',
            'status' => 'inactive',
        ]);

        $file = $this->makeDocx('Bad token {{employee_position}} and good {{employee_name}}');

        $upload = $this->withToken($this->adminToken)
            ->post('/api/v1/document-templates/'.$template->id.'/upload', [
                'file' => $file,
            ]);

        $upload->assertStatus(200);
        $this->assertTrue($upload->json('data.has_unknown_placeholders'));
        $this->assertContains('employee_position', $upload->json('data.validation_result.unknown'));

        $activate = $this->withToken($this->adminToken)
            ->postJson('/api/v1/document-templates/'.$template->id.'/activate');

        $activate->assertStatus(422);
    }

    public function test_non_docx_files_are_rejected_for_official_templates(): void
    {
        $template = DocumentTemplate::query()->create([
            'name' => 'PAR Official',
            'document_type' => 'issuance',
            'version' => '1.0',
            'status' => 'inactive',
        ]);

        $file = UploadedFile::fake()->create('notes.pdf', 100, 'application/pdf');

        $response = $this->withToken($this->adminToken)
            ->post('/api/v1/document-templates/'.$template->id.'/upload', [
                'file' => $file,
            ]);

        $response->assertStatus(422);
    }

    public function test_placeholder_registry_endpoint(): void
    {
        $response = $this->withToken($this->adminToken)
            ->getJson('/api/v1/document-templates/placeholders');

        $response->assertStatus(200);
        $keys = collect($response->json('data'))->pluck('key')->all();
        $this->assertContains('employee_name', $keys);
        $this->assertContains('property_number', $keys);
        $this->assertContains('serial_number', $keys);
        $this->assertNotContains('employee_position', $keys);
    }

    public function test_replace_retains_previous_version(): void
    {
        $template = DocumentTemplate::query()->create([
            'name' => 'PAR Official',
            'document_type' => 'issuance',
            'version' => '1.0',
            'status' => 'inactive',
        ]);

        $this->withToken($this->adminToken)
            ->post('/api/v1/document-templates/'.$template->id.'/upload', [
                'file' => $this->makeDocx('V1 {{employee_name}}'),
            ])->assertStatus(200);

        $this->withToken($this->adminToken)
            ->post('/api/v1/document-templates/'.$template->id.'/replace', [
                'file' => $this->makeDocx('V2 {{employee_name}} {{property_number}}'),
                'change_notes' => 'Second version',
            ])->assertStatus(200);

        $this->assertGreaterThanOrEqual(2, DocumentTemplateVersion::query()->where('document_template_id', $template->id)->count());
        $this->assertNotSame('1.0', $template->fresh()->version);
    }

    public function test_generate_docx_uses_identifier_serial_and_does_not_overwrite_source(): void
    {
        $office = Office::query()->create(['name' => 'RSSO XII', 'code' => 'R12']);
        $category = AssetCategory::query()->create(['name' => 'IT Equipment', 'code' => 'IT']);
        $manufacturer = Manufacturer::query()->create(['name' => 'Dell']);

        $asset = Asset::query()->create([
            'asset_number' => 'PSA-001',
            'name' => 'Laptop',
            'description' => 'Work laptop',
            'asset_category_id' => $category->id,
            'manufacturer_id' => $manufacturer->id,
            'office_id' => $office->id,
            'status' => AssetStatus::AVAILABLE->value,
            'condition_status' => ConditionStatus::GOOD->value,
            'issued_to' => 'Juan Dela Cruz',
            'date_issued' => now()->toDateString(),
        ]);

        AssetIdentifier::query()->create([
            'asset_id' => $asset->id,
            'identifier_type' => IdentifierType::SERIAL_NUMBER->value,
            'identifier_value' => 'SN-999',
            'is_primary' => true,
        ]);

        $template = DocumentTemplate::query()->create([
            'name' => 'PAR Official',
            'document_type' => 'issuance',
            'version' => '1.0',
            'status' => 'inactive',
        ]);

        $this->withToken($this->adminToken)
            ->post('/api/v1/document-templates/'.$template->id.'/upload', [
                'file' => $this->makeDocx('Name {{employee_name}} Prop {{property_number}} Serial {{serial_number}}'),
            ])->assertStatus(200);

        $this->withToken($this->adminToken)
            ->postJson('/api/v1/document-templates/'.$template->id.'/activate')
            ->assertStatus(200);

        $sourcePath = $template->fresh()->file_path;
        $sourceHash = Storage::disk('local')->get($sourcePath);

        $response = $this->withToken($this->adminToken)
            ->post('/api/v1/documents/generate', [
                'type' => 'issuance',
                'target_id' => $asset->id,
            ]);

        $response->assertOk();
        $this->assertStringContainsString(
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            (string) $response->headers->get('content-type'),
        );

        $this->assertSame($sourceHash, Storage::disk('local')->get($sourcePath));
        $this->assertDatabaseCount('generated_documents', 1);
        $this->assertTrue(GeneratedDocument::query()->where('document_type', 'issuance')->exists());
    }

    public function test_generate_fails_without_active_docx_template(): void
    {
        $response = $this->withToken($this->adminToken)
            ->postJson('/api/v1/documents/generate', [
                'type' => 'issuance',
                'target_id' => 1,
            ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('No active DOCX template', $response->json('message'));
    }

    public function test_non_admin_cannot_manage_templates(): void
    {
        $employee = User::factory()->create();
        $employeeRole = Role::query()->firstOrCreate(
            ['name' => UserRole::EMPLOYEE->value],
            ['description' => UserRole::EMPLOYEE->name],
        );
        $employee->roles()->sync([$employeeRole->id]);
        $token = $employee->createToken('auth')->plainTextToken;

        $response = $this->withToken($token)
            ->postJson('/api/v1/document-templates', [
                'name' => 'Test',
                'document_type' => 'issuance',
            ]);

        $response->assertStatus(403);
    }

    public function test_guest_cannot_access_templates(): void
    {
        $response = $this->getJson('/api/v1/document-templates');

        $response->assertStatus(401);
    }

    public function test_legacy_aliases_are_supported_in_registry(): void
    {
        $keys = PlaceholderRegistry::allKeys();
        $this->assertContains('asset_code', $keys);
        $this->assertContains('asset_number', $keys);
        $this->assertContains('property_number', $keys);
        $this->assertContains('department', $keys);
        $this->assertContains('department_name', $keys);
        $this->assertContains('issued_date', $keys);
        $this->assertContains('date_issued', $keys);
    }

    public function test_document_data_resolver_prefers_assets_property_number_over_legacy_identifier(): void
    {
        $office = Office::query()->create(['name' => 'Resolver Office A', 'code' => 'ROA']);
        $category = AssetCategory::query()->create(['name' => 'Resolver Category A', 'code' => 'RCA']);
        $manufacturer = Manufacturer::query()->create(['name' => 'Resolver Maker A']);

        $asset = Asset::query()->create([
            'asset_number' => 'AST-DOC-001',
            'property_number' => 'PROP-COLUMN-001',
            'name' => 'Resolver Asset One',
            'asset_category_id' => $category->id,
            'manufacturer_id' => $manufacturer->id,
            'office_id' => $office->id,
            'status' => AssetStatus::AVAILABLE->value,
            'condition_status' => ConditionStatus::GOOD->value,
        ]);

        AssetIdentifier::query()->create([
            'asset_id' => $asset->id,
            'identifier_type' => IdentifierType::PROPERTY_NUMBER->value,
            'identifier_value' => 'PROP-LEGACY-001',
            'is_primary' => true,
        ]);

        $resolved = app(DocumentDataResolver::class)->resolve('issuance', $asset->id);

        $this->assertSame('AST-DOC-001', $resolved['asset_number']);
        $this->assertSame('AST-DOC-001', $resolved['asset_code']);
        $this->assertSame('PROP-COLUMN-001', $resolved['property_number']);
    }

    public function test_document_data_resolver_uses_legacy_property_identifier_only_when_column_is_null(): void
    {
        $office = Office::query()->create(['name' => 'Resolver Office B', 'code' => 'ROB']);
        $category = AssetCategory::query()->create(['name' => 'Resolver Category B', 'code' => 'RCB']);
        $manufacturer = Manufacturer::query()->create(['name' => 'Resolver Maker B']);

        $asset = Asset::query()->create([
            'asset_number' => 'AST-DOC-002',
            'property_number' => null,
            'name' => 'Resolver Asset Two',
            'asset_category_id' => $category->id,
            'manufacturer_id' => $manufacturer->id,
            'office_id' => $office->id,
            'status' => AssetStatus::AVAILABLE->value,
            'condition_status' => ConditionStatus::GOOD->value,
        ]);

        AssetIdentifier::query()->create([
            'asset_id' => $asset->id,
            'identifier_type' => IdentifierType::PROPERTY_NUMBER->value,
            'identifier_value' => 'PROP-LEGACY-002',
            'is_primary' => true,
        ]);

        $resolved = app(DocumentDataResolver::class)->resolve('issuance', $asset->id);

        $this->assertSame('AST-DOC-002', $resolved['asset_number']);
        $this->assertSame('PROP-LEGACY-002', $resolved['property_number']);
    }

    public function test_excel_export_upload_still_works(): void
    {
        $file = UploadedFile::fake()->create(
            'template.xlsx',
            100,
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );

        $response = $this->withToken($this->adminToken)
            ->post('/api/v1/document-templates', [
                'name' => 'Inventory Export',
                'document_type' => 'excel_export',
                'description' => 'Default inventory export template',
                'file' => $file,
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('document_templates', [
            'name' => 'Inventory Export',
            'document_type' => 'excel_export',
        ]);
    }
}
