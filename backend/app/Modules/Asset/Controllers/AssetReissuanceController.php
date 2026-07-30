<?php

namespace App\Modules\Asset\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Asset\Enums\IssuanceType;
use App\Modules\Asset\Services\IssuanceAuthorization;
use App\Models\User;
use App\Modules\Asset\Models\Asset;
use App\Modules\Asset\Models\AssetIssuanceHistory;
use App\Modules\Asset\Traits\RespondsWithJson;
use App\Modules\Notification\Services\NotificationService;
use App\Modules\AuditLog\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AssetReissuanceController extends Controller
{
    use RespondsWithJson;

    public function __construct(
        private readonly NotificationService $notificationService,
        private readonly AuditLogService $auditLogService,
        private readonly \App\Modules\Workflow\Services\WorkflowEngineService $workflowEngineService,
        private readonly IssuanceAuthorization $issuanceAuthorization,
    ) {}

    /**
     * Check if current user is authorized to perform/manage reissuances.
     */
    private function authorizeReissuance(): void
    {
        $user = auth()->user();
        if (! $user) {
            abort(401, 'Unauthenticated.');
        }

        if (! $this->issuanceAuthorization->canManageIssuance($user)) {
            abort(403, 'Unauthorized. Only property custodians, officers or administrators can perform asset re-issuances.');
        }
    }

    /**
     * Process asset re-issuance ( accountability transfer ).
     */
    public function reissue(Request $request, $id): JsonResponse
    {
        $this->authorizeReissuance();

        $request->validate([
            'new_employee_id' => ['required', 'exists:users,id'],
            'transfer_date'   => ['required', 'date'],
            'reason'          => ['required', 'string', 'min:3'],
            'remarks'         => ['nullable', 'string'],
        ]);

        $asset = Asset::findOrFail($id);

        // Eligibility validation
        if (empty($asset->issued_to)) {
            return $this->error('Only assets that are currently permanently issued may be re-issued.', 422);
        }
        if ($asset->status->value === 'BORROWED') {
            return $this->error('Cannot re-issue a borrowed asset.', 422);
        }
        if ($asset->status->value === 'RESERVED') {
            return $this->error('Cannot re-issue a reserved asset.', 422);
        }
        if ($asset->status->value === 'MAINTENANCE') {
            return $this->error('Cannot re-issue an asset under maintenance.', 422);
        }
        if ($asset->deleted_at !== null) {
            return $this->error('Cannot re-issue an archived or deleted asset.', 422);
        }

        $newEmployee = User::findOrFail($request->input('new_employee_id'));

        // Resolve previous employee user if possible
        $previousEmployee = null;
        if ($asset->issued_to_user_id) {
            $previousEmployee = User::find($asset->issued_to_user_id);
        } else {
            // Fallback: match by full name query
            $previousEmployee = User::whereRaw("CONCAT(first_name, ' ', last_name) = ?", [$asset->issued_to])->first();
        }

        if ($previousEmployee && $previousEmployee->id === $newEmployee->id) {
            return $this->error('Cannot transfer accountability to the same employee.', 422);
        }

        $historyRecord = null;

        DB::transaction(function () use ($asset, $previousEmployee, $newEmployee, $request, &$historyRecord) {
            $prevName = $asset->issued_to;

            // 1. Update Asset Accountability
            $asset->update([
                'issued_to'         => $newEmployee->full_name,
                'issued_to_user_id' => $newEmployee->id,
                'issued_by_user_id' => auth()->id(),
                'date_issued'       => $request->input('transfer_date'),
            ]);

            // 2. Create Issuance History record
            $historyRecord = AssetIssuanceHistory::create([
                'asset_id'             => $asset->id,
                'issuance_type'        => IssuanceType::TRANSFER->value,
                'previous_employee_id' => $previousEmployee?->id,
                'new_employee_id'      => $newEmployee->id,
                'transferred_by'       => auth()->id(),
                'transfer_date'        => $request->input('transfer_date'),
                'reason'               => $request->input('reason'),
                'remarks'              => $request->input('remarks'),
            ]);

            // 3. Workflow Engine Execution History
            $activeVersion = $this->workflowEngineService->resolveActiveWorkflow('asset_reissuance');
            $this->workflowEngineService->recordHistory(
                $historyRecord,
                $activeVersion?->workflow_id,
                $activeVersion?->id,
                $activeVersion?->approvalLevels->first()?->id,
                1,
                'APPROVED',
                auth()->user(),
                $request->input('reason'),
                ['asset_id' => $asset->id, 'new_employee_id' => $newEmployee->id]
            );

            // 4. Log Audit Trail
            $this->auditLogService->log(
                'REISSUE',
                'Asset',
                "Transferred accountability of asset #{$asset->id} ({$asset->name}) from {$prevName} to {$newEmployee->full_name}",
                ['issued_to' => $prevName, 'issued_to_user_id' => $previousEmployee?->id],
                ['issued_to' => $newEmployee->full_name, 'issued_to_user_id' => $newEmployee->id]
            );

            // 4. Send Notifications
            if ($previousEmployee) {
                $this->notificationService->notifyUser(
                    $previousEmployee->id,
                    'Accountability Transferred',
                    "You are no longer responsible for asset {$asset->name} (Property Code: {$asset->asset_number}).",
                    'asset_returned',
                    $asset->id,
                    'Asset'
                );
            }

            $this->notificationService->notifyUser(
                $newEmployee->id,
                'New Accountability Assigned',
                "You have been permanently assigned asset {$asset->name} (Property Code: {$asset->asset_number}).",
                'borrowing_confirmed',
                $asset->id,
                'Asset'
            );

            $this->notificationService->notifyStaffAndAdmins(
                'Asset Accountability Re-Issued',
                "Asset {$asset->name} has been transferred from {$prevName} to {$newEmployee->full_name}.",
                'borrowing_confirmed',
                $asset->id,
                'Asset'
            );
        });

        return $this->success([
            'history_id' => $historyRecord->id,
            'asset'      => $asset->fresh()
        ], 'Asset accountability transferred successfully.');
    }

    /**
     * Get issuance history list for an asset.
     */
    public function history($id): JsonResponse
    {
        $history = AssetIssuanceHistory::where('asset_id', $id)
            ->with([
                'previousEmployee.department',
                'newEmployee.department',
                'officer'
            ])
            ->orderByDesc('created_at')
            ->get();

        return $this->success($history, 'Asset issuance history retrieved successfully.');
    }

    /**
     * Get filtered Re-issuance report items.
     */
    public function report(Request $request): JsonResponse
    {
        $query = $this->buildReportQuery($request);
        $reissuances = $query->orderByDesc('transfer_date')->orderByDesc('created_at')->get();

        return $this->success($this->transformReportItems($reissuances), 'Asset re-issuance report retrieved.');
    }

    /**
     * Export Re-issuance report to Excel or CSV.
     */
    public function export(Request $request): BinaryFileResponse|JsonResponse
    {
        $this->authorizeReissuance();

        $format = $request->query('format', 'excel');
        $query = $this->buildReportQuery($request);
        $records = $query->orderByDesc('transfer_date')->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        $sheet->setCellValue('A1', 'ASSET RE-ISSUANCE REPORT');
        $sheet->mergeCells('A1:H1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);

        $headers = [
            'Asset Tag / Code',
            'Asset Name',
            'Previous Holder',
            'New Holder',
            'Transferred By',
            'Transfer Date',
            'Reason',
            'Remarks'
        ];

        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . '3', $header);
            $sheet->getStyle($col . '3')->getFont()->setBold(true);
            $col++;
        }

        $row = 4;
        foreach ($records as $item) {
            $sheet->setCellValue('A' . $row, $item->asset?->asset_number ?? 'N/A');
            $sheet->setCellValue('B' . $row, $item->asset?->name ?? 'N/A');
            $sheet->setCellValue('C' . $row, $item->previousEmployee?->full_name ?? 'N/A');
            $sheet->setCellValue('D' . $row, $item->newEmployee?->full_name ?? 'N/A');
            $sheet->setCellValue('E' . $row, $item->officer?->full_name ?? 'N/A');
            $sheet->setCellValue('F' . $row, $item->transfer_date?->format('Y-m-d') ?? 'N/A');
            $sheet->setCellValue('G' . $row, $item->reason);
            $sheet->setCellValue('H' . $row, $item->remarks ?? '');
            $row++;
        }

        $filename = 'reissuance_report_' . date('Ymd_His');

        if ($format === 'csv') {
            $writer = new \PhpOffice\PhpSpreadsheet\Writer\Csv($spreadsheet);
            $path = storage_path('app/' . $filename . '.csv');
            $writer->save($path);
            return response()->download($path)->deleteFileAfterSend(true);
        }

        $writer = new Xlsx($spreadsheet);
        $path = storage_path('app/' . $filename . '.xlsx');
        $writer->save($path);
        return response()->download($path)->deleteFileAfterSend(true);
    }

    private function buildReportQuery(Request $request)
    {
        $query = AssetIssuanceHistory::query()->with([
            'asset.category',
            'asset.office',
            'asset.manufacturer',
            'previousEmployee',
            'newEmployee.department',
            'officer'
        ]);

        if ($request->filled('start_date')) {
            $query->where('transfer_date', '>=', $request->input('start_date'));
        }
        if ($request->filled('end_date')) {
            $query->where('transfer_date', '<=', $request->input('end_date'));
        }
        if ($request->filled('employee_id')) {
            $empId = $request->input('employee_id');
            $query->where(function ($q) use ($empId) {
                $q->where('previous_employee_id', $empId)
                  ->orWhere('new_employee_id', $empId);
            });
        }
        if ($request->filled('office_id')) {
            $query->whereHas('asset', fn ($q) => $q->where('office_id', $request->input('office_id')));
        }
        if ($request->filled('department_id')) {
            $deptId = $request->input('department_id');
            $query->whereHas('newEmployee', fn ($q) => $q->where('department_id', $deptId));
        }
        if ($request->filled('asset_category_id')) {
            $query->whereHas('asset', fn ($q) => $q->where('asset_category_id', $request->input('asset_category_id')));
        }
        if ($request->filled('manufacturer_id')) {
            $query->whereHas('asset', fn ($q) => $q->where('manufacturer_id', $request->input('manufacturer_id')));
        }
        if ($request->filled('transferred_by')) {
            $query->where('transferred_by', $request->input('transferred_by'));
        }

        return $query;
    }

    private function transformReportItems($items): array
    {
        return $items->map(fn ($history) => [
            'id'                => $history->id,
            'asset_number'      => $history->asset?->asset_number ?? 'N/A',
            'asset_name'        => $history->asset?->name ?? 'N/A',
            'previous_employee' => $history->previousEmployee?->full_name ?? 'N/A',
            'new_employee'      => $history->newEmployee?->full_name ?? 'N/A',
            'transferred_by'    => $history->officer?->full_name ?? 'N/A',
            'transfer_date'     => $history->transfer_date?->format('Y-m-d') ?? 'N/A',
            'reason'            => $history->reason,
            'remarks'           => $history->remarks ?? '',
        ])->toArray();
    }
}
