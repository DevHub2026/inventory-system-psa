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
            ['key' => 'description', 'label' => 'Description', 'required' => false, 'type' => 'text'],
            ['key' => 'item_type_name', 'label' => 'Type', 'required' => false, 'type' => 'reference', 'reference_model' => \App\Modules\Inventory\Models\InventoryItemType::class, 'reference_field' => 'name'],
            ['key' => 'category_name', 'label' => 'Category', 'required' => false, 'type' => 'reference', 'reference_model' => InventoryCategory::class, 'reference_field' => 'name'],
            ['key' => 'asset_category_name', 'label' => 'Asset Category', 'required' => false, 'type' => 'text'],
            ['key' => 'manufacturer_name', 'label' => 'Manufacturer', 'required' => false, 'type' => 'text'],
            ['key' => 'model', 'label' => 'Model', 'required' => false, 'type' => 'text'],
            ['key' => 'unit', 'label' => 'Unit', 'required' => false, 'type' => 'text'],
            ['key' => 'unit_cost', 'label' => 'Unit Cost', 'required' => false, 'type' => 'number'],
            ['key' => 'office_name', 'label' => 'Default Office', 'required' => false, 'type' => 'text'],
            ['key' => 'location_name', 'label' => 'Default Location', 'required' => false, 'type' => 'text'],
            ['key' => 'quantity', 'label' => 'Quantity', 'required' => false, 'type' => 'number'],
            ['key' => 'reorder_level', 'label' => 'Reorder Level', 'required' => false, 'type' => 'number'],
            ['key' => 'is_borrowable', 'label' => 'Borrowable', 'required' => false, 'type' => 'boolean'],
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
            'name' => ['itemname', 'equipmentname', 'productname', 'descriptionofitem', 'equipment', 'product'],
            'sku' => ['sku', 'itemcode', 'assetcode', 'propertyno', 'propertynumber', 'stockcode', 'partnumber'],
            'description' => ['description', 'itemdescription', 'details', 'specification', 'specifications'],
            'item_type_name' => ['itemtype', 'item type', 'item_type', 'itemtypename', 'item type name', 'inventory item type', 'inventorytype'],
            'category_name' => ['category', 'categoryname'],
            'asset_category_name' => ['assetcategory', 'asset category', 'assetcategoryname', 'categoryasset'],
            'manufacturer_name' => ['manufacturer', 'manufacturername', 'brand'],
            'model' => ['model', 'modelnumber', 'modelno'],
            'unit' => ['unit', 'uom', 'measurement', 'unitofmeasure', 'unitofmeasurement', 'unitofmeasuremnt'],
            'unit_cost' => ['unitcost', 'unit cost', 'unitcostphp', 'cost', 'unitprice', 'price'],
            'office_name' => ['defaultoffice', 'office', 'office_name', 'default office'],
            'location_name' => ['defaultlocation', 'location', 'location_name', 'default location'],
            'quantity' => ['quantity', 'qty', 'count', 'numberofitems', 'available', 'onhand'],
            'reorder_level' => ['reorder', 'reorderlevel', 'minstock', 'minimumstock', 'threshold', 'alertlevel', 'lowstockalert'],
            'is_borrowable' => ['borrowable', 'isborrowable', 'loanable'],
            'remarks' => ['remarks', 'notes', 'comments', 'description', 'additionalinfo', 'note', 'inventoryremarks'],
        ];
    }

    public function validateRow(array $mappedData, int $rowNumber, array &$context): array
    {
        $errors = [];
        $warnings = [];
        $data = [
            'name' => $this->nullableString($mappedData['name'] ?? null),
            'sku' => $this->nullableString($mappedData['sku'] ?? null),
            'description' => $this->nullableString($mappedData['description'] ?? null),
            'item_type_name' => $this->nullableString($mappedData['item_type_name'] ?? null),
            'asset_category_name' => $this->nullableString($mappedData['asset_category_name'] ?? null),
            'manufacturer_name' => $this->nullableString($mappedData['manufacturer_name'] ?? null),
            'model' => $this->nullableString($mappedData['model'] ?? null),
            'unit' => $this->nullableString($mappedData['unit'] ?? null),
            'unit_cost' => $this->decimalNumber($mappedData['unit_cost'] ?? null),
            'office_name' => $this->nullableString($mappedData['office_name'] ?? null),
            'location_name' => $this->nullableString($mappedData['location_name'] ?? null),
            'quantity' => $this->integerNumber($mappedData['quantity'] ?? null) ?? 0,
            'reorder_level' => $this->integerNumber($mappedData['reorder_level'] ?? null),
            'is_borrowable' => $this->booleanValue($mappedData['is_borrowable'] ?? true),
            'remarks' => $this->nullableString($mappedData['remarks'] ?? null),
        ];

        if ($data['name'] === null) {
            $errors[] = "Row {$rowNumber}: Item name is required.";
        }

        foreach (['quantity' => 'Quantity', 'reorder_level' => 'Reorder level', 'unit_cost' => 'Unit cost'] as $key => $label) {
            $value = $mappedData[$key] ?? null;
            $parsedValue = match ($key) {
                'unit_cost' => $this->decimalNumber($value),
                default => $this->integerNumber($value),
            };

            if ($value !== null && $this->nullableString($value) !== null && $parsedValue === null) {
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

        $itemTypeName = $this->nullableString($mappedData['item_type_name'] ?? null);
        if ($itemTypeName !== null && ! \App\Modules\Inventory\Models\InventoryItemType::query()->where('name', $itemTypeName)->exists()) {
            $warnings[] = "Row {$rowNumber}: Type '{$itemTypeName}' not found. It will be created.";
        }

        if ($itemTypeName !== null) {
            $data['item_type_name'] = $itemTypeName;
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

        $itemTypeName = $validatedData['item_type_name'] ?? null;
        unset($validatedData['item_type_name']);

        if ($itemTypeName !== null) {
            $itemType = \App\Modules\Inventory\Models\InventoryItemType::query()->firstOrCreate(
                ['name' => $itemTypeName],
                ['code' => Str::of($itemTypeName)->slug('_')->upper()->limit(10, '')->toString(), 'description' => 'Created during import']
            );
            $validatedData['item_type_id'] = $itemType->id;
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
