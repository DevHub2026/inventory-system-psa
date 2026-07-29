<?php

namespace App\Modules\Report\Services;

use App\Models\User;
use App\Modules\Asset\Models\Asset;
use App\Modules\Borrowing\Models\Borrowing;
use App\Modules\Inventory\Models\InventoryItem;
use App\Modules\Reservation\Models\Reservation;
use App\Modules\SystemSetup\Models\DocumentTemplate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Csv;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class DocumentExportService
{
    public function __construct(
        private readonly ReportService $reportService,
    ) {}

    /**
     * Resolve data for printable receipts/documents.
     */
    public function resolveDocumentData(string $documentType, int $targetId): array
    {
        $template = DocumentTemplate::getDefaultFor($documentType);

        $placeholders = [
            'current_date'  => now()->format('F j, Y'),
            'current_time'  => now()->format('g:i A'),
            'generated_by'  => auth()->user()?->full_name ?? 'System Administrator',
            'prepared_by'   => auth()->user()?->full_name ?? 'Property Custodian',
        ];

        switch ($documentType) {
            case 'borrow_receipt':
            case 'return_receipt':
                $borrowing = Borrowing::with([
                    'user.department',
                    'asset.category',
                    'asset.office',
                    'asset.manufacturer',
                    'extensionRequests' => fn ($q) => $q->latest()->limit(1),
                ])->findOrFail($targetId);
                $user  = $borrowing->user;
                $asset = $borrowing->asset;
                $latestExtension = $borrowing->extensionRequests->first();

                $placeholders = array_merge($placeholders, [
                    'employee_name'       => $user?->full_name ?? ($user?->email ?? 'N/A'),
                    'employee_number'     => $user?->employee_number ?? 'N/A',
                    'department'          => $user?->department?->name ?? 'N/A',
                    'office'              => $asset?->office?->name ?? 'PSA Regional Office',
                    'asset_name'          => $asset?->name ?? 'N/A',
                    'asset_code'          => $asset?->asset_number ?? 'N/A',
                    'serial_number'       => $asset?->serial_number ?? 'N/A',
                    'manufacturer'        => $asset?->manufacturer?->name ?? 'N/A',
                    'category'            => $asset?->category?->name ?? 'N/A',
                    'condition'           => $asset?->condition_status ?? 'Good',
                    'borrow_date'         => $borrowing->borrow_date?->format('F j, Y') ?? 'N/A',
                    'due_date'            => $borrowing->due_date?->format('F j, Y') ?? 'N/A',
                    'returned_date'       => $borrowing->returned_at?->format('F j, Y') ?? now()->format('F j, Y'),
                    'requested_extension' => $latestExtension?->requested_due_date?->format('F j, Y') ?? 'N/A',
                    'approved_extension'  => ($latestExtension?->status?->value === 'APPROVED')
                        ? ($latestExtension?->requested_due_date?->format('F j, Y') ?? 'N/A')
                        : 'N/A',
                ]);
                break;

            case 'issuance':
            case 'property_transfer':
                $asset = Asset::with(['category', 'office', 'location', 'manufacturer', 'issuedByUser.department'])->findOrFail($targetId);
                $issuedBy = $asset->issuedByUser;
                $placeholders = array_merge($placeholders, [
                    'employee_name'   => $asset->issued_to ?? 'Accountable Employee',
                    'employee_number' => $issuedBy?->employee_number ?? 'N/A',
                    'department'      => $issuedBy?->department?->name ?? $asset->office?->name ?? 'N/A',
                    'office'          => $asset->office?->name ?? 'PSA Central Office',
                    'asset_name'      => $asset->name,
                    'asset_code'      => $asset->asset_number,
                    'serial_number'   => $asset->serial_number ?? 'N/A',
                    'manufacturer'    => $asset->manufacturer?->name ?? 'N/A',
                    'category'        => $asset->category?->name ?? 'N/A',
                    'condition'       => $asset->condition_status instanceof \BackedEnum
                        ? $asset->condition_status->value
                        : ($asset->condition_status ?? 'Good'),
                    'issued_date'     => $asset->date_issued?->format('F j, Y') ?? now()->format('F j, Y'),
                    'issued_by'       => $issuedBy?->full_name ?? 'N/A',
                ]);
                break;

            case 'clearance':
                $user = User::with('department')->findOrFail($targetId);
                $placeholders = array_merge($placeholders, [
                    'employee_name'   => $user->full_name,
                    'employee_number' => $user->employee_number ?? 'N/A',
                    'department'      => $user->department?->name ?? 'N/A',
                    'office'          => 'Philippine Statistics Authority',
                ]);
                break;
        }

        return [
            'template'     => $template,
            'placeholders' => $placeholders,
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
            'assets'        => 'ASSET INVENTORY REPORT',
            'borrowings'    => 'BORROWED ITEMS REPORT',
            'reservations'  => 'RESERVATIONS REPORT',
            'inventory'     => 'STOCK INVENTORY REPORT',
            'overdue'       => 'OVERDUE BORROWINGS REPORT',
            'low_stock'     => 'LOW STOCK ALERT REPORT',
            'user_activity' => 'USER ACTIVITY REPORT',
            default         => 'OFFICIAL REPORT',
        };

        // Header rows
        $sheet->setCellValue('A1', 'PHILIPPINE STATISTICS AUTHORITY');
        $sheet->setCellValue('A2', $title);
        $sheet->setCellValue('A3', 'Generated on: '.now()->format('F j, Y g:i A').' | Filter: '.($filters['office_id'] ?? 'All Offices'));

        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $sheet->getStyle('A2')->getFont()->setBold(true)->setSize(12);

        $startRow = 5;

        // Populate table data
        switch ($reportType) {
            case 'assets':
                $headers = ['ID', 'Asset Code', 'Name', 'Category', 'Manufacturer', 'Office', 'Location', 'Status', 'Condition', 'Purchase Cost'];
                $rows = $this->reportService->getAssetReport($filters)->map(fn ($a) => [
                    $a->id, $a->asset_number, $a->name, $a->category?->name ?? 'N/A', $a->manufacturer?->name ?? 'N/A',
                    $a->office?->name ?? 'N/A', $a->location?->name ?? 'N/A', $a->status, $a->condition_status, $a->purchase_cost,
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

        // Write Headers
        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col.$startRow, $header);
            $sheet->getStyle($col.$startRow)->getFont()->setBold(true);
            $col++;
        }

        // Write Data Rows
        $currentRow = $startRow + 1;
        foreach ($rows as $rowData) {
            $col = 'A';
            foreach ($rowData as $val) {
                $sheet->setCellValue($col.$currentRow, $val);
                $col++;
            }
            $currentRow++;
        }

        // Auto-fit columns
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
