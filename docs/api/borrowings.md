# Borrowings API

Base path prefix: /api/v1

Primary routes (backend/app/Modules/Borrowing/Routes/api.php)

GET /api/v1/borrowings
- Purpose: List borrowings (paginated). Controller applies transform() to include computed fields (e.g., has_pending_extension).
- Authentication: Required
- Authorization: auth:sanctum; controller uses authorize('viewAny', Borrowing::class) where applicable
- Query params: search, filters (status, borrower, date ranges), pagination parameters (page, per_page)

POST /api/v1/borrowings
- Purpose: Create a borrowing record (checkout). Validated by request classes in the module.
- Authorization: create permission/policy

Request body (StoreBorrowingRequest):

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| asset_id | integer | required | FK to assets
| borrow_date | date | required | Borrowing start date
| due_date | date | required | Due date (after_or_equal: borrow_date)
| remarks | string | nullable | Remarks or purpose

POST /api/v1/assets/scan
- Purpose: Resolve an identifier to an asset or active borrowing in borrowing flows
- Request: query param value or POST body value

Request example for creating a borrowing:

{
  "asset_id": 123,
  "borrow_date": "2026-08-20",
  "due_date": "2026-09-20",
  "remarks": "Field use"
}

Source of truth:
- backend/app/Modules/Borrowing/Requests/StoreBorrowingRequest.php
- backend/app/Modules/Borrowing/Controllers/BorrowingController.php

POST /api/v1/assets/scan
- Purpose: QR/identifier scan used by borrowing flows to resolve an asset or active borrowing — implemented on BorrowingController::scan
- Authentication: Required
- Behavior: resolves to an existing borrowing or asset and returns appropriate response to client

POST /api/v1/borrowings/{borrowing}/return
- Purpose: Record return of a borrowed asset
- Authorization: controller/policy will validate action

POST /api/v1/assets/request-borrow
- Purpose: Employee QR scan flow to request borrow — creates a PENDING reservation (controller comment notes this creates a reservation, not an immediate borrowing)
- Request body: identifier or asset info as implemented in BorrowingController::requestBorrow

Extension requests (borrowings)
- GET /api/v1/borrowings/{borrowing}/extension-requests — list extensions for a borrowing
- POST /api/v1/borrowings/{borrowing}/extension-requests — create an extension request (borrower)
- GET /api/v1/extension-requests — (staff) list all extension requests (role-restricted)
- PATCH /api/v1/extension-requests/{extensionRequest}/approve — approve (role-restricted)
- PATCH /api/v1/extension-requests/{extensionRequest}/reject — reject (role-restricted)
- GET /api/v1/extension-requests/pending-count — returns pending count for current user context

Source of truth
- backend/app/Modules/Borrowing/Routes/api.php
- backend/app/Modules/Borrowing/Controllers/BorrowingController.php
- backend/app/Modules/Borrowing/Controllers/BorrowExtensionController.php
- backend/app/Modules/Borrowing/Requests/*
