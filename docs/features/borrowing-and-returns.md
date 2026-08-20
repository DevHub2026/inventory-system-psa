# Borrowing and Returns

## Overview

Borrowing is implemented by the Borrowing module. It supports listing borrowings, creating borrowing requests (employee request flow), scanning, returning, and extension-requests (see extension-requests.md). Borrowing endpoints are implemented in backend/app/Modules/Borrowing with controllers such as BorrowingController and BorrowExtensionController.

## Purpose

Manage the lifecycle of borrowed assets: create borrowings (or employee requests), record asset checkout, track due dates, process returns, and manage extension requests.

## Who Can Access It

Borrowing routes are protected by auth:sanctum. Specific actions may be further restricted by roles via middleware or policies. The routes are declared under backend/app/Modules/Borrowing/Routes/api.php.

## Where to Find It

- Frontend pages: frontend/src/pages/BorrowingPage.tsx, frontend/src/pages/BorrowedItemsPage.tsx, frontend/src/pages/BorrowingDetailsPage.tsx
- Frontend service: frontend/src/services/borrowingService.ts
- Backend routes: backend/app/Modules/Borrowing/Routes/api.php
- Backend controllers: backend/app/Modules/Borrowing/Controllers/BorrowingController.php and BorrowExtensionController.php

## Main Workflow

1. Listing borrowings: GET /borrowings — BorrowingController@index returns paginated borrowings. The transform() method on the controller shapes the API response and includes fields like has_pending_extension when present.
2. Creating a borrow/request: POST /borrowings (controller handles creation). There is also a request-borrowing flow used by QR/asset pages that may create a PENDING reservation rather than an immediate borrowing; check BorrowingController::requestBorrow comments.
3. Scan workflow: scan endpoints map QR identifiers to active borrowings or assets. BorrowingController::scan delegates to service logic that either returns active borrowing info or directs the client to the appropriate next action.
4. Returning: POST /borrowings/{id}/return (handled by BorrowingController) updates borrowing status and records return events.
5. Extension requests: A dedicated BorrowExtensionController allows borrowers to create extension requests and managers to approve/reject (see extension-requests.md).

## Available Actions

- List, view, create, and return borrowings
- Scan to resolve borrowings or assets and continue workflows
- Create extension requests and view their status (frontend surfaces has_pending_extension on listing responses)

## Role and Permission Behavior

- Borrowing module uses auth:sanctum globally; some actions require specific roles or policy checks. The controller and service classes enforce these checks.
- Frontend may show/hide action buttons based on role, but server enforces authorization.

## Status or Lifecycle

Borrowing statuses are defined on the model and referenced in the controller. Typical statuses include: pending (for requests/reservations), active/borrowed, returned, overdue — use exact strings from the Borrowing model and controller transform() when documenting UI labels.

## Validation and Restrictions

- Request validation is implemented via request classes used by controllers. Due date, borrower, and asset availability are validated serverside.
- A request-borrow endpoint (used by QR/asset flows) may create a PENDING reservation instead of an immediate borrowing.

## Related Features

- Extension Requests (see extension-requests.md) provide request/approval workflow for changing due_date.
- QR Scanning integrates with borrowing flows for quick asset identification.
- Reports include borrowing and overdue reports.

## Technical Notes

- Borrowing listing includes additional computed fields (e.g., has_pending_extension) added by the service/controller and returned in the transform() output consumed by the frontend.
- Source files:
  - [Borrowing routes](/C:/Users/salva/Downloads/PSA_DOCS/INVENTORY_SYSTEM/backend/app/Modules/Borrowing/Routes/api.php)
  - [BorrowingController](/C:/Users/salva/Downloads/PSA_DOCS/INVENTORY_SYSTEM/backend/app/Modules/Borrowing/Controllers/BorrowingController.php)
  - [BorrowingPage](/C:/Users/salva/Downloads/PSA_DOCS/INVENTORY_SYSTEM/frontend/src/pages/BorrowingPage.tsx)
  - [borrowingService](/C:/Users/salva/Downloads/PSA_DOCS/INVENTORY_SYSTEM/frontend/src/services/borrowingService.ts)

## Source-of-Truth References
- Borrowing routes: backend/app/Modules/Borrowing/Routes/api.php
- BorrowingController: backend/app/Modules/Borrowing/Controllers/BorrowingController.php
- BorrowExtensionController: backend/app/Modules/Borrowing/Controllers/BorrowExtensionController.php
- Frontend pages and service: frontend/src/pages/* and frontend/src/services/borrowingService.ts
