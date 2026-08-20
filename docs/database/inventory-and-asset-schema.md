# Inventory and Asset Schema (implementation-backed)

This document describes the verified relationship and ownership model between Inventory and Asset modules.

Key verified points

- Assets (durable property) are stored in `assets` table. Migration: backend/database/migrations/2026_07_14_100004_create_assets_table.php
  - Important columns: asset_number (unique), name, asset_category_id, office_id, location_id, status, purchase_date, purchase_cost, timestamps, softDeletes
  - Asset identifiers are stored separately in `asset_identifiers` (identifier_type, identifier_value, is_primary). Migration: 2026_07_14_100005_create_asset_identifiers_table.php

- Inventory items are stored in `inventory_items` table. Migration: 2026_07_16_000004_create_inventory_items_table.php and subsequent inventory migrations add classification, procurement fields, unit, suppliers, etc.

- Link between Inventory and Assets:
  - There is a migration `2026_07_18_203300_link_inventory_items_to_assets.php` which creates a linkage between inventory items and assets for items that are tracked as assets. This indicates the system supports tracking an inventory item as an asset (track_as_asset flag/migration additions exist).

- Ownership rule (implementation-backed):
  - The code enforces that certain procurement/identifier fields are authoritative in the Inventory flow and should not be edited directly via the Asset update endpoint. This is implemented by request/validation classes: backend/app/Modules/Asset/Requests/UpdateAssetRequest.php and backend/app/Modules/Inventory/Requests/StoreInventoryItemRequest.php which include authorization/validation comments indicating field ownership.
  - Migrations and request classes together confirm that inventory has procurement fields and identifiers that sync to assets through service logic and link migrations.

- Stock movement and count sessions
  - Stock transactions are stored in `stock_transactions` (migration: create_stock_transactions_table.php). Inventory count sessions tables exist in migrations: create_inventory_count_tables.php

- Categories, locations, offices
  - Asset categories: asset_categories table
  - Inventory categories: inventory_categories table
  - Offices and locations have their own tables and are foreign-keyed from assets and users where applicable.

Source references

- backend/database/migrations/2026_07_14_100004_create_assets_table.php
- backend/database/migrations/2026_07_14_100005_create_asset_identifiers_table.php
- backend/database/migrations/2026_07_16_000004_create_inventory_items_table.php
- backend/database/migrations/2026_07_18_203300_link_inventory_items_to_assets.php
- backend/app/Modules/Asset/Requests/UpdateAssetRequest.php
- backend/app/Modules/Inventory/Requests/StoreInventoryItemRequest.php
- backend/app/Modules/Asset/Models/Asset.php
- backend/app/Modules/Inventory/Models/InventoryItem.php

Notes and caveats

- The exact synchronization logic (what updates what and when) is implemented in service classes; the migrations and request validations together demonstrate the intended ownership but the runtime synchronization occurs in services. For exact behavior, consult InventoryService and AssetService in backend/app/Modules/*/Services/.
