<?php

namespace App\Modules\Import\Handlers;

use App\Models\User;
use App\Modules\Asset\Models\Location;
use App\Modules\Asset\Models\Office;
use App\Modules\Import\Contracts\ImportHandlerInterface;
use App\Modules\Import\Handlers\Concerns\NormalizesImportValues;

class LocationImportHandler implements ImportHandlerInterface
{
    use NormalizesImportValues;

    public function type(): string
    {
        return 'locations';
    }

    public function label(): string
    {
        return 'Locations';
    }

    public function entityLabel(): string
    {
        return 'locations';
    }

    public function systemFields(): array
    {
        return [
            ['key' => 'name', 'label' => 'Name', 'required' => true, 'type' => 'text'],
            ['key' => 'code', 'label' => 'Code', 'required' => false, 'type' => 'text'],
            ['key' => 'office', 'label' => 'Office', 'required' => false, 'type' => 'reference', 'reference_model' => Office::class, 'reference_field' => 'name'],
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
            'name' => ['name', 'location', 'locationname', 'room', 'area'],
            'code' => ['code', 'locationcode', 'roomcode'],
            'office' => ['office', 'office_name', 'officename', 'building'],
            'description' => ['description', 'remarks', 'notes'],
            'is_active' => ['active', 'isactive', 'status', 'enabled'],
        ];
    }

    public function validateRow(array $mappedData, int $rowNumber, array &$context): array
    {
        $name = $this->nullableString($mappedData['name'] ?? null);
        $officeName = $this->nullableString($mappedData['office'] ?? null);
        $errors = [];
        $warnings = [];
        $officeId = null;

        if ($name === null) {
            $errors[] = "Row {$rowNumber}: Name is required.";
        }

        if ($officeName !== null) {
            $officeId = Office::query()->whereRaw('LOWER(name) = ?', [strtolower($officeName)])->value('id');
            if ($officeId === null) {
                $errors[] = "Row {$rowNumber}: Office '{$officeName}' was not found.";
            }
        }

        $context['seen_locations'] ??= [];
        $key = strtolower(($officeId ?? 'none').'|'.($name ?? ''));
        if ($name !== null) {
            if (isset($context['seen_locations'][$key])) {
                $errors[] = "Row {$rowNumber}: Location '{$name}' is duplicated in the import file.";
            } elseif (Location::query()->where('name', $name)->where('office_id', $officeId)->exists()) {
                $errors[] = "Row {$rowNumber}: Location '{$name}' already exists.";
            }
            $context['seen_locations'][$key] = true;
        }

        return [
            'data' => [
                'office_id' => $officeId,
                'name' => $name,
                'code' => $this->nullableString($mappedData['code'] ?? null) ?: ($name ? $this->slugCode($name) : null),
                'description' => $this->nullableString($mappedData['description'] ?? null),
                'is_active' => $this->booleanValue($mappedData['is_active'] ?? null),
            ],
            'custom_values' => [],
            'errors' => $errors,
            'warnings' => $warnings,
        ];
    }

    public function importRow(array $validatedData, array $customValues, User $user): void
    {
        Location::query()->create($validatedData);
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
