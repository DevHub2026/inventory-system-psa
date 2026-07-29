<?php

namespace App\Modules\QrScan\Services;

use App\Enums\UserRole;
use App\Models\User;
use App\Modules\Asset\Models\Asset;
use App\Modules\AssetIdentifier\Services\AssetIdentifierService;
use App\Modules\AuditLog\Services\AuditLogService;
use App\Modules\Borrowing\Models\Borrowing;
use App\Modules\Borrowing\Models\BorrowExtensionRequest;
use App\Modules\LostAssetReport\Models\LostAssetReport;
use App\Modules\Maintenance\Models\Maintenance;
use App\Modules\QrScan\Enums\QrType;
use App\Modules\QrScan\Models\QrScanHistory;
use App\Modules\Reservation\Models\Reservation;
use App\Modules\Workflow\Services\WorkflowEngineService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;

class QrScanService
{
    public function __construct(
        private readonly AssetIdentifierService $assetIdentifierService,
        private readonly AuditLogService $auditLogService,
        private readonly WorkflowEngineService $workflowEngineService,
    ) {}

    /**
     * Centralized QR resolution flow.
     * Detects QR type and returns normalized context based on authenticated user's role.
     *
     * Detection order:
     * 1. Reservation receipt (PSA-RES-{id}|...)  → BORROWING_RECEIPT
     * 2. Borrowing receipt (PSA-BOR-{id}|... or BR-{id}|...)  → BORROWING_RECEIPT
     * 3. Return receipt (RT-{id}|...)  → RETURN_RECEIPT
     * 4. Permanent asset QR  → ASSET
     * 5. Unrecognized  → UNKNOWN
     */
    public function resolveQrIdentifier(string $identifier, User $user): array
    {
        $identifier = trim(urldecode($identifier));

        if ($identifier === '') {
            return [
                'qr_type' => QrType::UNKNOWN->value,
                'error' => 'empty',
                'message' => 'QR identifier is empty.',
                'available_actions' => [],
            ];
        }

        $reference = strtok($identifier, '|') ?: $identifier;

        // 1. Check for reservation receipt (PSA-RES-{id})
        if (str_starts_with($reference, 'PSA-RES-')) {
            $reservationId = (int) substr($reference, strlen('PSA-RES-'));
            if ($reservationId > 0) {
                $reservation = Reservation::query()
                    ->with(['user', 'assets', 'authorizer'])
                    ->find($reservationId);

                if ($reservation) {
                    return $this->buildReservationReceiptContext($reservation, $user);
                }
            }
        }

        // 2. Check for borrowing receipt (PSA-BOR-{id} or BR-{id})
        $borrowingId = null;
        if (str_starts_with($reference, 'PSA-BOR-')) {
            $borrowingId = (int) substr($reference, strlen('PSA-BOR-'));
        } elseif (str_starts_with($reference, 'BR-')) {
            $borrowingId = (int) str_replace('BR-', '', $reference);
        }

        if ($borrowingId && $borrowingId > 0) {
            $borrowing = Borrowing::query()
                ->with(['user', 'asset', 'authorizer', 'asset.category', 'asset.office'])
                ->find($borrowingId);

            if ($borrowing) {
                return $this->buildBorrowingReceiptContext($borrowing, $user);
            }
        }

        // 3. Check for return receipt (RT-{id})
        if (str_starts_with($reference, 'RT-')) {
            $borrowingId = (int) str_replace('RT-', '', $reference);
            if ($borrowingId > 0) {
                $borrowing = Borrowing::query()
                    ->with(['user', 'asset', 'authorizer', 'asset.category', 'asset.office'])
                    ->find($borrowingId);

                if ($borrowing) {
                    return $this->buildBorrowingReceiptContext($borrowing, $user);
                }
            }
        }

        // 4. Try as a permanent asset QR
        $assetIdentifier = $this->assetIdentifierService->findByValue($identifier);
        if ($assetIdentifier) {
            $asset = Asset::query()
                ->with(['category', 'manufacturer', 'office', 'location', 'identifiers', 'issuedByUser', 'issuedToUser'])
                ->find($assetIdentifier->asset_id);

            if (!$asset) {
                return [
                    'qr_type' => QrType::UNKNOWN->value,
                    'error' => 'not_found',
                    'message' => 'Asset no longer exists for this QR code.',
                    'available_actions' => [],
                ];
            }

            if ($asset->deleted_at) {
                return [
                    'qr_type' => QrType::ASSET->value,
                    'error' => 'archived',
                    'message' => 'This asset has been archived.',
                    'asset' => $this->serializeAsset($asset, $assetIdentifier),
                    'available_actions' => [],
                ];
            }

            return $this->buildAssetContext($asset, $assetIdentifier, $user);
        }

        // 5. Unknown QR
        return [
            'qr_type' => QrType::UNKNOWN->value,
            'error' => 'unsupported',
            'message' => 'This QR code is not recognized by the PSA Inventory System.',
            'available_actions' => [],
        ];
    }

    /**
     * Build context for a reservation/borrow request receipt.
     *
     * Reservation statuses:
     * - PENDING → Show "Approve Request" to authorized admin
     * - APPROVED → Show "Release Asset" to authorized admin (creates Borrowing)
     * - REJECTED/CANCELLED/EXPIRED → Read-only
     */
    private function buildReservationReceiptContext(Reservation $reservation, User $user): array
    {
        $asset = $reservation->assets()->first();
        $isAdmin = $this->isAdminOrCustodian($user);
        $isOwner = $reservation->user_id === $user->id;

        $availableActions = [];
        $workflowStatus = $this->getWorkflowStatus($reservation);

        if ($isAdmin) {
            if ($reservation->status === 'PENDING') {
                // Check if this admin can approve via workflow
                $canApprove = $this->canApproveReservation($reservation, $user);
                if ($canApprove) {
                    $availableActions[] = 'APPROVE_REQUEST';
                }
            } elseif ($reservation->status === 'APPROVED') {
                // Check if there's an existing active borrowing
                $existingBorrowing = Borrowing::query()
                    ->where('reservation_id', $reservation->id)
                    ->whereIn('status', ['BORROWED', 'ACTIVE', 'OVERDUE'])
                    ->first();

                if (!$existingBorrowing) {
                    // Approved reservation waiting for release
                    $availableActions[] = 'RELEASE_ASSET';
                }
            }
        }

        // Check for active borrowing created from this reservation
        $activeBorrowing = Borrowing::query()
            ->where('reservation_id', $reservation->id)
            ->whereIn('status', ['BORROWED', 'ACTIVE', 'OVERDUE'])
            ->first();

        if ($activeBorrowing && $isAdmin) {
            $availableActions[] = 'RETURN_ASSET';
        }

        return [
            'qr_type' => QrType::BORROWING_RECEIPT->value,
            'error' => null,
            'message' => null,
            'asset' => $asset ? $this->serializeSimpleAsset($asset) : null,
            'reservation' => [
                'id' => $reservation->id,
                'requester_name' => $reservation->user?->full_name ?? $reservation->user?->email,
                'employee_number' => $reservation->user?->employee_number,
                'department' => $reservation->user?->department?->name,
                'office' => $reservation->user?->office?->name,
                'asset_name' => $asset?->name,
                'asset_number' => $asset?->asset_number,
                'requested_date' => $reservation->created_at?->format('Y-m-d H:i:s'),
                'expected_return_date' => $reservation->end_date?->format('Y-m-d'),
                'status' => $reservation->status,
                'workflow_status' => $workflowStatus,
                'current_level_order' => $reservation->current_level_order,
                'remarks' => $reservation->remarks,
                'authorized_by_name' => $reservation->authorizer?->full_name ?? $reservation->authorizer?->email,
                'authorized_at' => $reservation->authorized_at?->format('Y-m-d H:i:s'),
            ],
            'borrowing' => $activeBorrowing ? [
                'id' => $activeBorrowing->id,
                'borrower_name' => $activeBorrowing->user?->full_name ?? $activeBorrowing->user?->email,
                'borrowed_at' => $activeBorrowing->borrowed_at?->format('Y-m-d H:i:s'),
                'due_date' => $activeBorrowing->due_date?->format('Y-m-d'),
                'returned_at' => $activeBorrowing->returned_at?->format('Y-m-d H:i:s'),
                'status' => $activeBorrowing->status,
            ] : null,
            'is_owner' => $isOwner,
            'user_permissions' => [
                'is_admin' => $isAdmin,
                'is_employee' => !$isAdmin,
            ],
            'available_actions' => $availableActions,
            'workflow_status' => $workflowStatus,
        ];
    }

    /**
     * Build context for a borrowing receipt.
     *
     * Borrowing statuses:
     * - BORROWED/ACTIVE/OVERDUE → Show "Return Asset" to admin
     * - RETURNED → Read-only
     */
    private function buildBorrowingReceiptContext(Borrowing $borrowing, User $user): array
    {
        $asset = $borrowing->asset;
        $isAdmin = $this->isAdminOrCustodian($user);
        $isOwner = $borrowing->user_id === $user->id;

        $availableActions = [];

        // Check for active borrowing
        if (in_array($borrowing->status, ['BORROWED', 'ACTIVE', 'OVERDUE'])) {
            if ($isAdmin) {
                $availableActions[] = 'RETURN_ASSET';
            }
        }

        // Determine QR type
        $isReturned = $borrowing->status === 'RETURNED';

        return [
            'qr_type' => $isReturned ? QrType::RETURN_RECEIPT->value : QrType::BORROWING_RECEIPT->value,
            'error' => null,
            'message' => null,
            'asset' => $asset ? $this->serializeSimpleAsset($asset) : null,
            'reservation' => null,
            'borrowing' => [
                'id' => $borrowing->id,
                'borrower_name' => $borrowing->user?->full_name ?? $borrowing->user?->email,
                'employee_number' => $borrowing->user?->employee_number,
                'department' => $borrowing->user?->department?->name,
                'office' => $borrowing->user?->office?->name,
                'asset_name' => $asset?->name,
                'asset_number' => $asset?->asset_number,
                'requested_date' => $borrowing->created_at?->format('Y-m-d H:i:s'),
                'borrowed_at' => $borrowing->borrowed_at?->format('Y-m-d H:i:s'),
                'due_date' => $borrowing->due_date?->format('Y-m-d'),
                'returned_at' => $borrowing->returned_at?->format('Y-m-d H:i:s'),
                'status' => $borrowing->status,
                'remarks' => $borrowing->remarks,
                'authorized_by_name' => $borrowing->authorizer?->full_name ?? $borrowing->authorizer?->email,
                'authorized_at' => $borrowing->authorized_at?->format('Y-m-d H:i:s'),
            ],
            'is_owner' => $isOwner,
            'user_permissions' => [
                'is_admin' => $isAdmin,
                'is_employee' => !$isAdmin,
            ],
            'available_actions' => $availableActions,
            'workflow_status' => $borrowing->status,
        ];
    }

    /**
     * Build context for a permanent asset QR.
     *
     * Employee actions:
     * - Available asset → REQUEST_BORROW, REPORT_DAMAGE, REPORT_LOST
     * - Unavailable → Read-only with explanation
     *
     * Admin actions:
     * - VIEW_ASSET_DETAILS
     * - VIEW_BORROWING_STATUS
     */
    private function buildAssetContext(Asset $asset, $assetIdentifier, User $user): array
    {
        $statusValue = $asset->status instanceof \App\Modules\Asset\Enums\AssetStatus
            ? $asset->status->value
            : (string) $asset->status;

        $isAdmin = $this->isAdminOrCustodian($user);

        // Active borrowing for this asset
        $activeBorrowing = Borrowing::query()
            ->with(['user'])
            ->where('asset_id', $asset->id)
            ->whereIn('status', ['BORROWED', 'ACTIVE', 'OVERDUE'])
            ->orderByDesc('created_at')
            ->first();

        // User's own active borrowing
        $myActiveBorrowing = Borrowing::query()
            ->where('asset_id', $asset->id)
            ->where('user_id', $user->id)
            ->whereIn('status', ['BORROWED', 'ACTIVE', 'OVERDUE'])
            ->first();

        // User's own pending reservation
        $myPendingReservation = Reservation::query()
            ->where('user_id', $user->id)
            ->where('status', 'PENDING')
            ->whereHas('assets', fn ($q) => $q->where('assets.id', $asset->id))
            ->first();

        // Active maintenance
        $activeMaintenance = Maintenance::query()
            ->where('asset_id', $asset->id)
            ->whereIn('status', ['scheduled', 'in_progress'])
            ->orderByDesc('created_at')
            ->first();

        // My pending lost report
        $myPendingLostReport = LostAssetReport::query()
            ->where('asset_id', $asset->id)
            ->where('reporter_id', $user->id)
            ->whereIn('status', ['PENDING', 'INVESTIGATING'])
            ->first();

        $isAvailable = $statusValue === 'AVAILABLE';
        $isBorrowed = $statusValue === 'BORROWED' || $activeBorrowing !== null;
        $isMaintenance = $statusValue === 'MAINTENANCE' || $activeMaintenance !== null;
        $isIssued = !empty($asset->issued_to) || !empty($asset->issued_to_user_id);
        $isDisposed = in_array($statusValue, ['RETIRED', 'DISPOSED', 'UNAVAILABLE']);

        // Determine available actions based on role
        $availableActions = [];

        if ($isAdmin) {
            // Admin: view details and borrowing status
            $availableActions[] = 'VIEW_ASSET_DETAILS';
            if ($activeBorrowing) {
                $availableActions[] = 'VIEW_BORROWING_STATUS';
            }
        } else {
            // Employee: request borrow, report damage, report lost
            $availableActions[] = 'VIEW_ASSET_DETAILS';

            $canRequestBorrow = $isAvailable
                && !$isIssued
                && !$myPendingReservation
                && !$myActiveBorrowing;

            if ($canRequestBorrow) {
                $availableActions[] = 'REQUEST_BORROW';
            }

            if (!$isDisposed && !$activeMaintenance) {
                $availableActions[] = 'REPORT_DAMAGE';
            }

            if (!$isDisposed && !$myPendingLostReport) {
                $availableActions[] = 'REPORT_LOST';
            }
        }

        // Determine asset status description
        $assetStatusDescription = 'Available for borrowing';
        if ($isBorrowed) {
            $assetStatusDescription = 'Currently Borrowed';
        } elseif ($isMaintenance) {
            $assetStatusDescription = 'Under Maintenance';
        } elseif ($isIssued) {
            $assetStatusDescription = 'Permanently Issued';
        } elseif ($isDisposed) {
            $assetStatusDescription = 'Unavailable';
        }

        return [
            'qr_type' => QrType::ASSET->value,
            'error' => null,
            'message' => null,
            'asset' => $this->serializeAsset($asset, $assetIdentifier),
            'asset_status' => $assetStatusDescription,
            'borrowing' => $activeBorrowing ? [
                'id' => $activeBorrowing->id,
                'borrower_name' => $activeBorrowing->user?->full_name ?? $activeBorrowing->user?->email,
                'borrowed_at' => $activeBorrowing->borrowed_at?->format('Y-m-d H:i:s'),
                'due_date' => $activeBorrowing->due_date?->format('Y-m-d'),
                'status' => $activeBorrowing->status,
            ] : null,
            'my_active_borrowing' => $myActiveBorrowing ? [
                'id' => $myActiveBorrowing->id,
                'due_date' => $myActiveBorrowing->due_date?->format('Y-m-d'),
                'status' => $myActiveBorrowing->status,
            ] : null,
            'my_pending_reservation' => $myPendingReservation ? [
                'id' => $myPendingReservation->id,
                'status' => $myPendingReservation->status,
            ] : null,
            'active_maintenance' => $activeMaintenance ? [
                'id' => $activeMaintenance->id,
                'type' => $activeMaintenance->type,
                'status' => $activeMaintenance->status,
            ] : null,
            'my_pending_lost_report' => $myPendingLostReport ? [
                'id' => $myPendingLostReport->id,
                'status' => $myPendingLostReport->status,
            ] : null,
            'user_permissions' => [
                'is_admin' => $isAdmin,
                'is_employee' => !$isAdmin,
            ],
            'available_actions' => $availableActions,
            'workflow_status' => $statusValue,
        ];
    }

    /**
     * Get the workflow status from a reservation's workflow engine.
     */
    private function getWorkflowStatus(Reservation $reservation): ?string
    {
        if ($reservation->workflow_status) {
            return $reservation->workflow_status;
        }
        // Fall back to reservation status
        return $reservation->status;
    }

    /**
     * Check if the user can approve this specific reservation via workflow.
     */
    private function canApproveReservation(Reservation $reservation, User $user): bool
    {
        try {
            return $this->workflowEngineService->canUserApproveCurrentLevel($reservation, $user);
        } catch (\Exception $e) {
            // If workflow engine throws (e.g. no workflow configured), fall back to role check
            return $this->isAdminOrCustodian($user);
        }
    }

    // Legacy resolveAsset method kept for backward compatibility
    public function resolveAsset(string $identifier, ?User $viewer = null): array
    {
        $assetIdentifier = $this->assetIdentifierService->findByValue(trim($identifier));

        if (! $assetIdentifier) {
            return ['error' => 'not_found', 'message' => 'No asset found for the provided QR code.'];
        }

        $asset = Asset::query()
            ->with(['category', 'manufacturer', 'office', 'location', 'identifiers', 'issuedByUser', 'issuedToUser'])
            ->find($assetIdentifier->asset_id);

        if (! $asset) {
            return ['error' => 'not_found', 'message' => 'Asset no longer exists.'];
        }

        if ($asset->deleted_at) {
            return ['error' => 'archived', 'message' => 'This asset has been archived.'];
        }

        $activeBorrowing = Borrowing::query()
            ->with(['user'])
            ->where('asset_id', $asset->id)
            ->whereIn('status', ['BORROWED', 'ACTIVE', 'OVERDUE'])
            ->orderByDesc('created_at')
            ->first();

        $myActiveBorrowing = $viewer
            ? Borrowing::query()
                ->where('asset_id', $asset->id)
                ->where('user_id', $viewer->id)
                ->whereIn('status', ['BORROWED', 'ACTIVE', 'OVERDUE'])
                ->first()
            : null;

        $pendingReservation = Reservation::query()
            ->with(['user'])
            ->whereHas('assets', fn ($q) => $q->where('assets.id', $asset->id))
            ->where('status', 'PENDING')
            ->orderByDesc('created_at')
            ->first();

        $myPendingReservation = $viewer
            ? Reservation::query()
                ->where('user_id', $viewer->id)
                ->where('status', 'PENDING')
                ->whereHas('assets', fn ($q) => $q->where('assets.id', $asset->id))
                ->first()
            : null;

        $myPendingExtension = $myActiveBorrowing
            ? BorrowExtensionRequest::query()
                ->where('borrowing_id', $myActiveBorrowing->id)
                ->where('status', 'PENDING')
                ->first()
            : null;

        $activeMaintenance = Maintenance::query()
            ->where('asset_id', $asset->id)
            ->whereIn('status', ['scheduled', 'in_progress'])
            ->orderByDesc('created_at')
            ->first();

        $myPendingLostReport = $viewer
            ? LostAssetReport::query()
                ->where('asset_id', $asset->id)
                ->where('reporter_id', $viewer->id)
                ->whereIn('status', ['PENDING', 'INVESTIGATING'])
                ->first()
            : null;

        $borrowHistory = Borrowing::query()
            ->with(['user'])
            ->where('asset_id', $asset->id)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        $myReservationHistory = $viewer
            ? Reservation::query()
                ->where('user_id', $viewer->id)
                ->whereHas('assets', fn ($q) => $q->where('assets.id', $asset->id))
                ->orderByDesc('created_at')
                ->limit(10)
                ->get()
            : collect();

        $maintenanceHistory = Maintenance::query()
            ->where('asset_id', $asset->id)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        $lostReportHistory = $viewer
            ? LostAssetReport::query()
                ->with(['reporter'])
                ->where('asset_id', $asset->id)
                ->where('reporter_id', $viewer->id)
                ->orderByDesc('created_at')
                ->limit(10)
                ->get()
            : collect();

        $statusValue = $asset->status instanceof \App\Modules\Asset\Enums\AssetStatus
            ? $asset->status->value
            : (string) $asset->status;

        $isAvailable = $statusValue === 'AVAILABLE';
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
                'category'        => $asset->category ? ['id' => $asset->category->id, 'name' => $asset->category->name] : null,
                'manufacturer'    => $asset->manufacturer ? ['id' => $asset->manufacturer->id, 'name' => $asset->manufacturer->name] : null,
                'office'          => $asset->office ? ['id' => $asset->office->id, 'name' => $asset->office->name] : null,
                'location'        => $asset->location ? ['id' => $asset->location->id, 'name' => $asset->location->name] : null,
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
    public function recordScan(Asset $asset, ?User $user, string $action, ?Request $request = null, ?string $scanSource = null): QrScanHistory
    {
        $ua       = $request?->userAgent() ?? '';
        $browser  = $this->detectBrowser($ua);
        $platform = $this->detectPlatform($ua);
        $device   = $this->detectDevice($ua);
        $source   = $scanSource ?? $request?->input('scan_source') ?? $request?->query('scan_source') ?? 'sidebar_scanner';

        $scan = QrScanHistory::create([
            'asset_id'         => $asset->id,
            'user_id'          => $user?->id,
            'action_performed' => $action,
            'device'           => $device,
            'platform'         => $platform,
            'browser'          => $browser,
            'scan_source'      => $source,
            'ip_address'       => $request?->ip(),
            'scanned_at'       => now(),
        ]);

        $this->auditLogService->log(
            'QR_SCANNED',
            'QrScan',
            "QR scanned for asset #{$asset->id} ({$asset->name}). Action: {$action} via {$source}",
            null,
            ['asset_id' => $asset->id, 'action' => $action, 'scan_source' => $source],
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

    private function serializeAsset($asset, $assetIdentifier): array
    {
        return [
            'id' => $asset->id,
            'asset_number' => $asset->asset_number,
            'name' => $asset->name,
            'description' => $asset->description,
            'model' => $asset->model,
            'status' => $asset->status instanceof \App\Modules\Asset\Enums\AssetStatus
                ? $asset->status->value
                : (string) $asset->status,
            'condition_status' => $asset->condition_status instanceof \BackedEnum
                ? $asset->condition_status->value
                : $asset->condition_status,
            'psa_qr_identifier' => $assetIdentifier->identifier_value,
            'category' => $asset->category ? ['id' => $asset->category->id, 'name' => $asset->category->name] : null,
            'manufacturer' => $asset->manufacturer ? ['id' => $asset->manufacturer->id, 'name' => $asset->manufacturer->name] : null,
            'office' => $asset->office ? ['id' => $asset->office->id, 'name' => $asset->office->name] : null,
            'location' => $asset->location ? ['id' => $asset->location->id, 'name' => $asset->location->name] : null,
            'issued_to' => $asset->issued_to,
            'issued_to_user_id' => $asset->issued_to_user_id,
            'issued_by_name' => $asset->issuedByUser?->full_name,
            'issued_to_name' => $asset->issuedToUser?->full_name ?? $asset->issued_to,
            'date_issued' => $asset->date_issued?->format('Y-m-d'),
            'created_at' => $asset->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $asset->updated_at?->format('Y-m-d H:i:s'),
        ];
    }

    private function serializeSimpleAsset($asset): array
    {
        return [
            'id' => $asset->id,
            'asset_number' => $asset->asset_number,
            'name' => $asset->name,
            'description' => $asset->description,
            'model' => $asset->model,
            'status' => $asset->status instanceof \App\Modules\Asset\Enums\AssetStatus
                ? $asset->status->value
                : (string) $asset->status,
            'condition_status' => $asset->condition_status instanceof \BackedEnum
                ? $asset->condition_status->value
                : $asset->condition_status,
            'category' => $asset->category ? ['id' => $asset->category->id, 'name' => $asset->category->name] : null,
            'manufacturer' => $asset->manufacturer ? ['id' => $asset->manufacturer->id, 'name' => $asset->manufacturer->name] : null,
            'office' => $asset->office ? ['id' => $asset->office->id, 'name' => $asset->office->name] : null,
            'location' => $asset->location ? ['id' => $asset->location->id, 'name' => $asset->location->name] : null,
        ];
    }

    private function isAdminOrCustodian(User $user): bool
    {
        return $user->hasRole(UserRole::SUPER_ADMINISTRATOR->value)
            || $user->hasRole(UserRole::SYSTEM_ADMINISTRATOR->value)
            || $user->hasRole(UserRole::PROPERTY_CUSTODIAN->value)
            || $user->hasRole(UserRole::INVENTORY_OFFICER->value);
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