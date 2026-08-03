<?php

namespace App\Modules\Inventory\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInventoryItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $item = $this->route('item');

        return [
            'name' => ['required', 'string', 'max:255'],
            'sku' => [
                'required',
                'string',
                'max:100',
                Rule::unique('inventory_items', 'sku')->ignore($item?->id),
            ],
            'type' => ['nullable', 'string', Rule::in(['non_expendable', 'expendable'])],
            'classification' => ['nullable', 'string', Rule::in(['PPE', 'SE', 'SUPPLY'])],
            'item_nature' => ['nullable', 'string', Rule::in(['ACCOUNTABLE_PROPERTY', 'CONSUMABLE_SUPPLY'])],
            'classification_reason' => ['nullable', 'string', 'max:1000'],
            'quantity' => ['required', 'integer', 'min:0'],
            'unit_cost' => ['nullable', 'numeric', 'min:0'],
            'unit' => ['nullable', 'string', 'max:50'],
            'reorder_level' => ['nullable', 'integer', 'min:0'],
            'remarks' => ['nullable', 'string'],
            'track_as_asset' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'sku.unique' => 'An item with this code already exists.',
        ];
    }
}
