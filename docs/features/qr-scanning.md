# QR Scanning

## Overview

QR scanning in this project is implemented as a resolution service: a QR identifier is resolved to a domain object (ASSET, BORROWING_RECEIPT, RETURN_RECEIPT, etc.) and the frontend navigates to the appropriate workflow. The code centralizes QR resolution server-side and the frontend uses qrService to call the endpoints.

## Purpose

Allow fast identification of assets or transactions via QR codes to accelerate borrowing, returning, and history lookup workflows.

## Who Can Access It

QR endpoints are behind auth:sanctum. Some history endpoints are role-protected (e.g., global QR history is limited to staff roles), while per-user history is available to the authenticated user.

## Where to Find It

- Frontend service: frontend/src/services/qrService.ts
- Backend routes: backend/app/Modules/QrScan/Routes/api.php
- Backend controller: backend/app/Modules/QrScan/Controllers/QrScanController.php (or module equivalent)

## Main Workflow

1. The frontend scanning UI captures or reads a QR identifier and calls qrService.resolveQr(identifier) which hits the server endpoint GET /qr/resolve/{identifier}.
2. The server resolves the identifier to a type and returns metadata (type and resolved resource info). Example types: ASSET, BORROWING_RECEIPT, RETURN_RECEIPT, UNKNOWN.
3. The frontend navigates the user to the correct page (asset details, borrowing receipt, return workflow) based on the response.
4. There are additional endpoints such as GET /qr/asset/{identifier} and POST /qr/scan-action for specialized flows.

## Available Actions After Scan

- Navigate to asset details (if identifier resolves to an ASSET)
- Resolve a borrowing/return receipt to show transaction details
- Trigger a scan action endpoint if the frontend wants server-side handling for the scan

## Error Handling

- If the QR code cannot be resolved, server returns UNKNOWN or an error response; the frontend surfaces an appropriate message and may offer manual search.

## Camera / Browser Limitations

- Scanning relies on the frontend implementation; the code assumes the app runs in browsers that support getUserMedia for camera access when used in-app. The repo contains a client-side scanner implementation (check frontend components that call qrService).

## Technical Notes

- Source-of-truth: qrService in the frontend and backend module QrScan routes. Look for endpoints: GET /qr/resolve/{identifier}, GET /qr/asset/{identifier}, POST /qr/scan-action, GET /qr/my-history, GET /qr/history.

## Source-of-Truth References
- frontend/src/services/qrService.ts
- backend/app/Modules/QrScan/Routes/api.php
