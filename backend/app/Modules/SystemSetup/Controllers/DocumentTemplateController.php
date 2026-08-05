<?php

namespace App\Modules\SystemSetup\Controllers;

use App\Modules\Asset\Traits\RespondsWithJson;
use App\Modules\SystemSetup\Enums\DocumentType;
use App\Modules\SystemSetup\Enums\TemplateUsageContext;
use App\Modules\SystemSetup\Models\DocumentTemplate;
use App\Modules\SystemSetup\Models\DocumentTemplateVersion;
use App\Modules\SystemSetup\Requests\StoreDocumentTemplateRequest;
use App\Modules\SystemSetup\Requests\UpdateDocumentTemplateRequest;
use App\Modules\SystemSetup\Requests\UploadDocumentTemplateRequest;
use App\Modules\Report\Services\DocumentExportService;
use App\Modules\SystemSetup\Services\DocumentTemplateService;
use App\Modules\SystemSetup\Services\PlaceholderRegistry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class DocumentTemplateController extends Controller
{
    use RespondsWithJson;

    public function __construct(
        private readonly DocumentTemplateService $templateService,
        private readonly DocumentExportService $documentExportService,
    ) {}

    private function transform(DocumentTemplate $template): array
    {
        $template->loadMissing(['uploader', 'createdByUser', 'updatedByUser']);

        $typeValue = $template->document_type instanceof DocumentType
            ? $template->document_type->value
            : (string) $template->document_type;

        // Resolve usage_context — support both cast enum and raw string.
        $usageContextValue = $template->usage_context instanceof TemplateUsageContext
            ? $template->usage_context->value
            : ($template->getRawOriginal('usage_context') ?? null);

        $usageContextEnum = $usageContextValue
            ? TemplateUsageContext::tryFrom($usageContextValue)
            : null;

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
            'usage_context' => $usageContextValue,
            'usage_context_label' => $usageContextEnum?->label(),
            'usage_context_description' => $usageContextEnum?->description(),
            'usage_context_operational_status' => $usageContextEnum?->operationalStatus(),
            'usage_context_operational_note' => $usageContextEnum?->operationalNote(),
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
            // ── Separated status fields ────────────────────────────────────
            'file_validation_status' => $template->getFileValidationStatus(),
            'placeholder_status' => $template->getPlaceholderStatus(),
            'resolution_mode' => $template->getResolutionMode(),
            'generation_readiness' => $template->getGenerationReadiness(),
            // ──────────────────────────────────────────────────────────────
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

    public function usageContexts(): JsonResponse
    {
        return $this->success(
            TemplateUsageContext::all(),
            'Template usage contexts retrieved successfully.',
        );
    }

    /**
     * Preview availability for a template.
     *
     * Reports which preview sources actually exist for the template's effective
     * system area (or document-type fallback):
     *   selected — the template currently opened
     *   active — the active context/fallback template actually used today
     *   default — the verified system default template (is_default AND active)
     */
    public function previewInfo(Request $request, DocumentTemplate $template): JsonResponse
    {
        $typeValue = $template->document_type instanceof DocumentType
            ? $template->document_type->value
            : (string) $template->document_type;

        $usageContextValue = $template->usage_context instanceof TemplateUsageContext
            ? $template->usage_context->value
            : ($template->getRawOriginal('usage_context') ?? null);

        $usageContext = $usageContextValue
            ? TemplateUsageContext::tryFrom($usageContextValue)
            : null;

        // If the template has no usage_context, fall back to its document type
        // so previews remain available for legacy templates.
        $effectiveContext = $usageContext ?: TemplateUsageContext::fromDocumentType($typeValue);

        $activeTemplate = $effectiveContext
            ? DocumentTemplate::getActiveDocxForContext($effectiveContext)
            : DocumentTemplate::getActiveDocxFor($typeValue);

        // Verified system default: is_default = true AND status = active.
        $defaultTemplate = DocumentTemplate::getDefaultFor(
            $effectiveContext ? $effectiveContext->documentType() : $typeValue
        );

        return $this->success([
            'template_id' => $template->id,
            'template_name' => $template->name,
            'template_version' => $template->version,
            'document_type' => $typeValue,
            'usage_context' => $usageContextValue,
            'usage_context_label' => $usageContext?->label(),
            'effective_context' => $effectiveContext?->value,
            'effective_context_label' => $effectiveContext?->label(),
            'resolution_mode' => $template->getResolutionMode(),
            'selected' => [
                'exists' => true,
                'ready' => $template->getGenerationReadiness() === 'ready',
                'template_id' => $template->id,
                'template_name' => $template->name,
                'template_version' => $template->version,
                'file_validation_status' => $template->getFileValidationStatus(),
                'placeholder_status' => $template->getPlaceholderStatus(),
                'generation_readiness' => $template->getGenerationReadiness(),
            ],
            'active' => $activeTemplate ? [
                'exists' => true,
                'template_id' => $activeTemplate->id,
                'template_name' => $activeTemplate->name,
                'template_version' => $activeTemplate->version,
                'is_default' => (bool) $activeTemplate->is_default,
                'resolution_source' => $activeTemplate->getRawOriginal('usage_context') === $effectiveContext?->value
                    ? 'active_context_template'
                    : 'document_type_fallback',
            ] : ['exists' => false],
            'default' => $defaultTemplate ? [
                'exists' => true,
                'template_id' => $defaultTemplate->id,
                'template_name' => $defaultTemplate->name,
                'template_version' => $defaultTemplate->version,
                'is_default' => true,
            ] : ['exists' => false],
            'real_record_supported' => $effectiveContext !== null
                && in_array($effectiveContext->value, [
                    'BORROWING_RECEIPT',
                    'BORROWING_RETURN',
                    'PERMANENT_ISSUANCE',
                    'ASSET_REISSUANCE',
                    'CLEARANCE',
                ], true),
        ], 'Preview availability retrieved successfully.');
    }

    /**
     * List valid workflow records for a real-record preview.
     *
     * Only exposes records for workflows that actually have verified backend
     * data and a document data resolver. Read-only — no state is modified.
     */
    public function previewRecords(Request $request, DocumentTemplate $template): JsonResponse
    {
        $usageContextValue = $template->usage_context instanceof TemplateUsageContext
            ? $template->usage_context->value
            : ($template->getRawOriginal('usage_context') ?? null);

        $usageContext = $usageContextValue
            ? TemplateUsageContext::tryFrom($usageContextValue)
            : null;

        $typeValue = $template->document_type instanceof DocumentType
            ? $template->document_type->value
            : (string) $template->document_type;

        $ctx = $usageContext ?: TemplateUsageContext::fromDocumentType($typeValue);

        if (! $ctx) {
            return $this->error('This template is not connected to a document-generation workflow.', null, 422);
        }

        $perPage = min(max((int) $request->query('per_page', 20), 1), 50);
        $records = collect();

        if ($ctx === TemplateUsageContext::BORROWING_RECEIPT) {
            $records = \App\Modules\Borrowing\Models\Borrowing::query()
                ->with(['user', 'asset'])
                ->whereIn('status', ['BORROWED', 'ACTIVE', 'OVERDUE'])
                ->orderByDesc('created_at')
                ->limit($perPage)
                ->get()
                ->map(fn ($b) => [
                    'target_type' => 'borrowing',
                    'target_id' => $b->id,
                    'label' => '#'.$b->id.' — '.($b->asset?->name ?? 'Asset #'.$b->asset_id).' — '.($b->user?->full_name ?? $b->user?->email),
                    'status' => $b->status,
                ]);
        } elseif ($ctx === TemplateUsageContext::BORROWING_RETURN) {
            $records = \App\Modules\Borrowing\Models\Borrowing::query()
                ->with(['user', 'asset'])
                ->whereIn('status', ['RETURNED', 'COMPLETED'])
                ->orderByDesc('returned_at')
                ->limit($perPage)
                ->get()
                ->map(fn ($b) => [
                    'target_type' => 'borrowing',
                    'target_id' => $b->id,
                    'label' => '#'.$b->id.' — '.($b->asset?->name ?? 'Asset #'.$b->asset_id).' — '.($b->user?->full_name ?? $b->user?->email),
                    'status' => $b->status,
                ]);
        } elseif ($ctx === TemplateUsageContext::PERMANENT_ISSUANCE) {
            $records = \App\Modules\Asset\Models\Asset::query()
                ->with(['issuedToUser'])
                ->where(fn ($q) => $q->whereNotNull('issued_to_user_id')->orWhereNotNull('issued_to'))
                ->orderByDesc('date_issued')
                ->limit($perPage)
                ->get()
                ->map(fn ($a) => [
                    'target_type' => 'asset',
                    'target_id' => $a->id,
                    'label' => '#'.$a->id.' — '.$a->name.' — '.($a->issuedToUser?->full_name ?? $a->issued_to),
                    'status' => 'ISSUED',
                ]);
        } elseif ($ctx === TemplateUsageContext::ASSET_REISSUANCE) {
            $records = \App\Modules\Asset\Models\AssetIssuanceHistory::query()
                ->with(['asset', 'newEmployee'])
                ->orderByDesc('transfer_date')
                ->limit($perPage)
                ->get()
                ->map(fn ($h) => [
                    'target_type' => 'asset_issuance_history',
                    'target_id' => $h->id,
                    'label' => '#'.$h->id.' — '.($h->asset?->name ?? 'Asset #'.$h->asset_id).' → '.($h->newEmployee?->full_name ?? 'N/A'),
                    'status' => 'TRANSFERRED',
                ]);
        } elseif ($ctx === TemplateUsageContext::CLEARANCE) {
            $records = \App\Models\User::query()
                ->whereNull('deleted_at')
                ->limit($perPage)
                ->get()
                ->map(fn ($u) => [
                    'target_type' => 'user',
                    'target_id' => $u->id,
                    'label' => '#'.$u->id.' — '.($u->full_name ?? $u->email).' — '.($u->employee_number ?? 'N/A'),
                    'status' => 'ACTIVE',
                ]);
        }

        return $this->success([
            'context' => $ctx->value,
            'records' => $records->values(),
        ], 'Preview records retrieved successfully.');
    }

    /**
     * Generate a read-only DOCX preview and return it for download.
     *
     * Preview never modifies workflow state: no borrowing, return, issuance,
     * re-issuance, transfer, clearance, reservation, asset-status or audit
     * records are created or changed.
     */
    public function previewGenerate(Request $request, DocumentTemplate $template): BinaryFileResponse|JsonResponse
    {
        $usageContextValue = $template->usage_context instanceof TemplateUsageContext
            ? $template->usage_context->value
            : ($template->getRawOriginal('usage_context') ?? null);

        $usageContext = $usageContextValue
            ? TemplateUsageContext::tryFrom($usageContextValue)
            : null;

        $typeValue = $template->document_type instanceof DocumentType
            ? $template->document_type->value
            : (string) $template->document_type;

        $ctx = $usageContext ?: TemplateUsageContext::fromDocumentType($typeValue);

        if (! $ctx) {
            return $this->error('This template is not connected to a document-generation workflow.', null, 422);
        }

        try {
            $mode = (string) $request->input('mode', 'selected');
            $sampleRaw = $request->input('sample_data', '1');
            $useSampleData = filter_var($sampleRaw, FILTER_VALIDATE_BOOL);
            $targetId = $request->input('target_id') ? (int) $request->input('target_id') : null;

            $preview = $this->documentExportService->previewDocument(
                context: $ctx,
                mode: $mode,
                useSampleData: $useSampleData,
                targetId: $targetId,
                selectedTemplateId: (int) $template->id,
            );

            // Response metadata is passed via headers so the download still works,
            // while the UI can show exactly which template was resolved.
            return response()->download(
                $preview['absolute_path'],
                $preview['filename'],
                [
                    'Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'X-Preview-Template-Id' => (string) $preview['template_id'],
                    'X-Preview-Template-Name' => rawurlencode($preview['template_name']),
                    'X-Preview-Template-Version' => $preview['template_version'],
                    'X-Preview-Resolution' => rawurlencode($preview['resolution']),
                    'X-Preview-Resolution-Source' => $preview['resolution_source'],
                ],
            )->deleteFileAfterSend(true);
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), null, 422);
        } catch (\RuntimeException $e) {
            return $this->error($e->getMessage(), null, 422);
        } catch (\Throwable $e) {
            return $this->error('Failed to generate preview: '.$e->getMessage(), null, 500);
        }
    }
}
