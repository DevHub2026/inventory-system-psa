<?php

namespace App\Modules\AssetIdentifier\Requests;

use App\Modules\Asset\Enums\IdentifierType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreAssetIdentifierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'asset_id' => ['required', 'integer', 'exists:assets,id'],
            'identifier_type' => ['required', new Enum(IdentifierType::class)],
            'identifier_value' => ['required', 'string', 'max:255', 'unique:asset_identifiers,identifier_value'],
            'is_primary' => ['nullable', 'boolean'],
        ];
    }
}
