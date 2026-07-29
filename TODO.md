# Phase 7 — QR Scan Role-Based Workflow Correction

## Implementation Progress

### PART 1: QR Type Detection - ✅ Backend centralized resolution flow
- [x] Created `QrType` enum (`ASSET`, `BORROWING_RECEIPT`, `RETURN_RECEIPT`, `UNKNOWN`)
- [x] Updated `QrScanService` with `resolveQrIdentifier()` — centralized flow detecting QR codes by type
- [x] Added borrowing receipt detection (`PSA-BOR-*`, `BR-*` prefixes)
- [x] Added return receipt detection (`RT-*` prefix)
- [x] Added permanent asset QR detection via `AssetIdentifierService`
- [x] Returns normalized context: `qr_type`, `asset`, `borrowing`, `available_actions`, `user_permissions`, `workflow_status`
- [x] Added new `GET /api/v1/qr/resolve/{identifier}` endpoint
- [x] Updated `QrScanController` with `resolve()` method
- [x] Preserved legacy `GET /api/v1/qr/asset/{identifier}` endpoint

### PART 2: Employee scans available asset QR - ✅ Frontend flow
- [x] `SharedQrScanner` now uses centralized `resolveQr()` endpoint
- [x] ScannedAssetResultModal shows asset information before performing actions
- [x] "Request to Borrow" button displayed only when eligible
- [x] BorrowRequestModal triggered on explicit user tap
- [x] Loading state while resolving
- [x] Success feedback after action
- [x] Unavailable assets clearly explained (Borrowed, Maintenance, Issued, Unavailable)
- [x] Duplicate request prevention (backend handles via existing `BorrowingService::requestBorrow()`)

### PART 3: Admin scans borrowing receipt QR - ✅ Backend + Frontend
- [x] Backend detects receipt QR and returns borrowing transaction context
- [x] Frontend `ScannedQrResultModal` renders borrowing receipt view
- [x] Shows transaction summary (borrower, asset, dates, status)
- [x] Admin sees "Return Asset" action when active borrowing
- [x] Employee sees read-only status message
- [x] Already-returned borrowings show read-only completed status
- [x] Return receipt (RT-) renders green completed view

### PART 4: Role-based action rules - ✅ Backend authorization
- [x] Backend `resolveQrIdentifier()` uses `isAdminOrCustodian()` for role detection
- [x] Employee actions: `REQUEST_BORROW`, `REPORT_DAMAGE`, `REPORT_LOST`
- [x] Admin actions: `RETURN_ASSET`, `VIEW_ASSET_DETAILS`, `VIEW_BORROWING_STATUS`
- [x] Backend authorization is the source of truth
- [x] Frontend displays actions based on backend-provided `available_actions` and `user_permissions`

### PART 5: Damage Report Management - 🔄 Partially implemented
- [x] Employee can submit damage report (existing `ReportDamageModal`)
- [x] Backend `MaintenanceService` handles report creation with workflow
- [ ] Admin management page for damage reports (needs new frontend page)
- [ ] Search, filter, pagination for damage reports
- [ ] Report details view with workflow timeline

### PART 6: Lost Asset Report Management - 🔄 Partially implemented
- [x] Employee can submit lost asset report (existing `ReportLostModal`)
- [x] Backend `LostAssetReportService` creates reports with workflow
- [x] Existing `GET /api/v1/lost-asset-reports` endpoint with filtering
- [x] Existing `GET /api/v1/lost-asset-reports/mine` for employee
- [ ] Admin management page for lost asset reports (needs new frontend page)

### PART 7: Navbar scanner and asset page scanner - ✅ Shared component
- [x] Single `SharedQrScanner` component used by both navbar and scanner page
- [x] Single `qrService.resolveQr()` for both
- [x] Desktop and mobile camera support
- [x] Manual QR/code entry fallback
- [x] Permission errors shown clearly
- [x] Camera released when leaving page
- [x] Duplicate scan events prevented
- [x] Loading state while resolving
- [x] Invalid/not-found state shown

### PART 8: Backend authorization and data integrity - ✅
- [x] Employees can only submit borrow requests for themselves
- [x] Employees cannot approve/release borrowings
- [x] Admin/Custodian actions respect workflow assignment
- [x] Duplicate borrow requests blocked
- [x] Returned borrowings cannot be returned again
- [ ] Additional feature tests needed

### PART 9: Notifications - ✅ Already existing
- [x] Existing `NotificationService::notifyStaffAndAdmins()` for borrow requests
- [x] Existing `NotificationService::notifyUser()` for individual notifications
- [x] Lost asset reports trigger notifications via `LostAssetReportService`
- [x] Damage reports trigger notifications via `MaintenanceService`

### PART 10: Testing and verification - 🔄 Pending
- [ ] Run `php artisan optimize:clear`
- [ ] Run `php artisan migrate`
- [ ] Run `php artisan route:list`
- [ ] Run `php artisan test`
- [ ] Run `npm run build`