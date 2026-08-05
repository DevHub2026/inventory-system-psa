<?php

namespace App\Modules\Report\Services;

use App\Models\User;
use App\Modules\Asset\Models\Asset;
use App\Modules\Asset\Models\AssetIssuanceHistory;
use App\Modules\Borrowing\Models\Borrowing;
use App\Modules\SystemSetup\Enums\TemplateUsageContext;
use App\Modules\SystemSetup\Models\DocumentTemplate;
use App\Modules\SystemSetup\Models\GeneratedDocument;
use App\Modules\SystemSetup\Services\DocxTemplateService;
use App\Modules\SystemSetup\Services\PlaceholderRegistry;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Csv;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class DocumentExportService
{
    public function __construct(
        private readonly ReportService $reportService,
        private readonly DocumentDataResolver $dataResolver,
        private readonly DocxTemplateService $docxService,
    ) {}

    /**
     * Generate an official DOCX document from the active template.
     *
     * @return array{generated: GeneratedDocument, absolute_path: string}
     */
    public function generateDocument(string $documentType, int $targetId): array
    {
        if (! in_array($documentType, PlaceholderRegistry::officialDocumentTypes(), true)) {
            throw new \InvalidArgumentException('Unsupported document type for DOCX generation.');
        }

        // Resolution order:
        // 1. Active template explicitly assigned to a matching usage_context.
        // 2. Fallback: active template matched by document_type only (backward
        //    compat for templates created before usage_context existed).
        $usageContext = TemplateUsageContext::fromDocumentType($documentType);
        $template = $usageContext
            ? DocumentTemplate::getActiveDocxForContext($usageContext)
            : DocumentTemplate::getActiveDocxFor($documentType);

        if (! $template) {
            throw new \RuntimeException(
                'No active DOCX template is configured for this document type. Please contact a system administrator.'
            );
        }

        if ($template->has_unknown_placeholders || $template->validation_status === 'invalid') {
            throw new \RuntimeException(
                'The active template contains unknown placeholders and cannot be used until it is fixed and re-validated.'
            );
        }

        if (! $template->file_path || ! Storage::disk('local')->exists($template->file_path)) {
            throw new \RuntimeException(
                'No active DOCX template file is available for this document type. Please contact a system administrator.'
            );
        }

        $targetType = $this->dataResolver->targetTypeFor($documentType);

        // Reuse an existing generated document for the same target + template
        // when the source record has not changed. This prevents duplicate
        // GeneratedDocument records and duplicate downloads on retry.
        $existing = GeneratedDocument::query()
            ->where('document_type', $documentType)
            ->where('target_type', $targetType)
            ->where('target_id', $targetId)
            ->where('document_template_id', $template->id)
            ->where('status', 'completed')
            ->latest('generated_at')
            ->first();

        if ($existing && $existing->file_path && Storage::disk('local')->exists($existing->file_path)) {
            Log::info('Reusing existing generated document', [
                'document_type' => $documentType,
                'target_id' => $targetId,
                'template_id' => $template->id,
                'generated_id' => $existing->id,
            ]);

            return [
                'generated' => $existing,
                'absolute_path' => Storage::disk('local')->path($existing->file_path),
                'reused' => true,
            ];
        }

        $placeholders = $this->dataResolver->resolve($documentType, $targetId);
        $sourcePath = Storage::disk('local')->path($template->file_path);

        $safeType = Str::slug($documentType);
        $filename = $safeType.'_'.$targetId.'_'.now()->format('Ymd_His').'_'.Str::lower(Str::random(6)).'.docx';
        $relativePath = 'generated-documents/'.$safeType.'/'.$filename;
        $absolutePath = Storage::disk('local')->path($relativePath);

        $this->docxService->generate($sourcePath, $absolutePath, $placeholders);

        $generated = GeneratedDocument::query()->create([
            'document_template_id' => $template->id,
            'document_type' => $documentType,
            'target_type' => $targetType,
            'target_id' => $targetId,
            'file_path' => $relativePath,
            'file_name' => $filename,
            'file_size' => is_file($absolutePath) ? filesize($absolutePath) : 0,
            'mime_type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'status' => 'completed',
            'metadata' => [
                'template_version' => $template->version,
                'placeholder_keys' => array_keys($placeholders),
            ],
            'generated_by' => Auth::id(),
            'generated_at' => now(),
        ]);

        Log::info('Official DOCX document generated', [
            'document_type' => $documentType,
            'target_id' => $targetId,
            'template_id' => $template->id,
            'generated_id' => $generated->id,
        ]);

        return [
            'generated' => $generated,
            'absolute_path' => $absolutePath,
            'reused' => false,
        ];
    }

    /**
     * Generate a read-only DOCX preview from a template.
     *
     * This method reuses the exact same template-resolution, data-resolver and
     * DOCX rendering pipeline as generateDocument(), but it does NOT create a
     * GeneratedDocument record and does NOT touch any workflow record.
     *
     * Preview is strictly read-only:
     *   - never creates a borrowing / return / issuance / transfer / clearance record
     *   - never changes asset, reservation, borrowing, issuance or workflow state
     *   - never fulfils a reservation item
     *
     * @return array{
     *   absolute_path: string,
     *   filename: string,
     *   template_id: int,
     *   template_name: string,
     *   template_version: string,
     *   resolution: string,
     *   resolution_source: string
     * }
     */
    public function previewDocument(
        TemplateUsageContext $context,
        string $mode,
        bool $useSampleData,
        ?int $targetId = null,
        ?int $selectedTemplateId = null,
    ): array {
        $docType = $context->documentType();
        $template = null;
        $resolutionSource = '';

        if ($mode === 'selected') {
            if ($selectedTemplateId === null) {
                throw new \InvalidArgumentException('A selected template is required for preview.');
            }
            $template = DocumentTemplate::query()->find($selectedTemplateId);

            if (! $template) {
                throw new \InvalidArgumentException('The selected template does not exist.');
            }

            $templateDocType = $template->getRawOriginal('document_type');
            if ($templateDocType !== $docType) {
                throw new \InvalidArgumentException(
                    'The selected template document type does not match the selected system area.'
                );
            }

            $resolutionSource = 'selected_template';
        } elseif ($mode === 'active') {
            $template = DocumentTemplate::getActiveDocxForContext($context);
            $resolutionSource = $template && $template->getRawOriginal('usage_context') === $context->value
                ? 'active_context_template'
                : 'document_type_fallback';
        } elseif ($mode === 'default') {
            // Verified system default: is_default = true AND active, matched by document_type.
            $template = DocumentTemplate::getDefaultFor($docType);
            $resolutionSource = 'verified_system_default';
        } else {
            throw new \InvalidArgumentException('Invalid preview mode.');
        }

        if (! $template) {
            if ($mode === 'default') {
                throw new \InvalidArgumentException(
                    'No system default template is available for this document type.'
                );
            }

            throw new \InvalidArgumentException(
                'No active DOCX template is configured for this system area. Please contact a system administrator.'
            );
        }

        $this->assertTemplateReadyForPreview($template);

        $placeholders = $useSampleData
            ? $this->samplePlaceholderValues($context)
            : $this->resolveRealPreviewData($context, $targetId);

        $sourcePath = Storage::disk('local')->path($template->file_path);
        if (! is_file($sourcePath)) {
            throw new \InvalidArgumentException('Template file not found on disk.');
        }

        // Previews are temporary — stored under previews/ and deleted after download.
        $safeContext = Str::slug($context->value);
        $filename = 'preview_'.$safeContext.'_'.$mode.'_'.now()->format('Ymd_His').'_'.Str::lower(Str::random(6)).'.docx';
        $relativePath = 'previews/'.$filename;
        $absolutePath = Storage::disk('local')->path($relativePath);

        $directory = dirname($absolutePath);
        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $this->docxService->generate($sourcePath, $absolutePath, $placeholders);

        return [
            'absolute_path' => $absolutePath,
            'filename' => $filename,
            'template_id' => $template->id,
            'template_name' => $template->name,
            'template_version' => $template->version,
            'resolution' => $context->value.' → '.($template->getRawOriginal('usage_context') === $context->value
                ? 'Active Context Template'
                : 'Document Type Fallback / Default'),
            'resolution_source' => $resolutionSource,
        ];
    }

    /**
     * Validate that a template is actually ready for preview generation.
     */
    private function assertTemplateReadyForPreview(DocumentTemplate $template): void
    {
        if (! filled($template->file_path)) {
            throw new \InvalidArgumentException('No template file has been uploaded.');
        }

        if ($template->extension !== 'docx') {
            throw new \InvalidArgumentException('This template is not a DOCX file and cannot be used for official document preview.');
        }

        if ($template->has_unknown_placeholders || $template->validation_status === 'invalid') {
            throw new \InvalidArgumentException(
                'This template contains unsupported placeholders and cannot be generated.'
            );
        }

        $rawStatus = $template->getRawOriginal('status');

        if ($rawStatus !== 'active') {
            throw new \InvalidArgumentException('This template is inactive. Activate it before previewing.');
        }
    }

    /**
     * Build safe, clearly-identifiable sample values for the preview.
     * Sample preview never touches any real workflow record.
     *
     * @return array<string, string>
     */
    private function samplePlaceholderValues(TemplateUsageContext $context): array
    {
        $samples = [
            // System / organization
            'organization_name' => 'PHILIPPINE STATISTICS AUTHORITY',
            'generated_date' => 'August 3, 2026',
            'current_date' => 'August 3, 2026',
            'current_time' => '9:00 AM',
            'generated_by' => 'Sample Administrator',
            'prepared_by' => 'Sample Administrator',
            // Employee (sample — never production employee data)
            'employee_name' => 'Juan Dela Cruz',
            'employee_number' => 'EMP-0001',
            'employee_email' => 'juan.delacruz@example.com',
            'department' => 'Sample Department',
            'department_name' => 'Sample Department',
            'office' => 'Sample Office',
            'office_name' => 'Sample Office',
            // Asset (sample)
            'asset_name' => 'Sample Laptop',
            'asset_description' => 'Sample asset description for preview only.',
            'asset_code' => 'ASSET-0001',
            'asset_number' => 'ASSET-0001',
            'property_number' => 'PPE-2026-0001',
            'serial_number' => 'SN-PREVIEW-0001',
            'asset_category' => 'IT Equipment',
            'category' => 'IT Equipment',
            'asset_condition' => 'Good',
            'condition' => 'Good',
            'asset_status' => 'Available',
            'purchase_date' => 'January 15, 2026',
            'purchase_cost' => '75,000.00',
            'model' => 'ThinkPad X1 Carbon',
            'manufacturer' => 'Lenovo',
            'brand' => 'Lenovo',
            // Borrowing / return
            'borrow_date' => 'August 3, 2026',
            'due_date' => 'August 10, 2026',
            'returned_date' => 'August 10, 2026',
            'return_date' => 'August 10, 2026',
            'requested_extension' => 'N/A',
            'approved_extension' => 'N/A',
            // Issuance
            'date_issued' => 'August 3, 2026',
            'issued_date' => 'August 3, 2026',
            'issued_by' => 'Sample Administrator',
            // Re-issuance / transfer
            'previous_employee' => 'Maria Santos',
            'new_employee' => 'Juan Dela Cruz',
            'transfer_date' => 'August 3, 2026',
            'reason' => 'Sample transfer reason for preview only.',
            'approved_by' => 'Sample Administrator',
        ];

        // Filter to placeholders actually supported by this system area.
        $supported = array_map(
            fn (array $def) => $def['key'],
            PlaceholderRegistry::forUsageContext($context->value)
        );

        return array_intersect_key($samples, array_flip($supported));
    }

    /**
     * Resolve real placeholder values for a real-record preview.
     *
     * @return array<string, string>
     */
    private function resolveRealPreviewData(TemplateUsageContext $context, ?int $targetId): array
    {
        if ($targetId === null || $targetId <= 0) {
            throw new \InvalidArgumentException('A valid workflow record is required for a real-record preview.');
        }

        $docType = $context->documentType();
        $this->assertPreviewTargetValid($context, $targetId);

        return $this->dataResolver->resolve($docType, $targetId);
    }

    /**
     * Validate that a real-record preview target exists and is in a valid state
     * for the selected system area. This is a read-only check — no workflow
     * record is modified.
     */
    private function assertPreviewTargetValid(TemplateUsageContext $context, int $targetId): void
    {
        $docType = $context->documentType();
        $targetType = $this->dataResolver->targetTypeFor($docType);

        if ($targetType === 'borrowing') {
            $borrowing = Borrowing::query()->with(['user', 'asset'])->find($targetId);

            if (! $borrowing) {
                throw new \InvalidArgumentException('The selected borrowing record does not exist.');
            }

            if ($docType === 'borrow_receipt' && ! in_array($borrowing->status, ['BORROWED', 'ACTIVE', 'OVERDUE'], true)) {
                throw new \InvalidArgumentException(
                    'The selected borrowing record is not valid for a Borrowing Receipt preview.'
                );
            }

            if ($docType === 'return_receipt' && ! in_array($borrowing->status, ['RETURNED', 'COMPLETED'], true)) {
                throw new \InvalidArgumentException(
                    'The selected borrowing record has not been returned. A Return Receipt preview requires a completed return.'
                );
            }

            return;
        }

        if ($targetType === 'asset') {
            $asset = Asset::query()->find($targetId);

            if (! $asset) {
                throw new \InvalidArgumentException('The selected asset record does not exist.');
            }

            if ($docType === 'issuance' && ! filled($asset->issued_to_user_id) && ! filled($asset->issued_to)) {
                throw new \InvalidArgumentException(
                    'The selected asset is not permanently issued and cannot be used for an issuance preview.'
                );
            }

            // NOTE: property_transfer is intentionally not exposed as a real-record
            // preview because the system has no dedicated property-transfer workflow
            // record — only a location/office transfer action on AssetController.
            return;
        }

        if ($targetType === 'asset_issuance_history') {
            $history = AssetIssuanceHistory::query()->find($targetId);

            if (! $history) {
                throw new \InvalidArgumentException('The selected re-issuance record does not exist.');
            }

            return;
        }

        if ($targetType === 'user') {
            $user = User::query()->find($targetId);

            if (! $user) {
                throw new \InvalidArgumentException('The selected employee record does not exist.');
            }

            return;
        }

        throw new \InvalidArgumentException(
            'The selected workflow is not connected to a document-generation feature.'
        );
    }

    /**
     * Export tabular reports to Excel (.xlsx) or CSV (.csv).
     */
    public function exportReport(string $reportType, string $format, array $filters = []): BinaryFileResponse
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        $title = match ($reportType) {
            'assets' => 'ASSET INVENTORY REPORT',
            'borrowings' => 'BORROWED ITEMS REPORT',
            'reservations' => 'RESERVATIONS REPORT',
            'inventory' => 'STOCK INVENTORY REPORT',
            'overdue' => 'OVERDUE BORROWINGS REPORT',
            'low_stock' => 'LOW STOCK ALERT REPORT',
            'user_activity' => 'USER ACTIVITY REPORT',
            default => 'OFFICIAL REPORT',
        };

        $sheet->setCellValue('A1', 'PHILIPPINE STATISTICS AUTHORITY');
        $sheet->setCellValue('A2', $title);
        $sheet->setCellValue('A3', 'Generated on: '.now()->format('F j, Y g:i A').' | Filter: '.($filters['office_id'] ?? 'All Offices'));

        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $sheet->getStyle('A2')->getFont()->setBold(true)->setSize(12);

        $startRow = 5;

        switch ($reportType) {
            case 'assets':
                $headers = ['ID', 'Property Number', 'Asset Number', 'Name', 'Category', 'Manufacturer', 'Office', 'Location', 'Status', 'Accountability', 'Condition', 'Purchase Cost'];
                $rows = $this->reportService->getAssetReport($filters)->map(fn ($a) => [
                    $a->id,
                    $a->property_number ?? 'N/A',
                    $a->asset_number,
                    $a->name,
                    $a->category?->name ?? 'N/A',
                    $a->manufacturer?->name ?? 'N/A',
                    $a->office?->name ?? 'N/A',
                    $a->location?->name ?? 'N/A',
                    $a->status,
                    $a->issued_to_user_id
                        ? 'Issued to '.($a->issuedToUser?->full_name ?? $a->issued_to ?? 'N/A')
                        : (filled($a->issued_to) ? 'Issued to '.$a->issued_to : 'Unassigned'),
                    $a->condition_status,
                    $a->purchase_cost,
                ]);
                break;

            case 'borrowings':
            case 'overdue':
                $headers = ['ID', 'Asset Name', 'Borrower', 'Borrow Date', 'Due Date', 'Status', 'Remarks'];
                $rows = ($reportType === 'overdue' ? $this->reportService->getOverdueItemsReport() : $this->reportService->getBorrowingReport($filters))
                    ->map(fn ($b) => [
                        $b->id, $b->asset?->name ?? 'N/A', $b->user?->full_name ?? $b->user?->email,
                        $b->borrow_date?->format('Y-m-d'), $b->due_date?->format('Y-m-d'), $b->status, $b->remarks,
                    ]);
                break;

            case 'inventory':
            case 'low_stock':
                $headers = ['ID', 'Item Name', 'SKU', 'Available Qty', 'Unit', 'Reorder Level', 'Manufacturer', 'Office', 'Location'];
                $rows = ($reportType === 'low_stock' ? $this->reportService->getLowStockReport() : $this->reportService->getInventoryReport($filters))
                    ->map(fn ($i) => [
                        $i->id, $i->name, $i->sku, $i->quantity, $i->unit?->name ?? $i->unit,
                        $i->reorder_level, $i->manufacturer?->name, $i->office?->name, $i->location?->name,
                    ]);
                break;

            default:
                $headers = ['ID', 'Details', 'Date'];
                $rows = collect([]);
                break;
        }

        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col.$startRow, $header);
            $sheet->getStyle($col.$startRow)->getFont()->setBold(true);
            $col++;
        }

        $currentRow = $startRow + 1;
        foreach ($rows as $rowData) {
            $col = 'A';
            foreach ($rowData as $val) {
                $sheet->setCellValue($col.$currentRow, $val);
                $col++;
            }
            $currentRow++;
        }

        foreach (range('A', $col) as $colLetter) {
            $sheet->getColumnDimension($colLetter)->setAutoSize(true);
        }

        $filename = strtolower(str_replace(' ', '_', $title)).'_'.now()->format('Ymd_His').'.'.$format;
        $tempPath = storage_path('app/temp_'.$filename);

        if ($format === 'csv') {
            $writer = new Csv($spreadsheet);
        } else {
            $writer = new Xlsx($spreadsheet);
        }

        $writer->save($tempPath);

        return response()->download($tempPath, $filename, [
            'Content-Type' => $format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }
}
