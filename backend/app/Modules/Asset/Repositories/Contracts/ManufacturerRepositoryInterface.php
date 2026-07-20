<?php

namespace App\Modules\Asset\Repositories\Contracts;

use App\Models\Manufacturer;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ManufacturerRepositoryInterface
{
    public function all(array $filters = []): LengthAwarePaginator;

    public function find(int $id): Manufacturer;

    public function create(array $data): Manufacturer;

    public function update(Manufacturer $manufacturer, array $data): Manufacturer;

    public function delete(Manufacturer $manufacturer): void;

    public function findByCode(string $code): ?Manufacturer;
}
