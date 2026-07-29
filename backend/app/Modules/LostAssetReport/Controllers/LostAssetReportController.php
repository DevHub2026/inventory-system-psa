<?php

namespace App\Modules\LostAssetReport\Controllers;

use App\Modules\Asset\Models\Asset;
use App\Modules\Asset\Traits\RespondsWithJson;
use App\Modules\LostAssetReport\Services\LostAssetReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class LostAssetReportController extends Controller
{
    use RespondsWithJson;

    public function __construct(private readonly LostAssetReportService $lostAssetReportService) {}

    /**
     * POST /api/v1/assets/{asset}/report-lost
     * Any authenticated employee can report an asset as lost.
     */
    public function reportLost(Request $request, Asset $asset): JsonResponse
    {
        $validated = $request->validate([
            'description'        => ['required', 'string', 'min:10'],
            'last_known_location' => ['nullable', 'string', 'max:500'],
            'date_lost'          => ['nullable', 'date', 'before_or_equal:today'],
            'remarks'            => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $report = $this->lostAssetReportService->create(
                $request->user(),
                $asset,
                $validated,
            );

            return $this->success(
                $this->transform($report),
                'Lost asset report submitted successfully.',
                201,
            );
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), null, 422);
        }
    }

    /**
     * GET /api/v1/lost-asset-reports
     * Admin/Custodian: list all reports (paginated, filterable).
     */
    public function index(Request $request): JsonResponse
    {
        $reports = $this->lostAssetReportService->list($request->query());

        return $this->success([
            'items' => collect($reports->items())->map(fn ($r) => $this->transform($r))->values(),
            'meta'  => [
                'current_page' => $reports->currentPage(),
                'per_page'     => $reports->perPage(),
                'total'        => $reports->total(),
                'last_page'    => $reports->lastPage(),
            ],
        ], 'Lost asset reports retrieved successfully.');
    }

    /**
     * GET /api/v1/lost-asset-reports/mine
     * Employee: own lost reports.
     */
    public function mine(Request $request): JsonResponse
    {
        $reports = $this->lostAssetReportService->myReports(
            $request->user(),
            $request->query('asset_id') ? (int) $request->query('asset_id') : null,
        );

        return $this->success(
            $reports->map(fn ($r) => $this->transform($r))->values(),
            'Your lost asset reports retrieved successfully.',
        );
    }

    private function transform($report): array
    {
        return [
            'id'                  => $report->id,
            'asset_id'            => $report->asset_id,
            'asset_name'          => $report->asset?->name,
            'asset_number'        => $report->asset?->asset_number,
            'reporter_id'         => $report->reporter_id,
            'reporter_name'       => $report->reporter?->full_name ?? $report->reporter?->email,
            'description'         => $report->description,
            'last_known_location' => $report->last_known_location,
            'date_lost'           => $report->date_lost?->format('Y-m-d'),
            'remarks'             => $report->remarks,
            'status'              => $report->status,
            'workflow_status'     => $report->workflow_status,
            'current_level_order' => $report->current_level_order,
            'created_at'          => $report->created_at?->format('Y-m-d H:i:s'),
        ];
    }
}
