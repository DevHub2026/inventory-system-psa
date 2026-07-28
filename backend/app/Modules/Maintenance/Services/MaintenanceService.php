<?php

namespace App\Modules\Maintenance\Services;

use App\Modules\Asset\Enums\AssetStatus;
use App\Modules\Maintenance\Models\Maintenance;
use App\Modules\Notification\Services\NotificationService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class MaintenanceService
{
    public function __construct(private readonly NotificationService $notificationService) {}

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
        return DB::transaction(function () use ($data) {
            $maintenance = Maintenance::create($data)->load(['asset', 'user']);

            // Set asset status to Maintenance when maintenance is created
            if ($maintenance->asset) {
                $maintenance->asset->update(['status' => AssetStatus::MAINTENANCE->value]);
            }

            $assetName = $maintenance->asset?->name ?? 'an asset';
            $this->notificationService->notifyStaffAndAdmins(
                'Maintenance Update',
                "Maintenance was scheduled for {$assetName}.",
                'maintenance_update',
                $maintenance->id,
                Maintenance::class,
                ['link' => '/maintenance', 'status' => $maintenance->status],
            );

            return $maintenance;
        });
    }

    public function update(Maintenance $maintenance, array $data): Maintenance
    {
        $maintenance->update($data);
        $fresh = $maintenance->fresh()->load(['asset', 'user']);

        $assetName = $fresh->asset?->name ?? 'an asset';
        $this->notificationService->notifyStaffAndAdmins(
            'Maintenance Update',
            "Maintenance for {$assetName} was updated (status: {$fresh->status}).",
            'maintenance_update',
            $fresh->id,
            Maintenance::class,
            ['link' => '/maintenance', 'status' => $fresh->status],
        );

        return $fresh;
    }

    public function delete(Maintenance $maintenance): void
    {
        $maintenance->delete();
    }

    public function complete(Maintenance $maintenance): Maintenance
    {
        return DB::transaction(function () use ($maintenance) {
            $maintenance->update([
                'status' => 'completed',
                'completed_date' => now(),
            ]);

            // Set asset status back to Available when maintenance is completed
            if ($maintenance->asset) {
                $maintenance->asset->update(['status' => AssetStatus::AVAILABLE->value]);
            }

            $fresh = $maintenance->fresh()->load(['asset', 'user']);
            $assetName = $fresh->asset?->name ?? 'an asset';

            $this->notificationService->notifyStaffAndAdmins(
                'Maintenance Completed',
                "Maintenance for {$assetName} has been completed.",
                'maintenance_update',
                $fresh->id,
                Maintenance::class,
                ['link' => '/maintenance', 'status' => 'completed'],
            );

            return $fresh;
        });
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
