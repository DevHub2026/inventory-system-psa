<?php

namespace App\Modules\Report\Controllers;

use App\Modules\Asset\Traits\RespondsWithJson;
use App\Modules\Report\Services\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class ReportController extends Controller
{
    use RespondsWithJson;

    public function __construct(private readonly ReportService $reportService) {}

    public function assets(Request $request): JsonResponse
    {
        $report = $this->reportService->getAssetReport($request->all());

        return $this->success($report->map(fn ($asset) => [
            'id' => $asset->id,
            'asset_number' => $asset->asset_number,
            'name' => $asset->name,
            'category' => $asset->category->name ?? 'N/A',
            'manufacturer' => $asset->manufacturer->name ?? 'N/A',
            'office' => $asset->office->name ?? 'N/A',
            'location' => $asset->location->name ?? 'N/A',
            'status' => $asset->status,
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
            'unit' => $item->unit,
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
            'unit' => $item->unit,
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
