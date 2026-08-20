# Reports

## Overview

The application exposes a set of concrete reporting endpoints and report export features. The frontend calls reportService (frontend/src/services/reportService.ts) to fetch report data and to request exports (CSV/Excel) for supported reports.

## Implemented Reports

The following reports are implemented and available via the ReportController or module-specific controllers:

- Assets report — GET /reports/assets (asset lists with metadata)
- Borrowings report — GET /reports/borrowings
- Reservations report — GET /reports/reservations
- Inventory report — GET /reports/inventory
- Overdue report — GET /reports/overdue
- Low stock report — GET /reports/low-stock
- User activity report — GET /reports/user-activity
- Reissuances report — GET /reports/reissuances (and dedicated export endpoint)
- Asset history (paginated) — GET /reports/asset-history

Refer to frontend/src/services/reportService.ts for the response shapes used by the UI.

## Exporting

- Most reports export via a shared endpoint: GET /reports/export with query parameters type and format (format: excel|csv).
- Reissuances has a dedicated export endpoint: GET /reports/reissuances/export (reads format directly).
- Frontend export flow: reportService.exportReport(type, format, params) handles the HTTP request and guards against JSON error responses.

## Filters

Each report accepts parameters as implemented on the server. Typical filters include date range, office, status, and search terms. Consult the controller for the exact query parameters supported by each report type.

## Role and Permission Behavior

Some reports are restricted to specific roles (e.g., reissuance reports limited to staff roles). Backend route middleware and controller checks are authoritative — the frontend respects these restrictions but they are enforced server-side.

## Limitations

- Report formats: CSV and Excel exports are supported for the endpoints that implement export. The UI attempts to download the binary response and handles JSON error responses.
- No client-side generation of complex charts or PDFs is implemented unless a controller implements it. Use server-side export endpoints for canonical exports.

## Technical Notes

- Frontend service: frontend/src/services/reportService.ts
- For reissuances: backend asset reissuance controller handles report and export (see asset module routes)

## Source-of-Truth References
- [reportService](/C:/Users/salva/Downloads/PSA_DOCS/INVENTORY_SYSTEM/frontend/src/services/reportService.ts)
- Routes: search backend/app/Modules/*/Routes/api.php and backend/app/Modules/Asset/Routes/api.php for reissuance report endpoints
