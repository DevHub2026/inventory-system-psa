<?php

namespace App\Modules\Asset\Requests;

use App\Modules\Asset\Enums\AssetStatus;
use App\Modules\Asset\Enums\ConditionStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class UpdateAssetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $assetId = $this->route('asset')?->id ?? $this->route('asset');

        return [
            'asset_number' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                Rule::unique('assets', 'asset_number')->ignore($assetId),
            ],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'asset_category_id' => ['sometimes', 'required', 'integer', 'exists:asset_categories,id'],
            'manufacturer_id' => ['nullable', 'integer', 'exists:manufacturers,id'],
            'office_id' => ['sometimes', 'required', 'integer', 'exists:offices,id'],
            'location_id' => ['nullable', 'integer', 'exists:locations,id'],
            'model' => ['nullable', 'string', 'max:255'],
            'status' => ['sometimes', 'required', new Enum(AssetStatus::class)],
            'condition_status' => ['nullable', new Enum(ConditionStatus::class)],
            'purchase_date' => ['nullable', 'date'],
            'purchase_cost' => ['nullable', 'numeric', 'min:0'],
            'warranty_until' => ['nullable', 'date'],
            'remarks' => ['nullable', 'string'],
        ];
    }
}
