<?php

namespace App\Modules\Borrowing\Repositories;

use App\Models\Borrowing;
use App\Modules\Borrowing\Repositories\Contracts\BorrowingRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class BorrowingRepository implements BorrowingRepositoryInterface
{
    public function all(array $filters = []): LengthAwarePaginator
    {
        $query = Borrowing::query();

        if (isset($filters['search'])) {
            $search = $filters['search'];
            $query->where('purpose', 'like', "%{$search}%");
        }

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (isset($filters['borrowed_at'])) {
            $query->whereDate('borrowed_at', $filters['borrowed_at']);
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    public function find(int $id): Borrowing
    {
        return Borrowing::findOrFail($id);
    }

    public function create(array $data): Borrowing
    {
        return Borrowing::create($data);
    }

    public function update(Borrowing $borrowing, array $data): Borrowing
    {
        $borrowing->update($data);
        return $borrowing->fresh();
    }

    public function delete(Borrowing $borrowing): void
    {
        $borrowing->delete();
    }

    public function findByUserId(int $userId): LengthAwarePaginator
    {
        return Borrowing::where('user_id', $userId)->paginate(15);
    }

    public function findByStatus(string $status): LengthAwarePaginator
    {
        return Borrowing::where('status', $status)->paginate(15);
    }

    public function findOverdue(): LengthAwarePaginator
    {
        return Borrowing::where('due_at', '<', now())
            ->where('status', '!=', 'returned')
            ->paginate(15);
    }
}
