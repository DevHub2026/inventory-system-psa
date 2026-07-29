<?php

namespace App\Modules\SystemSetup\Controllers;

use App\Modules\Asset\Traits\RespondsWithJson;
use App\Modules\SystemSetup\Enums\DocumentType;
use App\Modules\SystemSetup\Models\DocumentTemplate;
use App\Modules\SystemSetup\Requests\StoreDocumentTemplateRequest;
use App\Modules\SystemSetup\Requests\UpdateDocumentTemplateRequest;
use App\Modules\SystemSetup\Services\DocumentTemplateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class DocumentTemplateController extends Controller
{
    use RespondsWithJson;

    public function __construct(private readonly DocumentTemplateService $templateService) {}

    private function transform(DocumentTemplate $template): array
    {
        return [
            'id'                  => $template->id,
            'name'                => $template->name,
            'document_type'       => $template->document_type,
            'document_type_label' => $template->document_type instanceof DocumentType
                ? $template->document_type->label()
                : DocumentType::tryFrom($template->document_type)?->label() ?? $template->document_type,
            'category'            => $template->document_type instanceof DocumentType
                ? $template->document_type->category()
                : DocumentType::tryFrom($template->document_type)?->category() ?? 'Other',
            'description'         => $template->description,
            'version'             => $template->version,
            'status'              => $template->status,
            'status_label'        => $template->status_label,
            'is_default'          => $template->is_default,
            'file_name'           => $template->file_name,
            'file_size'           => $template->file_size,
            'mime_type'           => $template->mime_type,
            'extension'           => $template->extension,
            'file_url'            => $template->file_url,
            'uploaded_by'         => $template->uploaded_by,
            'upload_date'         => $template->upload_date?->format('Y-m-d H:i:s'),
            'header_org_name'     => $template->header_org_name ?? 'PHILIPPINE STATISTICS AUTHORITY',
            'header_office_name'  => $template->header_office_name ?? 'Regional Statistical Services Office',
            'header_title'        => $template->header_title,
            'logo_url'            => $template->logo_url,
            'body_template'       => $template->body_template,
            'footer_text'         => $template->footer_text,
            'footer_notes'        => $template->footer_notes,
            'signature_blocks'    => $template->signature_blocks ?? [],
            'paper_size'          => $template->paper_size ?? 'A4',
            'orientation'         => $template->orientation ?? 'portrait',
            'margin_top'          => $template->margin_top ?? 25,
            'margin_bottom'       => $template->margin_bottom ?? 25,
            'margin_left'         => $template->margin_left ?? 25,
            'margin_right'        => $template->margin_right ?? 25,
            'font_family'         => $template->font_family ?? 'Arial',
            'font_size'           => $template->font_size ?? 12,
            'text_alignment'      => $template->text_alignment ?? 'left',
            'created_by'          => $template->created_by,
            'updated_by'          => $template->updated_by,
            'created_by_name'     => $template->createdByUser?->name,
            'updated_by_name'     => $template->updatedByUser?->name,
            'created_at'          => $template->created_at?->format('Y-m-d H:i:s'),
            'updated_at'          => $template->updated_at?->format('Y-m-d H:i:s'),
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 20);
        $templates = $this->templateService->list($request->all(), $perPage);

        return $this->success([
            'items' => collect($templates->items())->map(fn (DocumentTemplate $t) => $this->transform($t))->values(),
            'meta'  => [
                'current_page' => $templates->currentPage(),
                'per_page'     => $templates->perPage(),
                'total'        => $templates->total(),
                'last_page'    => $templates->lastPage(),
            ],
            'links' => [
                'first' => $templates->url(1),
                'last'  => $templates->url($templates->lastPage()),
                'prev'  => $templates->previousPageUrl(),
                'next'  => $templates->nextPageUrl(),
            ],
        ], 'Document templates retrieved successfully.');
    }

    public function store(StoreDocumentTemplateRequest $request): JsonResponse
    {
        $template = $this->templateService->create(
            $request->validated(),
            $request->getFile(),
            $request->user()->id,
        );

        return $this->success(
            $this->transform($template),
            'Template uploaded successfully.',
            201,
        );
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
        $template = $this->templateService->update(
            $template->id,
            $request->validated(),
            $request->getFile(),
        );

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

    public function download(DocumentTemplate $template): BinaryFileResponse|JsonResponse
    {
        try {
            $path = $this->templateService->download($template->id);

            return response()->download(
                $path,
                $template->file_name,
                ['Content-Type' => $template->mime_type ?? 'application/octet-stream'],
            );
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), null, 404);
        }
    }

    public function preview(DocumentTemplate $template): BinaryFileResponse|JsonResponse
    {
        try {
            $path = $this->templateService->preview($template->id);

            return response()->file($path);
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), null, 404);
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

    public function setDefault(DocumentTemplate $template): JsonResponse
    {
        $template = $this->templateService->setDefault($template->id);

        return $this->success(
            $this->transform($template),
            'Default template set successfully.',
        );
    }

    public function restoreDefault(DocumentTemplate $template): JsonResponse
    {
        $template = $this->templateService->restoreDefault($template->id);

        return $this->success(
            $this->transform($template),
            'Template restored to default configuration.',
        );
    }

    public function toggleStatus(DocumentTemplate $template): JsonResponse
    {
        $template = $this->templateService->toggleStatus($template->id);

        return $this->success(
            $this->transform($template),
            'Template status toggled successfully.',
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
