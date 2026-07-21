<?php

namespace App\Modules\Maintenance\Services;

use App\Modules\Maintenance\Models\Maintenance;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class MaintenanceService
{
    public function list(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = Maintenance::query()->with(['asset', 'user']);

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (isset($filters['asset_id'])) {
            $query->where('asset_id', $filters['asset_id']);
        }

        return $query->orderByDesc('created_at')->paginate(min(max($perPage, 1), 100));
    }

    public function create(array $data): Maintenance
    {
        return Maintenance::create($data);
    }

    public function update(Maintenance $maintenance, array $data): Maintenance
    {
        $maintenance->update($data);

        return $maintenance->fresh();
    }

    public function delete(Maintenance $maintenance): void
    {
        $maintenance->delete();
    }

    public function complete(Maintenance $maintenance): Maintenance
    {
        $maintenance->update([
            'status' => 'completed',
            'completed_date' => now(),
        ]);

        return $maintenance->fresh();
    }

    public function getScheduled(): Collection
    {
        return Maintenance::query()
            ->with(['asset', 'user'])
            ->where('status', 'scheduled')
            ->where('scheduled_date', '>=', now())
            ->orderBy('scheduled_date', 'asc')
            ->get();
    }

    public function getOverdue(): Collection
    {
        return Maintenance::query()
            ->with(['asset', 'user'])
            ->where('status', 'scheduled')
            ->where('scheduled_date', '<', now())
            ->orderBy('scheduled_date', 'asc')
            ->get();
    }
}
