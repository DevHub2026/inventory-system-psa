# Module Architecture

The backend is organized into modules under backend/app/Modules. Each module groups routes, controllers, requests, services and resources that implement a cohesive domain.

Modules discovered (representative):

| Module | Primary Responsibility | Routes | Main Controllers / Services | Frontend Integration |
| ------ | ---------------------- | ------ | -------------------------- | -------------------- |
| Auth | Authentication, sessions, user profile | backend/app/Modules/Auth/Routes/api.php | AuthController, SessionController, UserController, RoleController | frontend auth flows, login/logout, profile
| Asset | Asset CRUD, scan, attachments, transfers, disposal, reissuance | backend/app/Modules/Asset/Routes/api.php | AssetController, AssetService, AssetReissuanceController | Asset pages, assetService, QR flows
| Inventory | Inventory items, count sessions, stock ops, import/export | backend/app/Modules/Inventory/Routes/api.php | InventoryController, InventoryImportWizardController | InventoryPage, inventoryService
| Borrowing | Borrowing lifecycle, scans, returns, extensions | backend/app/Modules/Borrowing/Routes/api.php | BorrowingController, BorrowExtensionController, BorrowingService | Borrowing pages, borrowingService
| Reservation | Reservation lifecycle (request, approve, release) | backend/app/Modules/Reservation/Routes/api.php | ReservationController | ReservationPage, reservationService
| QrScan | Central QR resolution and history | backend/app/Modules/QrScan/Routes/api.php | QrScanController | qrService, scanner UI
| Dashboard | Aggregated stats and cards | backend/app/Modules/Dashboard/Routes/api.php | DashboardController | AdminDashboard, dashboardService
| Report | Report generation, exports | backend/app/Modules/Report/Routes/api.php and Asset module for reissuances | ReportController, AssetReissuanceController | reportService, ReportPage
| Notification | Notification endpoints and integration | backend/app/Modules/Notification/Routes/api.php | NotificationController | Notification UI
| SystemSetup | Document templates and system-level settings | backend/app/Modules/SystemSetup/Routes/api.php | DocumentTemplate controllers | System setup pages
| AuditLog | Audit log queries (admin) | backend/app/Modules/AuditLog/Routes/api.php | AuditLogController | Admin tooling

Module responsibilities

- Routes: are registered per module and grouped under auth:sanctum when required.
- Controllers: handle request entrypoints and call services or perform model operations.
- Requests: define validation rules and may include authorize()/prepareForValidation() hooks.
- Services: encapsulate complex business logic or multi-step operations when present.
- Resources: format model data for API responses.

Inter-module dependencies (verified)

- Asset and Inventory: Inventory owns many procurement/identifier fields and synchronizes them to Asset records via InventoryService (see comments in UpdateAssetRequest and InventoryService references).
- Borrowing uses Asset models and Reservation models when validating borrowable states (see AssetController setBorrowable business rules referencing Borrowing and Reservation).
- QrScan integrates with Asset and Borrowing modules to resolve QR identifiers to domain objects.
- Reports sometimes cross modules (Asset reissuance report is implemented in Asset module with report route registration).

Source of truth

- backend/app/Modules/*/Routes/api.php
- backend/app/Modules/*/Controllers/*
- backend/app/Modules/*/Services/*
- frontend/src/pages/* and frontend/src/services/*
