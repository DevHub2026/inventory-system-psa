# Inventory and Asset Architecture

This document explains how Inventory and Asset responsibilities are separated and synchronized in the implementation.

Primary distinction (verified)

- Inventory items (inventory_items) model SKU-driven, stock-managed items (consumables, PPE, semi-expendable). Inventory module is the authoritative manager for procurement fields and SKU/serial management.
- Asset records (assets) model individually-tracked durable items with identification and custody fields. Asset records may be linked to an InventoryItem when Inventory manages the procurement/identifier lifecycle.

Ownership and synchronization (implementation-backed)

- InventoryService (backend/app/Modules/Inventory/Services) is responsible for creating/updating inventory items and—when configured—creating or syncing linked Asset and AssetIdentifier records.
- UpdateAssetRequest (backend/app/Modules/Asset/Requests/UpdateAssetRequest.php) explicitly documents field ownership: many fields (name, description, asset_category_id, manufacturer_id, office_id, location_id, model, asset_number) are inventory-owned and are prohibited on asset update requests. This is a strong indicator that Inventory is the authoritative edit point for those fields.

Identifiers and property numbers

- Inventory accepts property_number and serial_number fields and synchronizes them to assets.property_number and asset_identifiers respectively (see StoreInventoryItemRequest and InventoryService comments).
- Asset identifiers (asset_identifiers) store types (serial, qr, etc.) and values; identifiers are unique and may be marked primary.

Borrowability and classification

- Inventory items include classification fields: PPE, SE (Semi-Expendable), SUPPLY — classification impacts allowed operations.
- AssetController::setBorrowable enforces business rules: supply-classified items (classification === 'SUPPLY') cannot be made borrowable. Disabling borrowable is rejected when there are active borrowings or open reservations.

Lifecycle operations

- Inventory offers stock operations (stock-in, stock-out, adjust, transfer) and count sessions (cycle count). These operations affect inventory quantity, reorder levels and procurement metadata.
- Asset module handles transfers, disposal lifecycle, issuance/reissuance, attachments and asset-level status transitions.

Frontend integration

- InventoryPage and inventoryService manage inventory CRUD and stock operations.
- AssetPage and assetService manage asset details, scan flows and asset-specific operations. Inventory changes propagate to Asset views via the synchronization behavior in backend services.

Source of truth

- backend/app/Modules/Inventory/Requests/StoreInventoryItemRequest.php
- backend/app/Modules/Asset/Requests/UpdateAssetRequest.php
- backend/app/Modules/Inventory/Controllers/InventoryController.php
- backend/app/Modules/Asset/Controllers/AssetController.php
- frontend/src/services/inventoryService.ts
- frontend/src/services/assetService.ts
