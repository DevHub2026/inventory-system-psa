# Assets API

Base path prefix: /api/v1

Primary routes (backend/app/Modules/Asset/Routes/api.php)

GET /api/v1/assets
- Purpose: List assets (paginated)
- Authentication: Required (auth:sanctum)
- Authorization: controller uses $this->authorize('viewAny', Asset::class)
- Response: success wrapper with items, meta and links

GET /api/v1/assets/search
- Purpose: Server-side search for assets (used by frontend search inputs)
- Query parameter: search (string), per_page
- Returns paginated AssetResource collection

GET /api/v1/assets/scan
- Purpose: Resolve an identifier (value param) to an asset (scan endpoint)
- Query params: value (string) or body value
- Validations: value required, max 255
- Errors: 422 for missing/invalid value, 404 when not found

GET /api/v1/assets/{asset}
- Purpose: Show asset details (AssetResource)
- Authorization: can:view, asset

POST /api/v1/assets
- Purpose: Create asset (StoreAssetRequest validation)
- Authorization: can:create, Asset
- Success: 201 with AssetResource

Request body (StoreAssetRequest):

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| asset_number | string | required | Unique asset number
| property_number | string | nullable | Property number (unique)
| name | string | required | Asset name
| description | string | nullable | Asset description
| asset_category_id | integer | required | FK to asset_categories
| manufacturer_id | integer | nullable | FK to manufacturers
| office_id | integer | required | FK to offices
| location_id | integer | nullable | FK to locations
| model | string | nullable | Model identifier
| status | enum | nullable | AssetStatus enum value
| condition_status | enum | nullable | ConditionStatus enum
| purchase_date | date | nullable | Purchase date
| purchase_cost | numeric | nullable | Purchase cost
| warranty_until | date | nullable | Warranty end date
| remarks | string | nullable | Remarks
| issued_to | string | nullable | Issued-to display
| issued_by_user_id | integer | nullable | FK to users
| date_issued | date | nullable | Issuance date
| identifiers | array | nullable | Array of identifiers objects
| identifiers.*.identifier_type | enum | required_with:identifiers | Identifier type
| identifiers.*.identifier_value | string | required_with:identifiers | Identifier value (unique)
| identifiers.*.is_primary | boolean | nullable | Primary identifier flag

Update asset (UpdateAssetRequest) — accepted fields:

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| status | enum | sometimes, required | AssetStatus
| condition_status | enum | nullable | ConditionStatus
| remarks | string | nullable |
| property_number | string | nullable | Only for standalone assets (unique)
| custodian_id | integer | nullable | FK to users

Forbidden fields (prohibited on update request): name, description, asset_number, asset_category_id, manufacturer_id, office_id, location_id, model, purchase_date, purchase_cost, warranty_until — these are managed by Inventory module.

Source of truth:
- backend/app/Modules/Asset/Requests/StoreAssetRequest.php
- backend/app/Modules/Asset/Requests/UpdateAssetRequest.php
- backend/app/Modules/Asset/Controllers/AssetController.php
- backend/app/Modules/Asset/Resources/AssetResource.php

PUT /api/v1/assets/{asset}
- Purpose: Update asset (UpdateAssetRequest)
- Authorization: can:update, asset

DELETE /api/v1/assets/{asset}
- Purpose: Delete/archive asset (soft delete behavior via service)
- Authorization: can:delete, asset

POST /api/v1/assets/{asset}/archive
- Purpose: Mark asset archived (alias behavior)

POST /api/v1/assets/{asset}/restore
- Purpose: Restore archived asset

PATCH /api/v1/assets/{asset}/borrowable
- Purpose: Set borrowable flag on linked inventory item
- Request body: is_borrowable: boolean (required)
- Business rules enforced in controller (cannot make supply items borrowable, cannot disable while active borrowing/reservation exists, etc.)

POST /api/v1/assets/{asset}/transfer
- Purpose: Transfer asset to another custodian/location (TransferAssetRequest)

Attachment endpoints
- GET /api/v1/assets/{asset}/attachments
- POST /api/v1/assets/{asset}/attachments
- GET /api/v1/assets/{asset}/attachments/{attachment}/download
- DELETE /api/v1/assets/{asset}/attachments/{attachment}

Disposal routes (role-restricted)
- POST /api/v1/assets/{asset}/dispose
- POST /api/v1/assets/{asset}/dispose/finalize
- POST /api/v1/assets/{asset}/dispose/cancel

Reissuance
- POST /api/v1/assets/{asset}/reissue
- GET /api/v1/assets/{asset}/issuance-history

Asset identifiers API resource
- /api/v1/asset-identifiers (role-restricted via routes)

Source of truth
- backend/app/Modules/Asset/Routes/api.php
- backend/app/Modules/Asset/Controllers/AssetController.php
- backend/app/Modules/Asset/Requests/*
- backend/app/Modules/Asset/Resources/AssetResource.php
