# Database Architecture (high-level)

This document summarises the database architecture as derived from migrations and models in the repository.

Technology and migrations

- The project uses relational database(s) managed via Laravel migrations in backend/database/migrations.
- The repository supports SQLite for local testing and PostgreSQL in production (see backend/.env.example and composer.json hints).
- Migrations version and structure are authoritative for table definitions.

Major domain entities (representative)

- users — application users, roles and accessibility preferences are persisted on / related to this table
- roles / permissions — RBAC data (roles table, permissions table)
- assets — durable items tracked as Asset model (backend/app/Modules/Asset/Models)
- inventory_items — inventory / SKU-managed items (Inventory module)
- asset_identifiers — identifier records for assets (serial numbers / QR identifiers)
- borrowings — borrowing transactions with fields such as borrow_date, due_date, returned_at and status
- reservations — reservation records for requested borrowings (start_date, end_date, status)
- extension_requests (or extension_requests table) — borrow extension requests (requested_due_date, status, reason)
- qr_scans / qr_history — scan actions and history
- reports / audit_logs — audit trail and report tables where applicable

Relationships and important associations (verified)

- InventoryItem may be linked to an Asset via asset_id — Inventory is the authoritative manager of many procurement/identifier fields and synchronizes to Asset and AssetIdentifier records.
- Asset has many AssetIdentifier records (asset_identifiers) for property numbers, serial numbers and QR identifier values.
- Borrowing references Asset (asset_id) and user (borrower) and tracks lifecycle fields (status constant strings such as BORROWED/ACTIVE/OVERDUE/RETURNED).
- Reservation relates to assets via reservation_items pivot and has statuses (PENDING, APPROVED, REJECTED, CANCELLED, EXPIRED).
- ExtensionRequests reference borrowings and store requested_due_date, reason and status (PENDING/APPROVED/REJECTED).

JSON / structured fields

- Some user preferences (accessibility) may be persisted as JSON or structured columns; see users table migration and AuthController::updateAccessibilityPreferences for the exact storage field.

Verified gaps or ambiguities

- This document is intentionally high-level. Exact column lists and FK constraints should be taken from the migrations and model relationships for complete schema documentation.
- If a complete ER diagram is required, generate it from migrations or run schema introspection to ensure no FK or constraint is omitted.

Source of truth

- backend/database/migrations/
- backend/app/Models/*
- backend/app/Modules/*/Models/*
