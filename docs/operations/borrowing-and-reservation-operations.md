# Borrowing & Reservation Operations (implementation-backed)

Overview

This section documents the implemented borrowing and reservation lifecycles, including extension requests and scheduled reminders.

Implemented workflows (verified)

- Borrowing requests, approval, and returns
  - Implemented under Modules/Borrowing (controllers, services, models). Borrowings have lifecycle status (borrowed, returned, overdue, etc.).
  - Authorization enforced in controllers and services with role checks and policies (see BorrowingService and related controllers).

- Extension requests
  - borrow_extension_requests table and BorrowExtensionService exist; requests have status pending/approved/rejected and are related to borrowings. See backend/database/migrations/2026_07_28_153837_create_borrow_extension_requests_table.php and Modules/Borrowing/Services/BorrowExtensionService.php.
  - has_pending_extension behavior is exposed on borrowing list responses in services/controllers.

- Overdue handling and reminders
  - Scheduled command borrowings:send-overdue-reminders (backend/app/Console/Commands/SendOverdueBorrowingReminders.php) checks overdue borrowings and enqueues email notifications via OverdueBorrowingReminder notification (implements ShouldQueue).
  - Operational note: requires scheduled task runner and a queue worker.

- Reservations
  - Reservation module implements creation, approval/rejection, and release flows (Modules/Reservation controllers and services). Authorization enforced by policies and UserRole checks.

Operational cautions

- Extension approvals and status transitions are maintained by services — do not manually change borrowing due_date outside the approval flow unless you understand auditing implications.
- Email reminders are queued; ensure queue processing is operating reliably to deliver reminders.

Source-of-truth files

- backend/database/migrations/2026_07_28_153837_create_borrow_extension_requests_table.php
- backend/app/Modules/Borrowing/Services/BorrowingService.php
- backend/app/Modules/Borrowing/Services/BorrowExtensionService.php
- backend/app/Console/Commands/SendOverdueBorrowingReminders.php
- backend/app/Notifications/OverdueBorrowingReminder.php
- backend/app/Modules/Reservation/
