<?php

namespace App\Modules\AssetCategory\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAssetCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $categoryId = $this->route('assetCategory')?->id ?? $this->route('asset_category');

        return [
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('asset_categories', 'name')->ignore($categoryId),
            ],
            'code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('asset_categories', 'code')->ignore($categoryId),
            ],
            'description' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
