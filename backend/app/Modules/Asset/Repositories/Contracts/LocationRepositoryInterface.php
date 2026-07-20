<?php

namespace App\Modules\Asset\Repositories\Contracts;

use App\Models\Location;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface LocationRepositoryInterface
{
    public function all(array $filters = []): LengthAwarePaginator;

    public function find(int $id): Location;

    public function create(array $data): Location;

    public function update(Location $location, array $data): Location;

    public function delete(Location $location): void;

    public function findByCode(string $code): ?Location;
}
