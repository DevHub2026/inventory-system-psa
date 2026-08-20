# Architecture Decisions (verified)

This file records architecture decisions that are visible in the codebase. Each entry documents the decision, the implementation, trade-offs and references.

Decision: Modular backend architecture

## Decision
Organize backend code into domain modules under backend/app/Modules.

## Context
The code groups routes, controllers, requests, services and resources by domain (Asset, Inventory, Borrowing, Reservation, QrScan, Report, Auth, Dashboard, etc.).

## Current Implementation
backend/app/Modules contains a module folder for each domain. Each module contains a Routes/api.php file that registers module routes, a Controllers folder and optional Services/Requests/Resources.

## Why This Approach Fits
- Keeps domain code co-located and easier to reason about.
- Clear separation of concerns per module.

## Trade-offs / Limitations
- Potential duplication across modules if common utilities are not centralized.

## Source References
- backend/app/Modules/*/Routes/api.php

---

Decision: React frontend separated from Laravel API

## Decision
The frontend is a separate single-page React application (Vite) that communicates with Laravel API under /api/v1.

## Current Implementation
- frontend/ contains the SPA with services that call /api/v1 endpoints (vite.config proxy to backend for local development).

## Why This Approach Fits
- Clear separation of UI and API concerns; independent deployments; modern frontend toolchain.

## Trade-offs / Limitations
- Requires CORS/API proxying in some environments; two deployment artifacts to manage.

## Source References
- frontend/vite.config.ts
- frontend/src/services/api.ts
- backend/routes/api.php

---

Decision: Backend is authoritative for authorization

## Decision
The backend enforces all security/authorization via middleware and policies; frontend visibility helpers do not replace server-side checks.

## Current Implementation
- role middleware on routes and $this->authorize() in controllers; policies exist under App/Policies.
- Frontend uses role helper utilities for UI convenience.

## Why This Approach Fits
- Centralized, server-side security reduces client-side tampering risks.

## Trade-offs / Limitations
- Frontend must still mirror some visibility for UX; policies/policy changes must be coordinated with UI changes.

## Source References
- backend/routes/api.php
- backend/app/Policies/*
- frontend/src/utils/roleHelpers.ts

---

Decision: Inventory owns procurement and identifier fields, Asset is synchronized

## Decision
Inventory module is the authoritative writer for many procurement and identifier fields; Asset update endpoint explicitly prohibits changes to inventory-owned fields.

## Current Implementation
- UpdateAssetRequest prohibits inventory-owned fields; StoreInventoryItemRequest accepts identifiers and synchronizes them to Assets and AssetIdentifier.

## Why This Approach Fits
- Prevents conflicting write paths and centralizes procurement workflows into Inventory.

## Trade-offs / Limitations
- Requires synchronization logic and clear documentation for editors and API consumers.

## Source References
- backend/app/Modules/Asset/Requests/UpdateAssetRequest.php
- backend/app/Modules/Inventory/Requests/StoreInventoryItemRequest.php
- backend/app/Modules/Inventory/Services/*

---

Decision: Centralized QR resolution service

## Decision
Provide server-side QR resolution (/qr/resolve/{identifier}) that maps identifiers to resources and records scan history.

## Current Implementation
- QrScan module routes and QrScanController implement resolution, recordAction, my-history and history.

## Why This Approach Fits
- Centralizes identifier mapping and auditability of scans.

## Trade-offs / Limitations
- Client must implement appropriate flows after resolution; server does not automatically execute domain actions on scan.

## Source References
- backend/app/Modules/QrScan/Routes/api.php
- backend/app/Modules/QrScan/Controllers/QrScanController.php


Notes

- These decisions are recorded from the implementation. Where the code expresses rationale (comments in request classes and controllers), that is reproduced as explanation. If additional ADRs are required, generate them from further team discussions.
