<?php

namespace App\Modules\Borrowing\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBorrowingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'asset_id' => ['required', 'exists:assets,id'],
            'borrow_date' => ['required', 'date'],
            'due_date' => ['required', 'date', 'after_or_equal:borrow_date'],
            'remarks' => ['nullable', 'string'],
        ];
    }
}
