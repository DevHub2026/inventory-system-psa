<?php

namespace App\Modules\LostAssetReport\Services;

use App\Models\User;
use App\Modules\Asset\Models\Asset;
use App\Modules\AuditLog\Services\AuditLogService;
use App\Modules\LostAssetReport\Models\LostAssetReport;
use App\Modules\Notification\Services\NotificationService;
use App\Modules\Workflow\Services\WorkflowEngineService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class LostAssetReportService
{
    public function __construct(
        private readonly WorkflowEngineService $workflowEngineService,
        private readonly NotificationService $notificationService,
        private readonly AuditLogService $auditLogService,
    ) {}

    public function create(User $reporter, Asset $asset, array $data): LostAssetReport
    {
        return DB::transaction(function () use ($reporter, $asset, $data) {
            $report = LostAssetReport::create([
                'asset_id'           => $asset->id,
                'reporter_id'        => $reporter->id,
                'description'        => $data['description'],
                'last_known_location' => $data['last_known_location'] ?? null,
                'date_lost'          => $data['date_lost'] ?? null,
                'remarks'            => $data['remarks'] ?? null,
                'status'             => 'PENDING',
            ]);

            // Start workflow engine
            $this->workflowEngineService->startWorkflow(
                $report,
                'lost_asset_report',
                $reporter,
                $data['remarks'] ?? null,
            );

            $report->refresh();

            $reporterName = $reporter->full_name ?? $reporter->email;
            $this->notificationService->notifyStaffAndAdmins(
                'Lost Asset Report',
                "{$reporterName} reported asset \"{$asset->name}\" as lost.",
                'lost_asset_report',
                $report->id,
                LostAssetReport::class,
                ['link' => '/reports'],
            );

            $this->auditLogService->log(
                'LOST_REPORTED',
                'LostAssetReport',
                "Asset #{$asset->id} ({$asset->name}) reported as lost by {$reporterName}.",
                null,
                ['asset_id' => $asset->id, 'report_id' => $report->id],
            );

            return $report->load(['asset', 'reporter']);
        });
    }

    public function list(array $filters = []): LengthAwarePaginator
    {
        $query = LostAssetReport::query()->with(['asset', 'reporter']);

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (! empty($filters['asset_id'])) {
            $query->where('asset_id', $filters['asset_id']);
        }
        if (! empty($filters['reporter_id'])) {
            $query->where('reporter_id', $filters['reporter_id']);
        }

        $perPage = min(max((int) ($filters['per_page'] ?? 20), 1), 100);
        return $query->orderByDesc('created_at')->paginate($perPage);
    }

    public function myReports(User $user, ?int $assetId = null): Collection
    {
        $query = LostAssetReport::query()
            ->with(['asset'])
            ->where('reporter_id', $user->id);

        if ($assetId) {
            $query->where('asset_id', $assetId);
        }

        return $query->orderByDesc('created_at')->get();
    }
}
