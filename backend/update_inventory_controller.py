path = r'backend/app/Modules/Inventory/Controllers/InventoryController.php'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old = "$item->load(['asset.issuedToUser', 'asset.identifiers', 'unit', 'manufacturer', 'office', 'location', 'assetCategory', 'supplier']);"
new = "$item->load(['asset.issuedToUser', 'asset.identifiers', 'unit', 'manufacturer', 'office', 'location', 'assetCategory', 'supplier', 'itemType']);"

if old in content:
    content = content.replace(old, new)
    print('show() updated')
else:
    print('show() pattern not found')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)