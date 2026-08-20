# Core Entities (implementation-backed)

This document summarizes the main database entities (tables) used by the application. For each entity the authoritative migration is referenced.

Users

- Purpose: Stores application users and key profile fields (employee number, name, email, department, status).
- Owning module: app/Models (core user)
- Primary key: id (big integer)
- Important columns: employee_number, first_name, middle_name, last_name, department_id (FK), status, email (unique), password, timestamps, soft deletes
- Foreign keys: department_id → departments.id (onDelete set null)
- Authoritative migration: backend/database/migrations/0001_01_01_000000_create_users_table.php
- Model: backend/app/Models/User.php

Roles

- Purpose: Role records for RBAC; roles attached to users via pivot role_user
- Owning module: core
- Primary key: id
- Important columns: name (unique), description, timestamps
- Pivot: role_user (role_id, user_id) implements many-to-many
- Authoritative migration: backend/database/migrations/2026_07_14_110001_create_roles_table.php and 2026_07_14_110003_create_role_user_table.php
- Model: backend/app/Models/Role.php

Assets

- Purpose: Durable property items tracked in the Asset module
- Owning module: backend/app/Modules/Asset
- Primary key: id
- Important columns: asset_number (unique), name, asset_category_id (FK), manufacturer_id, office_id (FK), location_id (FK), model, status, purchase_date, purchase_cost, timestamps, soft deletes
- Foreign keys: asset_category_id → asset_categories.id, office_id → offices.id, location_id → locations.id
- Authoritative migration: backend/database/migrations/2026_07_14_100004_create_assets_table.php
- Model: backend/app/Modules/Asset/Models/Asset.php

Asset identifiers

- Purpose: Store multiple identifiers for an asset (property number, barcode, etc.)
- Owning module: Asset
- Primary key: id
- Important columns: asset_id (FK), identifier_type, identifier_value (unique), is_primary (boolean)
- Foreign keys: asset_id → assets.id (cascade on delete)
- Authoritative migration: backend/database/migrations/2026_07_14_100005_create_asset_identifiers_table.php
- Model: backend/app/Modules/Asset/Models/AssetIdentifier.php

Inventory items

- Purpose: Consumable inventory items separate from assets
- Owning module: backend/app/Modules/Inventory
- Primary key: id
- Important columns: sku/code fields, name, classification, quantity, unit_id, supplier_id, timestamps, soft deletes
- Authoritative migrations: backend/database/migrations/2026_07_16_000004_create_inventory_items_table.php and subsequent inventory-related migrations
- Model: backend/app/Modules/Inventory/Models/InventoryItem.php

Borrowings

- Purpose: Track asset borrowings by user
- Owning module: backend/app/Modules/Borrowing
- Primary key: id
- Important columns: user_id (FK), asset_id (FK), borrow_date, due_date, status, returned_at, timestamps, soft deletes
- Foreign keys: user_id → users.id (cascade), asset_id → assets.id (cascade)
- Authoritative migration: backend/database/migrations/2026_07_16_000003_create_borrowings_table.php
- Model: backend/app/Modules/Borrowing/Models/Borrowing.php

Borrow extension requests

- Purpose: Store extension requests tied to a borrowing
- Important columns: borrowing_id (FK), current_due_date, requested_due_date, reason, status (pending/approved/rejected), reviewed_by (FK to users), reviewed_at
- Foreign keys: borrowing_id → borrowings.id (cascade), reviewed_by → users.id (null on delete)
- Authoritative migration: backend/database/migrations/2026_07_28_153837_create_borrow_extension_requests_table.php
- Model: backend/app/Modules/Borrowing/Models/BorrowExtensionRequest.php

QR scan histories

- Purpose: Record QR scan events performed by users against assets
- Important columns: asset_id (FK), user_id (nullable FK), action_performed, device, platform, ip_address, scanned_at, timestamps, soft deletes
- Foreign keys: asset_id → assets.id (cascade), user_id → users.id (null on delete)
- Authoritative migration: backend/database/migrations/2026_07_29_200000_create_qr_scan_histories_table.php
- Model: backend/app/Modules/QrScan/Models/QrScanHistory.php

Audit logs and histories

- Tables: audit_logs, asset_issuance_histories, maintenance_logs, stock_transactions, etc.
- Purpose: capture action history, issuance changes, maintenance events and stock movements
- Authoritative migrations: see backend/database/migrations/*create_audit_logs_table.php and other history-related migrations

Notes

This file is a summary — consult each migration referenced above for exact column types, constraints and indexes.
