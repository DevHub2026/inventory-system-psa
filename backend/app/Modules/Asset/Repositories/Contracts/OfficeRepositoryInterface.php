<?php

namespace App\Modules\Asset\Repositories\Contracts;

use App\Models\Office;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface OfficeRepositoryInterface
{
    public function all(array $filters = []): LengthAwarePaginator;

    public function find(int $id): Office;

    public function create(array $data): Office;

    public function update(Office $office, array $data): Office;

    public function delete(Office $office): void;

    public function findByCode(string $code): ?Office;
}
