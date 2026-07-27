<?php

namespace App\Modules\Import\Handlers;

use App\Models\Department;
use App\Models\User;
use App\Modules\Import\Contracts\ImportHandlerInterface;
use App\Modules\Import\Handlers\Concerns\NormalizesImportValues;

class DepartmentImportHandler implements ImportHandlerInterface
{
    use NormalizesImportValues;

    public function type(): string
    {
        return 'departments';
    }

    public function label(): string
    {
        return 'Departments';
    }

    public function entityLabel(): string
    {
        return 'departments';
    }

    public function systemFields(): array
    {
        return [
            ['key' => 'name', 'label' => 'Name', 'required' => true, 'type' => 'text'],
            ['key' => 'description', 'label' => 'Description', 'required' => false, 'type' => 'text'],
        ];
    }

    public function customFields(): array
    {
        return [];
    }

    public function aliases(): array
    {
        return [
            'name' => ['name', 'department', 'departmentname', 'division'],
            'description' => ['description', 'remarks', 'notes'],
        ];
    }

    public function validateRow(array $mappedData, int $rowNumber, array &$context): array
    {
        $name = $this->nullableString($mappedData['name'] ?? null);
        $errors = [];

        if ($name === null) {
            $errors[] = "Row {$rowNumber}: Name is required.";
        }

        $context['seen_names'] ??= [];
        if ($name !== null) {
            $key = strtolower($name);
            if (isset($context['seen_names'][$key])) {
                $errors[] = "Row {$rowNumber}: Department '{$name}' is duplicated in the import file.";
            } elseif (Department::query()->where('name', $name)->exists()) {
                $errors[] = "Row {$rowNumber}: Department '{$name}' already exists.";
            }
            $context['seen_names'][$key] = true;
        }

        return [
            'data' => [
                'name' => $name,
                'description' => $this->nullableString($mappedData['description'] ?? null),
            ],
            'custom_values' => [],
            'errors' => $errors,
            'warnings' => [],
        ];
    }

    public function importRow(array $validatedData, array $customValues, User $user): void
    {
        Department::query()->create($validatedData);
    }

    public function supportsCustomFields(): bool
    {
        return false;
    }

    public function createCustomField(array $field, User $user): ?array
    {
        return null;
    }
}
