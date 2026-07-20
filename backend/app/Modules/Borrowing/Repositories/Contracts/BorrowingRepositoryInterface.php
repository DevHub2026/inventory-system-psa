<?php

namespace App\Modules\Borrowing\Repositories\Contracts;

use App\Models\Borrowing;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface BorrowingRepositoryInterface
{
    public function all(array $filters = []): LengthAwarePaginator;

    public function find(int $id): Borrowing;

    public function create(array $data): Borrowing;

    public function update(Borrowing $borrowing, array $data): Borrowing;

    public function delete(Borrowing $borrowing): void;

    public function findByUserId(int $userId): LengthAwarePaginator;

    public function findByStatus(string $status): LengthAwarePaginator;

    public function findOverdue(): LengthAwarePaginator;
}
