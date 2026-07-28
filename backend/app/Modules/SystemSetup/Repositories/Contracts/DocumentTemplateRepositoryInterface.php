<?php

namespace App\Modules\SystemSetup\Repositories\Contracts;

use App\Modules\SystemSetup\Enums\DocumentType;
use App\Modules\SystemSetup\Models\DocumentTemplate;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface DocumentTemplateRepositoryInterface
{
    public function all(array $filters = [], int $perPage = 20): LengthAwarePaginator;

    public function find(int $id): ?DocumentTemplate;

    public function create(array $data): DocumentTemplate;

    public function update(int $id, array $data): DocumentTemplate;

    public function delete(int $id): void;

    public function setDefault(int $id): DocumentTemplate;

    public function toggleStatus(int $id): DocumentTemplate;

    public function getByDocumentType(DocumentType|string $type): Collection;

    public function getDefault(DocumentType|string $type): ?DocumentTemplate;

    public function duplicate(int $id): DocumentTemplate;
}
