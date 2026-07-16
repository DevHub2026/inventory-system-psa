<?php

namespace App\Modules\Reservation\Services;

use App\Models\User;
use App\Modules\Reservation\Models\Reservation;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class ReservationService
{
    public function list(User $user, array $filters = []): Collection
    {
        return Reservation::query()
            ->where('user_id', $user->id)
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

            return $reservation->load('assets');
        });
    }

    public function approve(Reservation $reservation): Reservation
    {
        $reservation->update(['status' => 'APPROVED']);

        return $reservation->fresh()->load('assets');
    }
}
