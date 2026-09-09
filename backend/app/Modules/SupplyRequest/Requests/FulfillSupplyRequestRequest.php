<?php

namespace App\Modules\SupplyRequest\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FulfillSupplyRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1'],
            'items.*.supply_request_item_id' => [
                'required',
                'integer',
                'exists:supply_request_items,id',
            ],
            'items.*.quantity_issued' => ['required', 'integer', 'min:0'],
        ];
    }
}
