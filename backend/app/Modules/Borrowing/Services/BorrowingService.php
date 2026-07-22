<?php

namespace App\Modules\Borrowing\Services;

use App\Enums\UserRole;
use App\Models\User;
use App\Modules\Asset\Enums\AssetStatus;
use App\Modules\Asset\Exceptions\AssetNotAvailableException;
use App\Modules\Asset\Models\Asset;
use App\Modules\Borrowing\Models\Borrowing;
use App\Modules\Reservation\Models\Reservation;
use App\Modules\AssetIdentifier\Models\AssetIdentifier;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class BorrowingService
{
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

            if ($asset->status !== AssetStatus::AVAILABLE) {
                throw new AssetNotAvailableException('Asset is not available for borrowing.');
            }

            $hasActiveBorrowing = Borrowing::query()
                ->where('asset_id', $asset->id)
                ->where('status', 'BORROWED')
                ->exists();

            if ($hasActiveBorrowing) {
                throw new AssetNotAvailableException('Asset already has an active borrowing record.');
            }

            $reservation = $this->authorizedReservationForAsset($asset);

            if (! $reservation) {
                throw new \InvalidArgumentException('Borrowing is not authorized for this asset.');
            }

            $borrowing = Borrowing::create([
                'user_id' => $reservation->user_id,
                'asset_id' => $asset->id,
                'reservation_id' => $reservation->id,
                'borrow_date' => $data['borrow_date'],
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
        $asset = AssetIdentifier::query()
            ->where('identifier_value', trim($identifier))
            ->firstOrFail()
            ->asset;

        $activeBorrowing = Borrowing::query()
            ->where('asset_id', $asset->id)
            ->where('status', 'BORROWED')
            ->latest('id')
            ->first();

        if ($activeBorrowing) {
            return $this->return($actor, $activeBorrowing);
        }

        return $this->create($actor, [
            'asset_id' => $asset->id,
            'borrow_date' => now()->toDateString(),
            'due_date' => now()->addDays(7)->toDateString(),
        ]);
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
