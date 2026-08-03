<?php

namespace App\Modules\SystemSetup\Requests;

use App\Modules\SystemSetup\Enums\TemplateUsageContext;
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
            'name'          => ['sometimes', 'required', 'string', 'max:255'],
            'usage_context' => ['nullable', new Enum(TemplateUsageContext::class)],
            'description'   => ['nullable', 'string'],
            'change_notes'  => ['nullable', 'string', 'max:1000'],
            'is_default'    => ['nullable', 'boolean'],
        ];
    }
}
