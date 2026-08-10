<?php

namespace App\Modules\Inventory\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateInventoryItemTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $typeId = $this->route('inventoryItemType')?->id ?? $this->route('inventoryItemType');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('inventory_item_types', 'name')->ignore($typeId)],
            'code' => ['nullable', 'string', 'max:50', Rule::unique('inventory_item_types', 'code')->ignore($typeId)],
            'description' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}