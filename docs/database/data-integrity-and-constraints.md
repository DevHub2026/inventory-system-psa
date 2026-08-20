# Data Integrity and Constraints (implementation-backed)

This document summarizes database-level integrity mechanisms observed in migrations and the parts enforced in application code.

Database-enforced integrity (from migrations)

- Foreign keys with cascade/null rules
  - Example: users.department_id → departments.id (onDelete set null)
  - role_user pivot: role_id, user_id constrained with onDelete cascade
  - borrowings.user_id and borrowings.asset_id constrained with cascade on delete
  - asset_identifiers.asset_id constrained with cascade on delete
  - Many other FKs across migrations enforce referential integrity.

- Unique constraints and indexes
  - assets.asset_number is unique
  - asset_identifiers.identifier_value is unique
  - roles.name unique
  - users.email unique
  - Many indexes for performance (status, foreign keys, timestamps)

- Soft deletes
  - Many domain tables use `$table->softDeletes()` (users, assets, borrowings, qr_scan_histories, etc.) which enable application-level soft deletion via Eloquent.

- Column defaults
  - Many migrations set sensible defaults (e.g., borrowings.status default 'BORROWED', borrow_extension_requests.status default 'pending').

Application-enforced integrity

- Validation and request-level enforcement: FormRequest classes validate incoming data shapes and allowed values (backend/app/Modules/*/Requests/*). This prevents invalid state from being written to the DB.

- Business rules executed in services: e.g., extension approval updates borrowing.due_date and records reviewer; InventoryService may synchronize inventory->asset identifiers on track-as-asset operations.

- Authorization checks: Policies and middleware prevent unauthorized modifications that could corrupt domain state.

Constraints not enforced at DB level (application-level only)

- Some higher-level semantics (e.g., unique business rules across related entities, multi-record invariants) are enforced by service logic rather than DB constraints. Examples include complex procurement synchronization between inventory and assets and workflow approval requirements.

Recommended checks before DB changes

- When altering constraints or adding FK cascading, review service logic and existing data in production to ensure migration does not violate implicit assumptions.

Source references

- backend/database/migrations/
- backend/app/Modules/*/Requests/
- backend/app/Modules/*/Services/

Notes

- This documentation reflects the state of migrations in the repository. If you need a full index of all foreign keys and indexes, a follow-up extraction script can be run to list them programmatically.
