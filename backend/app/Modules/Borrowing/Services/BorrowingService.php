<?php

namespace App\Modules\Borrowing\Services;

use App\Enums\UserRole;
use App\Models\User;
use App\Modules\Asset\Enums\AssetStatus;
use App\Modules\Asset\Exceptions\AssetNotAvailableException;
use App\Modules\Asset\Models\Asset;
use App\Modules\Borrowing\Models\Borrowing;
use App\Modules\Reservation\Models\Reservation;
use App\Modules\AssetIdentifier\Services\AssetIdentifierService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class BorrowingService
{
    public function __construct(private readonly AssetIdentifierService $assetIdentifierService) {}

    public function list(User $user, int $perPage = 20): LengthAwarePaginator
    {
        return Borrowing::query()
            ->with(['user', 'asset', 'authorizer'])
            ->when(! $this->canViewAllBorrowings($user), fn ($query) => $query->where('user_id', $user->id))
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    public function create(User $actor, array $data): Borrowing
    {
        $this->ensureCanCompleteBorrow($actor);

        return DB::transaction(function () use ($actor, $data) {
            $asset = Asset::query()->lockForUpdate()->findOrFail($data['asset_id']);

            // Approved reservations created before the standardized workflow may
            // still leave the asset in RESERVED. That state represents the same
            // approved request and can be fulfilled exactly once by this service.
            $reservation = $this->authorizedReservationForAsset($asset);

            if ($asset->status !== AssetStatus::AVAILABLE
                && ! ($asset->status === AssetStatus::RESERVED && $reservation)) {
                throw new AssetNotAvailableException('Asset is not available for borrowing.');
            }

            $hasActiveBorrowing = Borrowing::query()
                ->where('asset_id', $asset->id)
                ->where('status', 'BORROWED')
                ->exists();

            if ($hasActiveBorrowing) {
                throw new AssetNotAvailableException('Asset already has an active borrowing record.');
            }

            if (! $reservation) {
                throw new \InvalidArgumentException('Borrowing is not authorized for this asset.');
            }

            $borrowing = Borrowing::create([
                'user_id' => $reservation->user_id,
                'asset_id' => $asset->id,
                'reservation_id' => $reservation->id,
                'borrow_date' => $data['borrow_date'],
                'borrowed_at' => now(),
                'due_date' => $reservation->end_date?->toDateString() ?? $data['due_date'],
                'status' => 'BORROWED',
                'remarks' => $data['remarks'] ?? null,
                'authorized_by' => $reservation->authorized_by,
                'authorized_at' => $reservation->authorized_at,
            ]);

            $asset->update(['status' => AssetStatus::BORROWED]);
            $reservation->assets()->updateExistingPivot($asset->id, ['fulfilled_at' => now()]);

            return $borrowing->load(['user', 'asset', 'authorizer']);
        });
    }

    public function return(User $actor, Borrowing $borrowing): Borrowing
    {
        return DB::transaction(function () use ($actor, $borrowing) {
            $borrowing = Borrowing::query()
                ->with('asset')
                ->lockForUpdate()
                ->findOrFail($borrowing->id);

            if (! $this->canCompleteReturn($actor, $borrowing)) {
                throw new \InvalidArgumentException('You are not authorized to complete this return.');
            }

            if ($borrowing->status !== 'BORROWED') {
                throw new \InvalidArgumentException('Borrowing has already been returned.');
            }

            $borrowing->update([
                'status' => 'RETURNED',
                'returned_at' => now(),
            ]);
            $borrowing->asset()->update(['status' => AssetStatus::AVAILABLE]);

            return $borrowing->fresh()->load(['user', 'asset', 'authorizer']);
        });
    }

    public function scan(User $actor, string $identifier): Borrowing
    {
        $identifier = trim($identifier);

        if ($identifier === '') {
            throw new \InvalidArgumentException('Identifier value is required.');
        }

        $receiptBorrowing = $this->borrowingFromReceipt($identifier);

        if ($receiptBorrowing) {
            if ($receiptBorrowing->status !== 'BORROWED') {
                throw new \InvalidArgumentException('Borrowing has already been returned.');
            }

            return $this->return($actor, $receiptBorrowing);
        }

        $reservation = $this->reservationFromReceipt($identifier);

        if ($reservation) {
            return $this->borrowReservationReceipt($actor, $reservation);
        }

        $assetIdentifier = $this->assetIdentifierService->findByValue($identifier);

        if (! $assetIdentifier) {
            throw new \InvalidArgumentException('Asset not found for the given identifier.');
        }

        $asset = $assetIdentifier->asset;

        $activeBorrowing = Borrowing::query()
            ->where('asset_id', $asset->id)
            ->where('status', 'BORROWED')
            ->latest('id')
            ->first();

        if ($activeBorrowing) {
            return $this->return($actor, $activeBorrowing);
        }

        $pendingReservation = $this->pendingReservationForAsset($asset);

        if ($pendingReservation) {
            return $this->borrowReservationReceipt($actor, $pendingReservation);
        }

        return $this->create($actor, [
            'asset_id' => $asset->id,
            'borrow_date' => now()->toDateString(),
            'borrowed_at' => now(),
            'due_date' => now()->addDays(7)->toDateString(),
        ]);
    }

    private function borrowReservationReceipt(User $actor, Reservation $reservation): Borrowing
    {
        $this->ensureCanCompleteBorrow($actor);

        return DB::transaction(function () use ($actor, $reservation) {
            $reservation = Reservation::query()
                ->with(['user', 'assets', 'authorizer'])
                ->lockForUpdate()
                ->findOrFail($reservation->id);

            if ($reservation->status === 'PENDING') {
                $reservation->update([
                    'status' => 'APPROVED',
                    'authorized_by' => $actor->id,
                    'authorized_at' => now(),
                ]);

                $reservation->assets()->update(['status' => AssetStatus::AVAILABLE->value]);
            } elseif ($reservation->status !== 'APPROVED') {
                throw new \InvalidArgumentException('This borrowing request cannot be authorized.');
            }

            $asset = $reservation->assets()
                ->whereNull('reservation_items.fulfilled_at')
                ->orderBy('assets.id')
                ->first();

            if (! $asset) {
                $existingBorrowing = Borrowing::query()
                    ->where('reservation_id', $reservation->id)
                    ->latest('id')
                    ->first();

                if ($existingBorrowing?->status === 'BORROWED') {
                    return $this->return($actor, $existingBorrowing);
                }

                if ($existingBorrowing?->status === 'RETURNED') {
                    throw new \InvalidArgumentException('This borrowing transaction has already been returned.');
                }

                throw new \InvalidArgumentException('Borrow request has already been completed.');
            }

            return $this->create($actor, [
                'asset_id' => $asset->id,
                'borrow_date' => now()->toDateString(),
                'borrowed_at' => now(),
                'due_date' => $reservation->end_date?->toDateString() ?? now()->addDays(7)->toDateString(),
            ]);
        });
    }

    private function borrowingFromReceipt(string $identifier): ?Borrowing
    {
        $reference = strtok($identifier, '|') ?: $identifier;

        if (! str_starts_with($reference, 'PSA-BOR-')) {
            return null;
        }

        $borrowingId = (int) substr($reference, strlen('PSA-BOR-'));

        return $borrowingId > 0
            ? Borrowing::query()->with(['user', 'asset', 'authorizer'])->find($borrowingId)
            : null;
    }

    private function reservationFromReceipt(string $identifier): ?Reservation
    {
        $reference = strtok($identifier, '|') ?: $identifier;

        if (! str_starts_with($reference, 'PSA-RES-')) {
            return null;
        }

        $reservationId = (int) substr($reference, strlen('PSA-RES-'));

        return $reservationId > 0
            ? Reservation::query()->with(['user', 'assets', 'authorizer'])->find($reservationId)
            : null;
    }

    private function authorizedReservationForAsset(Asset $asset): ?Reservation
    {
        return Reservation::query()
            ->where('status', 'APPROVED')
            ->whereHas('assets', fn ($query) => $query
                ->where('assets.id', $asset->id)
                ->whereNull('reservation_items.fulfilled_at'))
            ->orderBy('authorized_at')
            ->lockForUpdate()
            ->first();
    }

    private function pendingReservationForAsset(Asset $asset): ?Reservation
    {
        return Reservation::query()
            ->where('status', 'PENDING')
            ->whereHas('assets', fn ($query) => $query
                ->where('assets.id', $asset->id)
                ->whereNull('reservation_items.fulfilled_at'))
            ->orderBy('created_at')
            ->lockForUpdate()
            ->first();
    }

    private function ensureCanCompleteBorrow(User $user): void
    {
        if (! $this->canCompleteTransactions($user)) {
            throw new \InvalidArgumentException('You are not authorized to complete this borrowing transaction.');
        }
    }

    private function canCompleteReturn(User $user, Borrowing $borrowing): bool
    {
        return $borrowing->user_id === $user->id || $this->canCompleteTransactions($user);
    }

    private function canCompleteTransactions(User $user): bool
    {
        return $user->hasRole(UserRole::SUPER_ADMINISTRATOR->value)
            || $user->hasRole(UserRole::SYSTEM_ADMINISTRATOR->value)
            || $user->hasRole(UserRole::PROPERTY_CUSTODIAN->value)
            || $user->hasRole(UserRole::INVENTORY_OFFICER->value)
            || $user->hasRole(UserRole::DEPARTMENT_HEAD->value);
    }

    private function canViewAllBorrowings(User $user): bool
    {
        return $user->hasRole(UserRole::SUPER_ADMINISTRATOR->value)
            || $user->hasRole(UserRole::SYSTEM_ADMINISTRATOR->value)
            || $user->hasRole(UserRole::PROPERTY_CUSTODIAN->value)
            || $user->hasRole(UserRole::DEPARTMENT_HEAD->value);
    }
}
