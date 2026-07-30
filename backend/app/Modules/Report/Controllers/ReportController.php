<?php

namespace App\Modules\Report\Controllers;

use App\Modules\Report\Services\DocumentExportService;
use App\Modules\Report\Services\ReportService;
use App\Modules\Asset\Traits\RespondsWithJson;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ReportController extends Controller
{
    use RespondsWithJson;

    public function __construct(
        private readonly ReportService $reportService,
        private readonly DocumentExportService $exportService,
    ) {}

    public function export(Request $request): BinaryFileResponse|JsonResponse
    {
        $type   = $request->query('type', 'assets');
        $format = $request->query('format', 'excel') === 'csv' ? 'csv' : 'xlsx';

        try {
            return $this->exportService->exportReport($type, $format, $request->all());
        } catch (\Throwable $e) {
            return $this->error('Failed to generate export file: '.$e->getMessage(), null, 500);
        }
    }

    public function generateDocument(Request $request): BinaryFileResponse|JsonResponse
    {
        $type = $request->input('type', $request->query('type'));
        $targetId = (int) $request->input('target_id', $request->query('target_id'));

        if (! $type || ! $targetId) {
            return $this->error('Document type and target ID are required.', null, 422);
        }

        try {
            $result = $this->exportService->generateDocument((string) $type, $targetId);
            $generated = $result['generated'];

            return response()->download(
                $result['absolute_path'],
                $generated->file_name,
                [
                    'Content-Type' => $generated->mime_type
                        ?? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                ],
            );
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), null, 422);
        } catch (\RuntimeException $e) {
            return $this->error($e->getMessage(), null, 422);
        } catch (\Throwable $e) {
            return $this->error('Failed to generate document: '.$e->getMessage(), null, 500);
        }
    }

    public function assets(Request $request): JsonResponse
    {
        $report = $this->reportService->getAssetReport($request->all());

        return $this->success($report->map(fn ($asset) => [
            'id' => $asset->id,
            'asset_number' => $asset->asset_number,
            'property_number' => $asset->property_number,
            'name' => $asset->name,
            'category' => $asset->category->name ?? 'N/A',
            'manufacturer' => $asset->manufacturer->name ?? 'N/A',
            'office' => $asset->office->name ?? 'N/A',
            'location' => $asset->location->name ?? 'N/A',
            'status' => $asset->status,
            'accountability' => $asset->issued_to_user_id
                ? 'Issued to '.($asset->issuedToUser?->full_name ?? $asset->issued_to ?? 'N/A')
                : (filled($asset->issued_to) ? 'Issued to '.$asset->issued_to : 'Unassigned'),
            'condition' => $asset->condition_status,
            'purchase_date' => $asset->purchase_date?->format('Y-m-d'),
            'purchase_cost' => $asset->purchase_cost,
        ])->values(), 'Asset report generated successfully.');
    }

    public function borrowings(Request $request): JsonResponse
    {
        $report = $this->reportService->getBorrowingReport($request->all());

        return $this->success($report->map(fn ($borrowing) => [
            'id' => $borrowing->id,
            'asset_name' => $borrowing->asset->name ?? 'N/A',
            'borrower' => ($borrowing->user?->full_name ?: $borrowing->user?->email) ?? 'N/A',
            'borrow_date' => $borrowing->borrow_date?->format('Y-m-d'),
            'due_date' => $borrowing->due_date?->format('Y-m-d'),
            'status' => $borrowing->status,
            'remarks' => $borrowing->remarks,
        ])->values(), 'Borrowing report generated successfully.');
    }

    public function reservations(Request $request): JsonResponse
    {
        $report = $this->reportService->getReservationReport($request->all());

        return $this->success($report->map(fn ($reservation) => [
            'id' => $reservation->id,
            'user' => ($reservation->user?->full_name ?: $reservation->user?->email) ?? 'N/A',
            'status' => $reservation->status,
            'start_date' => $reservation->start_date?->format('Y-m-d'),
            'end_date' => $reservation->end_date?->format('Y-m-d'),
            'asset_count' => $reservation->assets()->count(),
            'remarks' => $reservation->remarks,
        ])->values(), 'Reservation report generated successfully.');
    }

    public function inventory(Request $request): JsonResponse
    {
        $report = $this->reportService->getInventoryReport($request->all());

        return $this->success($report->map(fn ($item) => [
            'id' => $item->id,
            'name' => $item->name,
            'sku' => $item->sku,
            'quantity' => $item->quantity,
            'unit' => $item->unit?->name ?? $item->unit,
            'manufacturer' => $item->manufacturer?->name,
            'office' => $item->office?->name,
            'location' => $item->location?->name,
            'reorder_level' => $item->reorder_level,
            'remarks' => $item->remarks,
        ])->values(), 'Inventory report generated successfully.');
    }

    public function overdue(): JsonResponse
    {
        $report = $this->reportService->getOverdueItemsReport();

        return $this->success($report->map(fn ($borrowing) => [
            'id' => $borrowing->id,
            'asset_name' => $borrowing->asset->name ?? 'N/A',
            'borrower' => ($borrowing->user?->full_name ?: $borrowing->user?->email) ?? 'N/A',
            'due_date' => $borrowing->due_date?->format('Y-m-d'),
            'days_overdue' => abs(now()->diffInDays($borrowing->due_date)),
        ])->values(), 'Overdue items report generated successfully.');
    }

    public function lowStock(): JsonResponse
    {
        $report = $this->reportService->getLowStockReport();

        return $this->success($report->map(fn ($item) => [
            'id' => $item->id,
            'name' => $item->name,
            'sku' => $item->sku,
            'quantity' => $item->quantity,
            'reorder_level' => $item->reorder_level,
            'unit' => $item->unit?->name ?? $item->unit,
            'manufacturer' => $item->manufacturer?->name,
            'office' => $item->office?->name,
            'location' => $item->location?->name,
        ])->values(), 'Low stock report generated successfully.');
    }

    public function userActivity(Request $request): JsonResponse
    {
        $report = $this->reportService->getUserActivityReport($request->all());

        return $this->success($report->map(fn ($borrowing) => [
            'id' => $borrowing->id,
            'user' => ($borrowing->user?->full_name ?: $borrowing->user?->email) ?? 'N/A',
            'asset_name' => $borrowing->asset->name ?? 'N/A',
            'action' => $borrowing->status === 'BORROWED' ? 'Borrowed' : 'Returned',
            'date' => $borrowing->borrow_date?->format('Y-m-d'),
        ])->values(), 'User activity report generated successfully.');
    }
}
