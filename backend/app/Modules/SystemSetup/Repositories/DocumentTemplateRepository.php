<?php

namespace App\Modules\SystemSetup\Repositories;

use App\Modules\SystemSetup\Enums\DocumentType;
use App\Modules\SystemSetup\Enums\TemplateStatus;
use App\Modules\SystemSetup\Models\DocumentTemplate;
use App\Modules\SystemSetup\Repositories\Contracts\DocumentTemplateRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class DocumentTemplateRepository implements DocumentTemplateRepositoryInterface
{
    public function all(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = DocumentTemplate::query()->with(['uploader', 'createdByUser', 'updatedByUser']);

        if (! empty($filters['document_type'])) {
            $query->where('document_type', $filters['document_type']);
        }

        if (! empty($filters['usage_context'])) {
            $query->where('usage_context', $filters['usage_context']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['is_default'])) {
            $query->where('is_default', (bool) $filters['is_default']);
        }

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('document_type', 'like', '%'.$search.'%')
                    ->orWhere('description', 'like', '%'.$search.'%');
            });
        }

        return $query->orderByDesc('is_default')
            ->orderByDesc('upload_date')
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    public function find(int $id): ?DocumentTemplate
    {
        return DocumentTemplate::query()->find($id);
    }

    public function create(array $data): DocumentTemplate
    {
        return DocumentTemplate::query()->create($data);
    }

    public function update(int $id, array $data): DocumentTemplate
    {
        $template = $this->find($id);

        if (! $template) {
            throw new \InvalidArgumentException('Template not found.');
        }

        $template->update($data);

        return $template->fresh();
    }

    public function delete(int $id): void
    {
        $template = $this->find($id);

        if (! $template) {
            throw new \InvalidArgumentException('Template not found.');
        }

        $template->delete();
    }

    public function setDefault(int $id): DocumentTemplate
    {
        return DB::transaction(function () use ($id) {
            $template = $this->find($id);

            if (! $template) {
                throw new \InvalidArgumentException('Template not found.');
            }

            $docType = $template->getRawOriginal('document_type');

            // Step 1: Set the target template as default FIRST
            // Use a raw update to ensure the query runs regardless of Eloquent dirty state
            DocumentTemplate::query()
                ->where('id', $id)
                ->update(['is_default' => true]);

            // Step 2: Unset any OTHER defaults for this document type
            DocumentTemplate::query()
                ->where('document_type', $docType)
                ->where('is_default', true)
                ->where('id', '!=', $id)
                ->update(['is_default' => false]);

            return $template->fresh();
        });
    }

    public function toggleStatus(int $id): DocumentTemplate
    {
        $template = $this->find($id);

        if (! $template) {
            throw new \InvalidArgumentException('Template not found.');
        }

        $currentStatus = $template->getRawOriginal('status');
        $newStatus = $currentStatus === TemplateStatus::ACTIVE->value
            ? TemplateStatus::INACTIVE->value
            : TemplateStatus::ACTIVE->value;

        $template->update(['status' => $newStatus]);

        return $template->fresh();
    }

    public function getByDocumentType(DocumentType|string $type): Collection
    {
        $value = $type instanceof DocumentType ? $type->value : $type;

        return DocumentTemplate::query()
            ->where('document_type', $value)
            ->orderByDesc('is_default')
            ->orderByDesc('upload_date')
            ->get();
    }

    public function getDefault(DocumentType|string $type): ?DocumentTemplate
    {
        return DocumentTemplate::getDefaultFor($type);
    }

    public function duplicate(int $id): DocumentTemplate
    {
        return DB::transaction(function () use ($id) {
            $template = $this->find($id);

            if (! $template) {
                throw new \InvalidArgumentException('Template not found.');
            }

            $docType = $template->getRawOriginal('document_type');

            // Copy the file
            $newPath = 'templates/'.$docType.'/'.uniqid().'_'.$template->file_name;
            $oldPath = $template->file_path;

            if ($oldPath && \Illuminate\Support\Facades\Storage::disk('local')->exists($oldPath)) {
                \Illuminate\Support\Facades\Storage::disk('local')->copy($oldPath, $newPath);
            } else {
                $newPath = $oldPath;
            }

            $newVersion = $this->incrementVersion($template->version);

            return DocumentTemplate::query()->create([
                'name' => $template->name.' (Copy)',
                'document_type' => $docType,
                'usage_context' => $template->getRawOriginal('usage_context'),
                'description' => $template->description,
                'version' => $newVersion,
                'status' => TemplateStatus::INACTIVE->value,
                'is_default' => false,
                'file_path' => $newPath,
                'file_name' => $template->file_name,
                'file_size' => $template->file_size,
                'mime_type' => $template->mime_type,
                'extension' => $template->extension,
                'validation_status' => $template->validation_status,
                'validation_result' => $template->validation_result,
                'has_unknown_placeholders' => (bool) $template->has_unknown_placeholders,
                'uploaded_by' => $template->uploaded_by,
                'upload_date' => now(),
            ]);
        });
    }

    private function incrementVersion(string $version): string
    {
        // Parse version like "1.0" -> "1.1", "2.3" -> "2.4"
        $parts = explode('.', $version);
        if (count($parts) === 2 && is_numeric($parts[0]) && is_numeric($parts[1])) {
            $parts[1] = (int) $parts[1] + 1;

            return $parts[0].'.'.$parts[1];
        }

        return '1.0';
    }
}