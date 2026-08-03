<?php

namespace App\Modules\SystemSetup\Requests;

use App\Modules\SystemSetup\Enums\DocumentType;
use App\Modules\SystemSetup\Enums\TemplateStatus;
use App\Modules\SystemSetup\Enums\TemplateUsageContext;
use App\Modules\SystemSetup\Services\PlaceholderRegistry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Rules\Enum;
use Illuminate\Validation\Validator;

class StoreDocumentTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null
            && ($user->hasRole('Super Administrator') || $user->hasRole('System Administrator'));
    }

    public function rules(): array
    {
        return [
            'name'          => ['required', 'string', 'max:255'],
            'document_type' => ['required', new Enum(DocumentType::class)],
            'usage_context' => ['nullable', new Enum(TemplateUsageContext::class)],
            'description'   => ['nullable', 'string'],
            'version'       => ['nullable', 'string', 'max:50'],
            'status'        => ['nullable', new Enum(TemplateStatus::class)],
            'is_default'    => ['nullable', 'boolean'],
            'change_notes'  => ['nullable', 'string', 'max:1000'],
            'file'          => ['nullable', 'file', 'max:10240'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $type = $this->input('document_type');
            $file = $this->file('file');
            $isOfficial = in_array($type, PlaceholderRegistry::officialDocumentTypes(), true);

            if (! $isOfficial && $file === null) {
                $validator->errors()->add('file', 'A template file is required for this document type.');
            }

            if ($file !== null) {
                $extension = strtolower($file->getClientOriginalExtension());
                $enum = DocumentType::tryFrom((string) $type);
                $allowed = $enum?->allowedExtensions() ?? ['docx'];
                if (! in_array($extension, $allowed, true)) {
                    $validator->errors()->add(
                        'file',
                        'File type .'.$extension.' is not allowed. Allowed: '.implode(', ', $allowed)
                    );
                }
            }
        });
    }

    public function getFile(): ?UploadedFile
    {
        return $this->file('file');
    }
}
