<?php

namespace App\Modules\Reservation\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreReservationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'asset_ids' => ['required', 'array'],
            'asset_ids.*' => ['exists:assets,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'remarks' => ['nullable', 'string'],
        ];
    }
}
