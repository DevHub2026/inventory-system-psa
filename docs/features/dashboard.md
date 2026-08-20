# Dashboard

## Overview

The Dashboard page aggregates high-level operational statistics and quick navigation to common workflows. It is implemented in the frontend under frontend/src/pages/AdminDashboard.tsx and relies on dashboardService for API calls.

## Purpose

Provide quick summary metrics and recent activity useful for administrators and staff (overdue items, low stock, recent borrowings, etc.) as implemented in the code.

## Who Can Access It

Backend route middleware and frontend guards indicate the dashboard pages are behind authentication. The dashboard API endpoints are registered in the backend modules and protected by auth:sanctum. Specific card visibility is determined by role checks in the frontend, but backend is authoritative for data access.

## Where to Find It

- Frontend page: frontend/src/pages/AdminDashboard.tsx
- Frontend service: frontend/src/services/dashboardService.ts
- Backend endpoints: routes are registered under module route files. Example endpoints used by the dashboard include (see corresponding controllers):
  - GET /dashboard/stats
  - GET /dashboard/recent-activity
  - GET /dashboard/low-stock
  - GET /dashboard/overdue

(Refer to backend route registrations for exact method/controller: search backend/app/Modules/*/Routes/api.php for dashboard-related routes.)

## Main Workflow

1. The Dashboard page calls dashboardService to fetch stats and lists.
2. The service uses authenticated API endpoints (auth:sanctum required).
3. Cards and lists are rendered; actions navigate to the appropriate resource pages (e.g., clicking an overdue card navigates to Borrowings page filtered by overdue status).

## Available Actions

- Navigate to asset lists, borrowings, reservations, and reports via dashboard cards and links.
- Drill-downs rely on existing list pages and their filters.

## Role and Permission Behavior

- Routes are protected by auth:sanctum and backend middleware. The dashboard page itself is accessible to authenticated users; individual card visibility may also be gated in the frontend UI.
- Backend enforces authorization for sensitive data (e.g., low-stock or reissuance reports are role-restricted).

## Validation and Restrictions

- Dashboard does not perform create/update operations directly — it aggregates server-side data.
- All data must come from authorized API endpoints.

## Technical Notes

- Source: frontend/src/pages/AdminDashboard.tsx and frontend/src/services/dashboardService.ts
- Backend data sources: controllers exposed in module route files (search backend/app/Modules/*/Routes/api.php)

## Source-of-Truth References
- frontend/src/pages/AdminDashboard.tsx
- frontend/src/services/dashboardService.ts
- Routes: search under backend/app/Modules/*/Routes/api.php for dashboard endpoints
