# Reservations

## Overview

Reservations allow employees to request the use of assets. The reservation module handles creation, approval/rejection, release, and lifecycle listings. The frontend pages and services use these endpoints to show reservation lists and action menus.

## Purpose

Provide a workflow for employees to request assets for a future period and for authorized staff to approve/reject and release reservations.

## Who Can Access It

Routes are protected by auth:sanctum. The Reservation module enforces role restrictions for approval/release endpoints; check reservation controller and route middleware for exact role lists.

## Where to Find It

- Frontend: frontend/src/pages/ReservationPage.tsx, frontend/src/services/reservationService.ts
- Backend routes: backend/app/Modules/Reservation/Routes/api.php
- Backend controller: backend/app/Modules/Reservation/Controllers/ReservationController.php

## Main Workflow

1. Create reservation: frontend posts to POST /reservations (controller validates and persists a PENDING reservation).
2. Approve/Reject: authorized staff call endpoints like POST /reservations/{id}/approve or /reject to change reservation status.
3. Release/Cancel: reservations may be released or cancelled via dedicated endpoints.
4. Scan authorization: there are endpoints to authorize reservations via QR scan flows (check routes for /reservations/scan-authorize endpoints).

## Available Actions

- Create reservation
- Approve, reject, release, cancel
- Query reservations for current user and system-wide lists

## Role and Permission Behavior

- Creating a reservation is available to authenticated employees.
- Approval and release actions are role-restricted to staff/administrators per route middleware and controller checks.
- Backend policies and controller-level checks are authoritative.

## Status or Lifecycle

Reservation statuses are defined in backend enums (e.g., backend/app/Enums/ReservationStatus.php) and include values such as pending, approved, rejected, cancelled, expired. Use the enum values verbatim when referencing statuses in API or docs.

## Validation and Restrictions

- Reservation creation validates asset availability and date ranges.
- Overlapping/conflicting reservations are handled by server-side checks where applicable; consult ReservationController for the exact conflict-resolution behavior.

## Related Features

- Reservations integrate with Borrowing flows (a reservation may later be used to create a borrowing).
- QR scanning can be used to authorize or identify reserved assets.

## Technical Notes

- Source: frontend/src/pages/ReservationPage.tsx, frontend/src/services/reservationService.ts
- Backend routes: backend/app/Modules/Reservation/Routes/api.php
- Reservation statuses: backend/app/Enums/ReservationStatus.php

## Source-of-Truth References
- [ReservationPage](frontend/src/pages/ReservationPage.tsx)
- [Reservation routes](backend/app/Modules/Reservation/Routes/api.php)
- [ReservationStatus enum](backend/app/Enums/ReservationStatus.php)
