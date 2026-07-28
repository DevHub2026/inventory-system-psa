<?php

namespace App\Modules\SystemSetup\Services;

use App\Modules\SystemSetup\Enums\DocumentType;
use App\Modules\SystemSetup\Enums\TemplateStatus;
use App\Modules\SystemSetup\Models\DocumentTemplate;
use App\Modules\SystemSetup\Repositories\Contracts\DocumentTemplateRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentTemplateService
{
    public function __construct(
        private readonly DocumentTemplateRepositoryInterface $repository,
    ) {}

    public function list(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        return $this->repository->all($filters, $perPage);
    }

    public function find(int $id): ?DocumentTemplate
    {
        return $this->repository->find($id);
    }

    public function create(array $data, ?UploadedFile $file = null, ?int $userId = null): DocumentTemplate
    {
        if ($file === null) {
            throw new \InvalidArgumentException('Template file is required.');
        }

        $validatedExtension = strtolower($file->getClientOriginalExtension());

        // Validate extension against allowed types
        $allowed = $this->getAllowedExtensions($data['document_type']);
        if (! in_array($validatedExtension, $allowed, true)) {
            throw new \InvalidArgumentException(
                'File type .'.$validatedExtension.' is not allowed for this document type. Allowed: '.implode(', ', $allowed)
            );
        }

        // Store the file securely
        $path = $this->storeFile($file, $data['document_type']);

        $template = $this->repository->create([
            'name'          => $data['name'],
            'document_type' => $data['document_type'],
            'description'   => $data['description'] ?? null,
            'version'       => $data['version'] ?? '1.0',
            'status'        => $data['status'] ?? TemplateStatus::ACTIVE->value,
            'is_default'    => $data['is_default'] ?? false,
            'file_path'     => $path,
            'file_name'     => $file->getClientOriginalName(),
            'file_size'     => $file->getSize(),
            'mime_type'     => $file->getMimeType(),
            'extension'     => $validatedExtension,
            'uploaded_by'   => $userId,
            'upload_date'   => now(),
        ]);

        // If this is set as default, ensure no other defaults exist
        if ($template->is_default) {
            $this->repository->setDefault($template->id);
        }

        return $template->fresh();
    }

    public function update(int $id, array $data, ?UploadedFile $file = null): DocumentTemplate
    {
        $template = $this->repository->find($id);

        if (! $template) {
            throw new \InvalidArgumentException('Template not found.');
        }

        $updateData = [
            'name'          => $data['name'] ?? $template->name,
            'document_type' => $data['document_type'] ?? $template->document_type,
            'description'   => $data['description'] ?? $template->description,
            'version'       => $data['version'] ?? $template->version,
            'status'        => $data['status'] ?? $template->status,
            'is_default'    => $data['is_default'] ?? $template->is_default,
        ];

        // If a new file is uploaded, replace the old one
        if ($file !== null) {
            $validatedExtension = strtolower($file->getClientOriginalExtension());
            $allowed = $this->getAllowedExtensions($updateData['document_type']);
            if (! in_array($validatedExtension, $allowed, true)) {
                throw new \InvalidArgumentException(
                    'File type .'.$validatedExtension.' is not allowed for this document type.'
                );
            }

            // Delete old file
            if ($template->file_path && Storage::disk('local')->exists($template->file_path)) {
                Storage::disk('local')->delete($template->file_path);
            }

            $path = $this->storeFile($file, $updateData['document_type']);
            $updateData['file_path'] = $path;
            $updateData['file_name'] = $file->getClientOriginalName();
            $updateData['file_size'] = $file->getSize();
            $updateData['mime_type'] = $file->getMimeType();
            $updateData['extension'] = $validatedExtension;
        }

        $template = $this->repository->update($id, $updateData);

        // If this is set as default, ensure no other defaults exist
        if ($template->is_default) {
            $this->repository->setDefault($template->id);
        }

        return $template->fresh();
    }

    public function delete(int $id): void
    {
        $template = $this->repository->find($id);

        if (! $template) {
            throw new \InvalidArgumentException('Template not found.');
        }

        // Delete the file
        if ($template->file_path && Storage::disk('local')->exists($template->file_path)) {
            Storage::disk('local')->delete($template->file_path);
        }

        $this->repository->delete($id);
    }

    public function download(int $id): string
    {
        $template = $this->repository->find($id);

        if (! $template) {
            throw new \InvalidArgumentException('Template not found.');
        }

        $fullPath = Storage::disk('local')->path($template->file_path);

        if (! file_exists($fullPath)) {
            throw new \InvalidArgumentException('Template file not found on disk.');
        }

        return $fullPath;
    }

    public function preview(int $id): string
    {
        // Preview uses the same file path; the frontend handles rendering
        return $this->download($id);
    }

    public function duplicate(int $id): DocumentTemplate
    {
        return $this->repository->duplicate($id);
    }

    public function setDefault(int $id): DocumentTemplate
    {
        return $this->repository->setDefault($id);
    }

    public function toggleStatus(int $id): DocumentTemplate
    {
        return $this->repository->toggleStatus($id);
    }

    public function getByDocumentType(DocumentType|string $type): Collection
    {
        return $this->repository->getByDocumentType($type);
    }

    public function getDefault(DocumentType|string $type): ?DocumentTemplate
    {
        return $this->repository->getDefault($type);
    }

    /**
     * Get the default active template for a document type,
     * or null if none exists.
     */
    public function resolveDefault(DocumentType|string $type): ?DocumentTemplate
    {
        return DocumentTemplate::getDefaultFor($type);
    }

    /**
     * Check if a default template exists for a document type.
     */
    public function hasDefault(DocumentType|string $type): bool
    {
        return $this->resolveDefault($type) !== null;
    }

    private function storeFile(UploadedFile $file, string $documentType): string
    {
        $directory = 'templates/'.$documentType;
        $filename = Str::uuid().'_'.Str::slug($file->getClientOriginalName()).'.'.$file->getClientOriginalExtension();

        return $file->storeAs($directory, $filename, 'local');
    }

    private function getAllowedExtensions(string $documentType): array
    {
        $type = DocumentType::tryFrom($documentType);

        return $type ? $type->allowedExtensions() : ['xlsx', 'xls', 'csv', 'docx', 'pdf'];
    }
}
