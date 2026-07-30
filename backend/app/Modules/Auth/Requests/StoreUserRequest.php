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
        $lastName       = (string) ($this->input('last_name') ?? '');
        $employeeNumber = (string) ($this->input('employee_number') ?? '');

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
            'employee_number' => ['required', 'string', 'unique:users,employee_number'],
            'username'        => ['required', 'string', 'max:255', 'unique:users,username'],
            'first_name'      => ['required', 'string', 'max:255'],
            'middle_name'     => ['nullable', 'string', 'max:255'],
            'last_name'       => ['required', 'string', 'max:255'],
            'email'           => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password'        => ['required', 'string', Password::min(8)->letters()->numbers()],
            'department_id'   => ['nullable', 'exists:departments,id'],
            'office_id'       => ['nullable', 'exists:offices,id'],
            'status'          => ['sometimes', 'string', Rule::in(UserStatus::values())],
            'roles'           => ['sometimes', 'array'],
            'roles.*'         => ['exists:roles,id'],
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
