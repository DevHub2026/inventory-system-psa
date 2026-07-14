<?php

namespace App\Modules\Asset\Requests;

use App\Modules\Asset\Enums\AssetStatus;
use App\Modules\Asset\Enums\ConditionStatus;
use App\Modules\Asset\Enums\IdentifierType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class StoreAssetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'asset_number' => ['required', 'string', 'max:100', 'unique:assets,asset_number'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'asset_category_id' => ['required', 'integer', 'exists:asset_categories,id'],
            'manufacturer_id' => ['nullable', 'integer', 'exists:manufacturers,id'],
            'office_id' => ['required', 'integer', 'exists:offices,id'],
            'location_id' => ['nullable', 'integer', 'exists:locations,id'],
            'model' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', new Enum(AssetStatus::class)],
            'condition_status' => ['nullable', new Enum(ConditionStatus::class)],
            'purchase_date' => ['nullable', 'date'],
            'purchase_cost' => ['nullable', 'numeric', 'min:0'],
            'warranty_until' => ['nullable', 'date'],
            'remarks' => ['nullable', 'string'],
            'identifiers' => ['nullable', 'array'],
            'identifiers.*.identifier_type' => ['required_with:identifiers', new Enum(IdentifierType::class)],
            'identifiers.*.identifier_value' => [
                'required_with:identifiers',
                'string',
                'max:255',
                'distinct',
                Rule::unique('asset_identifiers', 'identifier_value'),
            ],
            'identifiers.*.is_primary' => ['nullable', 'boolean'],
        ];
    }
}
