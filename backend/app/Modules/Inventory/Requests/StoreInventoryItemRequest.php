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
            // Core inventory fields
            'name'                   => ['required', 'string', 'max:255'],
            'sku'                    => [
                'required',
                'string',
                'max:100',
                Rule::unique('inventory_items', 'sku')->ignore($item?->id)->whereNull('deleted_at'),
            ],
            'type'                   => ['nullable', 'string', Rule::in(['non_expendable', 'expendable'])],
            'classification'         => ['nullable', 'string', Rule::in(['PPE', 'SE', 'SUPPLY'])],
            'item_nature'            => ['nullable', 'string', Rule::in(['ACCOUNTABLE_PROPERTY', 'CONSUMABLE_SUPPLY'])],
            'classification_reason'  => ['nullable', 'string', 'max:1000'],
            'quantity'               => ['required', 'integer', 'min:0'],
            'unit_cost'              => ['nullable', 'numeric', 'min:0'],
            'unit'                   => ['nullable', 'string', 'max:50'],
            'unit_id'                => ['nullable', 'integer', 'exists:units,id'],
            'reorder_level'          => ['nullable', 'integer', 'min:0'],
            'remarks'                => ['nullable', 'string'],
            'is_borrowable'          => ['nullable', 'boolean'],
            'track_as_asset'         => ['nullable', 'boolean'],
            // FK fields
            'manufacturer_id'        => ['nullable', 'integer', 'exists:manufacturers,id'],
            'office_id'              => ['nullable', 'integer', 'exists:offices,id'],
            'location_id'            => ['nullable', 'integer', 'exists:locations,id'],
            // Asset-level fields (written through linked asset)
            'model'                  => ['nullable', 'string', 'max:255'],
            'condition_status'       => ['nullable', 'string', 'max:100'],
            'description'            => ['nullable', 'string'],
            'asset_category_id'      => ['nullable', 'integer', 'exists:asset_categories,id'],
            'property_number'        => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'sku.unique' => 'An item with this Item Code / SKU already exists.',
        ];
    }
}
