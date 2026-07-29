<?php

namespace App\Modules\QrScan\Services;

use App\Models\User;
use App\Modules\Asset\Models\Asset;
use App\Modules\AssetIdentifier\Services\AssetIdentifierService;
use App\Modules\AuditLog\Services\AuditLogService;
use App\Modules\Borrowing\Models\Borrowing;
use App\Modules\Borrowing\Models\BorrowExtensionRequest;
use App\Modules\LostAssetReport\Models\LostAssetReport;
use App\Modules\Maintenance\Models\Maintenance;
use App\Modules\QrScan\Models\QrScanHistory;
use App\Modules\Reservation\Models\Reservation;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;

class QrScanService
{
    public function __construct(
        private readonly AssetIdentifierService $assetIdentifierService,
        private readonly AuditLogService $auditLogService,
    ) {}

    /**
     * Resolve QR identifier to full asset context for the Employee Asset Page.
     */
    public function resolveAsset(string $identifier, ?User $viewer = null): array
    {
        $assetIdentifier = $this->assetIdentifierService->findByValue(trim($identifier));

        if (! $assetIdentifier) {
            return ['error' => 'not_found', 'message' => 'No asset found for the provided QR code.'];
        }

        /** @var Asset $asset */
        $asset = Asset::query()
            ->with([
                'category',
                'manufacturer',
                'office',
                'location',
                'identifiers',
                'issuedByUser',
                'issuedToUser',
            ])
            ->find($assetIdentifier->asset_id);

        if (! $asset) {
            return ['error' => 'not_found', 'message' => 'Asset no longer exists.'];
        }

        if ($asset->deleted_at) {
            return ['error' => 'archived', 'message' => 'This asset has been archived.'];
        }

        // Active borrowing for this asset
        $activeBorrowing = Borrowing::query()
            ->with(['user'])
            ->where('asset_id', $asset->id)
            ->whereIn('status', ['BORROWED', 'ACTIVE', 'OVERDUE'])
            ->orderByDesc('created_at')
            ->first();

        // Active borrowing for the current user specifically (for extension eligibility)
        $myActiveBorrowing = $viewer
            ? Borrowing::query()
                ->where('asset_id', $asset->id)
                ->where('user_id', $viewer->id)
                ->whereIn('status', ['BORROWED', 'ACTIVE', 'OVERDUE'])
                ->first()
            : null;

        // Pending reservation for this asset
        $pendingReservation = Reservation::query()
            ->with(['user'])
            ->whereHas('assets', fn ($q) => $q->where('assets.id', $asset->id))
            ->where('status', 'PENDING')
            ->orderByDesc('created_at')
            ->first();

        // User's own pending reservation for this asset
        $myPendingReservation = $viewer
            ? Reservation::query()
                ->where('user_id', $viewer->id)
                ->where('status', 'PENDING')
                ->whereHas('assets', fn ($q) => $q->where('assets.id', $asset->id))
                ->first()
            : null;

        // Pending extension for user's active borrowing
        $myPendingExtension = $myActiveBorrowing
            ? BorrowExtensionRequest::query()
                ->where('borrowing_id', $myActiveBorrowing->id)
                ->where('status', 'PENDING')
                ->first()
            : null;

        // Active maintenance record
        $activeMaintenance = Maintenance::query()
            ->where('asset_id', $asset->id)
            ->whereIn('status', ['scheduled', 'in_progress'])
            ->orderByDesc('created_at')
            ->first();

        // My pending lost reports
        $myPendingLostReport = $viewer
            ? LostAssetReport::query()
                ->where('asset_id', $asset->id)
                ->where('reporter_id', $viewer->id)
                ->whereIn('status', ['PENDING', 'INVESTIGATING'])
                ->first()
            : null;

        // Borrow history for this asset (last 10)
        $borrowHistory = Borrowing::query()
            ->with(['user'])
            ->where('asset_id', $asset->id)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        // My reservation history for this asset
        $myReservationHistory = $viewer
            ? Reservation::query()
                ->where('user_id', $viewer->id)
                ->whereHas('assets', fn ($q) => $q->where('assets.id', $asset->id))
                ->orderByDesc('created_at')
                ->limit(10)
                ->get()
            : collect();

        // My extension history
        $myExtensionHistory = $myActiveBorrowing
            ? BorrowExtensionRequest::query()
                ->where('borrowing_id', $myActiveBorrowing->id)
                ->orderByDesc('created_at')
                ->get()
            : collect();

        // Maintenance history
        $maintenanceHistory = Maintenance::query()
            ->where('asset_id', $asset->id)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        // Lost report history for this asset (admin sees all, user sees own)
        $lostReportHistory = $viewer
            ? LostAssetReport::query()
                ->with(['reporter'])
                ->where('asset_id', $asset->id)
                ->where('reporter_id', $viewer->id)
                ->orderByDesc('created_at')
                ->limit(10)
                ->get()
            : collect();

        // Compute action eligibility
        $statusValue = $asset->status instanceof \App\Modules\Asset\Enums\AssetStatus
            ? $asset->status->value
            : (string) $asset->status;

        $isAvailable = $statusValue === 'AVAILABLE';
        $isBorrowed  = $statusValue === 'BORROWED';
        $isMaintenance = $statusValue === 'MAINTENANCE';
        $isIssued    = ! empty($asset->issued_to) || ! empty($asset->issued_to_user_id);
        $isDisposed  = in_array($statusValue, ['RETIRED', 'DISPOSED', 'UNAVAILABLE']);

        $canRequestBorrow = $isAvailable
            && ! $isIssued
            && ! $myPendingReservation
            && ! $myActiveBorrowing;

        $canRequestExtension = (bool) $myActiveBorrowing && ! $myPendingExtension;

        $canRequestReissuance = $isIssued && ! $isDisposed;

        $canReportDamage = ! $isDisposed && ! $activeMaintenance;

        $canReportLost = ! $isDisposed && ! $myPendingLostReport;

        return [
            'asset' => [
                'id'              => $asset->id,
                'asset_number'    => $asset->asset_number,
                'name'            => $asset->name,
                'description'     => $asset->description,
                'model'           => $asset->model,
                'status'          => $statusValue,
                'condition_status' => $asset->condition_status instanceof \BackedEnum
                    ? $asset->condition_status->value
                    : $asset->condition_status,
                'psa_qr_identifier' => $assetIdentifier->identifier_value,
                'category'        => $asset->category ? [
                    'id' => $asset->category->id, 'name' => $asset->category->name,
                ] : null,
                'manufacturer'    => $asset->manufacturer ? [
                    'id' => $asset->manufacturer->id, 'name' => $asset->manufacturer->name,
                ] : null,
                'office'          => $asset->office ? [
                    'id' => $asset->office->id, 'name' => $asset->office->name,
                ] : null,
                'location'        => $asset->location ? [
                    'id' => $asset->location->id, 'name' => $asset->location->name,
                ] : null,
                'issued_to'          => $asset->issued_to,
                'issued_to_user_id'  => $asset->issued_to_user_id,
                'issued_by_name'     => $asset->issuedByUser?->full_name,
                'issued_to_name'     => $asset->issuedToUser?->full_name ?? $asset->issued_to,
                'date_issued'        => $asset->date_issued?->format('Y-m-d'),
                'created_at'         => $asset->created_at?->format('Y-m-d H:i:s'),
                'updated_at'         => $asset->updated_at?->format('Y-m-d H:i:s'),
            ],
            'active_borrowing' => $activeBorrowing ? [
                'id'          => $activeBorrowing->id,
                'user_name'   => $activeBorrowing->user?->full_name ?? $activeBorrowing->user?->email,
                'borrow_date' => $activeBorrowing->borrow_date?->format('Y-m-d'),
                'due_date'    => $activeBorrowing->due_date?->format('Y-m-d'),
                'status'      => $activeBorrowing->status,
            ] : null,
            'my_active_borrowing' => $myActiveBorrowing ? [
                'id'       => $myActiveBorrowing->id,
                'due_date' => $myActiveBorrowing->due_date?->format('Y-m-d'),
                'status'   => $myActiveBorrowing->status,
            ] : null,
            'pending_reservation' => $pendingReservation ? [
                'id'          => $pendingReservation->id,
                'user_name'   => $pendingReservation->user?->full_name ?? $pendingReservation->user?->email,
                'start_date'  => $pendingReservation->start_date?->format('Y-m-d'),
                'end_date'    => $pendingReservation->end_date?->format('Y-m-d'),
                'workflow_status' => $pendingReservation->workflow_status,
                'current_level_order' => $pendingReservation->current_level_order,
            ] : null,
            'my_pending_reservation' => $myPendingReservation ? [
                'id'     => $myPendingReservation->id,
                'status' => $myPendingReservation->status,
                'workflow_status' => $myPendingReservation->workflow_status,
            ] : null,
            'my_pending_extension' => $myPendingExtension ? [
                'id'     => $myPendingExtension->id,
                'status' => $myPendingExtension->status instanceof \BackedEnum
                    ? $myPendingExtension->status->value
                    : $myPendingExtension->status,
            ] : null,
            'active_maintenance' => $activeMaintenance ? [
                'id'     => $activeMaintenance->id,
                'type'   => $activeMaintenance->type,
                'status' => $activeMaintenance->status,
            ] : null,
            'my_pending_lost_report' => $myPendingLostReport ? [
                'id'     => $myPendingLostReport->id,
                'status' => $myPendingLostReport->status,
            ] : null,
            'actions' => [
                'can_request_borrow'     => $canRequestBorrow,
                'can_request_extension'  => $canRequestExtension,
                'can_request_reissuance' => $canRequestReissuance,
                'can_report_damage'      => $canReportDamage,
                'can_report_lost'        => $canReportLost,
            ],
            'history' => [
                'borrow_history'     => $borrowHistory->map(fn ($b) => [
                    'id'          => $b->id,
                    'user_name'   => $b->user?->full_name ?? $b->user?->email,
                    'borrow_date' => $b->borrow_date?->format('Y-m-d'),
                    'due_date'    => $b->due_date?->format('Y-m-d'),
                    'returned_at' => $b->returned_at?->format('Y-m-d H:i:s'),
                    'status'      => $b->status,
                ])->values(),
                'my_reservation_history' => $myReservationHistory->map(fn ($r) => [
                    'id'         => $r->id,
                    'status'     => $r->status,
                    'start_date' => $r->start_date?->format('Y-m-d'),
                    'end_date'   => $r->end_date?->format('Y-m-d'),
                    'created_at' => $r->created_at?->format('Y-m-d H:i:s'),
                    'workflow_status' => $r->workflow_status,
                ])->values(),
                'maintenance_history' => $maintenanceHistory->map(fn ($m) => [
                    'id'          => $m->id,
                    'type'        => $m->type,
                    'status'      => $m->status,
                    'description' => $m->description,
                    'created_at'  => $m->created_at?->format('Y-m-d H:i:s'),
                ])->values(),
                'lost_report_history' => $lostReportHistory->map(fn ($l) => [
                    'id'          => $l->id,
                    'status'      => $l->status,
                    'description' => $l->description,
                    'date_lost'   => $l->date_lost?->format('Y-m-d'),
                    'created_at'  => $l->created_at?->format('Y-m-d H:i:s'),
                ])->values(),
            ],
        ];
    }

    /**
     * Record a QR scan event.
     */
    public function recordScan(Asset $asset, ?User $user, string $action, ?Request $request = null): QrScanHistory
    {
        $ua      = $request?->userAgent() ?? '';
        $browser = $this->detectBrowser($ua);
        $platform = $this->detectPlatform($ua);
        $device  = $this->detectDevice($ua);

        $scan = QrScanHistory::create([
            'asset_id'        => $asset->id,
            'user_id'         => $user?->id,
            'action_performed' => $action,
            'device'          => $device,
            'platform'        => $platform,
            'browser'         => $browser,
            'ip_address'      => $request?->ip(),
            'scanned_at'      => now(),
        ]);

        $this->auditLogService->log(
            'QR_SCANNED',
            'QrScan',
            "QR scanned for asset #{$asset->id} ({$asset->name}). Action: {$action}",
            null,
            ['asset_id' => $asset->id, 'action' => $action],
            $user?->id,
            $request?->ip(),
            $ua,
        );

        return $scan;
    }

    /**
     * Paginated scan history for admins/custodians.
     */
    public function listHistory(array $filters = []): LengthAwarePaginator
    {
        $query = QrScanHistory::query()->with(['asset', 'user']);

        if (! empty($filters['asset_id'])) {
            $query->where('asset_id', $filters['asset_id']);
        }
        if (! empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }
        if (! empty($filters['action_performed'])) {
            $query->where('action_performed', $filters['action_performed']);
        }
        if (! empty($filters['from_date'])) {
            $query->whereDate('scanned_at', '>=', $filters['from_date']);
        }
        if (! empty($filters['to_date'])) {
            $query->whereDate('scanned_at', '<=', $filters['to_date']);
        }

        $perPage = min(max((int) ($filters['per_page'] ?? 20), 1), 100);

        return $query->orderByDesc('scanned_at')->paginate($perPage);
    }

    /**
     * User's own scan history.
     */
    public function myHistory(User $user, array $filters = []): LengthAwarePaginator
    {
        $perPage = min(max((int) ($filters['per_page'] ?? 20), 1), 100);

        return QrScanHistory::query()
            ->with(['asset'])
            ->where('user_id', $user->id)
            ->orderByDesc('scanned_at')
            ->paginate($perPage);
    }

    private function detectBrowser(string $ua): string
    {
        if (str_contains($ua, 'Chrome') && ! str_contains($ua, 'Edg')) return 'Chrome';
        if (str_contains($ua, 'Firefox')) return 'Firefox';
        if (str_contains($ua, 'Safari') && ! str_contains($ua, 'Chrome')) return 'Safari';
        if (str_contains($ua, 'Edg')) return 'Edge';
        if (str_contains($ua, 'OPR') || str_contains($ua, 'Opera')) return 'Opera';
        return 'Unknown';
    }

    private function detectPlatform(string $ua): string
    {
        if (str_contains($ua, 'Windows')) return 'Windows';
        if (str_contains($ua, 'Mac')) return 'macOS';
        if (str_contains($ua, 'Linux') && ! str_contains($ua, 'Android')) return 'Linux';
        if (str_contains($ua, 'Android')) return 'Android';
        if (str_contains($ua, 'iPhone') || str_contains($ua, 'iPad')) return 'iOS';
        return 'Unknown';
    }

    private function detectDevice(string $ua): string
    {
        if (str_contains($ua, 'Mobile') || str_contains($ua, 'Android') || str_contains($ua, 'iPhone')) {
            return 'Mobile';
        }
        if (str_contains($ua, 'iPad') || str_contains($ua, 'Tablet')) {
            return 'Tablet';
        }
        return 'Desktop';
    }
}
