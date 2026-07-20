<?php

namespace App\Modules\Reservation\Repositories;

use App\Models\Reservation;
use App\Modules\Reservation\Repositories\Contracts\ReservationRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class ReservationRepository implements ReservationRepositoryInterface
{
    public function all(array $filters = []): LengthAwarePaginator
    {
        $query = Reservation::query();

        if (isset($filters['search'])) {
            $search = $filters['search'];
            $query->where('purpose', 'like', "%{$search}%");
        }

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (isset($filters['reservation_date'])) {
            $query->whereDate('reservation_date', $filters['reservation_date']);
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    public function find(int $id): Reservation
    {
        return Reservation::findOrFail($id);
    }

    public function create(array $data): Reservation
    {
        return Reservation::create($data);
    }

    public function update(Reservation $reservation, array $data): Reservation
    {
        $reservation->update($data);
        return $reservation->fresh();
    }

    public function delete(Reservation $reservation): void
    {
        $reservation->delete();
    }

    public function findByUserId(int $userId): LengthAwarePaginator
    {
        return Reservation::where('user_id', $userId)->paginate(15);
    }

    public function findByStatus(string $status): LengthAwarePaginator
    {
        return Reservation::where('status', $status)->paginate(15);
    }
}
