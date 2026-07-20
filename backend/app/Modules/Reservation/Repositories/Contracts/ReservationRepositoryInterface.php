<?php

namespace App\Modules\Reservation\Repositories\Contracts;

use App\Models\Reservation;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ReservationRepositoryInterface
{
    public function all(array $filters = []): LengthAwarePaginator;

    public function find(int $id): Reservation;

    public function create(array $data): Reservation;

    public function update(Reservation $reservation, array $data): Reservation;

    public function delete(Reservation $reservation): void;

    public function findByUserId(int $userId): LengthAwarePaginator;

    public function findByStatus(string $status): LengthAwarePaginator;
}
