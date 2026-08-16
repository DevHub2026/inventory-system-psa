# PSA Region XII Inventory Management System
# Current Implementation Audit

Audit scope: Reports page and its direct contents only.

This audit covers the frontend page at `frontend/src/pages/ReportPage.tsx`, the frontend report client at `frontend/src/services/reportService.ts`, the report API routes/controllers/services they call, and the direct export/document generation path used by reports. It does not audit unrelated pages except where needed to confirm routing or access control for the Reports page.

## Executive Summary

The Reports page is partially implemented. It has a working authenticated route, visible navigation entry for admin/staff roles, a tabbed report UI, report data loaders, and backend endpoints for several report datasets. However, the implementation is incomplete and inconsistent across frontend tabs, backend report endpoints, export behavior, RBAC placement, and lint/type quality.

Total report feature areas audited: 14

| Classification | Count |
|---|---:|
| Fully implemented and used | 4 |
| Partial / incomplete | 5 |
| Exists but unused / unrouted from Reports page | 2 |
| Broken / inconsistent | 3 |
| Not implemented | 0 |
| Cannot verify from static audit only | 0 |

Highest-priority findings:

| Priority | Finding |
|---|---|
| P0 | Reissuance report data route exists outside the Reports module RBAC group, so `/api/v1/reports/reissuances` is exposed through the Asset module with only `auth:sanctum` route middleware. |
| P1 | Reservation reports exist in backend and frontend service code but are not exposed on the Reports page tabs. |
| P1 | Generic export support is incomplete for `reservations` and `user_activity`; the export service defines titles but has no row-building cases for these report types. |
| P2 | Reports page has lint/type debt: missing hook dependency and `any` casts at the table boundary. |
| P2 | User activity report labels every non-`BORROWED` borrowing row as `Returned`, which can misclassify pending/rejected/overdue states if those statuses are included. |

## 1. Fully Implemented and Used

| Feature | Frontend | Backend | Database / Data Source | API | Verification | Notes |
|---|---|---|---|---|---|---|
| Assets report tab | `frontend/src/pages/ReportPage.tsx:18`, `frontend/src/pages/ReportPage.tsx:40`, `frontend/src/pages/ReportPage.tsx:102` | `backend/app/Modules/Report/Controllers/ReportController.php:21` | `Asset` query with relationships | `GET /api/v1/reports/assets` | Route present in `php artisan route:list --path=api/v1/reports` | Visible in Reports page and wired to service. |
| Borrowings report tab | `frontend/src/pages/ReportPage.tsx:19`, `frontend/src/pages/ReportPage.tsx:41`, `frontend/src/pages/ReportPage.tsx:114` | `backend/app/Modules/Report/Controllers/ReportController.php:59` | `Borrowing` query with asset and borrower relationships | `GET /api/v1/reports/borrowings` | Route present | Visible and wired. |
| Inventory report tab | `frontend/src/pages/ReportPage.tsx:20`, `frontend/src/pages/ReportPage.tsx:42`, `frontend/src/pages/ReportPage.tsx:131` | `backend/app/Modules/Report/Controllers/ReportController.php:99` | `InventoryItem` query with asset/category/location relationships | `GET /api/v1/reports/inventory` | Route present | Visible and wired. |
| Overdue report tab | `frontend/src/pages/ReportPage.tsx:21`, `frontend/src/pages/ReportPage.tsx:43`, `frontend/src/pages/ReportPage.tsx:146` | `backend/app/Modules/Report/Controllers/ReportController.php:134` | `Borrowing` query filtered to overdue records | `GET /api/v1/reports/overdue` | Route present | Visible and wired. |

## 2. Partial / Incomplete

| Feature | Current State | Gap | Evidence |
|---|---|---|---|
| Low stock report tab | Frontend tab and backend endpoint exist. | Needs runtime data validation because threshold/source semantics are not visible on the Reports page and depend on inventory fields. | `frontend/src/pages/ReportPage.tsx:22`, `frontend/src/pages/ReportPage.tsx:44`, `backend/app/Modules/Report/Controllers/ReportController.php:166` |
| User activity report tab | Frontend tab and backend endpoint exist. | Backend maps `action` from borrowing status only; non-`BORROWED` statuses become `Returned`, which can misrepresent workflow states. | `frontend/src/pages/ReportPage.tsx:23`, `frontend/src/pages/ReportPage.tsx:45`, `backend/app/Modules/Report/Controllers/ReportController.php:196` |
| Reissuance report tab | Frontend tab and backend endpoint exist. | Data route is registered in Asset module under only `auth:sanctum`, while most report routes are inside the Report module role-restricted group. | `frontend/src/pages/ReportPage.tsx:24`, `backend/app/Modules/Asset/Routes/api.php:45`, `backend/app/Modules/Report/Routes/api.php:6` |
| Report export | Export button calls report export for current tab. | Export service lacks row-building cases for `reservations` and `user_activity`; generic fallback returns an empty table for unsupported report types. | `frontend/src/pages/ReportPage.tsx:63`, `frontend/src/services/reportService.ts:138`, `backend/app/Services/DocumentExportService.php:449`, `backend/app/Services/DocumentExportService.php:469` |
| Report filters | UI provides `from`, `to`, and `search` filters. | Search behavior is not uniformly implemented across backend report endpoints from the page contract; exact filtering differs by endpoint. | `frontend/src/pages/ReportPage.tsx:331`, `frontend/src/services/reportService.ts:6` |

## 3. Exists but Unused / Unrouted

| Feature | Exists At | Why It Is Unused From Reports Page | Evidence |
|---|---|---|---|
| Reservations report | Frontend service type and API client exist; backend report route exists. | `reservations` is missing from `ReportType`, `TABS`, `loadReport`, and `currentColumns`, so users cannot select it on the Reports page. | `frontend/src/services/reportService.ts:30`, `frontend/src/services/reportService.ts:98`, `backend/app/Modules/Report/Routes/api.php:14`, `frontend/src/pages/ReportPage.tsx:16` |
| Report export title for reservations | Export service title map includes `reservations`. | No Reports page tab reaches it, and export service has no `reservations` row-building case. | `backend/app/Services/DocumentExportService.php:454`, `backend/app/Services/DocumentExportService.php:469` |

## 4. Broken / Inconsistent

| Issue | Impact | Evidence |
|---|---|---|
| Reissuance report RBAC is inconsistent with other reports. | Any authenticated user may be able to request reissuance report data if controller method has no internal authorization. This bypasses the Reports module role group. | `backend/app/Modules/Asset/Routes/api.php:45`, `backend/app/Modules/Asset/Routes/api.php:46`, `backend/app/Modules/Report/Routes/api.php:6` |
| User activity export likely produces empty output. | UI exposes User Activity and export, but the backend export service has no `user_activity` row case. | `frontend/src/pages/ReportPage.tsx:23`, `frontend/src/pages/ReportPage.tsx:63`, `backend/app/Services/DocumentExportService.php:457`, `backend/app/Services/DocumentExportService.php:469` |
| Reports page fails scoped lint. | Indicates type-safety and React hook maintenance risks on the page. | `frontend/src/pages/ReportPage.tsx:57`, `frontend/src/pages/ReportPage.tsx:350`, `frontend/src/pages/ReportPage.tsx:351`, `frontend/src/pages/ReportPage.tsx:352` |

Scoped lint command result:

```text
npx eslint src/pages/ReportPage.tsx src/services/reportService.ts

frontend/src/pages/ReportPage.tsx
  57:6   warning  React Hook useEffect has a missing dependency: 'loadReport'
  350:39 error    Unexpected any
  351:32 error    Unexpected any
  352:19 error    Unexpected any
```

## 5. Not Implemented

Within the limited Reports page scope, no entire visible report tab is completely missing its backend endpoint. The main missing item is not a new standalone report type; it is that an existing reservations report is implemented in service/backend code but not surfaced in the page.

Detailed report types not present on the Reports page:

| Missing Report View | Status |
|---|---|
| Reservations | Backend and service exist, page tab missing. |
| Asset history | Not present as a Reports page tab in this audit scope. |
| Inventory movement | Not present as a Reports page tab in this audit scope. |
| Inventory count variance | Not present as a Reports page tab in this audit scope. |
| Maintenance cost/history | Not present as a Reports page tab in this audit scope. |
| Disposal history | Not present as a Reports page tab in this audit scope. |
| Audit log report | Not present as a Reports page tab in this audit scope. |

## 6. Security / RBAC Matrix

| Area | Frontend Access | Backend Access | Assessment | Evidence |
|---|---|---|---|---|
| Reports page route | Protected by login only at route component level. Sidebar hides Reports for non-admin/staff users. | Most report endpoints restricted to specific roles. | UI hiding is not authorization; backend is the real control. | `frontend/src/routes/ProtectedRoute.tsx:5`, `frontend/src/layouts/Sidebar.tsx:29`, `frontend/src/layouts/Sidebar.tsx:71` |
| Main report endpoints | Reports nav shown to admin/staff. | Report module uses `auth:sanctum` plus role middleware for Super Administrator, System Administrator, Property Custodian, Inventory Officer, Department Head, Auditor. | Backend stronger than sidebar. Potential role mismatch because sidebar allows only admin/staff grouping. | `backend/app/Modules/Report/Routes/api.php:6` |
| Reissuance report data | Visible through Reports page tab. | Registered in Asset module with only `auth:sanctum`. | High-risk inconsistency. Should match Report module RBAC or authorize internally. | `backend/app/Modules/Asset/Routes/api.php:45` |
| Reissuance export | Visible through Reports page export. | Export route exists next to reissuance report route; controller export method contains explicit authorization based on earlier trace. | Export appears better protected than data route, but route placement remains inconsistent. | `backend/app/Modules/Asset/Routes/api.php:46` |
| Document generation | Not directly exposed as a Reports tab, but in Report routes. | Inside Report module role middleware. | Access aligns with reporting RBAC. | `backend/app/Modules/Report/Routes/api.php:18` |

## 7. Email / Notification Readiness

Reports page itself does not send email or create notifications. This section is limited to whether report-related readiness exists.

| Capability | Status | Evidence |
|---|---|---|
| Report export/download | Partially ready. UI calls export endpoint and backend has document export service, but some report types are unsupported by row mapping. | `frontend/src/pages/ReportPage.tsx:63`, `frontend/src/services/reportService.ts:136`, `backend/app/Services/DocumentExportService.php:469` |
| Email delivery from Reports page | Not used by Reports page. | No report page email action found in scoped files. |
| Notification creation from Reports page | Not used by Reports page. | No report page notification action found in scoped files. |

## 8. Scheduled Jobs / Automation

Reports page has no direct scheduled jobs or automation. Scheduled jobs elsewhere may influence data shown in reports, but they are outside this page-only audit.

| Job | Directly Used By Reports Page | Notes |
|---|---|---|
| `insurance:check-expiration` | No | May affect asset state/notifications elsewhere, not Reports page UI. |
| `borrowings:send-overdue-reminders` | No | Overdue report data comes from borrowing records, not from this scheduler. |
| `inventory:send-low-stock-alerts` | No | Low-stock report data comes from inventory records, not from this scheduler. |
| `maintenance:send-reminders` | No | Maintenance is not a Reports page tab in current UI. |

## 9. Reports Audit

| Report | UI Tab | Frontend Service | Backend Endpoint | Export Support | Status |
|---|---|---|---|---|---|
| Assets | Yes | `getAssets()` | `GET /api/v1/reports/assets` | Has export row case | Fully implemented and used |
| Borrowings | Yes | `getBorrowings()` | `GET /api/v1/reports/borrowings` | Has export row case | Fully implemented and used |
| Inventory | Yes | `getInventory()` | `GET /api/v1/reports/inventory` | Has export row case | Fully implemented and used |
| Overdue | Yes | `getOverdue()` | `GET /api/v1/reports/overdue` | Shares borrowings/overdue export case | Fully implemented and used |
| Low Stock | Yes | `getLowStock()` | `GET /api/v1/reports/low-stock` | Shares inventory/low-stock export case | Partial, needs data semantics verification |
| User Activity | Yes | `getUserActivity()` | `GET /api/v1/reports/user-activity` | Title exists, row case missing | Broken export / partial data mapping |
| Reissuances | Yes | `getReissuances()` | `GET /api/v1/reports/reissuances` | Special export path exists | Partial, RBAC inconsistency |
| Reservations | No | `getReservations()` | `GET /api/v1/reports/reservations` | Title exists, row case missing | Exists but unused |

Missing detailed report views from current Reports page:

| Detailed Report | Current Page Status |
|---|---|
| Asset history | Missing |
| Inventory movement | Missing |
| Inventory count variance | Missing |
| Maintenance cost/history | Missing |
| Disposal history | Missing |
| Audit log report | Missing |

## 10. Mobile Web Audit

This audit did not perform authenticated browser testing of the Reports page. Static review of the page suggests it is usable on mobile only if the shared table and layout components handle horizontal overflow correctly.

| Severity | Finding | Evidence |
|---|---|---|
| Critical | None confirmed from static Reports page audit. | No authenticated mobile runtime test was performed. |
| High | Reports table has many columns per tab and relies on shared table behavior for small screens. | `frontend/src/pages/ReportPage.tsx:102`, `frontend/src/pages/ReportPage.tsx:350` |
| Medium | Tab list can become wide because seven report tabs are visible and an eighth reservations tab is absent. | `frontend/src/pages/ReportPage.tsx:18` |
| Low | Date/search/export controls may wrap depending on the page-level responsive classes. | `frontend/src/pages/ReportPage.tsx:331` |

Mobile web only: native mobile applications are out of scope.

## 11. Recommended Roadmap

| Priority | Recommendation |
|---|---|
| P0 | Move reissuance report routes into the Report module RBAC group or add equivalent role middleware/internal authorization to the Asset module reissuance report data endpoint. |
| P1 | Add `reservations` to `ReportType`, `TABS`, `loadReport`, column definitions, and export handling, or remove the unused service/backend route from the Reports page contract. |
| P1 | Add export row-building support for `user_activity` and `reservations` in `DocumentExportService`. |
| P2 | Replace `any` casts in `ReportPage.tsx` with a typed table row union or typed table generic, and fix the `useEffect` dependency warning. |
| P2 | Review `ReportController::userActivity()` status mapping so pending/rejected/overdue statuses are not mislabeled as returned activity. |
| P3 | Add focused tests for report endpoint authorization, report tab data loading, and export output for each report type. |
| P4 | Add authenticated responsive checks for Reports page at 320, 360, 375, 390, 414, 768, and desktop widths. |

## 12. Evidence

Primary files reviewed:

| File | Relevant Lines / Items |
|---|---|
| `frontend/src/pages/ReportPage.tsx` | `ReportType` at line 16; tabs at lines 18-25; loader switch at lines 40-48; export action at lines 63-82; columns at lines 102-178; filters and table at lines 331-352 |
| `frontend/src/services/reportService.ts` | filter shape at lines 6-10; report item types at lines 12-57; API methods at lines 62-106; export method at lines 136-139 |
| `frontend/src/App.tsx` | Reports route at line 67 |
| `frontend/src/routes/ProtectedRoute.tsx` | login-only route protection at lines 5-16 |
| `frontend/src/layouts/Sidebar.tsx` | Reports nav roles at line 29; role filtering at lines 71-80 |
| `backend/app/Modules/Report/Routes/api.php` | role-restricted report group at line 6; endpoints at lines 8-18 |
| `backend/app/Modules/Asset/Routes/api.php` | reissuance report routes at lines 45-46 |
| `backend/app/Modules/Report/Controllers/ReportController.php` | report handlers at lines 21, 59, 99, 134, 166, 196 |
| `backend/app/Services/DocumentExportService.php` | report title map at lines 449-457; export row switch starts at line 469 |

Commands run for evidence:

```text
php artisan route:list
php artisan route:list --path=api/v1/reports
php artisan route:list --path=api/v1/reports/reissuances
php artisan schedule:list
npx eslint src/pages/ReportPage.tsx src/services/reportService.ts
rg --files frontend/src/pages frontend/src/components frontend/src/services frontend/src/layouts backend/app backend/routes backend/database/migrations
```

## Closing Answers

1. Is the Reports page finished?
   No. It is partially implemented.

2. Are all visible report tabs backed by APIs?
   Yes, visible tabs have data service methods and backend endpoints.

3. Are all implemented backend reports visible on the page?
   No. Reservations exists in backend/service code but is not visible on the Reports page.

4. Are exports complete?
   No. User activity and reservations have title metadata but no export row-building case in the generic export service.

5. Is RBAC consistent?
   No. Most reports use the Report module role group, but reissuance report data is routed through the Asset module with only authenticated access.

6. Is the page type/lint clean?
   No. Scoped lint reports one hook dependency warning and three `any` errors in `ReportPage.tsx`.

7. Is mobile web verified?
   Not fully. Static risks exist due to wide tabs/tables; authenticated mobile testing is still needed.

8. What should be fixed first?
   Fix reissuance report RBAC first, then expose or remove reservations consistently, then complete export support and page typing.
