# Borrowing and Reservation Schema (implementation-backed)

This document summarizes the persisted schema for borrowings, borrowing items, reservations, and extension requests.

Borrowings

- Migration: backend/database/migrations/2026_07_16_000003_create_borrowings_table.php
- Primary key: id
- Important columns: user_id (FK to users), asset_id (FK to assets), borrow_date, due_date, status (default 'BORROWED'), returned_at (timestamp), timestamps, softDeletes
- Model: backend/app/Modules/Borrowing/Models/Borrowing.php
- Remarks: Borrowings reference a single asset and a borrower user. Borrowing items table also exists (see borrowing_items migration) for multi-item borrowings (migration: 2026_07_20_130009_create_borrowing_items_table.php)

Borrowing items

- Migration: backend/database/migrations/2026_07_20_130009_create_borrowing_items_table.php
- Purpose: support borrowings that include multiple inventory items or assets; includes borrowing_id FK

Reservations

- Migration: backend/database/migrations/2026_07_16_000002_create_reservations_tables.php
- Purpose: store reservation requests for future asset use; reservations may be linked to borrowings when fulfilled (there is a migration linking borrowings to fulfilled reservation items: 2026_07_22_000000_link_borrowings_to_fulfilled_reservation_items.php)

Borrow extension requests

- Migration: backend/database/migrations/2026_07_28_153837_create_borrow_extension_requests_table.php
- Columns: borrowing_id (FK), current_due_date, requested_due_date, reason, status (pending/approved/rejected), reviewed_by (nullable FK to users), reviewed_at, remarks, timestamps
- Behavior: Service/controller logic enforces that only PENDING extension requests count as pending; on approval the service updates borrowing.due_date. The schema records reviewer and review time.

Approvals / workflow

- The repository includes workflow tables and fields (migrations: create_workflows_tables.php and add_workflow_fields_to_request_tables.php) that integrate approvals and request metadata for module-level requests, including reservations and extension requests.

Relationships and notes

- Reservations and borrowings are linked when a reservation is fulfilled to create a borrowing. The linking migration adds references to indicate fulfillment.
- Extension requests are explicitly tied to a borrowing via borrowing_id with an FK and an index on [borrowing_id, status] for efficient pending-count queries.

Source references

- backend/database/migrations/2026_07_16_000002_create_reservations_tables.php
- backend/database/migrations/2026_07_16_000003_create_borrowings_table.php
- backend/database/migrations/2026_07_20_130009_create_borrowing_items_table.php
- backend/database/migrations/2026_07_28_153837_create_borrow_extension_requests_table.php
- backend/database/migrations/2026_07_22_000000_link_borrowings_to_fulfilled_reservation_items.php
- backend/app/Modules/Borrowing/Models/Borrowing.php
- backend/app/Modules/Borrowing/Models/BorrowExtensionRequest.php

Caveat

- The application logic (services/controllers) is authoritative for lifecycle transitions (e.g., turning a reservation into a borrowing or approving an extension). The database records the state and relationships but the semantics of transitions are enforced by service code.
