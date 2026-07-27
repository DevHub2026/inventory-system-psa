<?php

namespace App\Modules\Import\Handlers;

use App\Models\User;
use App\Modules\AssetCategory\Models\AssetCategory;
use App\Modules\Import\Contracts\ImportHandlerInterface;
use App\Modules\Import\Handlers\Concerns\NormalizesImportValues;

class AssetCategoryImportHandler implements ImportHandlerInterface
{
    use NormalizesImportValues;

    public function type(): string
    {
        return 'asset_categories';
    }

    public function label(): string
    {
        return 'Asset Categories';
    }

    public function entityLabel(): string
    {
        return 'asset categories';
    }

    public function systemFields(): array
    {
        return [
            ['key' => 'name', 'label' => 'Name', 'required' => true, 'type' => 'text'],
            ['key' => 'code', 'label' => 'Code', 'required' => false, 'type' => 'text'],
            ['key' => 'description', 'label' => 'Description', 'required' => false, 'type' => 'text'],
            ['key' => 'is_active', 'label' => 'Active', 'required' => false, 'type' => 'boolean'],
        ];
    }

    public function customFields(): array
    {
        return [];
    }

    public function aliases(): array
    {
        return [
            'name' => ['name', 'category', 'categoryname', 'assetcategory'],
            'code' => ['code', 'categorycode', 'assetcategorycode'],
            'description' => ['description', 'remarks', 'notes'],
            'is_active' => ['active', 'isactive', 'status', 'enabled'],
        ];
    }

    public function validateRow(array $mappedData, int $rowNumber, array &$context): array
    {
        $name = $this->nullableString($mappedData['name'] ?? null);
        $code = $this->nullableString($mappedData['code'] ?? null);
        $errors = [];

        if ($name === null) {
            $errors[] = "Row {$rowNumber}: Name is required.";
        }

        $context['seen_names'] ??= [];
        $context['seen_codes'] ??= [];

        if ($name !== null) {
            $nameKey = strtolower($name);
            if (isset($context['seen_names'][$nameKey])) {
                $errors[] = "Row {$rowNumber}: Category '{$name}' is duplicated in the import file.";
            } elseif (AssetCategory::query()->where('name', $name)->exists()) {
                $errors[] = "Row {$rowNumber}: Category '{$name}' already exists.";
            }
            $context['seen_names'][$nameKey] = true;
        }

        if ($code !== null) {
            $codeKey = strtolower($code);
            if (isset($context['seen_codes'][$codeKey])) {
                $errors[] = "Row {$rowNumber}: Code '{$code}' is duplicated in the import file.";
            } elseif (AssetCategory::query()->where('code', $code)->exists()) {
                $errors[] = "Row {$rowNumber}: Code '{$code}' already exists.";
            }
            $context['seen_codes'][$codeKey] = true;
        }

        return [
            'data' => [
                'name' => $name,
                'code' => $code ?: ($name ? $this->slugCode($name) : null),
                'description' => $this->nullableString($mappedData['description'] ?? null),
                'is_active' => $this->booleanValue($mappedData['is_active'] ?? null),
            ],
            'custom_values' => [],
            'errors' => $errors,
            'warnings' => [],
        ];
    }

    public function importRow(array $validatedData, array $customValues, User $user): void
    {
        AssetCategory::query()->create($validatedData);
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
