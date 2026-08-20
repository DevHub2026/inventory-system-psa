# Request & Data Flow Examples

This document gives concrete end-to-end request examples and explains how data flows through the stack for representative operations.

Authentication (Login)

Flow:

Frontend (Auth form) → frontend/src/services/api.ts → POST /api/v1/login
→ backend App\Modules\Auth\Controllers\AuthController::login
→ FormRequest (LoginRequest) validates email/password
→ AuthController authenticates (Sanctum/session creation)
→ Success response contains token/session info and user data
→ Frontend stores token and updates AuthProvider state

Source of truth:
- backend/routes/api.php (login route)
- backend/app/Modules/Auth/Requests/LoginRequest.php
- backend/app/Modules/Auth/Controllers/AuthController.php
- frontend/src/services/api.ts

Inventory update (create inventory item)

Flow:

Frontend Inventory edit form → inventoryService.post('/inventory', payload)
→ backend route POST /api/v1/inventory (backend/app/Modules/Inventory/Routes/api.php)
→ InventoryController::store receives request
→ StoreInventoryItemRequest validates fields and enforces authorization (policy-based in authorize())
→ InventoryService or InventoryController persists inventory item and optionally creates a linked Asset
→ Controller returns JSON success wrapper with resource data

Special notes:
- InventoryRequest documents field ownership: inventory-owned vs asset-owned fields. InventoryService synchronizes identifiers and procurement fields into Asset and AssetIdentifier records on create/update.
- Some fields are prohibited for cross-writing (see StoreInventoryItemRequest and UpdateAssetRequest comments).

Source of truth:
- backend/app/Modules/Inventory/Requests/StoreInventoryItemRequest.php
- backend/app/Modules/Inventory/Controllers/InventoryController.php
- backend/app/Modules/Inventory/Services/*

Asset scan → borrowing flow (representative)

Flow:

Frontend scanner captures identifier and calls qrService.resolveQr(identifier) or borrowingService.post('/assets/scan', { value })
→ BorrowingController::scan or QrScanController::resolve resolves the identifier to either an Asset or an active Borrowing record
→ If result is an active borrowing, controller returns borrowing resource; if asset, controller returns AssetResource
→ Frontend navigates to appropriate page (borrowing details or asset borrow flow) based on server response

Source of truth:
- backend/app/Modules/Borrowing/Controllers/BorrowingController.php (scan)
- backend/app/Modules/QrScan/Controllers/QrScanController.php
- frontend/src/services/qrService.ts

Borrowing creation vs request-borrow behavior

- Regular borrowing creation: POST /api/v1/borrowings with StoreBorrowingRequest (asset_id, borrow_date, due_date). This creates a borrowing transaction (checkout) when authorized.

- request-borrow endpoint: POST /api/v1/assets/request-borrow (BorrowingController::requestBorrow) — documented in code as "Employee QR scan to create a borrow request (PENDING reservation)". The implementation creates a PENDING reservation rather than immediately creating a borrowing transaction. This is important: the asset request flow differs from direct borrowing.

Source of truth:
- backend/app/Modules/Borrowing/Routes/api.php
- backend/app/Modules/Borrowing/Controllers/BorrowingController.php
- backend/app/Modules/Borrowing/Requests/StoreBorrowingRequest.php

Accessibility preference change

Flow:

Frontend updates preference → PUT /api/v1/me/accessibility-preferences
→ AuthController::updateAccessibilityPreferences validates and persists per-user preference (likely on users table or related JSON field)
→ Frontend updates local state and persists changes to server

Source of truth:
- backend/routes/api.php (route registration)
- backend/app/Modules/Auth/Controllers/AuthController.php (updateAccessibilityPreferences)

FAQ read flow

Flow:

GET /api/v1/faqs → FaqController::index → returns FAQs persisted on server (single source-of-truth) → Frontend lists items. Administrative CRUD endpoints for FAQs are role-restricted.

Source of truth:
- backend/routes/api.php (faqs routes)
- backend/app/Modules/Faq/Controllers/FaqController.php

General notes

- Controllers often return standardized JSON via RespondsWithJson — search for the trait usage in backend/app/Modules to see the response pattern.
- FormRequest classes frequently contain both rules() and prepareForValidation() and sometimes implement authorize() to embed policy checks early in the flow.
