<?php

namespace App\Modules\SystemSetup\Services;

use App\Modules\SystemSetup\Enums\DocumentType;
use App\Modules\SystemSetup\Enums\TemplateStatus;
use App\Modules\SystemSetup\Models\DocumentTemplate;
use App\Modules\SystemSetup\Models\DocumentTemplateVersion;
use App\Modules\SystemSetup\Repositories\Contracts\DocumentTemplateRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentTemplateService
{
    public function __construct(
        private readonly DocumentTemplateRepositoryInterface $repository,
        private readonly DocxTemplateService $docxService,
    ) {}

    public function list(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        return $this->repository->all($filters, $perPage);
    }

    public function find(int $id): ?DocumentTemplate
    {
        return $this->repository->find($id);
    }

    /**
     * Create a template metadata record. File may be provided immediately or uploaded later.
     */
    public function create(array $data, ?UploadedFile $file = null, ?int $userId = null): DocumentTemplate
    {
        $documentType = $data['document_type'];
        $isOfficial = in_array($documentType, PlaceholderRegistry::officialDocumentTypes(), true);

        $payload = [
            'name' => $data['name'],
            'document_type' => $documentType,
            'description' => $data['description'] ?? null,
            'version' => $data['version'] ?? '1.0',
            'status' => $data['status'] ?? TemplateStatus::INACTIVE->value,
            'is_default' => (bool) ($data['is_default'] ?? false),
            'change_notes' => $data['change_notes'] ?? null,
            'created_by' => $userId,
            'updated_by' => $userId,
            'uploaded_by' => null,
            'upload_date' => null,
            'file_path' => null,
            'file_name' => null,
            'file_size' => 0,
            'mime_type' => null,
            'extension' => null,
            'validation_status' => null,
            'validation_result' => null,
            'has_unknown_placeholders' => false,
        ];

        if ($file !== null) {
            $this->assertAllowedFile($file, $documentType);
            $stored = $this->storeUploadedFile($file, $documentType);
            $payload = array_merge($payload, $stored, [
                'uploaded_by' => $userId,
                'upload_date' => now(),
            ]);

            if ($isOfficial || strtolower($file->getClientOriginalExtension()) === 'docx') {
                $validation = $this->docxService->validateFile(Storage::disk('local')->path($stored['file_path']));
                $payload['validation_status'] = $validation['validation_status'];
                $payload['validation_result'] = $validation;
                $payload['has_unknown_placeholders'] = $validation['unknown'] !== [];
                if ($payload['has_unknown_placeholders']) {
                    $payload['status'] = TemplateStatus::INACTIVE->value;
                    $payload['is_default'] = false;
                }
            }
        } elseif ($isOfficial) {
            // Official DOCX templates start inactive until a valid file is uploaded.
            $payload['status'] = TemplateStatus::INACTIVE->value;
        } elseif ($file === null && ! $isOfficial) {
            // Spreadsheet templates historically required a file on create.
            throw new \InvalidArgumentException('Template file is required for this document type.');
        }

        $template = $this->repository->create($payload);

        if ($template->is_default) {
            $this->repository->setDefault($template->id);
        }

        if ($template->file_path) {
            $this->archiveCurrentAsVersion($template->fresh(), $userId, $data['change_notes'] ?? 'Initial upload');
        }

        return $template->fresh(['uploader', 'createdByUser', 'updatedByUser']);
    }

    public function update(int $id, array $data): DocumentTemplate
    {
        $template = $this->requireTemplate($id);

        $fields = ['name', 'description', 'change_notes'];
        $updateData = [];
        foreach ($fields as $field) {
            if (array_key_exists($field, $data)) {
                $updateData[$field] = $data[$field];
            }
        }
        $updateData['updated_by'] = auth()->id();

        if (array_key_exists('is_default', $data)) {
            $updateData['is_default'] = (bool) $data['is_default'];
        }

        $template = $this->repository->update($id, $updateData);

        if (! empty($updateData['is_default'])) {
            $this->repository->setDefault($template->id);
        }

        return $template->fresh(['uploader', 'createdByUser', 'updatedByUser']);
    }

    public function uploadOrReplace(int $id, UploadedFile $file, ?string $changeNotes = null, ?int $userId = null): DocumentTemplate
    {
        $template = $this->requireTemplate($id);
        $docType = $template->getRawOriginal('document_type');
        $this->assertAllowedFile($file, $docType);

        return DB::transaction(function () use ($template, $file, $changeNotes, $userId, $docType) {
            // Archive existing file before replacing.
            if ($template->file_path && Storage::disk('local')->exists($template->file_path)) {
                $this->archiveCurrentAsVersion($template, $userId, $changeNotes ?? 'Replaced before new upload');
            }

            $stored = $this->storeUploadedFile($file, $docType);
            $version = $this->nextVersion($template->version);

            $update = array_merge($stored, [
                'version' => $version,
                'uploaded_by' => $userId ?? auth()->id(),
                'upload_date' => now(),
                'updated_by' => $userId ?? auth()->id(),
                'change_notes' => $changeNotes,
            ]);

            if (strtolower($file->getClientOriginalExtension()) === 'docx') {
                $validation = $this->docxService->validateFile(Storage::disk('local')->path($stored['file_path']));
                $update['validation_status'] = $validation['validation_status'];
                $update['validation_result'] = $validation;
                $update['has_unknown_placeholders'] = $validation['unknown'] !== [];
                if ($update['has_unknown_placeholders']) {
                    $update['status'] = TemplateStatus::INACTIVE->value;
                    $update['is_default'] = false;
                }
            }

            $template = $this->repository->update($template->id, $update);
            $this->archiveCurrentAsVersion($template, $userId ?? auth()->id(), $changeNotes ?? 'Uploaded version '.$version);

            return $template->fresh(['uploader', 'createdByUser', 'updatedByUser', 'versions']);
        });
    }

    public function validate(int $id): array
    {
        $template = $this->requireTemplate($id);

        if (! $template->file_path || ! Storage::disk('local')->exists($template->file_path)) {
            throw new \InvalidArgumentException('No DOCX file is uploaded for this template.');
        }

        if ($template->extension !== 'docx') {
            throw new \InvalidArgumentException('Placeholder validation is only supported for DOCX templates.');
        }

        $validation = $this->docxService->validateFile(Storage::disk('local')->path($template->file_path));

        $this->repository->update($template->id, [
            'validation_status' => $validation['validation_status'],
            'validation_result' => $validation,
            'has_unknown_placeholders' => $validation['unknown'] !== [],
            'updated_by' => auth()->id(),
        ]);

        if ($validation['unknown'] !== []) {
            $this->repository->update($template->id, [
                'status' => TemplateStatus::INACTIVE->value,
                'is_default' => false,
            ]);
        }

        return $validation;
    }

    public function activate(int $id): DocumentTemplate
    {
        $template = $this->requireTemplate($id);

        if ($template->isOfficialDocxType()) {
            if ($template->extension !== 'docx' || ! $template->file_path) {
                throw new \InvalidArgumentException('Upload a valid DOCX file before activating this template.');
            }
            if ($template->has_unknown_placeholders || $template->validation_status !== 'valid') {
                throw new \InvalidArgumentException(
                    'This template has unknown placeholders and cannot be activated until they are fixed.'
                );
            }
        }

        $template = $this->repository->update($id, [
            'status' => TemplateStatus::ACTIVE->value,
            'is_default' => true,
            'updated_by' => auth()->id(),
        ]);

        $this->repository->setDefault($template->id);

        return $template->fresh(['uploader', 'createdByUser', 'updatedByUser']);
    }

    public function deactivate(int $id): DocumentTemplate
    {
        $template = $this->repository->update($id, [
            'status' => TemplateStatus::INACTIVE->value,
            'is_default' => false,
            'updated_by' => auth()->id(),
        ]);

        return $template->fresh(['uploader', 'createdByUser', 'updatedByUser']);
    }

    public function delete(int $id): void
    {
        $template = $this->requireTemplate($id);

        // Soft-delete only; retain files for audit/rollback via versions.
        $this->repository->delete($id);
    }

    public function download(int $id): string
    {
        $template = $this->requireTemplate($id);

        if (! $template->file_path) {
            throw new \InvalidArgumentException('Template file not found on disk.');
        }

        $fullPath = Storage::disk('local')->path($template->file_path);

        if (! file_exists($fullPath)) {
            throw new \InvalidArgumentException('Template file not found on disk.');
        }

        return $fullPath;
    }

    public function downloadVersion(int $templateId, int $versionId): array
    {
        $template = $this->requireTemplate($templateId);
        $version = DocumentTemplateVersion::query()
            ->where('document_template_id', $template->id)
            ->where('id', $versionId)
            ->firstOrFail();

        $fullPath = Storage::disk('local')->path($version->file_path);
        if (! file_exists($fullPath)) {
            throw new \InvalidArgumentException('Version file not found on disk.');
        }

        return [$fullPath, $version];
    }

    public function versions(int $id): Collection
    {
        $template = $this->requireTemplate($id);

        return $template->versions()->with('uploader')->get();
    }

    public function restoreVersion(int $templateId, int $versionId, ?int $userId = null): DocumentTemplate
    {
        $template = $this->requireTemplate($templateId);
        $version = DocumentTemplateVersion::query()
            ->where('document_template_id', $template->id)
            ->where('id', $versionId)
            ->firstOrFail();

        if (! Storage::disk('local')->exists($version->file_path)) {
            throw new \InvalidArgumentException('Version file not found on disk.');
        }

        return DB::transaction(function () use ($template, $version, $userId) {
            if ($template->file_path && Storage::disk('local')->exists($template->file_path)) {
                $this->archiveCurrentAsVersion($template, $userId, 'Archived before restoring version '.$version->version);
            }

            // Copy version file to a new active path so version archives stay intact.
            $docType = $template->getRawOriginal('document_type');
            $newPath = 'templates/'.$docType.'/'.Str::uuid().'_restored_'.Str::slug(pathinfo($version->file_name, PATHINFO_FILENAME)).'.'.$version->extension;
            Storage::disk('local')->copy($version->file_path, $newPath);

            $next = $this->nextVersion($template->version);

            $update = [
                'version' => $next,
                'file_path' => $newPath,
                'file_name' => $version->file_name,
                'file_size' => $version->file_size,
                'mime_type' => $version->mime_type,
                'extension' => $version->extension,
                'validation_status' => $version->validation_status,
                'validation_result' => $version->validation_result,
                'has_unknown_placeholders' => $version->has_unknown_placeholders,
                'uploaded_by' => $userId ?? auth()->id(),
                'upload_date' => now(),
                'updated_by' => $userId ?? auth()->id(),
                'change_notes' => 'Restored from version '.$version->version,
            ];

            if ($update['has_unknown_placeholders']) {
                $update['status'] = TemplateStatus::INACTIVE->value;
                $update['is_default'] = false;
            }

            $template = $this->repository->update($template->id, $update);
            $this->archiveCurrentAsVersion($template, $userId ?? auth()->id(), 'Restored version '.$version->version);

            return $template->fresh(['uploader', 'versions']);
        });
    }

    public function setDefault(int $id): DocumentTemplate
    {
        return $this->activate($id);
    }

    public function toggleStatus(int $id): DocumentTemplate
    {
        $template = $this->requireTemplate($id);
        $current = $template->getRawOriginal('status');

        if ($current === TemplateStatus::ACTIVE->value) {
            return $this->deactivate($id);
        }

        return $this->activate($id);
    }

    public function duplicate(int $id): DocumentTemplate
    {
        return $this->repository->duplicate($id);
    }

    public function getByDocumentType(DocumentType|string $type): Collection
    {
        return $this->repository->getByDocumentType($type);
    }

    public function getDefault(DocumentType|string $type): ?DocumentTemplate
    {
        return $this->repository->getDefault($type);
    }

    public function resolveDefault(DocumentType|string $type): ?DocumentTemplate
    {
        return DocumentTemplate::getDefaultFor($type);
    }

    public function hasDefault(DocumentType|string $type): bool
    {
        return $this->resolveDefault($type) !== null;
    }

    private function requireTemplate(int $id): DocumentTemplate
    {
        $template = $this->repository->find($id);
        if (! $template) {
            throw new \InvalidArgumentException('Template not found.');
        }

        return $template;
    }

    private function assertAllowedFile(UploadedFile $file, string $documentType): void
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $allowed = $this->getAllowedExtensions($documentType);

        if (! in_array($extension, $allowed, true)) {
            throw new \InvalidArgumentException(
                'File type .'.$extension.' is not allowed for this document type. Allowed: '.implode(', ', $allowed)
            );
        }

        if (in_array($documentType, PlaceholderRegistry::officialDocumentTypes(), true) && $extension !== 'docx') {
            throw new \InvalidArgumentException('Official document templates must be DOCX files.');
        }

        $mime = (string) $file->getMimeType();
        if ($extension === 'docx') {
            $allowedMimes = [
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/zip',
                'application/octet-stream',
            ];
            if ($mime && ! in_array($mime, $allowedMimes, true)) {
                throw new \InvalidArgumentException('Invalid DOCX MIME type.');
            }
        }
    }

    /**
     * @return array{file_path: string, file_name: string, file_size: int, mime_type: ?string, extension: string}
     */
    private function storeUploadedFile(UploadedFile $file, string $documentType): array
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $directory = 'templates/'.$documentType;
        $safeOriginal = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) ?: 'template';
        $filename = Str::uuid().'_'.$safeOriginal.'.'.$extension;
        $path = $file->storeAs($directory, $filename, 'local');

        return [
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'file_size' => (int) $file->getSize(),
            'mime_type' => $file->getMimeType(),
            'extension' => $extension,
        ];
    }

    private function archiveCurrentAsVersion(DocumentTemplate $template, ?int $userId, ?string $notes): void
    {
        if (! $template->file_path) {
            return;
        }

        DocumentTemplateVersion::query()->create([
            'document_template_id' => $template->id,
            'version' => $template->version ?? '1.0',
            'file_path' => $template->file_path,
            'file_name' => $template->file_name ?? basename($template->file_path),
            'file_size' => $template->file_size ?? 0,
            'mime_type' => $template->mime_type,
            'extension' => $template->extension,
            'validation_status' => $template->validation_status,
            'validation_result' => $template->validation_result,
            'has_unknown_placeholders' => (bool) $template->has_unknown_placeholders,
            'change_notes' => $notes,
            'uploaded_by' => $userId ?? $template->uploaded_by,
        ]);
    }

    private function nextVersion(string $version): string
    {
        $parts = explode('.', $version);
        if (count($parts) >= 1 && is_numeric($parts[0])) {
            $major = (int) $parts[0];
            $minor = isset($parts[1]) && is_numeric($parts[1]) ? (int) $parts[1] + 1 : 1;

            return $major.'.'.$minor;
        }

        return '1.0';
    }

    private function getAllowedExtensions(string $documentType): array
    {
        $type = DocumentType::tryFrom($documentType);

        return $type ? $type->allowedExtensions() : ['docx'];
    }
}
