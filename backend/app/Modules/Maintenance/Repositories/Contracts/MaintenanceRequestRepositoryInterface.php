<?php

namespace App\Modules\Maintenance\Repositories\Contracts;

use App\Models\MaintenanceRequest;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface MaintenanceRequestRepositoryInterface
{
    public function all(array $filters = []): LengthAwarePaginator;

    public function find(int $id): MaintenanceRequest;

    public function create(array $data): MaintenanceRequest;

    public function update(MaintenanceRequest $request, array $data): MaintenanceRequest;

    public function delete(MaintenanceRequest $request): void;

    public function findByAssetId(int $assetId): LengthAwarePaginator;

    public function findByStatus(string $status): LengthAwarePaginator;
}
