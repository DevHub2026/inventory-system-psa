# QR Scanning Architecture

This document describes the QR scanning design implemented in the codebase.

Purpose

Provide a centralized server-side QR resolution service so the frontend scanner can map a scanned identifier to the appropriate domain resource (Asset, Borrowing receipt, Return receipt, or UNKNOWN) and drive the correct UI workflow.

Key components

- Frontend scanner / UI: captures QR identifier and calls the frontend qrService (frontend/src/services/qrService.ts).
- QR module routes: backend/app/Modules/QrScan/Routes/api.php registers endpoints for resolve, resolveAsset, recordAction, my-history and role-restricted history.
- QrScanController: resolves identifiers and records scan actions / history.

Routes (verified)
- GET /api/v1/qr/resolve/{identifier} → QrScanController::resolve (identifier may contain slashes; route uses where('identifier', '.*'))
- GET /api/v1/qr/asset/{identifier} → QrScanController::resolveAsset (legacy; records VIEW scan)
- POST /api/v1/qr/scan-action → QrScanController::recordAction (non-VIEW actions)
- GET /api/v1/qr/my-history → QrScanController::myHistory
- GET /api/v1/qr/history → QrScanController::history (role-restricted)

Resolution behavior (as implemented)

- The controller determines the resource type for an identifier and returns a typed response indicating the resolution (type and resolved resource data).
- The server records scans for history and analytics (my-history for user, history for staff).
- The QR service does not implicitly perform borrow or return actions unless a dedicated endpoint is called by the client after resolution — the resolution endpoint only identifies the target resource.

Integration with other modules

- Asset lookup: when a QR resolves to an asset, the frontend navigates to Asset details or initiates a borrowing request depending on UI flow.
- Borrowing: if QR resolves to an active borrowing receipt, the controller returns borrowing data for the frontend to show transaction details.
- Reservation/authorization: there is a reservations scan-authorize endpoint that interacts with reservation flows (backend/app/Modules/Reservation/Routes/api.php).

Security and privacy

- QR routes require authentication (auth:sanctum). Full history endpoints are role-restricted to staff roles via role middleware.

Source of truth

- backend/app/Modules/QrScan/Routes/api.php
- backend/app/Modules/QrScan/Controllers/QrScanController.php
- frontend/src/services/qrService.ts
