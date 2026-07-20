<?php

namespace App\Modules\Maintenance\Repositories;

use App\Models\MaintenanceRequest;
use App\Modules\Maintenance\Repositories\Contracts\MaintenanceRequestRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class MaintenanceRequestRepository implements MaintenanceRequestRepositoryInterface
{
    public function all(array $filters = []): LengthAwarePaginator
    {
        $query = MaintenanceRequest::query();

        if (isset($filters['search'])) {
            $search = $filters['search'];
            $query->where('title', 'like', "%{$search}%");
        }

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['asset_id'])) {
            $query->where('asset_id', $filters['asset_id']);
        }

        if (isset($filters['priority'])) {
            $query->where('priority', $filters['priority']);
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    public function find(int $id): MaintenanceRequest
    {
        return MaintenanceRequest::findOrFail($id);
    }

    public function create(array $data): MaintenanceRequest
    {
        return MaintenanceRequest::create($data);
    }

    public function update(MaintenanceRequest $request, array $data): MaintenanceRequest
    {
        $request->update($data);
        return $request->fresh();
    }

    public function delete(MaintenanceRequest $request): void
    {
        $request->delete();
    }

    public function findByAssetId(int $assetId): LengthAwarePaginator
    {
        return MaintenanceRequest::where('asset_id', $assetId)->paginate(15);
    }

    public function findByStatus(string $status): LengthAwarePaginator
    {
        return MaintenanceRequest::where('status', $status)->paginate(15);
    }
}
