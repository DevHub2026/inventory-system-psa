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

        $fields = [
            'name', 'document_type', 'description', 'version', 'status', 'is_default',
            'header_org_name', 'header_office_name', 'header_title', 'logo_url',
            'body_template', 'footer_text', 'footer_notes', 'signature_blocks',
            'paper_size', 'orientation', 'margin_top', 'margin_bottom', 'margin_left', 'margin_right',
            'font_family', 'font_size', 'text_alignment',
        ];

        $updateData = [];
        foreach ($fields as $field) {
            if (array_key_exists($field, $data)) {
                $updateData[$field] = $data[$field];
            }
        }
        $updateData['updated_by'] = auth()->id();

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

    public function restoreDefault(int $id): DocumentTemplate
    {
        $template = $this->repository->find($id);
        if (! $template) {
            throw new \InvalidArgumentException('Template not found.');
        }

        $docType = $template->getRawOriginal('document_type');
        $preset = $this->getDefaultPreset($docType);

        $template->update([
            'header_org_name'    => $preset['header_org_name'],
            'header_office_name' => $preset['header_office_name'],
            'header_title'       => $preset['header_title'],
            'body_template'      => $preset['body_template'],
            'footer_text'        => $preset['footer_text'],
            'footer_notes'       => $preset['footer_notes'],
            'signature_blocks'   => $preset['signature_blocks'],
            'paper_size'         => 'A4',
            'orientation'        => 'portrait',
            'margin_top'         => 25,
            'margin_bottom'      => 25,
            'margin_left'        => 25,
            'margin_right'       => 25,
            'font_family'        => 'Arial',
            'font_size'          => 12,
            'text_alignment'     => 'left',
            'updated_by'         => auth()->id(),
        ]);

        return $template->fresh();
    }

    public static function getDefaultPreset(string $docType): array
    {
        return match ($docType) {
            'borrow_receipt' => [
                'header_org_name'    => 'PHILIPPINE STATISTICS AUTHORITY',
                'header_office_name' => 'Regional Statistical Services Office',
                'header_title'       => 'PROPERTY BORROW RECEIPT',
                'body_template'      => "This is to acknowledge receipt of the following property/equipment borrowed by {{employee_name}} (Employee No: {{employee_number}}) from {{department}} ({{office}}):\n\nAsset Name: {{asset_name}}\nAsset Code / Property Tag: {{asset_code}}\nSerial Number: {{serial_number}}\nManufacturer: {{manufacturer}}\nCategory: {{category}}\nCondition: {{condition}}\n\nBorrow Date: {{borrow_date}}\nDue Date: {{due_date}}\n\nThe borrower agrees to maintain the item in good condition and return it on or before the due date.",
                'footer_text'        => 'Official Document — Philippine Statistics Authority',
                'footer_notes'       => 'Note: Unreturned items after the due date will be subject to property accountability review.',
                'signature_blocks'   => [
                    ['key' => 'prepared_by', 'label' => 'Prepared By', 'name' => '{{prepared_by}}', 'position' => 'Property Custodian', 'enabled' => true],
                    ['key' => 'approved_by', 'label' => 'Approved By', 'name' => 'Department Head', 'position' => 'Supervising Officer', 'enabled' => true],
                    ['key' => 'received_by', 'label' => 'Received By (Borrower)', 'name' => '{{employee_name}}', 'position' => 'Borrower', 'enabled' => true],
                    ['key' => 'witnessed_by', 'label' => 'Witnessed By', 'name' => '', 'position' => 'Witness', 'enabled' => false],
                ],
            ],
            'return_receipt' => [
                'header_org_name'    => 'PHILIPPINE STATISTICS AUTHORITY',
                'header_office_name' => 'Regional Statistical Services Office',
                'header_title'       => 'PROPERTY RETURN RECEIPT',
                'body_template'      => "This is to certify that {{employee_name}} (Employee No: {{employee_number}}) of {{department}} has returned the following item:\n\nAsset Name: {{asset_name}}\nAsset Code: {{asset_code}}\nSerial Number: {{serial_number}}\n\nReturned Date: {{returned_date}}\nCondition upon Return: {{condition}}\n\nThe property has been inspected and returned to active inventory.",
                'footer_text'        => 'Official Document — Philippine Statistics Authority',
                'footer_notes'       => 'Verified and accepted into system inventory.',
                'signature_blocks'   => [
                    ['key' => 'prepared_by', 'label' => 'Received & Inspected By', 'name' => '{{prepared_by}}', 'position' => 'Inventory Inspector', 'enabled' => true],
                    ['key' => 'approved_by', 'label' => 'Approved By', 'name' => 'Property Custodian', 'position' => 'Custodian Officer', 'enabled' => true],
                    ['key' => 'received_by', 'label' => 'Returned By', 'name' => '{{employee_name}}', 'position' => 'Borrower', 'enabled' => true],
                    ['key' => 'witnessed_by', 'label' => 'Witnessed By', 'name' => '', 'position' => 'Witness', 'enabled' => false],
                ],
            ],
            'issuance' => [
                'header_org_name'    => 'PHILIPPINE STATISTICS AUTHORITY',
                'header_office_name' => 'Regional Statistical Services Office',
                'header_title'       => 'PROPERTY ACKNOWLEDGEMENT RECEIPT (PAR)',
                'body_template'      => "I hereby acknowledge receipt from {{office}} of the following official property for which I am permanently responsible:\n\nItem: {{asset_name}}\nProperty Tag / Code: {{asset_code}}\nSerial Number: {{serial_number}}\nManufacturer: {{manufacturer}}\nCategory: {{category}}\nIssued Date: {{issued_date}}\n\nIssued To: {{employee_name}} (Employee No: {{employee_number}})\nDepartment: {{department}}",
                'footer_text'        => 'Official Document — Philippine Statistics Authority',
                'footer_notes'       => 'Permanent issuance record. Please report any loss or damage immediately.',
                'signature_blocks'   => [
                    ['key' => 'prepared_by', 'label' => 'Issued By', 'name' => '{{prepared_by}}', 'position' => 'Supply Officer', 'enabled' => true],
                    ['key' => 'approved_by', 'label' => 'Approved By', 'name' => 'Property Custodian', 'position' => 'Head Custodian', 'enabled' => true],
                    ['key' => 'received_by', 'label' => 'Received By (Recipient)', 'name' => '{{employee_name}}', 'position' => 'Accountable Employee', 'enabled' => true],
                    ['key' => 'witnessed_by', 'label' => 'Witnessed By', 'name' => '', 'position' => 'Witness', 'enabled' => false],
                ],
            ],
            'property_transfer' => [
                'header_org_name'    => 'PHILIPPINE STATISTICS AUTHORITY',
                'header_office_name' => 'Regional Statistical Services Office',
                'header_title'       => 'PROPERTY TRANSFER REPORT',
                'body_template'      => "This document certifies the official transfer of property accountability:\n\nAsset Name: {{asset_name}}\nProperty Code: {{asset_code}}\nSerial Number: {{serial_number}}\nCategory: {{category}}\nCondition: {{condition}}\n\nTransfer Date: {{current_date}}\nTransferred From: {{office}}\nTransferred To: {{department}}",
                'footer_text'        => 'Official Document — Philippine Statistics Authority',
                'footer_notes'       => 'Transfer of accountability is effective upon signature of both parties.',
                'signature_blocks'   => [
                    ['key' => 'prepared_by', 'label' => 'Transferor (Relinquishing Officer)', 'name' => '{{prepared_by}}', 'position' => 'Relinquishing Officer', 'enabled' => true],
                    ['key' => 'approved_by', 'label' => 'Approved By', 'name' => 'Property Custodian', 'position' => 'Chief Custodian', 'enabled' => true],
                    ['key' => 'received_by', 'label' => 'Transferee (Receiving Officer)', 'name' => '{{employee_name}}', 'position' => 'Receiving Officer', 'enabled' => true],
                    ['key' => 'witnessed_by', 'label' => 'Witnessed By', 'name' => '', 'position' => 'Witness', 'enabled' => false],
                ],
            ],
            'clearance' => [
                'header_org_name'    => 'PHILIPPINE STATISTICS AUTHORITY',
                'header_office_name' => 'Regional Statistical Services Office',
                'header_title'       => 'PROPERTY CLEARANCE CERTIFICATE',
                'body_template'      => "This is to certify that {{employee_name}} (Employee No: {{employee_number}}) of {{department}} has been cleared of all property accountabilities, equipment borrowings, and inventory obligations as of {{current_date}}.\n\nStatus: FULLY CLEARED",
                'footer_text'        => 'Official Document — Philippine Statistics Authority',
                'footer_notes'       => 'Valid for official clearance processes.',
                'signature_blocks'   => [
                    ['key' => 'prepared_by', 'label' => 'Verified & Prepared By', 'name' => '{{prepared_by}}', 'position' => 'Clearance Officer', 'enabled' => true],
                    ['key' => 'approved_by', 'label' => 'Approved By', 'name' => 'Property Custodian', 'position' => 'Chief Custodian', 'enabled' => true],
                    ['key' => 'received_by', 'label' => 'Cleared Employee', 'name' => '{{employee_name}}', 'position' => 'Employee', 'enabled' => true],
                    ['key' => 'witnessed_by', 'label' => 'Witnessed By', 'name' => '', 'position' => 'HR Representative', 'enabled' => false],
                ],
            ],
            default => [
                'header_org_name'    => 'PHILIPPINE STATISTICS AUTHORITY',
                'header_office_name' => 'Regional Statistical Services Office',
                'header_title'       => 'OFFICIAL DOCUMENT',
                'body_template'      => "Document content for {{employee_name}} regarding {{asset_name}} ({{asset_code}}). Generated on {{current_date}}.",
                'footer_text'        => 'Official Document — Philippine Statistics Authority',
                'footer_notes'       => '',
                'signature_blocks'   => [
                    ['key' => 'prepared_by', 'label' => 'Prepared By', 'name' => '{{prepared_by}}', 'position' => 'Officer', 'enabled' => true],
                    ['key' => 'approved_by', 'label' => 'Approved By', 'name' => 'Head', 'position' => 'Supervisor', 'enabled' => true],
                    ['key' => 'received_by', 'label' => 'Received By', 'name' => 'Recipient', 'position' => 'Recipient', 'enabled' => false],
                    ['key' => 'witnessed_by', 'label' => 'Witnessed By', 'name' => '', 'position' => 'Witness', 'enabled' => false],
                ],
            ],
        };
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
