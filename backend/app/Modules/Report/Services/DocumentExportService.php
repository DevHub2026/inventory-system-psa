<?php

namespace App\Modules\Report\Services;

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
            'target_type' => $this->dataResolver->targetTypeFor($documentType),
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
        ];
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
