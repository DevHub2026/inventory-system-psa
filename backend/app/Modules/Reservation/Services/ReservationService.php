<?php

namespace App\Modules\Reservation\Services;

use App\Enums\UserRole;
use App\Models\User;
use App\Modules\Asset\Enums\AssetStatus;
use App\Modules\AssetIdentifier\Models\AssetIdentifier;
use App\Modules\Reservation\Models\Reservation;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ReservationService
{
    public function list(User $user, int $perPage = 20): LengthAwarePaginator
    {
        return Reservation::query()
            ->with(['user', 'assets', 'authorizer'])
            ->when(! $this->canViewAllReservations($user), fn ($query) => $query->where('user_id', $user->id))
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    public function create(User $user, array $data): Reservation
    {
        return DB::transaction(function () use ($user, $data) {
            $reservation = Reservation::create([
                'user_id' => $user->id,
                'status' => 'PENDING',
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'],
                'remarks' => $data['remarks'] ?? null,
            ]);

            $reservation->assets()->sync($data['asset_ids']);
            $reservation->assets()->update(['status' => AssetStatus::RESERVED->value]);

            return $reservation->load(['user', 'assets']);
        });
    }

    public function approve(Reservation $reservation, User $authorizer): Reservation
    {
        return DB::transaction(function () use ($reservation, $authorizer) {
            $reservation = Reservation::query()
                ->with(['user', 'assets'])
                ->lockForUpdate()
                ->findOrFail($reservation->id);

            if ($reservation->status !== 'PENDING') {
                throw new \InvalidArgumentException('Borrow request is already authorized or completed.');
            }

            $reservation->update([
                'status' => 'APPROVED',
                'authorized_by' => $authorizer->id,
                'authorized_at' => now(),
            ]);

            // Approval authorizes a future transaction; it must not borrow the asset.
            $reservation->assets()->update(['status' => AssetStatus::AVAILABLE->value]);

            return $reservation->fresh()->load(['user', 'assets', 'authorizer']);
        });
    }

    public function authorizeByScan(User $authorizer, string $value): Reservation
    {
        return DB::transaction(function () use ($authorizer, $value) {
            $reservation = $this->reservationFromScanValue($value);

            if (! $reservation) {
                throw new \InvalidArgumentException('No pending borrow request found for this QR code.');
            }

            return $this->approve($reservation, $authorizer);
        });
    }

    private function reservationFromScanValue(string $value): ?Reservation
    {
        $value = trim($value);
        $reference = strtok($value, '|') ?: $value;

        if (str_starts_with($reference, 'PSA-RES-')) {
            $reservationId = (int) substr($reference, strlen('PSA-RES-'));

            return $reservationId > 0 ? Reservation::query()->find($reservationId) : null;
        }

        $asset = AssetIdentifier::query()
            ->where('identifier_value', $value)
            ->first()
            ?->asset;

        if (! $asset) {
            return null;
        }

        return Reservation::query()
            ->where('status', 'PENDING')
            ->whereHas('assets', fn ($query) => $query->where('assets.id', $asset->id))
            ->orderBy('created_at')
            ->first();
    }

    private function canViewAllReservations(User $user): bool
    {
        return $user->hasRole(UserRole::SUPER_ADMINISTRATOR->value)
            || $user->hasRole(UserRole::SYSTEM_ADMINISTRATOR->value)
            || $user->hasRole(UserRole::PROPERTY_CUSTODIAN->value)
            || $user->hasRole(UserRole::DEPARTMENT_HEAD->value);
    }
}
