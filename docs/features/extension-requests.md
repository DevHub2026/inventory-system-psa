# Extension Requests

## Overview

Extension requests allow borrowers to request extension of the due date for an active borrowing. The code implements an extension request lifecycle via the BorrowExtensionController and related service classes. The frontend surfaces extension creation and shows whether a borrowing has a pending extension via the borrowing list response field has_pending_extension.

## Purpose

Allow borrowers to request more time for a borrowed asset and allow authorized staff to approve or reject such requests while preserving audit and lifecycle history.

## Who Can Access It

- Authenticated borrowers can create extension requests for their borrowings (controller and service enforce ownership checks).
- Staff/administrators with roles permitted by the BorrowExtensionController/service can view, approve, or reject extension requests. Check route middleware and service.canManageExtensions for the exact role list.

## Where to Find It

- Frontend: borrowing UI components and frontend/src/services/borrowingService.ts (the borrowing list includes has_pending_extension in responses)
- Backend routes: backend/app/Modules/Borrowing/Routes/api.php
- Backend controllers: backend/app/Modules/Borrowing/Controllers/BorrowExtensionController.php
- Backend services: backend/app/Modules/Borrowing/Services/BorrowExtensionService.php

## Main Workflow

1. Borrower creates an extension request: POST /borrowings/{borrowing}/extensions (or similar route; see BorrowExtensionController route registration).
2. The extension request is persisted with status PENDING.
3. Authorized staff view pending requests and may approve or reject them via controller endpoints (e.g., POST /borrowings/extensions/{extension}/approve).
4. When approved, the service updates the borrowing record (due_date) as implemented by the approval handler. Approved and rejected requests are recorded and visible through API listing endpoints.
5. Borrowing listing uses withCount('pendingExtensionRequest') or equivalent to add has_pending_extension to each borrowing in the list responses.

## Available Statuses

Extension request statuses observed include: PENDING, APPROVED, REJECTED (use exact enum strings from BorrowExtension models/enums in backend when referencing API values).

## Role and Permission Behavior

- Creation: borrower ownership check enforced by service/controller
- Management: service.canManageExtensions and route middleware control which staff roles can approve/reject
- Backend is authoritative for all permission checks; frontend only surfaces UI controls accordingly.

## Effects on Borrowing

- On approval, the service updates the borrowing due_date and records the approval event in history/audit logs (see service implementation).
- Rejection leaves the borrowing due_date unchanged.

## Validation and Restrictions

- Extension requests are validated by request classes — e.g., ensure requested_due_date is after current due_date and within allowed limits. See BorrowExtension request validation logic.

## Related Features

- Borrowing listing shows has_pending_extension — used by frontend to display extension indicators.
- Notifications: approval/rejection triggers may generate notifications (check BorrowExtensionService for notification calls).

## Technical Notes

- Source files: BorrowExtensionController and BorrowExtensionService in backend/app/Modules/Borrowing
- Frontend field: has_pending_extension is returned by BorrowingController transform() and consumed by frontend/src/services/borrowingService.ts

## Source-of-Truth References
- [Borrowing routes](/C:/Users/salva/Downloads/PSA_DOCS/INVENTORY_SYSTEM/backend/app/Modules/Borrowing/Routes/api.php)
- [BorrowExtensionController](/C:/Users/salva/Downloads/PSA_DOCS/INVENTORY_SYSTEM/backend/app/Modules/Borrowing/Controllers/BorrowExtensionController.php)
- [BorrowExtensionService](/C:/Users/salva/Downloads/PSA_DOCS/INVENTORY_SYSTEM/backend/app/Modules/Borrowing/Services/BorrowExtensionService.php)
- [borrowingService](/C:/Users/salva/Downloads/PSA_DOCS/INVENTORY_SYSTEM/frontend/src/services/borrowingService.ts)
