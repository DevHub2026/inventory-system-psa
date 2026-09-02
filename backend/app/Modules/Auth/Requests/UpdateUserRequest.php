<?php

namespace App\Modules\Auth\Requests;

use App\Enums\UserStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Preserve the current username unless the caller explicitly changes it.
     * Never regenerate a username during a normal update.
     */
    protected function prepareForValidation(): void
    {
        $blankToNull = [];
        foreach (['employee_number', 'username', 'first_name', 'middle_name', 'last_name'] as $field) {
            if ($this->has($field) && trim((string) $this->input($field)) === '') {
                $blankToNull[$field] = null;
            }
        }

        if ($blankToNull !== []) {
            $this->merge($blankToNull);
        }

        if ($this->has('username')) {
            $this->merge([
                'username' => trim((string) $this->input('username')) === '' ? null : trim((string) $this->input('username')),
            ]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'employee_number' => ['sometimes', 'nullable', 'string', Rule::unique('users', 'employee_number')->ignore($this->route('user'))],
            'username'        => ['sometimes', 'nullable', 'string', 'max:255', Rule::unique('users', 'username')->ignore($this->route('user'))],
            'first_name'      => ['sometimes', 'nullable', 'string', 'max:255'],
            'middle_name'     => ['nullable', 'string', 'max:255'],
            'last_name'       => ['sometimes', 'nullable', 'string', 'max:255'],
            'email'           => ['sometimes', 'required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($this->route('user'))],
            'password'        => ['sometimes', 'required', 'string', Password::min(8)->letters()->numbers()],
            'department_id'   => ['nullable', 'exists:departments,id'],
            'office_id'       => ['nullable', 'exists:offices,id'],
            'status'          => ['sometimes', 'string', Rule::in(UserStatus::values())],
            'roles'           => ['sometimes', 'array'],
            'roles.*'         => ['exists:roles,id'],
            'email_notifications_enabled' => ['sometimes', 'boolean'],
        ];
    }
}
