<?php

namespace App\Modules\Asset\Controllers;

use App\Enums\UserRole;
use App\Models\User;
use App\Modules\Asset\Enums\AssetStatus;
use App\Modules\Asset\Models\Asset;
use App\Modules\Asset\Traits\RespondsWithJson;
use App\Modules\AuditLog\Services\AuditLogService;
use App\Modules\Borrowing\Models\Borrowing;
use App\Modules\Maintenance\Models\Maintenance;
use App\Modules\Reservation\Models\Reservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

/**
 * Disposal lifecycle controller.
 *
 * States:
 *   AVAILABLE / MAINTENANCE / UNAVAILABLE / RETIRED
 *     → FOR_DISPOSAL  (markForDisposal)
 *   FOR_DISPOSAL
 *     → DISPOSED      (finalize)
 *     → AVAILABLE     (cancel - authorized reversal, audit reason required)
 *   DISPOSED           terminal, no further transitions.
 *
 * Blocking rules:
 *   - Cannot mark FOR_DISPOSAL while BORROWED, RESERVED, Permanently Issued,
 *     or under active MAINTENANCE.
 *   - DISPOSED is terminal.
 */
class DisposalController extends Controller
{
    use RespondsWithJson;

    public function __construct(
        private readonly AuditLogService $auditLogService,
    ) {}

    /**
     * Mark an eligible asset as FOR_DISPOSAL.
     *
     * Allowed for: Super Admin, System Admin, Property Custodian, Inventory Officer, Dept Head.
     * Eligible from: AVAILABLE, MAINTENANCE, UNAVAILABLE, RETIRED.
     */
    public function markForDisposal(Request $request, Asset $asset): JsonResponse
    {
        $this->authorizeDisposalAction($request->user());

        $validated = $request->validate([
            'disposal_reason'        => ['required', 'string', 'min:3'],
            'disposal_date'          => ['required', 'date'],
            'disposal_method'        => ['nullable', 'string', 'max:100'],
            'disposal_approval_ref'  => ['nullable', 'string', 'max:255'],
        ]);

        $currentStatus = $asset->status instanceof AssetStatus
            ? $asset->status
            : AssetStatus::tryFrom((string) $asset->status);

        // Terminal state — cannot mark again.
        if ($currentStatus === AssetStatus::DISPOSED) {
            return $this->error('This asset is already disposed and cannot be modified.', null, 422);
        }

        // Already proposed.
        if ($currentStatus === AssetStatus::FOR_DISPOSAL) {
            return $this->error('This asset is already marked for disposal.', null, 422);
        }

        // Blocking rules: BORROWED / RESERVED / Permanent Issue / active Maintenance.
        $blocking = $this->blockingReason($asset);

        if ($blocking !== null) {
            return $this->error($blocking, null, 422);
        }

        DB::transaction(function () use ($asset, $validated, $request): void {
            $asset->update([
                'status'              => AssetStatus::FOR_DISPOSAL,
                'disposal_reason'     => $validated['disposal_reason'],
                'disposal_date'       => $validated['disposal_date'],
                'disposal_method'     => $validated['disposal_method'] ?? null,
                'disposal_approval_ref' => $validated['disposal_approval_ref'] ?? null,
                'disposal_approved_by'  => $request->user()->id,
                'disposal_cancelled_at' => null,
                'disposal_cancel_reason'=> null,
            ]);

            // Audit log the transition.
            $this->auditLogService->log(
                'ASSET_MARKED_FOR_DISPOSAL',
                'Asset',
                "Asset #{$asset->id} ({$asset->name}) marked FOR_DISPOSAL. Reason: {$validated['disposal_reason']}.",
                ['from_status' => (function () use ($asset): string {
                     $raw = $asset->getOriginal('status');
                     if ($raw instanceof AssetStatus) {
                         return $raw->value;
                     }
                     return (string) ($raw ?? '');
                 })(),
                 'to_status'   => AssetStatus::FOR_DISPOSAL->value],
                ['disposal_reason' => $validated['disposal_reason'],
                 'disposal_date'   => $validated['disposal_date']],
                $request->user()->id,
                $request->ip(),
                $request->userAgent(),
            );
        });

        return $this->success(['asset' => $asset->fresh()], 'Asset marked for disposal successfully.');
    }

    /**
     * Finalize disposal — FOR_DISPOSAL → DISPOSED (terminal).
     */
    public function finalize(Request $request, Asset $asset): JsonResponse
    {
        $this->authorizeDisposalAction($request->user());

        $currentStatus = $asset->status instanceof AssetStatus
            ? $asset->status
            : AssetStatus::tryFrom((string) $asset->status);

        if ($currentStatus !== AssetStatus::FOR_DISPOSAL) {
            return $this->error('Only assets marked FOR_DISPOSAL can be finalised as DISPOSED.', null, 422);
        }

        $validated = $request->validate([
            'disposal_date'         => ['required', 'date'],
            'disposal_method'       => ['required', 'string', 'max:100'],
            'disposal_approval_ref' => ['nullable', 'string', 'max:255'],
        ]);

        DB::transaction(function () use ($asset, $validated, $request): void {
            $asset->update([
                'status'              => AssetStatus::DISPOSED,
                'disposal_date'       => $validated['disposal_date'],
                'disposal_method'     => $validated['disposal_method'],
                'disposal_approval_ref' => $validated['disposal_approval_ref'] ?? $asset->disposal_approval_ref,
                'disposal_cancelled_at' => null,
                'disposal_cancel_reason'=> null,
            ]);

            $this->auditLogService->log(
                'ASSET_DISPOSED',
                'Asset',
                "Asset #{$asset->id} ({$asset->name}) finalised as DISPOSED. Method: {$validated['disposal_method']}.",
                ['from_status' => AssetStatus::FOR_DISPOSAL->value,
                 'to_status'   => AssetStatus::DISPOSED->value],
                ['disposal_method' => $validated['disposal_method'],
                 'disposal_date'   => $validated['disposal_date']],
                $request->user()->id,
                $request->ip(),
                $request->userAgent(),
            );
        });

        return $this->success(['asset' => $asset->fresh()], 'Asset disposed successfully.');
    }

    /**
     * Cancel the FOR_DISPOSAL proposal — authorized reversal to AVAILABLE.
     * Requires an audit reason.
     */
    public function cancel(Request $request, Asset $asset): JsonResponse
    {
        $this->authorizeDisposalAction($request->user());

        $currentStatus = $asset->status instanceof AssetStatus
            ? $asset->status
            : AssetStatus::tryFrom((string) $asset->status);

        if ($currentStatus !== AssetStatus::FOR_DISPOSAL) {
            return $this->error('Only assets currently marked FOR_DISPOSAL can have the proposal cancelled.', null, 422);
        }

        $validated = $request->validate([
            'disposal_cancel_reason' => ['required', 'string', 'min:3'],
        ]);

        DB::transaction(function () use ($asset, $validated, $request): void {
            $asset->update([
                'status'                => AssetStatus::AVAILABLE,
                'disposal_cancelled_at' => now(),
                'disposal_cancel_reason'=> $validated['disposal_cancel_reason'],
            ]);

            $this->auditLogService->log(
                'ASSET_DISPOSAL_CANCELLED',
                'Asset',
                "Asset #{$asset->id} ({$asset->name}) disposal proposal CANCELLED and the asset returned to AVAILABLE. Reason: {$validated['disposal_cancel_reason']}.",
                ['from_status' => AssetStatus::FOR_DISPOSAL->value,
                 'to_status'   => AssetStatus::AVAILABLE->value],
                ['disposal_cancel_reason' => $validated['disposal_cancel_reason']],
                $request->user()->id,
                $request->ip(),
                $request->userAgent(),
            );
        });

        return $this->success(['asset' => $asset->fresh()], 'Disposal proposal cancelled. Asset is available again.');
    }

    /**
     * Determine why this asset cannot enter FOR_DISPOSAL.
     *
     * Returns null when the asset is eligible, otherwise a descriptive
     * business-rule message.
     */
    private function blockingReason(Asset $asset): ?string
    {
        $activeBorrowing = Borrowing::query()
            ->where('asset_id', $asset->id)
            ->whereIn('status', ['BORROWED', 'ACTIVE', 'OVERDUE'])
            ->exists();

        if ($activeBorrowing) {
            return 'Cannot mark this asset for disposal while it is actively borrowed. Complete the return first.';
        }

        $openReservation = Reservation::query()
            ->whereIn('status', ['PENDING', 'APPROVED'])
            ->whereHas('assets', fn ($q) => $q
                ->where('assets.id', $asset->id)
                ->whereNull('reservation_items.fulfilled_at'))
            ->exists();

        if ($openReservation) {
            return 'Cannot mark this asset for disposal while it has an open borrow request or reserved status. Resolve the request first.';
        }

        // Permanently issued (has an accountable holder).
        if (filled($asset->issued_to_user_id) || filled($asset->issued_to)) {
            return 'Cannot mark a permanently issued asset for disposal while it has an accountable holder. Transfer or recall the asset first.';
        }

        $activeMaintenance = Maintenance::query()
            ->where('asset_id', $asset->id)
            ->whereIn('status', ['scheduled', 'in_progress'])
            ->exists();

        if ($activeMaintenance) {
            return 'Cannot mark this asset for disposal while it is under active maintenance. Complete or cancel the maintenance first.';
        }

        return null;
    }

    /**
     * Authorization: Super Admin, System Admin, Property Custodian,
     * Inventory Officer, or Department Head.
     */
    private function authorizeDisposalAction(User $user): void
    {
        $allowed = $user->hasRole(UserRole::SUPER_ADMINISTRATOR->value)
            || $user->hasRole(UserRole::SYSTEM_ADMINISTRATOR->value)
            || $user->hasRole(UserRole::PROPERTY_CUSTODIAN->value)
            || $user->hasRole(UserRole::INVENTORY_OFFICER->value)
            || $user->hasRole(UserRole::DEPARTMENT_HEAD->value);

        abort_unless($allowed, 403, 'Unauthorized. Only property custodians, officers, department heads or administrators can perform disposal actions.');
    }
}