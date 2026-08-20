# Reservations API

Base path prefix: /api/v1

Primary routes (backend/app/Modules/Reservation/Routes/api.php)

GET /api/v1/reservations
- Purpose: List reservations (paginated)
- Authentication: Required

POST /api/v1/reservations
- Purpose: Create a reservation (employee request for asset)

Request body (StoreReservationRequest):

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| asset_ids | array | required | Array of asset IDs to reserve
| asset_ids.* | integer | required | Asset id (exists:assets,id)
| start_date | date | required | Reservation start date
| end_date | date | required | Reservation end date (after_or_equal:start_date)
| remarks | string | nullable | Optional remarks

Source of truth:
- backend/app/Modules/Reservation/Requests/StoreReservationRequest.php
- backend/app/Modules/Reservation/Controllers/ReservationController.php


POST /api/v1/reservations/scan-authorize
- Purpose: Authorize a reservation via QR scan (role-restricted)
- Authorization: role:Super Administrator,System Administrator,Property Custodian,Inventory Officer,Department Head

POST /api/v1/reservations/{reservation}/approve
- Purpose: Approve a reservation (role-restricted)

POST /api/v1/reservations/{reservation}/release
- Purpose: Release a reservation to allow issuance (role-restricted)

POST /api/v1/reservations/{reservation}/reject
- Purpose: Reject reservation (role-restricted)

POST /api/v1/reservations/{reservation}/cancel
- Purpose: Cancel reservation (by owner)

Source of truth
- backend/app/Modules/Reservation/Routes/api.php
- backend/app/Modules/Reservation/Controllers/ReservationController.php
- backend/app/Modules/Reservation/Requests/*
