<?php

namespace App\Modules\SystemSetup\Requests;

use App\Modules\SystemSetup\Enums\DocumentType;
use App\Modules\SystemSetup\Enums\TemplateStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Rules\Enum;

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
            'description'   => ['nullable', 'string'],
            'version'       => ['nullable', 'string', 'max:50'],
            'status'        => ['nullable', new Enum(TemplateStatus::class)],
            'is_default'    => ['nullable', 'boolean'],
            'file'          => ['required', 'file', 'mimes:xlsx,xls,csv,docx,pdf', 'max:10240'],
        ];
    }

    public function getFile(): ?UploadedFile
    {
        return $this->file('file');
    }
}
