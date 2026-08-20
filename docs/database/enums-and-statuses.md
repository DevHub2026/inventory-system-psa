# Enums and Statuses (implementation-backed)

This file extracts canonical enum values and status strings from repository enums and migrations.

Guidelines

- The values listed below are the actual stored/database values (as seen in migrations or enums). Use these exact strings when filtering or querying the API or DB.

Verified enums / statuses

- User status
  - Migration default: 'active' (see backend/database/migrations/0001_01_01_000000_create_users_table.php)
  - Enum file (if present): backend/app/Enums/UserStatus.php (refer to the file for canonical values)

- Borrowing status
  - Stored strings in migrations: default 'BORROWED' in borrowings table migration (backend/database/migrations/2026_07_16_000003_create_borrowings_table.php)
  - Other states used in code: RETURNED, OVERDUE, PENDING (refer to Borrowing model and controller logic)

- Extension request status (borrow_extension_requests)
  - Stored values (migration default): 'pending' with allowed values observed as pending, approved, rejected. See backend/database/migrations/2026_07_28_153837_create_borrow_extension_requests_table.php and backend/app/Modules/Borrowing/Enums/ExtensionRequestStatus.php

- Reservation status
  - See backend/app/Enums/ReservationStatus.php and reservation migrations; statuses include pending, approved, rejected, cancelled, expired (use exact enum file values)

- Asset status
  - Stored as string in assets.status (see backend/database/migrations/2026_07_14_100004_create_assets_table.php)
  - Canonical values are defined in asset module enums if present (backend/app/Modules/Asset/Enums or backend/app/Enums)

- Inventory classification / item type
  - Migrations add classification column (see 2026_07_30_160600_add_classification_to_inventory_items_table.php) — values and allowed classifications are validated in request classes and domain enums.

How to verify exact values

- For any domain where exact status strings are critical (filters, report queries), consult the corresponding enum class in the codebase, or the migration where the column default was set, and the request validation that may restrict allowed values.

Source references

- backend/database/migrations/*
- backend/app/Enums/
- backend/app/Modules/*/Enums/
- backend/app/Modules/*/Requests/* (FormRequests often list allowed values)

Notes

- This file intentionally avoids listing every enum case; it provides guidance and points to authoritative source files where exact values are defined. Use repository enum files and migration defaults as the source of truth.
