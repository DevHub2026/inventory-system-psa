# Extension Requests API

Base path prefix: /api/v1

Routes (borrowings module)

GET /api/v1/borrowings/{borrowing}/extension-requests
- Purpose: List extension requests for a specific borrowing
- Authentication: Required
- Authorization: owner or manager as enforced by controller/service

POST /api/v1/borrowings/{borrowing}/extension-requests
- Purpose: Create an extension request for a borrowing (PENDING)
- Request body: validated by BorrowExtension request class (requested_due_date, reason)
- Authentication: Required
- Authorization: typically borrower ownership enforced in service

Request body (StoreExtensionRequest):

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| requested_due_date | date | required | New requested due date (must be after current due_date)
| reason | string | required | Reason for extension (max 1000 chars)

Validation notes:
- StoreExtensionRequest adds an after-validation hook to ensure the borrowing is in status 'BORROWED' and not already returned; otherwise the request is rejected.

Source of truth:
- backend/app/Modules/Borrowing/Requests/StoreExtensionRequest.php
- backend/app/Modules/Borrowing/Controllers/BorrowExtensionController.php
- backend/app/Modules/Borrowing/Services/BorrowExtensionService.php

GET /api/v1/extension-requests
- Purpose: Staff paginated list of extension requests (role-restricted)
- Middleware: role:Super Administrator,System Administrator,Property Custodian,Inventory Officer,Department Head

PATCH /api/v1/extension-requests/{extensionRequest}/approve
- Purpose: Approve an extension request — service updates borrowing due_date and records approval
- Authorization: role-restricted as above

PATCH /api/v1/extension-requests/{extensionRequest}/reject
- Purpose: Reject an extension request

GET /api/v1/extension-requests/pending-count
- Purpose: Return count of pending extension requests for the current context

Source of truth
- backend/app/Modules/Borrowing/Routes/api.php
- backend/app/Modules/Borrowing/Controllers/BorrowExtensionController.php
- backend/app/Modules/Borrowing/Services/BorrowExtensionService.php
- backend/app/Modules/Borrowing/Requests/*
