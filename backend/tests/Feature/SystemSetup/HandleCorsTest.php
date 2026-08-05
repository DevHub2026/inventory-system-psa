<?php

namespace Tests\Feature\SystemSetup;

use App\Enums\UserRole;
use App\Http\Middleware\HandleCors;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Tests\TestCase;

/**
 * Verifies the custom HandleCors middleware works with every response type
 * the application produces, including Symfony BinaryFileResponse (DOCX
 * previews, generated documents, XLSX/CSV exports).
 *
 * Regression for the crash where the middleware called the Illuminate-only
 * header() method on a Symfony BinaryFileResponse, which does not define it.
 */
class HandleCorsTest extends TestCase
{
    use RefreshDatabase;

    private HandleCors $middleware;

    protected function setUp(): void
    {
        parent::setUp();
        $this->middleware = new HandleCors();
    }

    private function assertCorsHeadersPresent($response): void
    {
        $this->assertSame('*', $response->headers->get('Access-Control-Allow-Origin'));
        $this->assertSame(
            'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            $response->headers->get('Access-Control-Allow-Methods')
        );
        $this->assertSame(
            'Content-Type, Accept, Authorization, X-Requested-With, X-CSRF-TOKEN',
            $response->headers->get('Access-Control-Allow-Headers')
        );
        $this->assertSame('86400', $response->headers->get('Access-Control-Max-Age'));
    }

    public function test_binary_file_response_passes_through_handle_cors_without_crash(): void
    {
        // Create a real temp file to serve as a BinaryFileResponse.
        $temp = tempnam(sys_get_temp_dir(), 'cors_').'.docx';
        file_put_contents($temp, 'fake docx content');

        $request = Request::create('/api/v1/documents/generate', 'POST');

        $response = $this->middleware->handle($request, function () use ($temp) {
            return new BinaryFileResponse($temp, 200, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition' => 'attachment; filename="preview.docx"',
            ]);
        });

        // The middleware must NOT throw; the response must be a BinaryFileResponse.
        $this->assertInstanceOf(BinaryFileResponse::class, $response);
        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame(
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            $response->headers->get('Content-Type')
        );
        $this->assertStringContainsString('attachment; filename="preview.docx"', $response->headers->get('Content-Disposition'));

        // CORS headers must be present.
        $this->assertCorsHeadersPresent($response);

        @unlink($temp);
    }

    public function test_illuminate_json_response_still_receives_cors_headers(): void
    {
        $request = Request::create('/api/v1/document-templates', 'GET');

        $response = $this->middleware->handle($request, function () {
            return response()->json(['success' => true, 'data' => []], 200);
        });

        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertSame(200, $response->getStatusCode());
        $this->assertCorsHeadersPresent($response);
        $this->assertStringContainsString('"success":true', $response->getContent());
    }

    public function test_preflight_options_request_returns_cors_headers(): void
    {
        $request = Request::create('/api/v1/document-templates', 'OPTIONS');

        $response = $this->middleware->handle($request, function () {
            return response('', 200);
        });

        $this->assertSame(200, $response->getStatusCode());
        $this->assertCorsHeadersPresent($response);
    }

    public function test_binary_file_response_preserves_download_headers_after_cors(): void
    {
        $temp = tempnam(sys_get_temp_dir(), 'cors_export_').'.xlsx';
        file_put_contents($temp, 'fake xlsx content');

        $request = Request::create('/api/v1/reports/export', 'GET');

        $response = $this->middleware->handle($request, function () use ($temp) {
            return new BinaryFileResponse($temp, 200, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition' => 'attachment; filename="report.xlsx"',
            ]);
        });

        $this->assertInstanceOf(BinaryFileResponse::class, $response);
        $this->assertSame(
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            $response->headers->get('Content-Type')
        );
        $this->assertStringContainsString('attachment; filename="report.xlsx"', $response->headers->get('Content-Disposition'));
        $this->assertCorsHeadersPresent($response);

        @unlink($temp);
    }

    public function test_real_docx_preview_endpoint_no_longer_crashes_handle_cors(): void
    {
        Storage::fake('local');

        $admin = User::factory()->create(['first_name' => 'Admin', 'last_name' => 'User']);
        $role = Role::query()->firstOrCreate(
            ['name' => UserRole::SUPER_ADMINISTRATOR->value],
            ['description' => UserRole::SUPER_ADMINISTRATOR->name],
        );
        $admin->roles()->sync([$role->id]);
        $token = $admin->createToken('auth')->plainTextToken;

        // Build a valid DOCX template.
        $phpWord = new \PhpOffice\PhpWord\PhpWord();
        $phpWord->addSection()->addText('{{employee_name}} {{borrow_date}}');
        $temp = tempnam(sys_get_temp_dir(), 'cors_docx_').'.docx';
        \PhpOffice\PhpWord\IOFactory::createWriter($phpWord, 'Word2007')->save($temp);

        $template = \App\Modules\SystemSetup\Models\DocumentTemplate::query()->create([
            'name'          => 'CORS Preview Template',
            'document_type' => 'borrow_receipt',
            'usage_context' => 'BORROWING_RECEIPT',
            'version'       => '1.0',
            'status'        => 'inactive',
            'is_default'    => false,
        ]);

        $this->withToken($token)
            ->post("/api/v1/document-templates/{$template->id}/upload", [
                'file' => new \Illuminate\Http\UploadedFile($temp, 'template.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', null, true),
            ])->assertStatus(200);

        $this->withToken($token)
            ->postJson("/api/v1/document-templates/{$template->id}/activate")
            ->assertStatus(200);

        // The preview endpoint returns a BinaryFileResponse. Before the fix this
        // crashed in HandleCors with "Call to undefined method ...::header()".
        $response = $this->withToken($token)
            ->post("/api/v1/document-templates/{$template->id}/preview", [
                'mode'        => 'selected',
                'sample_data' => 'true',
            ]);

        // The middleware must not throw. The response should be a successful
        // binary download with CORS headers.
        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame(
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            $response->headers->get('Content-Type')
        );
        $this->assertSame('*', $response->headers->get('Access-Control-Allow-Origin'));

        @unlink($temp);
    }
}