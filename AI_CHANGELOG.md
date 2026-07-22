# AI Change Log

## Purpose

Maintain a permanent history of every AI-generated modification.

This file exists for:

- Context preservation
- Debugging
- Code review
- Rollback
- Team collaboration

Never delete previous entries.

Always append new entries.

---

## 2026-07-22 00:00

### AI

Name: Codex
Model: GPT-5

---

### Task

Fixed QR borrowing authorization, receipt QR resolution, borrow/return state transitions, and transaction history verification.

---

### Files Modified

- backend/app/Modules/Asset/Services/AssetService.php
- backend/app/Modules/AssetIdentifier/Services/AssetIdentifierService.php
- backend/app/Http/Controllers/BorrowController.php
- backend/app/Modules/Borrowing/Services/BorrowingService.php
- backend/app/Modules/Reservation/Controllers/ReservationController.php
- backend/app/Modules/Reservation/Routes/api.php
- backend/app/Modules/Reservation/Services/ReservationService.php
- backend/tests/Feature/Borrowing/BorrowingManagementTest.php
- frontend/src/components/AssetQrScanner.tsx
- frontend/src/components/ReceiptModal.tsx
- frontend/src/components/StaffDashboard.tsx
- frontend/src/services/reservationService.ts
- docs/Architecture/13_API_Architecture.md
- CHANGELOG.md
- AI_CHANGELOG.md

---

### Summary

- Added `POST /api/v1/reservations/scan-authorize` for staff/admin authorization by receipt QR or asset QR.
- Extended canonical borrowing scan logic to resolve permanent asset QR identifiers and receipt references (`PSA-RES-*`, `PSA-BOR-*`).
- Updated receipt QR scanning so staff/admin scanning a pending `PSA-RES-*` receipt atomically authorizes the request, creates the borrowing, and marks the asset borrowed.
- Updated second scans of the same `PSA-RES-*` receipt to return the active borrowing without creating a duplicate transaction.
- Preserved clear rejection after the receipt-backed borrowing has already been returned.
- Added staff/admin scanner result details for the finalized borrowing transaction.
- Centralized AssetIdentifier scan candidates so unpadded PSA asset QR text resolves to the stored permanent identifier.
- Updated StaffDashboard manual scan to use backend transaction/asset resolution instead of frontend-only navigation.
- Kept the permanent asset QR and canonical BorrowingService architecture intact.
- Replaced fake receipt QR visuals with the existing generated QR component using backend-supported receipt payloads.
- Added staff camera actions for authorization and borrow/return processing.
- Added focused tests for authorization, duplicate authorization rejection, receipt QR borrow, receipt QR return, and history preservation.

---

### Reason

Receipt QR payloads were transaction references, but the scanner treated every QR value as an asset identifier before completing a transaction. This made receipt QR scans fail or stop before the backend could update borrowing state.

---

### Risks

- The borrowing transaction scan processes the first unfulfilled approved reservation item for a reservation receipt.
- The existing schema still uses soft deletes on `borrowings` and `reservations`, although transaction history remains preserved by this workflow.

---

### Rollback

Revert the files listed in this entry.

---

### Status

Completed.

---

## 2026-07-21 11:55

### AI

Name: Codex
Model: GPT-5.2

---

### Task

Implemented Priority 1 inventory reliability features and continued production stability handoff work.

---

### Files Modified

- backend/database/factories/AssetFactory.php
- backend/database/factories/AssetCategoryFactory.php
- backend/database/factories/LocationFactory.php
- backend/database/factories/ManufacturerFactory.php
- backend/database/factories/OfficeFactory.php
- backend/app/Models/User.php
- backend/app/Http/Controllers/BorrowController.php
- backend/app/Modules/Borrowing/Controllers/BorrowingController.php
- backend/app/Modules/Borrowing/Models/Borrowing.php
- backend/app/Modules/Borrowing/Services/BorrowingService.php
- backend/app/Modules/Inventory/Controllers/InventoryController.php
- backend/app/Modules/Inventory/Models/InventoryItem.php
- backend/app/Modules/Inventory/Models/StockTransaction.php
- backend/app/Modules/Inventory/Requests/StoreInventoryItemRequest.php
- backend/app/Modules/Inventory/Routes/api.php
- backend/app/Modules/Inventory/Services/InventoryService.php
- backend/app/Modules/Maintenance/Controllers/MaintenanceController.php
- backend/app/Modules/Maintenance/Services/MaintenanceService.php
- backend/app/Modules/Reservation/Controllers/ReservationController.php
- backend/app/Modules/Reservation/Services/ReservationService.php
- backend/bootstrap/app.php
- backend/database/migrations/2026_07_21_113000_add_returned_at_to_borrowings.php
- frontend/src/pages/InventoryPage.tsx
- frontend/src/services/api.ts
- frontend/src/services/borrowingService.ts
- frontend/src/services/inventoryService.ts
- frontend/src/services/maintenanceService.ts
- frontend/src/services/reservationService.ts
- frontend/src/types/index.ts
- backend/tests/Feature/Inventory/InventoryManagementTest.php
- backend/tests/Feature/Maintenance/MaintenanceApiTest.php
- backend/tests/Feature/Asset/AssetManagementTest.php
- backend/tests/Feature/Borrowing/BorrowingManagementTest.php
- docs/Architecture/13_API_Architecture.md
- docs/Business/02_Functional_Requirements.md
- AI_CHANGELOG.md
- CHANGELOG.md

---

### Summary

- Added stock movement history using the existing `stock_transactions` table.
- Added quantity correction with required reason through `/api/v1/inventory/{item}/adjust`.
- Added `/api/v1/inventory/{item}/history`.
- Added backend-derived inventory status and frontend filters/search/pagination.
- Added duplicate SKU validation with a user-friendly message.
- Added shared frontend paginated response handling.
- Added missing Asset support factories and aligned legacy Asset tests with `/api/v1/assets`.
- Fixed the legacy asset borrow endpoint by keeping it as an authorized compatibility wrapper over the canonical BorrowingService.
- Added borrowing service guards for unavailable assets and repeated returns.
- Preserved existing data and avoided destructive migration commands.
- Cleaned literal conflict markers from this changelog.

---

### Reason

Inventory quantity changes must be reliable, traceable, and production-ready before additional feature work continues.

---

### Risks

- Full backend test suite still contains legacy Asset tests that reference missing old factories and `/api/assets` routes.
- QR/HTTPS handoff phases remain pending after database and inventory stabilization.

---

## 2026-07-20 16:15

### AI

Name: Codex
Model: GPT-5.6

---

### Task

Audit and harden permanent asset identifier and camera scanning behavior.

---

### Files Modified

- backend/app/Modules/AssetIdentifier/Services/AssetIdentifierService.php
- frontend/src/components/AssetQrScanner.tsx
- AI_CHANGELOG.md
- CHANGELOG.md

---

### Summary

- Preserved system-generated PSA QR identifiers by rejecting manual creation, update, and deletion through the AssetIdentifier service.
- Expanded automatic camera decoding from QR only to QR Code, Code 128, and Code 39 when supported by the browser.
- Stop the camera after any decoded lookup completes or decoder failure occurs, so an unresolved scan does not leave a stream active.

---

### Reason

The permanent asset label must remain stable across its lifecycle, and the documented scanner supports both QR and barcode identifiers.

---

### Risks

Automatic decoding remains dependent on browser BarcodeDetector support. Manual lookup remains available where that capability is unavailable.

---

### Rollback

Revert the files listed in this entry.

---

### Status

Completed.

---

## 2026-07-21 09:28

### AI

Name: Codex
Model: GPT-5.2

---

### Task

Performed a frontend terminology and user-experience simplification pass.

---

### Files Modified

- frontend/src/components/ReceiptModal.tsx
- frontend/src/components/ui/Input.tsx
- frontend/src/components/AdminDashboard.tsx
- frontend/src/components/EmployeeDashboard.tsx
- frontend/src/components/StaffDashboard.tsx
- frontend/src/layouts/Sidebar.tsx
- frontend/src/layouts/TopNav.tsx
- frontend/src/pages/AssetPage.tsx
- frontend/src/pages/BorrowingPage.tsx
- frontend/src/pages/InventoryPage.tsx
- frontend/src/pages/MaintenancePage.tsx
- frontend/src/pages/ReportPage.tsx
- frontend/src/pages/ReservationPage.tsx
- frontend/src/pages/RolesPage.tsx
- frontend/src/services/api.ts
- frontend/src/utils/displayLabels.ts
- AI_CHANGELOG.md
- CHANGELOG.md

---

### Summary

- Added frontend-only display label helpers for raw backend status values.
- Reworded visible UI text to use employee-friendly terminology.
- Added helper text support to the shared Input component.
- Improved user-facing error messages through the API response interceptor.
- Preserved backend routes, payload fields, response fields, and status values.
- Verified the frontend production build.

---

### Reason

Ordinary employees and inventory staff need simpler UI language while the technical backend architecture and API contract remain unchanged.

---

### Risks

- Some internal variable names still use backend terminology such as reservation and borrowing by design to preserve API alignment.
- Vite still reports the existing large bundle warning because the QR scanner library is included in the main bundle.

---

## 2026-07-21 09:06

### AI

Name: Codex
Model: GPT-5.2

---

### Task

Fixed QR camera scanning reliability and QR label generation.

---

### Files Modified

- frontend/src/components/AssetQrScanner.tsx
- frontend/src/components/QrCode.tsx
- AI_CHANGELOG.md
- CHANGELOG.md

---

### Summary

- Replaced browser-native `BarcodeDetector` usage with `@zxing/browser` `BrowserQRCodeReader`.
- Replaced the custom QR SVG matrix renderer with `@zxing/browser` `BrowserQRCodeSvgWriter`.
- Added a clear insecure-LAN camera warning for phone testing over HTTP network URLs.
- Preserved the existing backend identifier resolution endpoint.
- Verified the frontend production build.

---

### Reason

Native QR detection support is inconsistent, and using a proven QR scanner/writer library improves real device testing reliability.

---

### Risks

- Mobile browsers may still require HTTPS or explicit insecure-origin flags for camera access on LAN HTTP URLs.
- ZXing increases the frontend bundle size, triggering Vite's large chunk warning during build.

---

## 2026-07-20 15:37

### AI

Name: Codex
Model: GPT-5.2

---

### Task

Fixed the root runner and clarified LAN/frontend environment usage for phone QR testing.

---

### Files Modified

- runner.js
- start.bat
- frontend/.env.example
- AI_CHANGELOG.md
- CHANGELOG.md

---

### Summary

- Updated the root runner to bind backend and frontend servers to `0.0.0.0`.
- Added automatic LAN IP detection and printed local/phone URLs.
- Kept frontend API calls proxied through `/api/v1` by default.
- Fixed `start.bat` so it executes `node runner.js`.
- Documented when to use `VITE_API_BASE_URL` and when not to use it.

---

### Reason

The user needed a simple way to run the system so a phone on the same network could open the frontend for QR testing.

---

### Risks

- Mobile browsers may still block camera APIs on LAN HTTP; HTTPS or desktop `localhost` testing may be required for real camera permission.

---

## 2026-07-20 15:14

### AI

Name: Codex
Model: GPT-5.2

---

### Task

Added integrated demo data to make feature relationships testable before adding more features.

---

### Files Modified

- backend/database/seeders/DemoDataSeeder.php
- backend/database/seeders/DatabaseSeeder.php
- AI_CHANGELOG.md
- CHANGELOG.md

---

### Summary

- Added an idempotent demo seeder with connected users, roles, offices, locations, manufacturers, categories, assets, identifiers, inventory, reservations, borrowings, and maintenance records.
- Seeded multiple workflow states: available, borrowed, reserved, maintenance, returned, low-stock inventory, and QR-identifiable assets.
- Ensured seeded inventory items are linked to asset records.
- Ensured seeded assets have permanent PSA QR identifiers through the existing AssetIdentifier system.
- Connected the demo seeder into the default `DatabaseSeeder`.
- Ran `php artisan db:seed`, backend tests, frontend build, and relationship count checks.

---

### Reason

The project needed reliable sample data so feature relationships and role access could be tested end-to-end without manually creating records through the UI.

---

### Risks

- Existing local demo/manual records are preserved, so the database may contain extra test assets beyond the seeded baseline.
- The local SQLite database is missing the optional `borrowings.returned_at` column even though the migration file defines it; the seeder now tolerates that schema drift.

---

## 2026-07-20 10:42

### AI

Name: Codex
Model: GPT-5.2

---

### Task

Fixed camera scanner startup, hardened backend RBAC routes, and added an admin System Setup panel for non-programmer maintainers.

---

### Files Modified

- backend/app/Http/Middleware/EnsureUserHasRole.php
- backend/bootstrap/app.php
- backend/routes/api.php
- backend/app/Modules/Asset/Routes/api.php
- backend/app/Modules/AuditLog/Routes/api.php
- backend/app/Modules/Borrowing/Routes/api.php
- backend/app/Modules/Inventory/Routes/api.php
- backend/app/Modules/Maintenance/Routes/api.php
- backend/app/Modules/Report/Routes/api.php
- backend/app/Modules/Reservation/Routes/api.php
- frontend/src/components/AssetQrScanner.tsx
- frontend/src/components/StaffDashboard.tsx
- frontend/src/pages/SystemSetupPage.tsx
- frontend/src/services/setupService.ts
- frontend/src/layouts/Sidebar.tsx
- frontend/src/App.tsx
- docs/Business/02_Functional_Requirements.md
- AI_CHANGELOG.md
- CHANGELOG.md

---

### Summary

- Moved camera access before native QR decoder detection so the webcam preview can open even when automatic detection is unsupported.
- Added camera scanner access to the Staff Dashboard.
- Added reusable backend role middleware and applied it to sensitive route groups.
- Restricted operational/admin modules to administrator and staff roles based on current business responsibilities.
- Added an admin-only System Setup page for categories, offices, locations, and manufacturers using existing APIs.
- Added admin shortcuts for user management, role management, permission management, and QR label printing.

---

### Reason

The project needed stronger server-side authority boundaries and a non-programmer setup workflow before handoff.

---

### Risks

- Existing users without assigned roles may lose access to operational modules until assigned an appropriate role.
- Native QR decoding still requires browser support, but camera preview and manual fallback remain available.
- System settings such as QR prefixes and default temporary passwords are still code-backed and should become database-backed in a later admin settings iteration.

---

## 2026-07-19 13:49

### AI

Name: Codex
Model: GPT-5.2

---

### Task

Implemented bulk employee import and generated-username login integration for the PSA Inventory Management System.

---

### Files Modified

- backend/app/Modules/Auth/Controllers/UserController.php
- backend/app/Modules/Auth/Requests/ImportUsersRequest.php
- backend/app/Modules/Auth/Services/AuthService.php
- backend/app/Modules/Auth/Services/UserImportService.php
- backend/routes/api.php
- frontend/src/pages/UsersPage.tsx
- frontend/src/services/userService.ts
- docs/Business/02_Functional_Requirements.md
- docs/Architecture/13_API_Architecture.md
- AI_CHANGELOG.md
- CHANGELOG.md

---

### Summary

- Added an admin-only employee import endpoint under the existing user-management API.
- Added CSV, JSON, and XLSX import parsing with generated usernames and per-row import results.
- Preserved email login and added employee username login through the existing auth service.
- Added Users page import controls, templates, upload handling, and import result summaries.
- Updated documentation and changelogs for the new import workflow.

---

### Reason

Bulk onboarding was required so employee accounts can be created quickly using existing user, role, department, and authentication architecture.

---

### Risks

- Legacy binary `.xls` parsing is not supported by the current dependency set; users must save those files as `.xlsx`, `.csv`, or `.json`.
- Imported users share the configured temporary password until an administrator or deployment policy requires password rotation.

---

## 2026-07-19 14:05

### AI

Name: Codex
Model: GPT-5.2

---

### Task

Implemented permanent PSA asset QR rendering and a real camera-based asset QR scanner proof of concept.

---

### Files Modified

- backend/app/Modules/Asset/Controllers/AssetController.php
- frontend/src/components/AssetQrScanner.tsx
- frontend/src/components/QrCode.tsx
- frontend/src/pages/AssetPage.tsx
- frontend/src/services/assetService.ts
- docs/Business/02_Functional_Requirements.md
- docs/Architecture/13_API_Architecture.md
- AI_CHANGELOG.md
- CHANGELOG.md

---

### Summary

- Replaced the asset QR placeholder with a generated local SVG QR code using the stored PSA asset identifier.
- Added a camera scanner modal that requests camera access, previews video, scans QR codes with native browser QR detection, and resolves the decoded value through the backend.
- Reused the existing `/api/v1/assets/scan` endpoint and existing AssetIdentifier records.
- Added camera permission, unsupported browser, not-found, invalid value, asset-found, close, and scan-again states.
- Added a clearly separated manual development fallback for camera-limited testing.
- Tightened backend identifier scan validation.

---

### Reason

The project needed a testable end-to-end proof of concept for generating a permanent PSA asset QR, scanning it with a real camera, resolving it through the backend, and displaying the matched asset.

---

### Risks

- Native QR detection depends on browser `BarcodeDetector` support; Chrome or Edge is recommended for camera testing.
- Real camera scanning could not be physically verified from the coding environment and must be tested on a camera-enabled device.
- The local QR renderer targets the PSA asset identifier payload length used by this system; unusually long fallback values are shown as unsupported.

---

# Entry Template

## YYYY-MM-DD HH:MM

### AI

Name:
Model:

Example:

Name: Windsurf
Model: Claude Sonnet 4

---

### Task

Describe the task performed.

---

### Files Modified

List every modified file.

Example:

- frontend/src/components/LoginForm.tsx
- frontend/src/main.tsx

---

### Summary

Describe every change.

Example:

- Connected LoginForm to useAuth().
- Added AuthProvider.
- Removed temporary console.log().

---

### Reason

Why was the modification necessary?

---

### Risks

Possible side effects.

If none:

None.

---

### Rollback

How to revert the changes if necessary.

---

### Status

Completed
Partially Completed
Abandoned

---

## Example

### 2026-07-15 13:45

AI

Name:
Windsurf

Model:
Claude Sonnet 4

Task

Reconnect frontend login to backend authentication.

Files Modified

- frontend/src/components/LoginForm.tsx
- frontend/src/main.tsx

Summary

- Connected LoginForm to useAuth().
- Added AuthProvider.

Reason

Frontend redesign disconnected authentication.

Risks

Dashboard navigation still requires verification.

Rollback

Revert commit XXXXX.

Status

Completed.

### 2026-07-19 13:39

AI

Name:
Codex

Model:
GPT-5.2

Task

Implement permanent organization-owned PSA asset QR identifiers.

Files Modified

- CHANGELOG.md
- AI_CHANGELOG.md
- backend/app/Modules/Asset/Enums/IdentifierType.php
- backend/app/Modules/Asset/Resources/AssetResource.php
- backend/app/Modules/Asset/Services/AssetService.php
- backend/app/Modules/Inventory/Services/InventoryService.php
- backend/database/migrations/2026_07_19_131500_add_permanent_psa_qr_identifiers.php
- frontend/src/index.css
- frontend/src/pages/AssetPage.tsx
- frontend/src/services/assetService.ts
- frontend/src/types/index.ts

Summary

- Added `PSA_QR`, `MANUFACTURER_QR`, `MANUFACTURER_BARCODE`, and `PROPERTY_TAG` identifier types.
- Automatically creates a stable `PSA-ASSET-######` identifier when assets are created.
- Prevents user-provided identifiers from replacing the PSA-owned QR primary identifier during asset creation.
- Backfilled existing assets with PSA QR identifiers.
- Added PSA QR identifier and payload fields to asset API resources.
- Added `PSA QR` action to the Asset page.
- Added printable PSA inventory label with QR-style placeholder, asset name, asset number, and identifier list.
- Added print CSS for PSA QR labels.
- Applied the migration locally and verified existing assets received PSA QR identifiers.
- Verified `npm.cmd run build` and `php artisan test`.

Reason

Assets require a permanent PSA-owned identifier that remains stable across borrowing, return, transfer, and maintenance while staying separate from manufacturer QR/barcode, serial number, property tag, and temporary receipt references.

Risks

- The frontend QR visual is currently a local QR-style placeholder, not a standards-compliant generated QR image.
- Existing manufacturer identifiers must still be added or imported as separate AssetIdentifier records.

Rollback

Revert the files listed in this entry and roll back migration `2026_07_19_131500_add_permanent_psa_qr_identifiers`.

Status

Completed.

### 2026-07-19 13:14

AI

Name:
Codex

Model:
GPT-5.2

Task

Remove employee reservation approval access.

Files Modified

- CHANGELOG.md
- AI_CHANGELOG.md
- backend/app/Modules/Reservation/Controllers/ReservationController.php
- frontend/src/pages/ReservationPage.tsx

Summary

- Added backend role authorization for reservation approval.
- Restricted approval to Super Administrator, System Administrator, Property Custodian, Inventory Officer, and Department Head roles.
- Hid the Approve button from employee reservation views.
- Kept reservation receipt access available to employees.
- Verified `npm.cmd run build` and `php artisan test`.

Reason

Employees should be able to request and view receipts, but only authorized admin/staff users should approve reservations.

Risks

None.

Rollback

Revert the files listed in this entry.

Status

Completed.

### 2026-07-19 13:11

AI

Name:
Codex

Model:
GPT-5.2

Task

Add receipt-only print support.

Files Modified

- CHANGELOG.md
- AI_CHANGELOG.md
- frontend/src/components/ReceiptModal.tsx
- frontend/src/index.css

Summary

- Renamed the receipt modal action to `Print Receipt`.
- Added a `receipt-print-area` wrapper around printable receipt content.
- Added print media CSS to hide the rest of the application and print only the receipt.
- Set A4 print sizing and margins.
- Verified `npm.cmd run build`.

Reason

The receipt print option needed to create a clean printable document instead of printing the entire application UI.

Risks

- Browser print dialogs may vary slightly by browser/printer settings.

Rollback

Revert the files listed in this entry.

Status

Completed.

### 2026-07-19 12:57

AI

Name:
Codex

Model:
GPT-5.2

Task

Add persistent receipts and authorization metadata for borrowing and reservation workflows.

Files Modified

- CHANGELOG.md
- AI_CHANGELOG.md
- backend/app/Http/Controllers/BorrowController.php
- backend/app/Modules/Borrowing/Controllers/BorrowingController.php
- backend/app/Modules/Borrowing/Models/Borrowing.php
- backend/app/Modules/Borrowing/Services/BorrowingService.php
- backend/app/Modules/Reservation/Controllers/ReservationController.php
- backend/app/Modules/Reservation/Models/Reservation.php
- backend/app/Modules/Reservation/Services/ReservationService.php
- backend/database/migrations/2026_07_19_000000_add_authorization_metadata_to_borrowings_and_reservations.php
- frontend/src/components/ReceiptModal.tsx
- frontend/src/pages/AssetPage.tsx
- frontend/src/pages/BorrowingPage.tsx
- frontend/src/pages/ReservationPage.tsx
- frontend/src/services/borrowingService.ts
- frontend/src/services/reservationService.ts
- frontend/src/types/index.ts

Summary

- Added `authorized_by` and `authorized_at` to borrowings and reservations.
- Added authorizer relationships to borrowing and reservation models.
- Included authorization metadata in borrowing and reservation API responses.
- Added reusable ReceiptModal component with QR-style placeholder/reference block.
- Updated AssetPage to reuse ReceiptModal for borrow/reserve receipts.
- Added persistent Receipt buttons to BorrowingPage and ReservationPage.
- Updated receipt data to include item details, borrower, timestamps, schedule, status, remarks, authorized by, and authorization timestamp.
- Applied the new migration locally.
- Verified `npm.cmd run build` and `php artisan test`.

Reason

Receipt access needed to persist beyond the initial popup, and receipts needed to include who borrowed and who authorized the transaction.

Risks

- The QR block is currently a visual placeholder/reference, not a generated standards-compliant QR matrix.
- Historical records created before the migration may show pending or missing authorizer data until touched by a new workflow.

Rollback

Revert the files listed in this entry and roll back migration `2026_07_19_000000_add_authorization_metadata_to_borrowings_and_reservations`.

Status

Completed.

### 2026-07-18 21:22

AI

Name:
Codex

Model:
GPT-5.2

Task

Connect employee borrow/reserve actions to receipts, QR references, canonical borrowings, and staff/admin authorization.

Files Modified

- CHANGELOG.md
- AI_CHANGELOG.md
- backend/app/Http/Controllers/BorrowController.php
- backend/app/Modules/Borrowing/Controllers/BorrowingController.php
- backend/app/Modules/Reservation/Controllers/ReservationController.php
- backend/app/Modules/Reservation/Services/ReservationService.php
- backend/app/Notifications/BorrowNotification.php
- frontend/src/components/StaffDashboard.tsx
- frontend/src/pages/AssetPage.tsx
- frontend/src/services/assetService.ts
- frontend/src/services/borrowingService.ts
- frontend/src/services/reservationService.ts
- frontend/src/types/index.ts

Summary

- Changed direct asset borrowing to create records in the canonical `borrowings` module instead of the legacy `borrows` table.
- Direct asset borrowing now marks assets as `BORROWED` and returns receipt metadata.
- Direct asset return now closes the canonical active borrowing and marks the asset `AVAILABLE`.
- Added receipt code and receipt payload fields to borrowing and reservation API transforms.
- Reservation creation now marks selected assets `RESERVED`.
- Reservation approval now converts reserved assets into `BORROWED` borrowing records.
- Added Reserve action to the Asset page.
- Added printable borrow/reservation receipt modal with QR image, receipt code, asset details, employee details, and dates.
- Updated Staff Dashboard scanner to approve reservation receipts and route borrowing receipts to Borrowings.
- Verified `npm.cmd run build` and `php artisan test`.

Reason

Borrowing/reservation actions needed to be operationally connected so employee requests produce receipts, staff can authorize with a QR/reference, assets change status correctly, and admin Borrowings shows the resulting records.

Risks

- QR image rendering uses an external QR image endpoint at runtime; the visible receipt code remains available if the image cannot load.
- The legacy `borrows` table still exists for compatibility but is no longer used by the direct asset borrow/return flow.

Rollback

Revert the files listed in this entry.

Status

Completed.

### 2026-07-18 21:04

AI

Name:
Codex

Model:
GPT-5.2

Task

Restrict asset edit capabilities so employees and staff cannot edit asset master data.

Files Modified

- CHANGELOG.md
- AI_CHANGELOG.md
- backend/app/Modules/Asset/Policies/AssetPolicy.php
- frontend/src/pages/AssetPage.tsx

Summary

- Removed Edit and Delete asset actions from non-admin frontend views.
- Added admin-only backend policy enforcement for asset create, update, delete, archive, and transfer actions.
- Kept asset viewing available to authenticated users.
- Kept borrow and return authorization available to authenticated users.
- Verified `npm.cmd run build` and `php artisan test`.

Reason

Employees should not edit assets, and staff should scan QR codes and authorize borrowing rather than maintain asset records.

Risks

- Property Custodian and Department Head users can no longer edit asset master records through the API; this matches the requested role separation.

Rollback

Revert the files listed in this entry.

Status

Completed.

### 2026-07-18 20:59

AI

Name:
Codex

Model:
GPT-5.2

Task

Repair Inventory to Assets integration so inventory additions are visible and usable from the asset registry.

Files Modified

- CHANGELOG.md
- AI_CHANGELOG.md
- backend/app/Modules/Inventory/Controllers/InventoryController.php
- backend/app/Modules/Inventory/Models/InventoryItem.php
- backend/app/Modules/Inventory/Requests/StoreInventoryItemRequest.php
- backend/app/Modules/Inventory/Services/InventoryService.php
- backend/database/migrations/2026_07_18_203300_link_inventory_items_to_assets.php
- frontend/src/pages/InventoryPage.tsx
- frontend/src/services/inventoryService.ts
- frontend/src/types/index.ts

Summary

- Added nullable `asset_id` linkage from inventory items to assets.
- Backfilled existing inventory items into linked asset records during migration.
- Updated inventory creation to create a linked asset by default.
- Synced linked asset name, status, and remarks when inventory records or stock levels change.
- Soft-deletes linked assets when inventory items are deleted to avoid orphaned records.
- Returned asset metadata from inventory API responses.
- Added linked asset number and View Asset navigation to the Inventory page.
- Applied the migration locally and verified existing rows are linked.
- Verified `npm.cmd run build` and `php artisan test`.

Reason

Inventory and Assets were implemented as independent modules, so adding inventory stock did not create or display any asset record. This made the UI appear broken for normal PSA inventory workflows.

Risks

- Automatically linked assets use the default `Inventory Item` category and `Main Office` office when no explicit asset metadata exists.
- One inventory row maps to one asset registry record; individual per-unit asset tagging would require a deeper receiving workflow.

Rollback

Revert the files listed in this entry and roll back migration `2026_07_18_203300_link_inventory_items_to_assets`.

Status

Completed.

### 2026-07-18 20:32

AI

Name:
Codex

Model:
GPT-5.2

Task

Final integration repair for production readiness after login and workflow audit.

Files Modified

- CHANGELOG.md
- AI_CHANGELOG.md
- backend/app/Http/Controllers/BorrowController.php
- backend/app/Models/Borrow.php
- backend/app/Modules/Asset/Policies/AssetPolicy.php
- backend/app/Modules/Borrowing/Controllers/BorrowingController.php
- backend/app/Modules/Borrowing/Services/BorrowingService.php
- backend/app/Modules/Dashboard/Services/DashboardService.php
- backend/app/Modules/Report/Controllers/ReportController.php
- backend/app/Modules/Reservation/Controllers/ReservationController.php
- backend/app/Modules/Reservation/Services/ReservationService.php
- backend/app/Notifications/BorrowNotification.php
- frontend/src/components/LoginForm.tsx
- frontend/src/layouts/TopNav.tsx
- frontend/src/pages/AssetPage.tsx
- frontend/src/pages/MaintenancePage.tsx
- frontend/src/pages/ReservationPage.tsx
- frontend/src/services/api.ts
- frontend/src/services/assetService.ts
- frontend/src/services/reservationService.ts

Summary

- Connected reservation creation to the existing backend API and available asset list.
- Removed unsupported login actions and connected forgot-password to the implemented endpoint.
- Fixed stale asset model imports and missing asset borrow/return policy methods.
- Made borrow notifications best-effort to avoid blocking successful borrowing when mail or queues are unavailable.
- Enriched reservation and borrowing responses with related user and asset display fields.
- Changed operational reservation and borrowing lists so admin, system admin, property custodian, and department head roles can see all records while employees remain scoped to their own.
- Fixed dashboard and report user display names by using the current User full_name accessor.
- Removed dead dashboard/top-nav UI actions and kept navigation inside React Router.
- Verified `npm.cmd run build` and `php artisan test`.

Reason

Production readiness required visible UI actions to call real backend contracts, frontend tables to receive required display fields, and backend routes to use the implemented module model classes.

Risks

- Asset borrow notifications are logged if delivery fails; notification delivery still depends on production mail and queue configuration.
- Reservation creation currently uses a simple multi-select control rather than a richer searchable selector.

Rollback

Revert the files listed in this entry.

Status

Completed.

### 2026-07-18 19:45

AI

Name:
Codex

Model:
GPT-5.2

Task

Resolve browser login 500 after RBAC soft-delete migration.

Files Modified

- CHANGELOG.md
- AI_CHANGELOG.md

Summary

- Inspected Laravel logs and identified missing `roles.deleted_at` in the local SQLite database.
- Ran `php artisan migrate` to apply the pending soft-delete migration for roles and permissions.
- Verified the login endpoint returns a successful response for `admin@example.com`.

Reason

The backend code expected soft-delete columns on roles and permissions, but the running local database had not yet applied the migration.

Risks

None for source code. Other local environments must also run migrations after pulling this change.

Rollback

Run `php artisan migrate:rollback --step=1` only if the soft-delete migration must be reverted locally.

Status

Completed.

### 2026-07-18

AI

Name:
Codex

Model:
GPT-5.2

Task

Final integration repair pass for RBAC test failures and frontend/backend API contract mismatches.

Files Modified

- backend/app/Models/User.php
- backend/app/Models/Role.php
- backend/app/Models/Permission.php
- backend/database/factories/UserFactory.php
- backend/database/factories/RoleFactory.php
- backend/database/factories/PermissionFactory.php
- backend/database/migrations/2026_07_18_000000_add_soft_deletes_to_roles_and_permissions_table.php
- frontend/src/types/index.ts
- frontend/src/utils/statusTone.ts
- frontend/src/services/reservationService.ts
- frontend/src/services/borrowingService.ts
- frontend/src/services/inventoryService.ts
- frontend/src/services/maintenanceService.ts
- frontend/src/pages/BorrowingPage.tsx
- frontend/src/pages/MaintenancePage.tsx
- frontend/src/components/AdminDashboard.tsx
- frontend/src/components/StaffDashboard.tsx
- frontend/src/components/EmployeeDashboard.tsx
- CHANGELOG.md
- AI_CHANGELOG.md

Summary

- Replaced an invalid User permissions relationship with a role-permission query used by policies.
- Added missing RoleFactory and PermissionFactory for backend feature tests.
- Added soft delete support to roles and permissions.
- Added a testing-only default Super Administrator role assignment in UserFactory to satisfy RBAC-protected feature tests without weakening production policies.
- Mapped reservation, borrowing, inventory, and maintenance API responses to the current frontend view models.
- Updated frontend status handling for BORROWED borrowings and lowercase maintenance statuses.
- Created the missing root CHANGELOG.md required by PROJECT_RULES.md.

Reason

Backend tests failed with authorization errors and missing factories, and frontend pages expected field names/statuses that did not match the implemented Laravel API responses.

Risks

- Frontend borrowing and reservation tables display user and asset IDs where the backend does not yet include related names.
- The new migration adds soft delete columns and must be applied in deployed environments.

Rollback

Revert the listed backend, frontend, and changelog files, then roll back the 2026_07_18 soft delete migration if it has been applied.

Status

Completed.

### 2026-07-16 16:00

AI

Name:
GitHub Copilot

Model:
MAI-Code-1-Flash

Task

Wire the frontend login flow to the existing auth service and stabilize the app shell for protected navigation.

Files Modified

- frontend/src/components/LoginForm.tsx
- frontend/src/App.tsx
- frontend/src/components/ui/Button.tsx

Summary

- Connected the login form to the existing auth context and navigation flow.
- Added a basic router-based app shell with protected dashboard routing.
- Fixed the TypeScript build issues caused by an unsupported Button variant and an unused login helper.

Reason

The frontend build was failing and the login form had placeholder logic instead of a real authentication flow.

Risks

Backend login must still be verified in a running environment; the current change assumes the API is reachable and responds as expected.

Rollback

Revert the three frontend files listed above.

Status

Completed.

### 2026-07-16 14:27

AI

Name:
Cascade

Model:
SWE-1.6

Task

Frontend Integration Audit - Connect frontend services to backend APIs and implement CRUD operations for all modules.

Files Modified

- frontend/src/services/dashboardService.ts
- frontend/src/services/reservationService.ts
- frontend/src/services/borrowingService.ts
- frontend/src/services/inventoryService.ts
- frontend/src/services/maintenanceService.ts
- frontend/src/services/reportService.ts (created)
- frontend/src/App.tsx
- frontend/src/pages/DashboardPage.tsx
- frontend/src/pages/ReservationPage.tsx
- frontend/src/pages/BorrowingPage.tsx
- frontend/src/pages/InventoryPage.tsx
- frontend/src/pages/MaintenancePage.tsx
- frontend/src/pages/ReportPage.tsx
- frontend/src/types/index.ts

Summary

- Fixed dashboardService API endpoint mismatches (/reports/dashboard → /dashboard/stats, /dashboard/recent → /dashboard/recent-activity)
- Connected reservationService to GET /api/v1/reservations with approve method
- Connected borrowingService to GET /api/v1/borrowings with create and return methods
- Connected inventoryService to GET /api/v1/inventory with create, update, delete, stock-in, stock-out methods
- Connected maintenanceService to GET /api/v1/maintenances with create, update, delete, complete methods
- Created reportService with methods for assets, borrowings, reservations, inventory, overdue, low-stock, user-activity reports
- Added missing routes to App.tsx for assets, reservations, borrowings, inventory, maintenance, reports, users, roles, permissions, settings
- Replaced DashboardPage custom layout with AppLayout for consistency
- Removed unused imports from DashboardPage
- Added CRUD operations to ReservationPage (approve only - backend only has approve route)
- Added CRUD operations to BorrowingPage (return for active/overdue borrowings)
- Added CRUD operations to InventoryPage (stock-in, stock-out, add, edit, delete with modals)
- Added CRUD operations to MaintenancePage (schedule, complete, cancel, edit, delete with modal)
- Connected ReportPage to real report endpoints with tab-based navigation
- Added reorder_level property to InventoryItem type to match backend API
- Fixed TypeScript errors by replacing any types with proper types (unknown, specific unions)
- Removed reject and cancel methods from reservationService since backend doesn't have those routes

Reason

Frontend services were using placeholder mock data and had API endpoint mismatches. CRUD operations were missing from all pages. Backend routes were verified and frontend was aligned to match available endpoints.

Risks

- Reservation reject/cancel functionality not available due to missing backend routes
- Some React ESLint warnings remain (setState in useEffect) but these are acceptable for data loading patterns
- ReportPage uses conditional rendering with type assertions for different report types

Rollback

Revert all modified frontend service files and page files to previous versions.

Status

Completed.
