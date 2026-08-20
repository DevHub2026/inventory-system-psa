# Audit and History Schema (implementation-backed)

This document explains the audit and history-related tables found in the migrations.

Audit logs

- Migration: backend/database/migrations/2026_07_16_050943_create_audit_logs_table.php
- Purpose: general-purpose audit log for application events (who, what, when, details). Consult the migration for exact columns.
- Behavior: The codebase may insert audit entries via service classes; audit logs are append-style records.

Asset issuance histories

- Migration: backend/database/migrations/2026_07_29_090000_create_asset_issuance_histories_table.php
- Purpose: track issuance/reissuance events for assets with references to issuing user and receiving user, issuance type and timestamps.

Maintenance and damage logs

- Migrations exist for maintenance_requests and maintenance_logs (2026_07_15_051508_create_maintenances_table.php and 2026_07_20_130016_create_maintenance_logs_table.php) and damage_reports; they persist event history for maintenance lifecycle.

Stock transactions and count histories

- stock_transactions (create_stock_transactions_table.php) records movements (stock-in, stock-out, transfer) with references to inventory items, quantity, source/destination and transaction metadata.
- Inventory count tables (create_inventory_count_tables.php) store count session definitions and per-item counts for reconciliation.

Soft deletes and append-only patterns

- Many history tables use timestamps with softDeletes where relevant. Some tables are append-only style (audit_logs, asset_issuance_histories) where entries are not expected to be edited.

Source references

- backend/database/migrations/2026_07_16_050943_create_audit_logs_table.php
- backend/database/migrations/2026_07_29_090000_create_asset_issuance_histories_table.php
- backend/database/migrations/2026_07_20_130014_create_stock_transactions_table.php
- backend/database/migrations/2026_07_20_130016_create_maintenance_logs_table.php
- backend/database/migrations/2026_08_16_201000_create_inventory_count_tables.php

Notes

- The precise retention and archival policy is not represented in the migrations; retention is a deployment/ops concern and is Not Confirmed by repository code.
