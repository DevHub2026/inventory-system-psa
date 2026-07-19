<?php

namespace App\Modules\Borrowing\Services;

use App\Enums\UserRole;
use App\Models\User;
use App\Modules\Asset\Models\Asset;
use App\Modules\Borrowing\Models\Borrowing;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class BorrowingService
{
    public function list(User $user): Collection
    {
        return Borrowing::query()
            ->with(['user', 'asset', 'authorizer'])
            ->when(! $this->canViewAllBorrowings($user), fn ($query) => $query->where('user_id', $user->id))
            ->orderByDesc('created_at')
            ->get();
    }

    public function create(User $user, array $data): Borrowing
    {
        return DB::transaction(function () use ($user, $data) {
            $asset = Asset::query()->findOrFail($data['asset_id']);

            $borrowing = Borrowing::create([
                'user_id' => $user->id,
                'asset_id' => $asset->id,
                'borrow_date' => $data['borrow_date'],
                'due_date' => $data['due_date'],
                'status' => 'BORROWED',
                'remarks' => $data['remarks'] ?? null,
                'authorized_by' => $user->id,
                'authorized_at' => now(),
            ]);

            $asset->update(['status' => 'BORROWED']);

            return $borrowing->load(['user', 'asset', 'authorizer']);
        });
    }

    public function return(Borrowing $borrowing): Borrowing
    {
        return DB::transaction(function () use ($borrowing) {
            $borrowing->update(['status' => 'RETURNED']);
            $borrowing->asset()->update(['status' => 'AVAILABLE']);

            return $borrowing->fresh()->load(['user', 'asset', 'authorizer']);
        });
    }

    private function canViewAllBorrowings(User $user): bool
    {
        return $user->hasRole(UserRole::SUPER_ADMINISTRATOR->value)
            || $user->hasRole(UserRole::SYSTEM_ADMINISTRATOR->value)
            || $user->hasRole(UserRole::PROPERTY_CUSTODIAN->value)
            || $user->hasRole(UserRole::DEPARTMENT_HEAD->value);
    }
}
