<?php

namespace App\Modules\SystemSetup\Controllers;

use App\Modules\Asset\Traits\RespondsWithJson;
use App\Modules\SystemSetup\Enums\DocumentType;
use App\Modules\SystemSetup\Models\DocumentTemplate;
use App\Modules\SystemSetup\Models\DocumentTemplateVersion;
use App\Modules\SystemSetup\Requests\StoreDocumentTemplateRequest;
use App\Modules\SystemSetup\Requests\UpdateDocumentTemplateRequest;
use App\Modules\SystemSetup\Requests\UploadDocumentTemplateRequest;
use App\Modules\SystemSetup\Services\DocumentTemplateService;
use App\Modules\SystemSetup\Services\PlaceholderRegistry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class DocumentTemplateController extends Controller
{
    use RespondsWithJson;

    public function __construct(private readonly DocumentTemplateService $templateService) {}

    private function transform(DocumentTemplate $template): array
    {
        $template->loadMissing(['uploader', 'createdByUser', 'updatedByUser']);

        $typeValue = $template->document_type instanceof DocumentType
            ? $template->document_type->value
            : (string) $template->document_type;

        return [
            'id' => $template->id,
            'name' => $template->name,
            'document_type' => $typeValue,
            'document_type_label' => $template->document_type instanceof DocumentType
                ? $template->document_type->label()
                : DocumentType::tryFrom($typeValue)?->label() ?? $typeValue,
            'category' => $template->document_type instanceof DocumentType
                ? $template->document_type->category()
                : DocumentType::tryFrom($typeValue)?->category() ?? 'Other',
            'description' => $template->description,
            'version' => $template->version,
            'status' => $template->status instanceof \BackedEnum
                ? $template->status->value
                : $template->status,
            'status_label' => $template->status_label,
            'is_default' => $template->is_default,
            'file_name' => $template->file_name,
            'file_size' => $template->file_size,
            'mime_type' => $template->mime_type,
            'extension' => $template->extension,
            'has_file' => filled($template->file_path),
            'is_docx_ready' => $template->isDocxReady(),
            'validation_status' => $template->validation_status,
            'validation_result' => $template->validation_result,
            'has_unknown_placeholders' => (bool) $template->has_unknown_placeholders,
            'change_notes' => $template->change_notes,
            'uploaded_by' => $template->uploaded_by,
            'uploaded_by_name' => $template->uploader?->full_name,
            'upload_date' => $template->upload_date?->format('Y-m-d H:i:s'),
            'created_by' => $template->created_by,
            'updated_by' => $template->updated_by,
            'created_by_name' => $template->createdByUser?->full_name,
            'updated_by_name' => $template->updatedByUser?->full_name,
            'created_at' => $template->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $template->updated_at?->format('Y-m-d H:i:s'),
        ];
    }

    private function transformVersion(DocumentTemplateVersion $version): array
    {
        $version->loadMissing('uploader');

        return [
            'id' => $version->id,
            'document_template_id' => $version->document_template_id,
            'version' => $version->version,
            'file_name' => $version->file_name,
            'file_size' => $version->file_size,
            'mime_type' => $version->mime_type,
            'extension' => $version->extension,
            'validation_status' => $version->validation_status,
            'validation_result' => $version->validation_result,
            'has_unknown_placeholders' => (bool) $version->has_unknown_placeholders,
            'change_notes' => $version->change_notes,
            'uploaded_by' => $version->uploaded_by,
            'uploaded_by_name' => $version->uploader?->full_name,
            'created_at' => $version->created_at?->format('Y-m-d H:i:s'),
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 20);
        $templates = $this->templateService->list($request->all(), $perPage);

        return $this->success([
            'items' => collect($templates->items())->map(fn (DocumentTemplate $t) => $this->transform($t))->values(),
            'meta' => [
                'current_page' => $templates->currentPage(),
                'per_page' => $templates->perPage(),
                'total' => $templates->total(),
                'last_page' => $templates->lastPage(),
            ],
            'links' => [
                'first' => $templates->url(1),
                'last' => $templates->url($templates->lastPage()),
                'prev' => $templates->previousPageUrl(),
                'next' => $templates->nextPageUrl(),
            ],
        ], 'Document templates retrieved successfully.');
    }

    public function store(StoreDocumentTemplateRequest $request): JsonResponse
    {
        try {
            $template = $this->templateService->create(
                $request->validated(),
                $request->getFile(),
                $request->user()->id,
            );

            return $this->success(
                $this->transform($template),
                'Template created successfully.',
                201,
            );
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), null, 422);
        }
    }

    public function show(DocumentTemplate $template): JsonResponse
    {
        return $this->success(
            $this->transform($template),
            'Template retrieved successfully.',
        );
    }

    public function update(UpdateDocumentTemplateRequest $request, DocumentTemplate $template): JsonResponse
    {
        $template = $this->templateService->update($template->id, $request->validated());

        return $this->success(
            $this->transform($template),
            'Template updated successfully.',
        );
    }

    public function destroy(DocumentTemplate $template): JsonResponse
    {
        $this->templateService->delete($template->id);

        return $this->success(null, 'Template deleted successfully.');
    }

    public function upload(UploadDocumentTemplateRequest $request, DocumentTemplate $template): JsonResponse
    {
        try {
            $template = $this->templateService->uploadOrReplace(
                $template->id,
                $request->getFile(),
                $request->validated('change_notes'),
                $request->user()->id,
            );

            return $this->success(
                $this->transform($template),
                'DOCX template uploaded successfully.',
            );
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), null, 422);
        }
    }

    public function replace(UploadDocumentTemplateRequest $request, DocumentTemplate $template): JsonResponse
    {
        return $this->upload($request, $template);
    }

    public function download(DocumentTemplate $template): BinaryFileResponse|JsonResponse
    {
        try {
            $path = $this->templateService->download($template->id);

            return response()->download(
                $path,
                $template->file_name ?: basename($path),
                ['Content-Type' => $template->mime_type ?? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            );
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), null, 404);
        }
    }

    public function validateTemplate(DocumentTemplate $template): JsonResponse
    {
        try {
            $validation = $this->templateService->validate($template->id);
            $fresh = $this->templateService->find($template->id);

            return $this->success([
                'template' => $this->transform($fresh),
                'validation' => $validation,
            ], 'Template validation completed.');
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), null, 422);
        }
    }

    public function activate(DocumentTemplate $template): JsonResponse
    {
        try {
            $template = $this->templateService->activate($template->id);

            return $this->success(
                $this->transform($template),
                'Template activated successfully.',
            );
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), null, 422);
        }
    }

    public function deactivate(DocumentTemplate $template): JsonResponse
    {
        $template = $this->templateService->deactivate($template->id);

        return $this->success(
            $this->transform($template),
            'Template deactivated successfully.',
        );
    }

    public function versions(DocumentTemplate $template): JsonResponse
    {
        $versions = $this->templateService->versions($template->id);

        return $this->success(
            $versions->map(fn (DocumentTemplateVersion $v) => $this->transformVersion($v))->values(),
            'Template versions retrieved successfully.',
        );
    }

    public function restoreVersion(DocumentTemplate $template, int $version): JsonResponse
    {
        try {
            $restored = $this->templateService->restoreVersion(
                $template->id,
                $version,
                request()->user()?->id,
            );

            return $this->success(
                $this->transform($restored),
                'Template version restored successfully.',
            );
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), null, 422);
        }
    }

    public function downloadVersion(DocumentTemplate $template, int $version): BinaryFileResponse|JsonResponse
    {
        try {
            [$path, $versionModel] = $this->templateService->downloadVersion($template->id, $version);

            return response()->download(
                $path,
                $versionModel->file_name,
                ['Content-Type' => $versionModel->mime_type ?? 'application/octet-stream'],
            );
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), null, 404);
        }
    }

    public function placeholders(Request $request): JsonResponse
    {
        $type = $request->query('document_type');

        return $this->success(
            PlaceholderRegistry::forApi($type ? (string) $type : null),
            'Supported placeholders retrieved successfully.',
        );
    }

    public function setDefault(DocumentTemplate $template): JsonResponse
    {
        try {
            $template = $this->templateService->setDefault($template->id);

            return $this->success(
                $this->transform($template),
                'Default template set successfully.',
            );
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), null, 422);
        }
    }

    public function toggleStatus(DocumentTemplate $template): JsonResponse
    {
        try {
            $template = $this->templateService->toggleStatus($template->id);

            return $this->success(
                $this->transform($template),
                'Template status toggled successfully.',
            );
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), null, 422);
        }
    }

    public function duplicate(DocumentTemplate $template): JsonResponse
    {
        $duplicate = $this->templateService->duplicate($template->id);

        return $this->success(
            $this->transform($duplicate),
            'Template duplicated successfully.',
            201,
        );
    }

    public function byType(Request $request, string $type): JsonResponse
    {
        $documentType = DocumentType::tryFrom($type);

        if (! $documentType) {
            return $this->error('Invalid document type.', null, 422);
        }

        $templates = $this->templateService->getByDocumentType($documentType);

        return $this->success(
            $templates->map(fn (DocumentTemplate $t) => $this->transform($t))->values(),
            'Templates retrieved successfully.',
        );
    }

    public function documentTypes(): JsonResponse
    {
        return $this->success(
            DocumentType::all(),
            'Document types retrieved successfully.',
        );
    }
}
