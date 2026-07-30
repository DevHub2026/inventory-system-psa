<?php

namespace App\Modules\Borrowing\Requests;

use App\Modules\Borrowing\Models\Borrowing;
use Illuminate\Foundation\Http\FormRequest;

class StoreExtensionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'requested_due_date' => ['required', 'date', 'after:current_due_date'],
            'reason' => ['required', 'string', 'max:1000'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $borrowing = $this->route('borrowing');

            if ($borrowing && $borrowing->status !== 'BORROWED') {
                $validator->errors()->add('borrowing', 'Extension can only be requested for active borrowings.');
            }

            if ($borrowing && $borrowing->returned_at !== null) {
                $validator->errors()->add('borrowing', 'Cannot request extension for a returned borrowing.');
            }
        });
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'current_due_date' => $this->route('borrowing')?->due_date?->format('Y-m-d'),
        ]);
    }
}