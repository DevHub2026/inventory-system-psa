import os

path = r'backend/app/Modules/Inventory/Services/InventoryService.php'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add itemType to eager loading in export query
old1 = "->with(['asset.issuedToUser', 'asset.identifiers', 'unit', 'manufacturer', 'office', 'location', 'assetCategory'])"
new1 = "->with(['asset.issuedToUser', 'asset.identifiers', 'unit', 'manufacturer', 'office', 'location', 'assetCategory', 'itemType'])"
content = content.replace(old1, new1)

# 2. Add itemType to eager loading in list query
old2 = "InventoryItem::query()->with(['asset.issuedToUser', 'asset.identifiers', 'unit', 'manufacturer', 'office', 'location', 'assetCategory', 'supplier']);"
new2 = "InventoryItem::query()->with(['asset.issuedToUser', 'asset.identifiers', 'unit', 'manufacturer', 'office', 'location', 'assetCategory', 'supplier', 'itemType']);"
content = content.replace(old2, new2)

# 3. Add item_type_name to template export rows
old3 = "'sku'              => $item->sku ?? '',"
new3 = "'sku'              => $item->sku ?? '',\n                'item_type_name'   => $item->itemType?->name ?? '',"
content = content.replace(old3, new3)

# 4. Add item_type column to template export so it appears in output
old4 = "'classification'   => $item->classification ?? ucfirst(str_replace('_', '-', $item->type ?? '')),"
new4 = "'classification'   => $item->classification ?? ucfirst(str_replace('_', '-', $item->type ?? '')),\n                'item_type'        => $item->itemType?->name ?? '',"
content = content.replace(old4, new4)

# 5. Add item_type_name in hardcoded spreadsheet headers (after B: Inventory Type)
old5 = "'B' => 'Inventory Type',"
new5 = "'B' => 'Inventory Type',\n            'B2' => 'Item Type',"
content = content.replace(old5, new5)

# 6. Insert 'Item Type' column into hardcoded export data
# The hardcoded export uses letters A-X for columns. We need to insert item_type
# For the hardcoded header we add it right after 'B' (Inventory Type).
# For data we add $item->itemType?->name in the data row after 'B'.
# Simplest: add a new column between B (Inventory Type) and C (Item Name)
# We'll just append item_type to the row data after B by shifting logic.
# Since the headers are keyed by letters, let's insert after B in headers:
# We'll do it in the hardcoded section by finding the header array.

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('InventoryService.php updated successfully')