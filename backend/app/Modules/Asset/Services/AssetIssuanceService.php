<?php

namespace App\Modules\Asset\Services;

use App\Models\User;
use App\Modules\Asset\Enums\AssetStatus;
use App\Modules\Asset\Enums\IssuanceType;
use App\Modules\Asset\Exceptions\AssetNotAvailableException;
use App\Modules\Asset\Models\Asset;
use App\Modules\Asset\Models\AssetIssuanceHistory;
use App\Modules\AuditLog\Services\AuditLogService;
use App\Modules\Notification\Services\NotificationService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class AssetIssuanceService
{
    public function __construct(
        private readonly IssuanceAuthorization $authorization,
        private readonly AuditLogService $auditLogService,
        private readonly NotificationService $notificationService,
        private readonly AssetLifecycleCoordinator $assetLifecycleCoordinator,
    ) {}

    public function assignInitial(User $actor, Asset $asset, int $issuedToUserId, string $dateIssued): Asset
    {
        if (! $this->authorization->canManageIssuance($actor)) {
            throw new \InvalidArgumentException('You are not authorized to perform permanent asset issuance.');
        }

        $holder = $this->resolveAssignableUser($issuedToUserId);

        if ($this->hasCurrentHolder($asset)) {
            throw new \InvalidArgumentException(
                'This asset is already permanently issued. Use the re-issuance workflow to transfer accountability.',
            );
        }

        $this->assertAssetEligibleForIssuance($asset);

        return DB::transaction(function () use ($actor, $asset, $holder, $dateIssued) {
            $asset = Asset::query()->lockForUpdate()->findOrFail($asset->id);

            if ($this->hasCurrentHolder($asset)) {
                throw new \InvalidArgumentException(
                    'This asset is already permanently issued. Use the re-issuance workflow to transfer accountability.',
                );
            }

            $this->assertAssetEligibleForIssuance($asset);

            $asset->update([
                'issued_to_user_id' => $holder->id,
                'issued_to' => $holder->full_name,
                'issued_by_user_id' => $actor->id,
                'date_issued' => $dateIssued,
            ]);

            $this->createInitialHistoryIfMissing($asset, $holder, $actor, $dateIssued);

            $this->auditLogService->log(
                'ISSUE',
                'Asset',
                "Permanently issued asset #{$asset->id} ({$asset->name}) to {$holder->full_name}",
                [],
                [
                    'issued_to_user_id' => $holder->id,
                    'date_issued' => $dateIssued,
                ],
            );

            $this->notificationService->notifyUser(
                $holder->id,
                'New Accountability Assigned',
                "You have been permanently assigned asset {$asset->name} (Property Code: {$asset->asset_number}).",
                'borrowing_confirmed',
                $asset->id,
                Asset::class,
            );

            return $asset->fresh([
                'category',
                'manufacturer',
                'office',
                'location',
                'identifiers',
                'issuedToUser.department',
                'issuedToUser.office',
                'issuedToUser.roles',
                'issuedByUser',
            ]);
        });
    }

    public function searchUsersForPicker(User $actor, array $filters = []): LengthAwarePaginator
    {
        if (! $this->authorization->canManageIssuance($actor)) {
            throw new \InvalidArgumentException('You are not authorized to search users for issuance.');
        }

        $perPage = max(1, min(50, (int) ($filters['per_page'] ?? 20)));

        return $this->activeUsersQuery()
            ->with(['department', 'office', 'roles'])
            ->when(! empty($filters['search']), fn (Builder $q) => $this->applyUserSearch($q, (string) $filters['search']))
            ->when(! empty($filters['office_id']), fn (Builder $q) => $q->where('office_id', (int) $filters['office_id']))
            ->when(! empty($filters['department_id']), fn (Builder $q) => $q->where('department_id', (int) $filters['department_id']))
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->paginate($perPage);
    }

    public function listUsersForDirectory(User $actor, array $filters = []): LengthAwarePaginator
    {
        if (! $this->authorization->canManageIssuance($actor)) {
            throw new \InvalidArgumentException('You are not authorized to view the issuance directory.');
        }

        $perPage = max(1, min(50, (int) ($filters['per_page'] ?? 20)));
        $hasIssuances = filter_var($filters['has_issuances'] ?? true, FILTER_VALIDATE_BOOLEAN);

        $query = $this->activeUsersQuery()
            ->with(['department', 'office', 'roles'])
            ->withCount([
                'permanentlyIssuedAssets as permanent_issuance_count' => fn (Builder $q) => $q
                    ->whereNull('assets.deleted_at'),
            ])
            ->withMax([
                'permanentlyIssuedAssets' => fn (Builder $q) => $q->whereNull('assets.deleted_at'),
            ], 'date_issued');

        if ($hasIssuances) {
            $query->whereHas('permanentlyIssuedAssets', fn (Builder $q) => $q->whereNull('assets.deleted_at'));
        }

        if (! empty($filters['search'])) {
            $this->applyUserSearch($query, (string) $filters['search']);
        }

        if (! empty($filters['office_id'])) {
            $query->where('office_id', (int) $filters['office_id']);
        }

        if (! empty($filters['department_id'])) {
            $query->where('department_id', (int) $filters['department_id']);
        }

        return $query
            ->orderByDesc('permanent_issuance_count')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->paginate($perPage);
    }

    /**
     * @return array{user: User, items: \Illuminate\Support\Collection<int, Asset>}
     */
    public function listAssetsForUser(User $actor, User $subject, array $filters = []): array
    {
        if (! $this->authorization->canViewUserIssuances($actor, $subject)) {
            throw new \InvalidArgumentException('You are not authorized to view this user\'s permanent issuances.');
        }

        $subject->loadMissing(['department', 'office', 'roles']);

        $query = Asset::query()
            ->with(['category', 'office', 'issuedByUser', 'issuedToUser'])
            ->where('issued_to_user_id', $subject->id)
            ->whereNull('deleted_at');

        if (! empty($filters['search'])) {
            $like = '%'.trim((string) $filters['search']).'%';
            $query->where(function (Builder $q) use ($like) {
                $q->where('name', 'like', $like)
                    ->orWhere('asset_number', 'like', $like)
                    ->orWhere('property_number', 'like', $like);
            });
        }

        if (! empty($filters['asset_category_id'])) {
            $query->where('asset_category_id', (int) $filters['asset_category_id']);
        }

        if (! empty($filters['office_id'])) {
            $query->where('office_id', (int) $filters['office_id']);
        }

        if (! empty($filters['date_issued_from'])) {
            $query->whereDate('date_issued', '>=', $filters['date_issued_from']);
        }

        if (! empty($filters['date_issued_to'])) {
            $query->whereDate('date_issued', '<=', $filters['date_issued_to']);
        }

        $items = $query
            ->orderByDesc('date_issued')
            ->orderByDesc('id')
            ->get();

        if (filter_var($filters['include_history'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
            $historicalAssetIds = AssetIssuanceHistory::query()
                ->where('new_employee_id', $subject->id)
                ->where('issuance_type', IssuanceType::TRANSFER->value)
                ->pluck('asset_id')
                ->unique()
                ->diff($items->pluck('id'));

            if ($historicalAssetIds->isNotEmpty()) {
                $historical = Asset::query()
                    ->with(['category', 'office', 'issuedByUser'])
                    ->whereIn('id', $historicalAssetIds)
                    ->get();

                $items = $items->concat($historical)->unique('id')->values();
            }
        }

        return [
            'user' => $subject,
            'items' => $items,
        ];
    }

    public function hasCurrentHolder(Asset $asset): bool
    {
        if ($asset->issued_to_user_id !== null) {
            return true;
        }

        return filled($asset->issued_to);
    }

    private function assertAssetEligibleForIssuance(Asset $asset): void
    {
        $this->assetLifecycleCoordinator->assertNoBorrowingConflictsForPermanentIssuance($asset);

        if ($asset->trashed()) {
            throw new AssetNotAvailableException('Cannot issue an archived or deleted asset.');
        }

        $status = $asset->status instanceof AssetStatus
            ? $asset->status
            : AssetStatus::tryFrom((string) $asset->status);

        if ($status === null) {
            return;
        }

        if (in_array($status, [
            AssetStatus::BORROWED,
            AssetStatus::RESERVED,
            AssetStatus::MAINTENANCE,
            AssetStatus::DISPOSED,
            AssetStatus::RETIRED,
        ], true)) {
            throw new AssetNotAvailableException(
                "Asset cannot be permanently issued while its status is {$status->value}.",
            );
        }
    }

    private function resolveAssignableUser(int $userId): User
    {
        $user = User::query()
            ->whereKey($userId)
            ->whereNull('deleted_at')
            ->first();

        if (! $user || ! $this->isActiveUser($user)) {
            throw new \InvalidArgumentException('The selected user is not valid for permanent issuance.');
        }

        return $user;
    }

    private function isActiveUser(User $user): bool
    {
        $status = $user->status;

        return in_array($status, ['active', 1, '1'], true);
    }

    private function activeUsersQuery(): Builder
    {
        return User::query()
            ->whereNull('deleted_at')
            ->where(function (Builder $query) {
                $query->where('status', 'active')
                    ->orWhere('status', 1)
                    ->orWhere('status', '1');
            });
    }

    private function applyUserSearch(Builder $query, string $search): Builder
    {
        $search = trim($search);

        if ($search === '') {
            return $query;
        }

        $like = '%'.$search.'%';
        $driver = $query->getConnection()->getDriverName();
        $operator = $driver === 'pgsql' ? 'ilike' : 'like';

        return $query->where(function (Builder $builder) use ($like, $operator) {
            $builder
                ->where('first_name', $operator, $like)
                ->orWhere('last_name', $operator, $like)
                ->orWhere('middle_name', $operator, $like)
                ->orWhere('employee_number', $operator, $like)
                ->orWhere('email', $operator, $like)
                ->orWhereHas('department', fn (Builder $q) => $q->where('name', $operator, $like))
                ->orWhereHas('office', fn (Builder $q) => $q->where('name', $operator, $like));
        });
    }

    private function createInitialHistoryIfMissing(
        Asset $asset,
        User $holder,
        User $actor,
        string $dateIssued,
    ): void {
        $exists = AssetIssuanceHistory::query()
            ->where('asset_id', $asset->id)
            ->where('issuance_type', IssuanceType::INITIAL->value)
            ->where('new_employee_id', $holder->id)
            ->exists();

        if ($exists) {
            return;
        }

        AssetIssuanceHistory::create([
            'asset_id' => $asset->id,
            'issuance_type' => IssuanceType::INITIAL->value,
            'previous_employee_id' => null,
            'new_employee_id' => $holder->id,
            'transferred_by' => $actor->id,
            'transfer_date' => $dateIssued,
            'reason' => 'Initial permanent issuance',
            'remarks' => null,
        ]);
    }
}
