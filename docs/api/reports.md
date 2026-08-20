# Reports API

Base path prefix: /api/v1

Primary report endpoints (see backend module routes and asset module for reissuance)

GET /api/v1/reports/assets
GET /api/v1/reports/borrowings
GET /api/v1/reports/reservations
GET /api/v1/reports/inventory
GET /api/v1/reports/overdue
GET /api/v1/reports/low-stock
GET /api/v1/reports/user-activity
GET /api/v1/reports/reissuances
GET /api/v1/reports/asset-history

Export
- GET /api/v1/reports/export?type={type}&format={excel|csv}
  - Purpose: Shared export endpoint for many report types
- GET /api/v1/reports/reissuances/export?format={excel|csv}
  - Purpose: Dedicated reissuances export endpoint

Authentication: Required
Authorization: Some reports (like reissuances export) are role-restricted per routes

Response shapes
- The frontend expects paginated lists or arrays depending on the report. See frontend/src/services/reportService.ts for concrete response interfaces.

Source of truth
- backend/app/Modules/Report/Routes/api.php
- backend/app/Modules/Asset/Routes/api.php (reissuance report + export)
- frontend/src/services/reportService.ts
