<?php

namespace App\Modules\SystemSetup\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;

class UploadDocumentTemplateRequest extends FormRequest
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
            'file' => ['required', 'file', 'max:10240'],
            'change_notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function getFile(): UploadedFile
    {
        return $this->file('file');
    }
}
