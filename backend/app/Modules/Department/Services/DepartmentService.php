<?php

namespace App\Modules\Department\Services;

use App\Modules\Department\Models\Department;
use App\Modules\Department\Repositories\Contracts\DepartmentRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class DepartmentService
{
    public function __construct(private readonly DepartmentRepositoryInterface $departmentRepository) {}

    public function list(array $filters = []): LengthAwarePaginator
    {
        $perPage = (int) ($filters['per_page'] ?? 20);

        $query = Department::query()->withCount('users');

        if (! empty($filters['search'])) {
            $term = '%'.$filters['search'].'%';
            $operator = $this->searchOperator();
            $query->where(function ($builder) use ($term, $operator) {
                $builder->where('name', $operator, $term)
                    ->orWhere('code', $operator, $term);
            });
        }

        return $query->orderBy('name')->paginate($perPage);
    }

    public function create(array $data): Department
    {
        return $this->departmentRepository->create($data);
    }

    public function update(Department $department, array $data): Department
    {
        return $this->departmentRepository->update($department, $data);
    }

    public function delete(Department $department): void
    {
        if ($this->departmentRepository->hasUsers($department)) {
            throw new \InvalidArgumentException('Cannot delete department with assigned users.');
        }

        $this->departmentRepository->delete($department);
    }

    private function searchOperator(): string
    {
        return DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
    }
}
