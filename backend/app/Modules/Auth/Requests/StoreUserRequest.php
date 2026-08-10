<?php

namespace App\Modules\Auth\Requests;

use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Auto-generate username from last_name + employee_number before validation runs.
     */
    protected function prepareForValidation(): void
    {
        $lastName       = trim((string) ($this->input('last_name') ?? ''));
        $employeeNumber = trim((string) ($this->input('employee_number') ?? ''));

        $blankToNull = [];
        foreach (['employee_number', 'username', 'first_name', 'middle_name', 'last_name'] as $field) {
            if ($this->has($field) && trim((string) $this->input($field)) === '') {
                $blankToNull[$field] = null;
            }
        }

        if ($blankToNull !== []) {
            $this->merge($blankToNull);
        }

        if (empty($this->input('username')) && $lastName !== '' && $employeeNumber !== '') {
            $this->merge([
                'username' => static::buildUsername($lastName, $employeeNumber),
            ]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'employee_number' => ['nullable', 'string', 'unique:users,employee_number'],
            'username'        => ['nullable', 'string', 'max:255', 'unique:users,username'],
            'first_name'      => ['nullable', 'string', 'max:255'],
            'middle_name'     => ['nullable', 'string', 'max:255'],
            'last_name'       => ['nullable', 'string', 'max:255'],
            'email'           => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password'        => ['nullable', 'string', Password::min(8)->letters()->numbers()],
            'department_id'   => ['nullable', 'exists:departments,id'],
            'office_id'       => ['nullable', 'exists:offices,id'],
            'status'          => ['sometimes', 'string', Rule::in(UserStatus::values())],
            'roles'           => ['sometimes', 'array'],
            'roles.*'         => ['exists:roles,id'],
            'email_notifications_enabled' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'username.unique' => 'The generated username :input is already taken. Please adjust the last name or employee number.',
        ];
    }

    /**
     * Sanitise and build a username: lowercase(lastName) + employeeNumber.
     * Strips spaces and any non-alphanumeric characters from the last name.
     */
    public static function buildUsername(string $lastName, string $employeeNumber): string
    {
        $sanitized = preg_replace('/[^a-z0-9]/', '', strtolower(trim($lastName))) ?? '';
        return $sanitized . trim($employeeNumber);
    }
}
