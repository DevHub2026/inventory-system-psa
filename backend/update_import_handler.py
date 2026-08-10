import os

# Build path relative to this script file (lives in backend/)
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)
target = os.path.join(project_root, 'app', 'Modules', 'Import', 'Handlers', 'InventoryImportHandler.php')

with open(target, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add InventoryItemType import after InventoryItem import
old_import = r"use App\Modules\Inventory\Models\InventoryItem;" + "\n" + r"use Illuminate\Support\Facades\DB;"
new_import = r"use App\Modules\Inventory\Models\InventoryItem;" + "\n" + r"use App\Modules\Inventory\Models\InventoryItemType;" + "\n" + r"use Illuminate\Support\Facades\DB;"
content = content.replace(old_import, new_import)

# 2. Add item_type_name to systemFields (after category_name line)
old_sys = "            ['key' => 'category_name', 'label' => 'Category', 'required' => false, 'type' => 'reference', 'reference_model' => InventoryCategory::class, 'reference_field' => 'name'],"
new_sys = old_sys + "\n            ['key' => 'item_type_name', 'label' => 'Item Type', 'required' => false, 'type' => 'reference', 'reference_model' => InventoryItemType::class, 'reference_field' => 'name'],"
content = content.replace(old_sys, new_sys)

# 3. Add item_type_name to aliases (after category_name alias line)
old_alias = "            'category_name' => ['category', 'type', 'classification', 'itemtype', 'assettype', 'equipmenttype', 'categoryname'],"
new_alias = old_alias + "\n            'item_type_name' => ['item_type_name', 'itemtype', 'item_type', 'itemtypename', 'type_name', 'equipment_type', 'equipment_type_name'],"
content = content.replace(old_alias, new_alias)

# 4. Add item_type_name validation in validateRow (after category_name validation block)
old_validate = (
    "        $categoryName = $this->nullableString($mappedData['category_name'] ?? null);\n"
    "        if ($categoryName !== null && ! InventoryCategory::query()->where('name', $categoryName)->exists()) {\n"
    "            $warnings[] = \"Row {$rowNumber}: Category '{$categoryName}' not found. It will be created.\";\n"
    "        }\n"
    "\n"
    "        if ($categoryName !== null) {\n"
    "            $data['category_name'] = $categoryName;\n"
    "        }"
)
new_validate = (
    "        $categoryName = $this->nullableString($mappedData['category_name'] ?? null);\n"
    "        if ($categoryName !== null && ! InventoryCategory::query()->where('name', $categoryName)->exists()) {\n"
    "            $warnings[] = \"Row {$rowNumber}: Category '{$categoryName}' not found. It will be created.\";\n"
    "        }\n"
    "\n"
    "        if ($categoryName !== null) {\n"
    "            $data['category_name'] = $categoryName;\n"
    "        }\n"
    "\n"
    "        $itemTypeName = $this->nullableString($mappedData['item_type_name'] ?? null);\n"
    "        if ($itemTypeName !== null && ! InventoryItemType::query()->where('name', $itemTypeName)->exists()) {\n"
    "            $errors[] = \"Row {$rowNumber}: Item Type '{$itemTypeName}' not found in master data.\";\n"
    "        }\n"
    "\n"
    "        if ($itemTypeName !== null) {\n"
    "            $data['item_type_name'] = $itemTypeName;\n"
    "        }"
)
content = content.replace(old_validate, new_validate)

# 5. Add item_type_name resolution in importRow (before InventoryItem::create)
old_import_row = (
    "        if ($categoryName !== null) {\n"
    "            $category = InventoryCategory::query()->firstOrCreate(\n"
    "                ['name' => $categoryName],\n"
    "                ['code' => Str::of($categoryName)->slug('_')->upper()->limit(10, '')->toString(), 'description' => 'Created during import']\n"
    "            );\n"
    "            $validatedData['inventory_category_id'] = $category->id;\n"
    "        }\n"
    "\n"
    "        $item = InventoryItem::query()->create($validatedData);"
)
new_import_row = (
    "        if ($categoryName !== null) {\n"
    "            $category = InventoryCategory::query()->firstOrCreate(\n"
    "                ['name' => $categoryName],\n"
    "                ['code' => Str::of($categoryName)->slug('_')->upper()->limit(10, '')->toString(), 'description' => 'Created during import']\n"
    "            );\n"
    "            $validatedData['inventory_category_id'] = $category->id;\n"
    "        }\n"
    "\n"
    "        $itemTypeName = $validatedData['item_type_name'] ?? null;\n"
    "        unset($validatedData['item_type_name']);\n"
    "        if ($itemTypeName !== null) {\n"
    "            $type = InventoryItemType::query()->where('name', $itemTypeName)->first();\n"
    "            if ($type) {\n"
    "                $validatedData['item_type_id'] = $type->id;\n"
    "            }\n"
    "        }\n"
    "\n"
    "        $item = InventoryItem::query()->create($validatedData);"
)
content = content.replace(old_import_row, new_import_row)

with open(target, 'w', encoding='utf-8') as f:
    f.write(content)

print('InventoryImportHandler.php updated')
