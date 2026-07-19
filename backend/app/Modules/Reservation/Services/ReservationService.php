<?php

namespace App\Modules\Reservation\Services;

use App\Enums\UserRole;
use App\Models\User;
use App\Modules\Asset\Enums\AssetStatus;
use App\Modules\Borrowing\Models\Borrowing;
use App\Modules\Reservation\Models\Reservation;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class ReservationService
{
    public function list(User $user, array $filters = []): Collection
    {
        return Reservation::query()
            ->with(['user', 'assets', 'authorizer'])
            ->when(! $this->canViewAllReservations($user), fn ($query) => $query->where('user_id', $user->id))
            ->orderByDesc('created_at')
            ->get();
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
            $reservation->load(['user', 'assets']);

            foreach ($reservation->assets as $asset) {
                Borrowing::query()->updateOrCreate(
                    [
                        'user_id' => $reservation->user_id,
                        'asset_id' => $asset->id,
                        'status' => 'BORROWED',
                    ],
                    [
                        'borrow_date' => now()->toDateString(),
                        'due_date' => $reservation->end_date?->toDateString() ?? now()->addDays(7)->toDateString(),
                        'remarks' => $reservation->remarks,
                        'authorized_by' => $authorizer->id,
                        'authorized_at' => now(),
                    ],
                );

                $asset->update(['status' => AssetStatus::BORROWED->value]);
            }

            $reservation->update([
                'status' => 'APPROVED',
                'authorized_by' => $authorizer->id,
                'authorized_at' => now(),
            ]);

            return $reservation->fresh()->load(['user', 'assets', 'authorizer']);
        });
    }

    private function canViewAllReservations(User $user): bool
    {
        return $user->hasRole(UserRole::SUPER_ADMINISTRATOR->value)
            || $user->hasRole(UserRole::SYSTEM_ADMINISTRATOR->value)
            || $user->hasRole(UserRole::PROPERTY_CUSTODIAN->value)
            || $user->hasRole(UserRole::DEPARTMENT_HEAD->value);
    }
}
