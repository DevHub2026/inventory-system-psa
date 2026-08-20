# Assets

## Overview

The Asset module manages durable property (assets). It provides search, scan, borrowable flags, attachments, issuance (reissuance), disposal lifecycle, and related master data (categories, offices, locations, manufacturers).

## Purpose

Track and manage organization assets including identification, custody changes, transfers, reissuances, and disposal.

## Who Can Access It

Most asset endpoints are protected by auth:sanctum. Specific actions (disposal, asset category management, offices/locations) are role-restricted via middleware in the routes file.

Examples of role-restricted actions (see backend/app/Modules/Asset/Routes/api.php):
- Disposal lifecycle: roles including Super Administrator, System Administrator, Property Custodian, Inventory Officer, Department Head
- Reissuance reports: restricted to selected roles
- Asset identifier CRUD: restricted to admin/inventory roles

Frontend pages and services:
- Page: frontend/src/pages/AssetPage.tsx (asset details)
- Services: frontend/src/services/assetService.ts

## Where to Find It

- Backend routes: backend/app/Modules/Asset/Routes/api.php
- AssetController: backend/app/Modules/Asset/Controllers/AssetController.php
- Attachment controllers, reissuance controllers, location/manufacturer controllers in the same module

## Main Workflow

1. Asset creation and listing are provided by the apiResource('assets') controller and related routes.
2. Search: GET /assets/search — controller handles server-side search and should be used by UI search boxes.
3. Scan: GET /assets/scan — QR/resolution based scanning is supported.
4. Borrowable flag: PATCH /assets/{asset}/borrowable toggles borrowable status.
5. Reissue: POST /assets/{asset}/reissue — reissue action to change custodian; issuance history: GET /assets/{asset}/issuance-history.
6. Disposal: endpoints under /assets/{asset}/dispose/* manage disposal lifecycle (markForDisposal, finalize, cancel) — role-restricted.
7. Attachments: assets/{asset}/attachments endpoints allow file attachments.

## Available Actions

- Create, view, update, delete assets (apiResource)
- Set borrowable flag
- Scan asset via QR endpoints
- Attach and download attachments
- Reissue assets and view issuance history
- Disposal lifecycle actions (mark, finalize, cancel)

## Role and Permission Behavior

Routes define role gate middleware — backend is the authoritative source for who can perform each action. Note that the frontend may hide UI elements based on roles, but server-side checks still apply.

## Status or Lifecycle

Asset statuses are managed on the model and presented by the controller transform() outputs used by the frontend. Disposal and reissuance generate history records accessible via report endpoints.

## Validation and Restrictions

- Some asset fields are owned by inventory/procurement flows and may not be updated via the asset update endpoint — see frontend assetService comments and backend validation rules in the controller/request classes.

## Related Features

- Borrowings and Reservations reference assets when creating transactions.
- QR scanning resolves assets and routes users to asset pages or borrowing workflows.
- Reports include asset lists, histories, and reissuance exports.

## Technical Notes

- Routes and role restrictions: backend/app/Modules/Asset/Routes/api.php
- Controller: backend/app/Modules/Asset/Controllers/AssetController.php
- Frontend: frontend/src/services/assetService.ts

## Source-of-Truth References
- backend/app/Modules/Asset/Routes/api.php
- backend/app/Modules/Asset/Controllers/AssetController.php
- frontend/src/pages/AssetPage.tsx
