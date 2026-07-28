<?php

namespace App\Modules\Borrowing\Repositories;

use App\Modules\Borrowing\Enums\ExtensionRequestStatus;
use App\Modules\Borrowing\Models\BorrowExtensionRequest;
use App\Modules\Borrowing\Repositories\Contracts\BorrowExtensionRequestRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class BorrowExtensionRequestRepository implements BorrowExtensionRequestRepositoryInterface
{
    public function find(int $id): ?BorrowExtensionRequest
    {
        return BorrowExtensionRequest::query()->with(['borrowing', 'reviewer'])->find($id);
    }

    public function findByBorrowing(int $borrowingId): Collection
    {
        return BorrowExtensionRequest::query()
            ->with(['reviewer'])
            ->where('borrowing_id', $borrowingId)
            ->orderByDesc('created_at')
            ->get();
    }

    public function hasPending(int $borrowingId): bool
    {
        return BorrowExtensionRequest::query()
            ->where('borrowing_id', $borrowingId)
            ->where('status', ExtensionRequestStatus::PENDING)
            ->exists();
    }

    public function create(array $data): BorrowExtensionRequest
    {
        return BorrowExtensionRequest::query()->create($data);
    }

    public function update(int $id, array $data): BorrowExtensionRequest
    {
        $request = $this->find($id);

        if (! $request) {
            throw new \InvalidArgumentException('Extension request not found.');
        }

        $request->update($data);

        return $request->fresh();
    }

    public function countPending(): int
    {
        return BorrowExtensionRequest::query()
            ->where('status', ExtensionRequestStatus::PENDING)
            ->count();
    }
}