<?php

namespace App\Modules\SupplyRequest\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSupplyRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'remarks' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.inventory_item_id' => [
                'required',
                'integer',
                'exists:inventory_items,id',
            ],
            'items.*.quantity_requested' => ['required', 'integer', 'min:1'],
        ];
    }
}
