# Dashboard API

Base path prefix: /api/v1

Endpoints (backend/app/Modules/Dashboard/Routes/api.php)

GET /api/v1/dashboard/stats
- Purpose: Retrieve summary statistics used by the dashboard cards
- Authentication: Required (auth:sanctum)
- Authorization: controller enforces view access via middleware; specific data restrictions enforced in controller/service
- Response: JSON success wrapper with data object containing stats and counts

GET /api/v1/dashboard/recent-activity
- Purpose: Retrieve recent activity entries for dashboard timeline
- Authentication: Required

GET /api/v1/dashboard/low-stock
- Purpose: Retrieve low stock items for dashboard card
- Authentication: Required
- Authorization: some low-stock data may be role-restricted in controller/service

GET /api/v1/dashboard/overdue-assets
- Purpose: Retrieve list of overdue assets for dashboard
- Authentication: Required

Source of truth
- backend/app/Modules/Dashboard/Routes/api.php
- backend/app/Modules/Dashboard/Controllers/DashboardController.php
