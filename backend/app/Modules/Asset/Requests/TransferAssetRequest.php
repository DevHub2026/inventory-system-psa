<?php

namespace App\Modules\Asset\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TransferAssetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'office_id' => ['required', 'integer', 'exists:offices,id'],
            'location_id' => ['nullable', 'integer', 'exists:locations,id'],
            'remarks' => ['nullable', 'string'],
        ];
    }
}
