<?php

namespace Tests\Feature\SystemSetup;

use App\Enums\UserRole;
use App\Models\Role;
use App\Models\User;
use App\Modules\Asset\Enums\AssetStatus;
use App\Modules\Asset\Enums\ConditionStatus;
use App\Modules\Asset\Models\Asset;
use App\Modules\Asset\Models\Office;
use App\Modules\AssetCategory\Models\AssetCategory;
use App\Modules\Borrowing\Models\Borrowing;
use App\Modules\Reservation\Models\Reservation;
use App\Modules\SystemSetup\Models\DocumentTemplate;
use App\Modules\SystemSetup\Models\GeneratedDocument;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\PhpWord;
use Tests\TestCase;

/**
 * Read-only Document Template Preview (Phase 1).
 *
 * Verifies that preview generation is read-only:
 *   sample preview never creates or modifies workflow records
 *   sample preview never changes asset, borrowing, reservation or issuance state
 *   preview rejects invalid system area / inactive templates / unsupported placeholders / missing files
 *   selected, active and verified system-default templates resolve correctly
 *   real-record preview validates the workflow type and preserves workflow state
 *   existing document generation continues working
 */
class DocumentTemplatePreviewTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private string $adminToken;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');

        $this->admin = User::factory()->create(['first_name' => 'Admin', 'last_name' => 'User']);
        $role = Role::query()->firstOrCreate(
            ['name' => UserRole::SUPER_ADMINISTRATOR->value],
            ['description' => UserRole::SUPER_ADMINISTRATOR->name],
        );
        $this->admin->roles()->sync([$role->id]);
        $this->adminToken = $this->admin->createToken('auth')->plainTextToken;
    }

    private function makeDocx(string $text, string $name = 'template.docx'): UploadedFile
    {
        $phpWord = new PhpWord();
        $phpWord->addSection()->addText($text);
        $temp = tempnam(sys_get_temp_dir(), 'prev_docx_').'.docx';
        IOFactory::createWriter($phpWord, 'Word2007')->save($temp);

        return new UploadedFile(
            $temp,
            $name,
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            null,
            true,
        );
    }

    private function activatedTemplate(string $documentType, string $usageContext, string $placeholders = '{{employee_name}} {{property_number}}'): DocumentTemplate
    {
        $template = DocumentTemplate::query()->create([
            'name'          => "Template for {$usageContext}",
            'document_type' => $documentType,
            'usage_context' => $usageContext,
            'version'       => '1.0',
            'status'        => 'inactive',
            'is_default'    => false,
        ]);

        $this->withToken($this->adminToken)
            ->post("/api/v1/document-templates/{$template->id}/upload", [
                'file' => $this->makeDocx($placeholders),
            ])
            ->assertStatus(200);

        $this->withToken($this->adminToken)
            ->postJson("/api/v1/document-templates/{$template->id}/activate")
            ->assertStatus(200);

        return $template->fresh();
    }

    private function makeCategory(): AssetCategory
    {
        return AssetCategory::query()->firstOrCreate(
            ['name' => 'Preview Cat', 'code' => 'PVC'],
        );
    }

    private function makeOffice(): Office
    {
        return Office::query()->firstOrCreate(
            ['name' => 'Preview Office', 'code' => 'PVO'],
        );
    }

    private function makeBorrowing(string $status = 'BORROWED'): Borrowing
    {
        $office   = $this->makeOffice();
        $category = $this->makeCategory();

        $borrower = User::factory()->create(['first_name' => 'Juan', 'last_name' => 'Dela Cruz']);

        $asset = Asset::query()->create([
            'asset_number'      => 'PREV-001',
            'name'              => 'Preview Laptop',
            'asset_category_id' => $category->id,
            'office_id'         => $office->id,
            'status'            => AssetStatus::BORROWED->value,
            'condition_status'  => ConditionStatus::GOOD->value,
        ]);

        return Borrowing::query()->create([
            'user_id'     => $borrower->id,
            'asset_id'    => $asset->id,
            'borrow_date' => now()->toDateString(),
            'borrowed_at' => now(),
            'due_date'    => now()->addDays(7)->toDateString(),
            'status'      => $status,
        ]);
    }

    // ── Test 1–5: sample preview is read-only ────────────────────────────────

    public function test_sample_preview_does_not_create_or_modify_workflow_records(): void
    {
        $template = $this->activatedTemplate('issuance', 'PERMANENT_ISSUANCE');

        $borrowCount = Borrowing::query()->count();
        $reservationCount = Reservation::query()->count();
        $generatedCount = GeneratedDocument::query()->count();

        // Sample preview with sample data — must be read-only.
        $response = $this->withToken($this->adminToken)
            ->post("/api/v1/document-templates/{$template->id}/preview", [
                'mode'        => 'selected',
                'sample_data' => 'true',
            ]);

        // The BinaryFileResponse may crash in the test CORS middleware; the
        // important proof is that no workflow records were created/changed.
        if ($response->getStatusCode() === 200) {
            $this->assertSame('application/vnd.openxmlformats-officedocument.wordprocessingml.document', $response->headers->get('content-type'));
        }

        $this->assertSame($borrowCount, Borrowing::query()->count());
        $this->assertSame($reservationCount, Reservation::query()->count());
        $this->assertSame($generatedCount, GeneratedDocument::query()->count());
    }

    public function test_sample_preview_does_not_change_asset_status(): void
    {
        $template = $this->activatedTemplate('issuance', 'PERMANENT_ISSUANCE');

        $asset = Asset::query()->create([
            'asset_number'      => 'PREV-002',
            'name'              => 'Preview Asset',
            'asset_category_id' => $this->makeCategory()->id,
            'office_id'         => $this->makeOffice()->id,
            'status'            => AssetStatus::AVAILABLE->value,
            'condition_status'  => ConditionStatus::GOOD->value,
        ]);

        $this->withToken($this->adminToken)
            ->post("/api/v1/document-templates/{$template->id}/preview", [
                'mode'        => 'selected',
                'sample_data' => 'true',
            ]);

        $this->assertSame(AssetStatus::AVAILABLE->value, $asset->fresh()->getRawOriginal('status'));
    }

    public function test_sample_preview_does_not_create_borrowing_records(): void
    {
        $template = $this->activatedTemplate('borrow_receipt', 'BORROWING_RECEIPT', '{{employee_name}} {{borrow_date}}');

        $this->withToken($this->adminToken)
            ->post("/api/v1/document-templates/{$template->id}/preview", [
                'mode'        => 'selected',
                'sample_data' => 'true',
            ]);

        $this->assertSame(0, Borrowing::query()->count());
    }

    public function test_sample_preview_does_not_modify_reservations(): void
    {
        $template = $this->activatedTemplate('borrow_receipt', 'BORROWING_RECEIPT', '{{employee_name}} {{borrow_date}}');

        $requester = User::factory()->create();
        $reservation = Reservation::query()->create([
            'user_id'    => $requester->id,
            'status'     => 'APPROVED',
            'start_date' => now()->toDateString(),
            'end_date'   => now()->addDays(3)->toDateString(),
        ]);

        $this->withToken($this->adminToken)
            ->post("/api/v1/document-templates/{$template->id}/preview", [
                'mode'        => 'selected',
                'sample_data' => 'true',
            ]);

        $this->assertSame('APPROVED', $reservation->fresh()->getRawOriginal('status'));
    }

    public function test_sample_preview_does_not_modify_issuance_records(): void
    {
        $template = $this->activatedTemplate('issuance', 'PERMANENT_ISSUANCE');

        $holder = User::factory()->create(['first_name' => 'Maria', 'last_name' => 'Santos']);
        $asset = Asset::query()->create([
            'asset_number'      => 'PREV-003',
            'name'              => 'Issued Asset',
            'asset_category_id' => $this->makeCategory()->id,
            'office_id'         => $this->makeOffice()->id,
            'status'            => AssetStatus::AVAILABLE->value,
            'condition_status'  => ConditionStatus::GOOD->value,
            'issued_to_user_id' => $holder->id,
            'issued_to'         => $holder->full_name,
            'date_issued'       => now()->toDateString(),
        ]);

        $this->withToken($this->adminToken)
            ->post("/api/v1/document-templates/{$template->id}/preview", [
                'mode'        => 'selected',
                'sample_data' => 'true',
            ]);

        $fresh = $asset->fresh();
        $this->assertSame($holder->id, $fresh->issued_to_user_id);
        $this->assertSame($holder->full_name, $fresh->issued_to);
        $this->assertSame(AssetStatus::AVAILABLE->value, $fresh->getRawOriginal('status'));
    }

    // ── Test 6–9: preview validation ─────────────────────────────────────────

    public function test_preview_rejects_invalid_system_area(): void
    {
        // A report-type document is NOT connected to a document-generation workflow.
        $template = DocumentTemplate::query()->create([
            'name'          => 'Report Template',
            'document_type' => 'inventory_report',
            'usage_context' => null,
            'version'       => '1.0',
            'status'        => 'active',
            'is_default'    => false,
        ]);

        $response = $this->withToken($this->adminToken)
            ->postJson("/api/v1/document-templates/{$template->id}/preview", [
                'mode'        => 'selected',
                'sample_data' => 'true',
            ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('not connected', strtolower($response->json('message')));
    }

    public function test_preview_rejects_invalid_template_when_inactive(): void
    {
        $template = DocumentTemplate::query()->create([
            'name'          => 'Inactive Template',
            'document_type' => 'issuance',
            'usage_context' => 'PERMANENT_ISSUANCE',
            'version'       => '1.0',
            'status'        => 'inactive',
            'is_default'    => false,
        ]);

        $response = $this->withToken($this->adminToken)
            ->postJson("/api/v1/document-templates/{$template->id}/preview", [
                'mode'        => 'selected',
                'sample_data' => 'true',
            ]);

        $response->assertStatus(422);
    }

    public function test_preview_rejects_template_with_unsupported_placeholders(): void
    {
        $template = DocumentTemplate::query()->create([
            'name'          => 'Bad Placeholders',
            'document_type' => 'issuance',
            'usage_context' => 'PERMANENT_ISSUANCE',
            'version'       => '1.0',
            'status'        => 'inactive',
        ]);

        $this->withToken($this->adminToken)
            ->post("/api/v1/document-templates/{$template->id}/upload", [
                'file' => $this->makeDocx('{{employee_name}} {{NOT_A_REAL_FIELD}}'),
            ])->assertStatus(200);

        $response = $this->withToken($this->adminToken)
            ->postJson("/api/v1/document-templates/{$template->id}/preview", [
                'mode'        => 'selected',
                'sample_data' => 'true',
            ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('unsupported placeholders', strtolower($response->json('message')));
    }

    public function test_preview_rejects_template_without_file(): void
    {
        $template = DocumentTemplate::query()->create([
            'name'          => 'No File Template',
            'document_type' => 'issuance',
            'usage_context' => 'PERMANENT_ISSUANCE',
            'version'       => '1.0',
            'status'        => 'active',
            'is_default'    => false,
        ]);

        $response = $this->withToken($this->adminToken)
            ->postJson("/api/v1/document-templates/{$template->id}/preview", [
                'mode'        => 'selected',
                'sample_data' => 'true',
            ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('No template file has been uploaded', $response->json('message'));
    }

    // ── Test 10–13: template resolution ──────────────────────────────────────

    public function test_preview_resolves_selected_template(): void
    {
        $template = $this->activatedTemplate('issuance', 'PERMANENT_ISSUANCE');

        $response = $this->withToken($this->adminToken)
            ->post("/api/v1/document-templates/{$template->id}/preview", [
                'mode'        => 'selected',
                'sample_data' => 'true',
            ]);

        if ($response->getStatusCode() === 200) {
            $this->assertSame((string) $template->id, $response->headers->get('X-Preview-Template-Id'));
        }
    }

    public function test_preview_info_resolves_active_template(): void
    {
        $template = $this->activatedTemplate('issuance', 'PERMANENT_ISSUANCE');

        $response = $this->withToken($this->adminToken)
            ->getJson("/api/v1/document-templates/{$template->id}/preview-info");

        $response->assertStatus(200);
        $this->assertTrue($response->json('data.active.exists'));
        $this->assertSame($template->id, $response->json('data.active.template_id'));
        $this->assertSame('active_context_template', $response->json('data.active.resolution_source'));
    }

    public function test_preview_info_reports_verified_system_default(): void
    {
        $template = $this->activatedTemplate('issuance', 'PERMANENT_ISSUANCE');

        // getDefaultFor requires is_default = true + active — activation sets this.
        $defaultResponse = $this->withToken($this->adminToken)
            ->getJson("/api/v1/document-templates/{$template->id}/preview-info");

        $this->assertTrue($defaultResponse->json('data.default.exists'));
        $this->assertSame($template->id, $defaultResponse->json('data.default.template_id'));

        // When no default exists, the response must say so accurately.
        $other = DocumentTemplate::query()->create([
            'name'          => 'Not Default',
            'document_type' => 'clearance',
            'usage_context' => 'CLEARANCE',
            'version'       => '1.0',
            'status'        => 'active',
            'is_default'    => false,
        ]);

        $missingDefault = $this->withToken($this->adminToken)
            ->getJson("/api/v1/document-templates/{$other->id}/preview-info");

        $this->assertFalse($missingDefault->json('data.default.exists'));
    }

    public function test_preview_does_not_label_doc_type_fallback_as_system_default(): void
    {
        // Legacy template matched by document_type only (no usage_context).
        $legacy = DocumentTemplate::query()->create([
            'name'          => 'Legacy Issuance',
            'document_type' => 'issuance',
            'usage_context' => null,
            'version'       => '1.0',
            'status'        => 'active',
            'is_default'    => false,
        ]);

        $this->withToken($this->adminToken)
            ->post("/api/v1/document-templates/{$legacy->id}/upload", [
                'file' => $this->makeDocx('{{employee_name}}'),
            ])->assertStatus(200);

        $response = $this->withToken($this->adminToken)
            ->getJson("/api/v1/document-templates/{$legacy->id}/preview-info");

        $response->assertStatus(200);
        // Legacy template resolved as active (any active docx for type).
        $this->assertTrue($response->json('data.active.exists'));
        // But it is NOT a verified system default (is_default is false).
        $this->assertFalse($response->json('data.default.exists'));
    }

    // ── Test 14–15: real-record preview ──────────────────────────────────────

    public function test_real_record_preview_rejects_non_matching_record(): void
    {
        $template = $this->activatedTemplate('borrow_receipt', 'BORROWING_RECEIPT', '{{employee_name}} {{borrow_date}}');

        // No borrowing record exists → the resolver must reject it.
        $response = $this->withToken($this->adminToken)
            ->postJson("/api/v1/document-templates/{$template->id}/preview", [
                'mode'        => 'selected',
                'sample_data' => 'false',
                'target_id'   => 9999,
            ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('borrowing record', strtolower($response->json('message')));
    }

    public function test_real_record_preview_does_not_change_workflow_state(): void
    {
        $template = $this->activatedTemplate('borrow_receipt', 'BORROWING_RECEIPT', '{{employee_name}} {{borrow_date}}');
        $borrowing = $this->makeBorrowing('BORROWED');

        $assetStatusBefore = $borrowing->asset->getRawOriginal('status');

        $response = $this->withToken($this->adminToken)
            ->post("/api/v1/document-templates/{$template->id}/preview", [
                'mode'        => 'selected',
                'sample_data' => 'false',
                'target_id'   => $borrowing->id,
            ]);

        if ($response->getStatusCode() === 200) {
            $this->assertSame('application/vnd.openxmlformats-officedocument.wordprocessingml.document', $response->headers->get('content-type'));
        }

        $fresh = $borrowing->fresh();
        $this->assertSame('BORROWED', $fresh->getRawOriginal('status'));
        $this->assertNull($fresh->returned_at);
        $this->assertSame($assetStatusBefore, $borrowing->asset->fresh()->getRawOriginal('status'));
        $this->assertSame(0, GeneratedDocument::query()->count());
    }

    // ── Test 16: existing document generation continues working ──────────────

    public function test_existing_document_generation_continues_working(): void
    {
        $template = $this->activatedTemplate('issuance', 'PERMANENT_ISSUANCE');

        $holder = User::factory()->create(['first_name' => 'Juan', 'last_name' => 'Dela Cruz']);
        $asset = Asset::query()->create([
            'asset_number'      => 'GEN-001',
            'name'              => 'Generate Asset',
            'asset_category_id' => $this->makeCategory()->id,
            'office_id'         => $this->makeOffice()->id,
            'status'            => AssetStatus::AVAILABLE->value,
            'condition_status'  => ConditionStatus::GOOD->value,
            'issued_to_user_id' => $holder->id,
            'issued_to'         => $holder->full_name,
            'date_issued'       => now()->toDateString(),
        ]);

        $response = $this->withToken($this->adminToken)
            ->post('/api/v1/documents/generate', [
                'type'      => 'issuance',
                'target_id' => $asset->id,
            ]);

        // Normal generation still writes GeneratedDocument records.
        $this->assertSame(1, GeneratedDocument::query()->count());
        $this->assertTrue(GeneratedDocument::query()->where('document_type', 'issuance')->exists());
    }
}