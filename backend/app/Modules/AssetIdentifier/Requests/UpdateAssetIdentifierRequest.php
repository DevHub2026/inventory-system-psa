<?php

namespace App\Modules\AssetIdentifier\Requests;

use App\Modules\Asset\Enums\IdentifierType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class UpdateAssetIdentifierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $identifierId = $this->route('assetIdentifier')?->id
            ?? $this->route('asset_identifier')
            ?? $this->route('identifier');

        return [
            'asset_id' => ['sometimes', 'required', 'integer', 'exists:assets,id'],
            'identifier_type' => ['sometimes', 'required', new Enum(IdentifierType::class)],
            'identifier_value' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('asset_identifiers', 'identifier_value')->ignore($identifierId),
            ],
            'is_primary' => ['nullable', 'boolean'],
        ];
    }
}
