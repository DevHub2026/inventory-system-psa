<?php

namespace App\Modules\SystemSetup\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GenerateDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'type' => ['required', 'string'],
            'target_id' => ['required', 'integer', 'min:1'],
        ];
    }
}
