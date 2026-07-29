<?php

namespace App\Modules\Import\Handlers;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Role;
use App\Models\User;
use App\Modules\Auth\Services\UserImportService;
use App\Modules\Import\Contracts\ImportHandlerInterface;
use App\Modules\Import\Handlers\Concerns\NormalizesImportValues;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class UserImportHandler implements ImportHandlerInterface
{
    use NormalizesImportValues;

    public function type(): string
    {
        return 'users';
    }

    public function label(): string
    {
        return 'Users / Employees';
    }

    public function entityLabel(): string
    {
        return 'users';
    }

    public function systemFields(): array
    {
        return [
            ['key' => 'first_name', 'label' => 'First Name', 'required' => true, 'type' => 'text'],
            ['key' => 'middle_name', 'label' => 'Middle Name', 'required' => false, 'type' => 'text'],
            ['key' => 'last_name', 'label' => 'Last Name', 'required' => true, 'type' => 'text'],
            ['key' => 'id_number', 'label' => 'ID Number', 'required' => true, 'type' => 'text'],
            ['key' => 'email', 'label' => 'Email', 'required' => true, 'type' => 'email'],
            ['key' => 'role', 'label' => 'Role', 'required' => false, 'type' => 'reference', 'reference_model' => Role::class, 'reference_field' => 'name'],
            ['key' => 'username', 'label' => 'Username', 'required' => false, 'type' => 'text'],
        ];
    }

    public function customFields(): array
    {
        return [];
    }

    public function aliases(): array
    {
        return [
            'first_name' => ['firstname', 'givenname', 'first'],
            'middle_name' => ['middlename', 'middleinitial', 'middle'],
            'last_name' => ['lastname', 'surname', 'familyname', 'last'],
            'id_number' => ['idnumber', 'employeeid', 'employeeidnumber', 'idno', 'employee_number', 'employeenumber'],
            'email' => ['email', 'emailaddress', 'mail'],
            'role' => ['role', 'userrole', 'accesslevel'],
            'username' => ['username', 'login', 'user_name'],
        ];
    }

    public function validateRow(array $mappedData, int $rowNumber, array &$context): array
    {
        $data = [
            'first_name' => $this->nullableString($mappedData['first_name'] ?? null),
            'middle_name' => $this->nullableString($mappedData['middle_name'] ?? null),
            'last_name' => $this->nullableString($mappedData['last_name'] ?? null),
            'id_number' => $this->nullableString($mappedData['id_number'] ?? null),
            'email' => strtolower((string) $this->nullableString($mappedData['email'] ?? null)),
            'username' => $this->nullableString($mappedData['username'] ?? null),
            'role' => $this->nullableString($mappedData['role'] ?? null) ?? UserRole::EMPLOYEE->value,
        ];

        $validator = Validator::make($data, [
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'id_number' => ['required', 'string', 'regex:/^\d{4}-\d{4}$/'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'username' => ['nullable', 'string', 'max:255'],
            'role' => ['nullable', 'string', 'max:255'],
        ]);

        $errors = array_map(fn (string $error) => "Row {$rowNumber}: {$error}", $validator->errors()->all());
        $warnings = [];

        // Use provided username or generate one
        $username = $data['username'] ?? '';
        if ($username === '') {
            $username = $this->generateUsername((string) $data['last_name'], (string) $data['id_number']);
        }

        // Collision-safe username: append number if taken
        $originalUsername = $username;
        $counter = 0;
        while (User::query()->where('username', $username)->exists()) {
            $counter++;
            $username = $originalUsername . $counter;
        }

        $context['seen_emails'] ??= [];
        $context['seen_id_numbers'] ??= [];
        $context['seen_usernames'] ??= [];

        if ($data['email'] !== '' && isset($context['seen_emails'][$data['email']])) {
            $errors[] = "Row {$rowNumber}: Email '{$data['email']}' is duplicated in the import file.";
        } elseif ($data['email'] !== '' && User::query()->where('email', $data['email'])->exists()) {
            $errors[] = "Row {$rowNumber}: Email '{$data['email']}' already exists.";
        }

        if ($data['id_number'] !== null && isset($context['seen_id_numbers'][$data['id_number']])) {
            $errors[] = "Row {$rowNumber}: ID number '{$data['id_number']}' is duplicated in the import file.";
        } elseif ($data['id_number'] !== null && User::query()->where('employee_number', $data['id_number'])->exists()) {
            $errors[] = "Row {$rowNumber}: ID number '{$data['id_number']}' already exists.";
        }

        if (isset($context['seen_usernames'][$username])) {
            $errors[] = "Row {$rowNumber}: Username '{$username}' is duplicated in the import file.";
        }

        $role = Role::query()->whereRaw('LOWER(name) = LOWER(?)', [(string) $data['role']])->first();
        if (! $role instanceof Role) {
            $errors[] = "Row {$rowNumber}: Role '{$data['role']}' was not found.";
        }

        $context['seen_emails'][$data['email']] = true;
        if ($data['id_number'] !== null) {
            $context['seen_id_numbers'][$data['id_number']] = true;
        }
        $context['seen_usernames'][$username] = true;

        return [
            'data' => [
                'employee_number' => $data['id_number'],
                'username' => $username,
                'first_name' => $data['first_name'],
                'middle_name' => $data['middle_name'],
                'last_name' => $data['last_name'],
                'email' => $data['email'],
                'role_id' => $role?->id,
                'role_name' => $role?->name,
            ],
            'custom_values' => [],
            'errors' => $errors,
            'warnings' => $warnings,
        ];
    }

    public function importRow(array $validatedData, array $customValues, User $user): void
    {
        DB::transaction(function () use ($validatedData): void {
            $roleId = $validatedData['role_id'];
            unset($validatedData['role_id'], $validatedData['role_name']);

            $created = User::query()->create([
                ...$validatedData,
                'password' => bcrypt(UserImportService::INITIAL_PASSWORD),
                'status' => UserStatus::ACTIVE->value,
            ]);

            if ($roleId !== null) {
                $created->roles()->syncWithoutDetaching([$roleId]);
            }
        });
    }

    public function supportsCustomFields(): bool
    {
        return false;
    }

    public function createCustomField(array $field, User $user): ?array
    {
        return null;
    }

    private function generateUsername(string $lastName, string $idNumber): string
    {
        $normalizedLastName = preg_replace('/\s+/', '', strtolower(trim($lastName))) ?: '';

        return $normalizedLastName . $idNumber;
    }
}
