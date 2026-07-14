<?php

namespace App\Modules\Auth\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', Rule::unique('permissions', 'name')->ignore($this->permission)],
            'module' => ['sometimes', 'required', 'string'],
            'description' => ['nullable', 'string'],
        ];
    }
}
