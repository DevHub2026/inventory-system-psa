<?php

namespace App\Modules\Import\Handlers;

use App\Models\InventoryCategory;
use App\Models\InventoryCustomField;
use App\Models\User;
use App\Modules\Import\Contracts\ImportHandlerInterface;
use App\Modules\Import\Handlers\Concerns\NormalizesImportValues;
use App\Modules\Inventory\Models\InventoryItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InventoryImportHandler implements ImportHandlerInterface
{
    use NormalizesImportValues;

    public function type(): string
    {
        return 'inventory';
    }

    public function label(): string
    {
        return 'Inventory Items';
    }

    public function entityLabel(): string
    {
        return 'inventory items';
    }

    public function systemFields(): array
    {
        return [
            ['key' => 'name', 'label' => 'Item Name', 'required' => true, 'type' => 'text'],
            ['key' => 'sku', 'label' => 'SKU/Code', 'required' => false, 'type' => 'text'],
            ['key' => 'category_name', 'label' => 'Category', 'required' => false, 'type' => 'reference', 'reference_model' => InventoryCategory::class, 'reference_field' => 'name'],
            ['key' => 'unit', 'label' => 'Unit', 'required' => false, 'type' => 'text'],
            ['key' => 'quantity', 'label' => 'Quantity', 'required' => false, 'type' => 'number'],
            ['key' => 'reorder_level', 'label' => 'Reorder Level', 'required' => false, 'type' => 'number'],
            ['key' => 'remarks', 'label' => 'Remarks', 'required' => false, 'type' => 'text'],
        ];
    }

    public function customFields(): array
    {
        return InventoryCustomField::query()
            ->where('is_active', true)
            ->get(['id', 'name', 'field_key', 'field_type'])
            ->map(fn (InventoryCustomField $field) => [
                'id' => $field->id,
                'name' => $field->name,
                'field_key' => $field->field_key,
                'field_type' => $field->field_type,
            ])
            ->all();
    }

    public function aliases(): array
    {
        return [
            'name' => ['itemname', 'assetname', 'equipmentname', 'productname', 'descriptionofitem', 'item', 'asset', 'equipment', 'product'],
            'sku' => ['sku', 'code', 'itemcode', 'assetcode', 'propertyno', 'propertynumber', 'stockcode', 'partnumber', 'reference'],
            'category_name' => ['category', 'type', 'classification', 'itemtype', 'assettype', 'equipmenttype', 'categoryname'],
            'unit' => ['unit', 'uom', 'measurement', 'unitofmeasure', 'unitofmeasurement'],
            'quantity' => ['quantity', 'qty', 'count', 'numberofitems', 'stock', 'available', 'onhand'],
            'reorder_level' => ['reorder', 'reorderlevel', 'minstock', 'minimumstock', 'threshold', 'alertlevel'],
            'remarks' => ['remarks', 'notes', 'comments', 'description', 'additionalinfo', 'note'],
        ];
    }

    public function validateRow(array $mappedData, int $rowNumber, array &$context): array
    {
        $errors = [];
        $warnings = [];
        $data = [
            'name' => $this->nullableString($mappedData['name'] ?? null),
            'sku' => $this->nullableString($mappedData['sku'] ?? null),
            'unit' => $this->nullableString($mappedData['unit'] ?? null),
            'quantity' => (int) ($mappedData['quantity'] ?? 0),
            'reorder_level' => $this->nullableString($mappedData['reorder_level'] ?? null),
            'remarks' => $this->nullableString($mappedData['remarks'] ?? null),
        ];

        if ($data['name'] === null) {
            $errors[] = "Row {$rowNumber}: Item name is required.";
        }

        foreach (['quantity' => 'Quantity', 'reorder_level' => 'Reorder level'] as $key => $label) {
            $value = $this->nullableString($mappedData[$key] ?? null);
            if ($value !== null && ! is_numeric($value)) {
                $errors[] = "Row {$rowNumber}: {$label} must be numeric.";
            }
        }

        if ($data['reorder_level'] !== null) {
            $data['reorder_level'] = (int) $data['reorder_level'];
        }

        if ($data['sku'] !== null) {
            $skuKey = strtolower($data['sku']);
            $context['seen_skus'] ??= [];

            if (isset($context['seen_skus'][$skuKey])) {
                $errors[] = "Row {$rowNumber}: SKU '{$data['sku']}' is duplicated in the import file.";
            } elseif (InventoryItem::query()->where('sku', $data['sku'])->exists()) {
                $errors[] = "Row {$rowNumber}: SKU '{$data['sku']}' already exists.";
            }

            $context['seen_skus'][$skuKey] = true;
        }

        $categoryName = $this->nullableString($mappedData['category_name'] ?? null);
        if ($categoryName !== null && ! InventoryCategory::query()->where('name', $categoryName)->exists()) {
            $warnings[] = "Row {$rowNumber}: Category '{$categoryName}' not found. It will be created.";
        }

        if ($categoryName !== null) {
            $data['category_name'] = $categoryName;
        }

        return [
            'data' => $data,
            'custom_values' => $mappedData['_custom'] ?? [],
            'errors' => $errors,
            'warnings' => $warnings,
        ];
    }

    public function importRow(array $validatedData, array $customValues, User $user): void
    {
        $categoryName = $validatedData['category_name'] ?? null;
        unset($validatedData['category_name']);

        if ($categoryName !== null) {
            $category = InventoryCategory::query()->firstOrCreate(
                ['name' => $categoryName],
                ['code' => Str::of($categoryName)->slug('_')->upper()->limit(10, '')->toString(), 'description' => 'Created during import']
            );
            $validatedData['inventory_category_id'] = $category->id;
        }

        $item = InventoryItem::query()->create($validatedData);

        foreach ($customValues as $fieldId => $value) {
            if ($this->nullableString($value) === null) {
                continue;
            }

            DB::table('inventory_item_custom_fields')->insert([
                'inventory_item_id' => $item->id,
                'inventory_custom_field_id' => (int) $fieldId,
                'value' => $value,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function supportsCustomFields(): bool
    {
        return true;
    }

    public function createCustomField(array $field, User $user): ?array
    {
        $name = trim((string) ($field['name'] ?? ''));
        if ($name === '') {
            return null;
        }

        $customField = InventoryCustomField::query()->firstOrCreate(
            ['field_key' => 'custom_'.Str::slug($name, '_')],
            [
                'name' => $name,
                'field_type' => $field['field_type'] ?? 'text',
                'description' => $field['description'] ?? null,
                'is_active' => true,
                'created_by' => $user->id,
            ]
        );

        return [
            'id' => $customField->id,
            'name' => $customField->name,
            'field_key' => $customField->field_key,
            'field_type' => $customField->field_type,
        ];
    }
}
