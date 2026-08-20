# Migrations (implementation-backed)

This document explains how migrations are organized and how to inspect them. Migrations are the authoritative source for schema.

Organization

- All migrations live under: backend/database/migrations/
- Filenames include timestamps and descriptive names. Many migrations are grouped by module (asset, inventory, borrowing) and by purpose (create, add_fields, link tables).

Common tasks (safe guidance)

- Inspect migration status (read-only): `php artisan migrate:status`
- Run pending migrations (destructive to data if run against a production DB): `php artisan migrate` — *do not run against production without backup and approvals.*
- Rollback last batch: `php artisan migrate:rollback` (may be destructive)

Safety note

- Do not run destructive commands (migrate:fresh, migrate:reset, db:wipe) against a live database unless you intentionally want to destroy data.

How migrations map to domain

- Look for domain prefixes in filenames and recent timestamps. Example:
  - Asset: create_assets_table.php, create_asset_identifiers_table.php, add_property_number_to_assets_table.php
  - Inventory: create_inventory_items_table.php, create_stock_transactions_table.php, create_inventory_count_tables.php
  - Borrowing: create_borrowings_table.php, create_borrowing_items_table.php, create_borrow_extension_requests_table.php
  - Auth/session: create_personal_access_tokens_table.php, create_user_sessions_table.php

Authoritative references

- backend/database/migrations/
- When documenting or migrating data, extract column definitions directly from migration files and cross-check them with corresponding Eloquent model properties and casts.
