# Inventory API

Base path prefix: /api/v1

Routes and purpose (verified in backend/app/Modules/Inventory/Routes/api.php)

GET /api/v1/inventory
- Purpose: List inventory items (paginated). Supports filters and search; controller implements request validation and service-level filtering.
- Authentication: Required
- Authorization: role middleware restricts to specific roles (Super Administrator, System Administrator, Property Custodian, Inventory Officer, Supply Officer, Department Head)
- Response: { success: true, message, data: { items: [...], meta, links } }

Create / Update inventory item (StoreInventoryItemRequest)

Key request fields (inventory create/update):

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| name | string | required on create | Item display name
| sku | string | required on create | Unique Item Code / SKU
| description | string | nullable |
| type | string | nullable | 'non_expendable'|'expendable'
| item_type_id | integer | nullable |
| classification | string | nullable | 'PPE'|'SE'|'SUPPLY'
| item_nature | string | nullable | 'ACCOUNTABLE_PROPERTY'|'CONSUMABLE_SUPPLY'
| quantity | integer | required on create | Current stock quantity
| unit_cost | numeric | nullable |
| purchase_date | date | nullable |
| warranty_until | date | nullable |
| unit | string | nullable |
| unit_id | integer | nullable | FK to units
| manufacturer_id | integer | nullable | FK to manufacturers
| asset_category_id | integer | nullable | FK to asset categories
| office_id | integer | nullable | Default office for linked Asset
| location_id | integer | nullable | Default location
| is_borrowable | boolean | nullable | Whether items of this inventory type may be borrowed
| property_number | string | nullable | Stored on linked Asset (unique check against assets.property_number)
| serial_number | string | nullable | Stored as AssetIdentifier

Note: condition_status is prohibited on inventory requests (asset-owned field).

Source of truth:
- backend/app/Modules/Inventory/Requests/StoreInventoryItemRequest.php
- backend/app/Modules/Inventory/Controllers/InventoryController.php

GET /api/v1/inventory/simple
- Purpose: Return simplified list for selects

GET /api/v1/inventory/{item}
- Purpose: Show inventory item details

POST /api/v1/inventory
- Purpose: Create inventory item
- Authorization: role middleware
- Request body: See backend/app/Modules/Inventory/Requests for validation rules

PUT /api/v1/inventory/{item}
- Purpose: Update inventory item

DELETE /api/v1/inventory/{item}
- Purpose: Delete/archive inventory item

Stock operations
- POST /api/v1/inventory/{item}/stock-in
- POST /api/v1/inventory/{item}/stock-out
- POST /api/v1/inventory/{item}/adjust
- POST /api/v1/inventory/{item}/transfer
- These endpoints validate quantity, reason and target locations where applicable. Refer to Request classes for exact fields.

Count sessions (cycle counts)
- GET /api/v1/inventory/count-sessions
- POST /api/v1/inventory/count-sessions
- GET /api/v1/inventory/count-sessions/{session}
- POST /api/v1/inventory/count-sessions/{session}/items/{item}
- POST /api/v1/inventory/count-sessions/{session}/complete
- POST /api/v1/inventory/count-sessions/{session}/reconcile

Import/Export
- POST /api/v1/inventory/import
- GET /api/v1/inventory/export
- GET /api/v1/inventory/export/download
- Import Wizard endpoints: POST /api/v1/inventory/import-wizard/*

Item types
- API resource: /api/v1/inventory-item-types (see routes file for parameters)

Source of truth
- backend/app/Modules/Inventory/Routes/api.php
- backend/app/Modules/Inventory/Controllers/InventoryController.php
- backend/app/Modules/Inventory/Requests/*
