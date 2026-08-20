# Feature documentation

This folder documents the project’s core operational features as implemented in the codebase. These documents are written from the live repository source of truth (frontend pages, services, backend controllers, routes, models, and policies).

Principle: The implementation is the source of truth. Update the corresponding documentation when a supported workflow, route, authorization rule, or user-visible behavior changes.

Feature index

- Dashboard — docs/features/dashboard.md — Overview of available dashboard cards, stats and data sources
- Inventory management — docs/features/inventory.md — Inventory flows, stock operations, import/export, and Supply Officer behavior
- Assets — docs/features/assets.md — Asset lifecycle, identifiers, issuance, and disposal
- Borrowing and returns — docs/features/borrowing-and-returns.md — Borrowing creation, returns, QR-assisted workflow, permissions
- Reservations — docs/features/reservations.md — Reservation lifecycle, approvals, release
- QR scanning — docs/features/qr-scanning.md — QR resolution endpoints and scanner behaviors
- Extension requests — docs/features/extension-requests.md — Borrowing extension request lifecycle and role behaviors
- Reports — docs/features/reports.md — Implemented reports, filters and export behavior

Each document lists the exact routes, frontend pages/components, backend controllers/services, and the canonical role/permission cues discovered in the repo. Where behavior or scope could not be fully verified in code, the document marks that explicitly.

Source-of-truth used for this folder (representative):
- frontend/src/pages/* (Dashboard, InventoryPage, AssetPage, BorrowingPage, ReservationPage, ReportPage)
- frontend/src/services/* (assetService, borrowingService, inventoryService, reservationService, qrService, reportService, dashboardService)
- backend/app/Modules/*/Routes/api.php (module route files)
- backend/app/Modules/*/Controllers/* (controllers referenced by routes)
- backend/app/Modules/*/Services/* (service classes used by controllers)
- backend/app/Models/* (Borrowing, Asset, Reservation models)

If you find a discrepancy between the code and these docs, report it and update the code or docs accordingly. Do not change application logic as part of documentation updates unless a confirmed bug requires a fix.