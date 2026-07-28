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
     * If last_name or employee_number changes and no username is explicitly provided,
     * re-generate the username automatically.
     */
    protected function prepareForValidation(): void
    {
        // Only regenerate if the caller is not explicitly setting a username
        if (! $this->has('username')) {
            $user           = $this->route('user');
            $lastName       = (string) ($this->input('last_name') ?? $user?->last_name ?? '');
            $employeeNumber = (string) ($this->input('employee_number') ?? $user?->employee_number ?? '');

            if ($lastName !== '' && $employeeNumber !== '') {
                $this->merge([
                    'username' => StoreUserRequest::buildUsername($lastName, $employeeNumber),
                ]);
            }
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'employee_number' => ['sometimes', 'required', 'string', Rule::unique('users', 'employee_number')->ignore($this->route('user'))],
            'username'        => ['sometimes', 'required', 'string', 'max:255', Rule::unique('users', 'username')->ignore($this->route('user'))],
            'first_name'      => ['sometimes', 'required', 'string', 'max:255'],
            'middle_name'     => ['nullable', 'string', 'max:255'],
            'last_name'       => ['sometimes', 'required', 'string', 'max:255'],
            'email'           => ['sometimes', 'required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($this->route('user'))],
            'password'        => ['sometimes', 'required', 'string', Password::min(8)->letters()->numbers()],
            'department_id'   => ['nullable', 'exists:departments,id'],
            'office_id'       => ['nullable', 'exists:offices,id'],
            'status'          => ['sometimes', 'string', Rule::in(UserStatus::values())],
            'roles'           => ['sometimes', 'array'],
            'roles.*'         => ['exists:roles,id'],
        ];
    }
}
