<?php

namespace App\Modules\Asset\Services;

use App\Modules\Asset\Enums\AssetStatus;
use App\Modules\Asset\Models\Asset;
use App\Modules\Borrowing\Models\Borrowing;
use App\Modules\Reservation\Models\Reservation;

class AssetLifecycleCoordinator
{
    /**
     * Prevent direct manual edits from setting workflow-owned statuses.
     */
    public function validateManualStatusTransition(Asset $asset, ?string $nextStatus): void
    {
        if ($nextStatus === null || $nextStatus === '') {
            return;
        }

        $current = $asset->status instanceof AssetStatus
            ? $asset->status->value
            : (string) $asset->status;

        if ($current === $nextStatus) {
            return;
        }

        if (in_array($nextStatus, [AssetStatus::BORROWED->value, AssetStatus::RESERVED->value], true)) {
            throw new \InvalidArgumentException(
                "Asset status '{$nextStatus}' is controlled by reservation/borrowing workflows and cannot be set manually.",
            );
        }
    }

    /**
     * Prevent permanent issuance while a pending/approved request is unresolved.
     */
    public function assertNoBorrowingConflictsForPermanentIssuance(Asset $asset): void
    {
        $hasActiveBorrowing = Borrowing::query()
            ->where('asset_id', $asset->id)
            ->whereIn('status', ['BORROWED', 'ACTIVE', 'OVERDUE'])
            ->exists();

        if ($hasActiveBorrowing) {
            throw new \InvalidArgumentException(
                'Cannot permanently issue this asset while it has an active borrowing transaction.',
            );
        }

        $hasOpenReservation = Reservation::query()
            ->whereIn('status', ['PENDING', 'APPROVED'])
            ->whereHas('assets', fn ($q) => $q
                ->where('assets.id', $asset->id)
                ->whereNull('reservation_items.fulfilled_at'))
            ->exists();

        if ($hasOpenReservation) {
            throw new \InvalidArgumentException(
                'Cannot permanently issue this asset while it has an open borrow request. Resolve the request first.',
            );
        }
    }
}
