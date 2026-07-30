<?php

namespace App\Modules\SystemSetup\Requests;

use App\Modules\SystemSetup\Enums\DocumentType;
use App\Modules\SystemSetup\Enums\TemplateStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Rules\Enum;

class UpdateDocumentTemplateRequest extends FormRequest
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
            'name'                => ['sometimes', 'required', 'string', 'max:255'],
            'document_type'       => ['sometimes', 'required', new Enum(DocumentType::class)],
            'description'         => ['nullable', 'string'],
            'version'             => ['nullable', 'string', 'max:50'],
            'status'              => ['nullable', new Enum(TemplateStatus::class)],
            'is_default'          => ['nullable', 'boolean'],
            'file'                => ['nullable', 'file', 'mimes:xlsx,xls,csv,docx,pdf,png,jpg,jpeg,svg', 'max:10240'],
            'header_org_name'     => ['nullable', 'string', 'max:255'],
            'header_office_name'  => ['nullable', 'string', 'max:255'],
            'header_title'        => ['nullable', 'string', 'max:255'],
            'logo_url'            => ['nullable', 'string'],
            'body_template'       => ['nullable', 'string'],
            'footer_text'         => ['nullable', 'string'],
            'footer_notes'        => ['nullable', 'string'],
            'signature_blocks'    => ['nullable', 'array'],
            'paper_size'          => ['nullable', 'string', 'in:A4,Letter'],
            'orientation'         => ['nullable', 'string', 'in:portrait,landscape'],
            'margin_top'          => ['nullable', 'numeric'],
            'margin_bottom'       => ['nullable', 'numeric'],
            'margin_left'         => ['nullable', 'numeric'],
            'margin_right'        => ['nullable', 'numeric'],
            'font_family'         => ['nullable', 'string', 'in:Arial,Calibri,Times New Roman'],
            'font_size'           => ['nullable', 'integer', 'between:8,24'],
            'text_alignment'      => ['nullable', 'string', 'in:left,center,right'],
        ];
    }

    public function getFile(): ?UploadedFile
    {
        return $this->file('file');
    }
}
