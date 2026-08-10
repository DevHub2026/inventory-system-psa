<?php

namespace App\Modules\Auth\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // Structured name fields (preferred)
            'first_name'      => ['sometimes', 'nullable', 'string', 'max:255'],
            'middle_name'     => ['sometimes', 'nullable', 'string', 'max:255'],
            'last_name'       => ['sometimes', 'nullable', 'string', 'max:255'],
            // Legacy single-field "name" sent by the Settings page
            'name'            => ['sometimes', 'nullable', 'string', 'max:500'],
            'username'        => ['sometimes', 'nullable', 'string', 'max:50'],
            'employee_number' => ['sometimes', 'nullable', 'string', 'max:50'],
            'email_notifications_enabled' => ['sometimes', 'boolean'],
            'email'           => [
                'sometimes',
                'nullable',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($this->user()?->id),
            ],
        ];
    }

    /**
     * Split a "name" field into first_name / last_name when the frontend sends
     * a single combined name string (backward compatible).
     *
     * @return array<string, mixed>
     */
    public function validated($key = null, $default = null): mixed
    {
        $data = parent::validated($key, $default);

        if (! is_array($data)) {
            return $data;
        }

        if (array_key_exists('name', $data) && ! empty($data['name'])) {
            $parts = preg_split('/\s+/', trim((string) $data['name']), 2);
            if (! array_key_exists('first_name', $data) || $data['first_name'] === null) {
                $data['first_name'] = $parts[0] ?? null;
            }
            if (! array_key_exists('last_name', $data) || $data['last_name'] === null) {
                $data['last_name'] = $parts[1] ?? null;
            }
        }

        unset($data['name']); // never write a 'name' column directly

        return $data;
    }
}
