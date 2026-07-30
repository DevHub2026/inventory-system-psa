<?php

namespace App\Modules\Asset\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AssignPermanentIssuanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'issued_to_user_id' => ['required', 'integer', 'exists:users,id'],
            'date_issued' => ['required', 'date'],
        ];
    }
}
