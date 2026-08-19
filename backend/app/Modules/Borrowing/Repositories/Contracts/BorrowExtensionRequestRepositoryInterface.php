<?php

namespace App\Modules\Borrowing\Repositories\Contracts;

use App\Modules\Borrowing\Models\BorrowExtensionRequest;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface BorrowExtensionRequestRepositoryInterface
{
    public function find(int $id): ?BorrowExtensionRequest;
    public function findByBorrowing(int $borrowingId): Collection;
    public function hasPending(int $borrowingId): bool;
    public function create(array $data): BorrowExtensionRequest;
    public function update(int $id, array $data): BorrowExtensionRequest;
    public function countPending(): int;
    public function paginateAll(array $filters = [], int $perPage = 20): LengthAwarePaginator;
}