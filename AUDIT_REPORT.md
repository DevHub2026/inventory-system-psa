# 1. CURRENT SYSTEM STATUS

Overall assessment: The PSA Region XII Inventory Management System is a substantial Laravel + React/Vite web application with most core modules implemented and wired. It is not yet deployment-ready because security/RBAC inconsistencies, frontend lint debt, incomplete reports/exports, log-only email configuration, and runtime verification gaps remain.

Deployment readiness: Not ready. Backend tests pass and frontend production build passes, but current `.env` is local/debug/log-mail, queue/scheduler deployment is unverified, and several P0/P1 authorization findings remain.

Backend: Stronger than frontend quality gate. `php artisan route:list` shows 234 routes, `php artisan schedule:list` shows 4 scheduled commands, and `php artisan test` passed with 363 tests and 1428 assertions.

Frontend: Builds successfully with Vite, but `npm run lint` fails with 116 problems: 93 errors and 23 warnings. Core page routing is authentication-only; role hiding is mostly sidebar/UI-level.

Security: Mixed. Sanctum, session-token middleware, policies, and role middleware exist, but several sensitive routes are broader than expected.

Email: Partially implemented. Laravel mail/notifications exist, password reset path exists, and overdue reminders are queued notifications, but current mailer is `log`; production SMTP/provider delivery is not active.

Reports: Implemented but not enterprise-complete. Basic report tabs exist for assets, borrowings, overdue, inventory, low stock, user activity, and reissuances. Reservations report exists in backend/service but is not surfaced in the UI. Some exports are empty/incomplete.

Mobile web: Partially implemented by responsive layout, scroll wrappers, mobile sidebar, and QR routes. Authenticated runtime verification at 320, 360, 375, 390, 414, 768, and desktop widths is still needed.

# 2. VERIFIED FEATURE MATRIX

| Feature | Frontend | Backend | DB | API | RBAC | Tests | Runtime Verification | Status | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| Authentication | Login/auth hook/services | AuthController/AuthService | users, tokens, sessions | login/logout/me/profile/password | Sanctum + session token + throttles | Yes | Automated backend only | FULLY IMPLEMENTED & USED | `backend/routes/api.php:12-28`, `frontend/src/services/authService.ts` |
| Profile/session management | Settings/Sessions pages | AuthController/SessionController | users, user_sessions | `/profile`, `/change-password`, `/sessions` | Authenticated user | Yes | Not browser-verified | FULLY IMPLEMENTED & USED | `backend/routes/api.php:21-28`, `frontend/src/pages/SessionsPage.tsx` |
| Users | Users page/service | UserController/UserService | users, role_user | `/users` | Policies | Yes | Not browser-verified | FULLY IMPLEMENTED & USED | `backend/routes/api.php:31-54`, `backend/tests/Feature/Auth/UserManagementTest.php` |
| Roles | Roles page/service | RoleController/RoleService | roles, role_user | `/roles` | Policies | Yes | Not browser-verified | FULLY IMPLEMENTED & USED | `backend/routes/api.php:56-75` |
| Permissions | Permissions page/service | PermissionController | permissions, permission_role | `/permissions` | Super Administrator middleware | Yes | Not browser-verified | IMPLEMENTED BUT INCOMPLETE | `backend/routes/api.php:86-92`, `frontend/src/pages/PermissionsPage.tsx` |
| RBAC/authorization | Sidebar role helpers | Policies + role middleware | role/permission tables | Mixed | Inconsistent | Partial | Static only | BROKEN / INCONSISTENT | `frontend/src/routes/ProtectedRoute.tsx:5-16`, `frontend/src/layouts/Sidebar.tsx:29-49` |
| Dashboard | DashboardPage | DashboardController/Service | domain tables | `/dashboard/*` | Auth only | Yes | Not browser-verified | FULLY IMPLEMENTED & USED | `backend/app/Modules/Dashboard/Routes/api.php` |
| Asset CRUD | AssetPage/service | AssetController/AssetService | assets/setup tables | `/assets` | AssetPolicy | Yes | Not browser-verified | FULLY IMPLEMENTED & USED | `backend/app/Modules/Asset/Controllers/AssetController.php:28-236` |
| Asset identifiers/QR | QR UI/components | AssetIdentifierController/QrScanController | asset_identifiers, qr_scan_histories | `/asset-identifiers`, `/qr/*` | Mixed auth/role | Yes | Camera not verified | IMPLEMENTED BUT INCOMPLETE | `backend/app/Modules/QrScan/Routes/api.php`, `frontend/src/pages/QRScannerPage.tsx` |
| Asset lifecycle | Asset actions/modals | Asset, Disposal, issuance controllers | asset status/disposal/issuance columns | archive/restore/transfer/dispose/reissue/issue | Mixed | Partial | Not fully verified | IMPLEMENTED BUT INCOMPLETE | `backend/app/Modules/Asset/Routes/api.php:20-54` |
| Asset attachments | AssetPage calls | AssetAttachmentController | asset_attachments | `/assets/{asset}/attachments` | AssetPolicy view/update | No focused test found | Not runtime-verified | RECENTLY IMPLEMENTED - NEEDS VERIFICATION | `backend/database/migrations/2026_08_16_202000_create_asset_attachments_table.php`, `backend/app/Modules/Asset/Controllers/AssetAttachmentController.php` |
| Permanent issuance | IssuedAssets components | PermanentIssuanceController | asset issuance fields/history | `/permanent-issuances/*` | Assign authorizes, lookup auth-only | Yes | Not runtime-verified | IMPLEMENTED BUT INCOMPLETE | `backend/app/Modules/Asset/Routes/api.php:49-52` |
| Reissuance | Reissue modal/report tab | AssetReissuanceController | asset_issuance_histories | `/assets/{asset}/reissue`, `/reports/reissuances` | Report route auth-only | Partial | Not runtime-verified | BROKEN / INCONSISTENT | `backend/app/Modules/Asset/Routes/api.php:42-46` |
| Inventory CRUD | InventoryPage/service | InventoryController/Service | inventory_items | `/inventory` | Role middleware | Yes | Not browser-verified | FULLY IMPLEMENTED & USED | `backend/app/Modules/Inventory/Routes/api.php:12-27` |
| Stock in/out/adjustment | InventoryPage actions | InventoryController/Service | stock_transactions | stock operation routes | Role middleware | Yes | Not browser-verified | FULLY IMPLEMENTED & USED | `backend/app/Modules/Inventory/Services/InventoryService.php:648-690` |
| Inventory transfer | InventoryPage transfer UI | InventoryController/Service | transfer metadata on stock_transactions | `/inventory/{item}/transfer` | Role middleware | Some coverage | Not runtime-verified | RECENTLY IMPLEMENTED - NEEDS VERIFICATION | `backend/app/Modules/Inventory/Services/InventoryService.php:713`, `backend/database/migrations/2026_08_16_200000_add_transfer_metadata_to_stock_transactions_table.php` |
| Inventory count/reconciliation | InventoryPage count UI | InventoryController/Service | inventory_count_sessions/items | count-session routes | Role middleware | Not clearly focused | Not runtime-verified | RECENTLY IMPLEMENTED - NEEDS VERIFICATION | `backend/app/Modules/Inventory/Controllers/InventoryController.php:375-439`, `backend/database/migrations/2026_08_16_201000_create_inventory_count_tables.php` |
| Inventory import/export | Wizard/export UI | Import and Inventory controllers | inventory_imports | import/export routes | Role middleware | Yes | Not browser-verified | IMPLEMENTED BUT INCOMPLETE | `backend/app/Modules/Inventory/Routes/api.php:35-48`, `backend/app/Modules/Import/Routes/api.php` |
| Borrowing | BorrowingPage/QR request | BorrowingController/Service | borrowings | `/borrowings`, `/assets/request-borrow` | Auth + service checks | Yes | Not browser-verified | FULLY IMPLEMENTED & USED | `backend/app/Modules/Borrowing/Services/BorrowingService.php:58-96` |
| Returns | BorrowingPage/QR result | BorrowingController/Service | returned fields | return routes | Mixed | Yes | Not browser-verified | FULLY IMPLEMENTED & USED | `backend/app/Modules/Borrowing/Services/BorrowingService.php:107-134` |
| Borrowing extensions | ExtensionRequestsPage/modal | BorrowExtensionController/Service | borrow_extension_requests | extension routes | Approve/reject auth-only | Yes | Not browser-verified | IMPLEMENTED BUT INCOMPLETE | `backend/app/Modules/Borrowing/Routes/api.php:16-21` |
| Reservations | ReservationPage/service | ReservationController/Service | reservations/items | `/reservations` | Approve/release/reject role middleware | Yes | Not browser-verified | IMPLEMENTED BUT INCOMPLETE | `backend/app/Modules/Reservation/Routes/api.php` |
| Reservation conflict/availability | Asset selection/status checks | ReservationService | reservations/items/assets | create/approve/release | Service checks | Yes | Not runtime-verified | IMPLEMENTED BUT INCOMPLETE | `backend/app/Modules/Reservation/Services/ReservationService.php:60` |
| Maintenance | MaintenancePage/service | MaintenanceController/Service | maintenances | `/maintenances` | Role middleware for management | Yes | Not browser-verified | FULLY IMPLEMENTED & USED | `backend/app/Modules/Maintenance/Routes/api.php:13-23` |
| Maintenance reminders | No config UI | SendMaintenanceReminders command | maintenances/notifications | scheduler | Console | No focused runtime test | Not deployed-verified | RECENTLY IMPLEMENTED - NEEDS VERIFICATION | `backend/app/Console/Commands/SendMaintenanceReminders.php`, `backend/routes/console.php:14` |
| Damage reporting | QR modal | MaintenanceController | maintenances damage fields | `/assets/{asset}/report-damage` | Any auth user | Yes | Not mobile-verified | IMPLEMENTED BUT INCOMPLETE | `backend/app/Modules/Maintenance/Routes/api.php:8-10` |
| Disposal/retirement | Asset/Inventory UI | DisposalController | disposal fields | dispose/finalize/cancel | Staff/admin role middleware | Yes | Not runtime-verified | RECENTLY IMPLEMENTED - NEEDS VERIFICATION | `backend/app/Modules/Asset/Routes/api.php:36-40` |
| Document templates | DocumentTemplatesPage | DocumentTemplateController/Service | templates/versions/generated | `/document-templates`, `/documents/generate` | Admin write, auth/report role read | Yes | Not browser-verified | FULLY IMPLEMENTED & USED | `backend/app/Modules/SystemSetup/Routes/api.php`, `backend/app/Modules/Report/Services/DocumentExportService.php:36` |
| Workflow configuration | WorkflowsPage | WorkflowController/Service/Engine | workflow tables | `/workflows/*` | Admin management | Yes | Domain integration not verified | IMPLEMENTED BUT UNUSED / UNWIRED | `backend/app/Modules/Workflow/Routes/api.php`, `backend/app/Modules/Workflow/Services/WorkflowEngineService.php` |
| Reports | ReportPage | ReportController/ReportService | source domain tables | `/reports/*` | Mostly role middleware | Report tests | Not browser-verified | BROKEN / INCONSISTENT | `frontend/src/pages/ReportPage.tsx`, `backend/app/Modules/Report/Routes/api.php` |
| Report exports | Export buttons | DocumentExportService | temp files | `/reports/export`, reissuance export | Inconsistent | Partial | Not downloaded/inspected | BROKEN / INCONSISTENT | `backend/app/Modules/Report/Services/DocumentExportService.php:444-537` |
| Audit logs/history | QR history page, audit APIs | AuditLog/QrScan controllers | audit_logs, qr_scan_histories | `/audit-logs`, `/qr/history` | Auditor/admin for full logs | Yes | Not browser-verified | IMPLEMENTED BUT INCOMPLETE | `backend/app/Modules/AuditLog/Routes/api.php`, `backend/app/Modules/QrScan/Routes/api.php:24-27` |
| Notifications | NotificationBell/service | NotificationController/Service | notifications | `/notifications/*` | Auth user | Yes | Not browser-verified | FULLY IMPLEMENTED & USED | `backend/app/Modules/Notification/Routes/api.php`, `frontend/src/components/NotificationBell.tsx` |
| Email | Preference UI only | Laravel notifications/mail | jobs table | password reset/notify paths | User preference | Partial | Not SMTP-verified | IMPLEMENTED BUT INCOMPLETE | `backend/.env:52`, `backend/app/Notifications/OverdueBorrowingReminder.php` |
| Scheduler | No admin UI | 4 scheduled commands | domain tables | console scheduler | Console | schedule:list only | Cron/worker not verified | IMPLEMENTED BUT INCOMPLETE | `backend/routes/console.php:11-14` |
| Mobile web | Responsive app layout/QR route | N/A | N/A | N/A | N/A | Build only | Not authenticated viewport-tested | IMPLEMENTED BUT INCOMPLETE | `frontend/src/layouts/Sidebar.tsx`, `frontend/src/App.tsx:52-55` |
| Old split inventory pages | Files exist | Uses inventory services | existing DB | no route | N/A | N/A | Not reachable | IMPLEMENTED BUT UNUSED / UNWIRED | `frontend/src/pages/ExpendableInventoryPage.tsx`, `frontend/src/pages/NonExpendableInventoryPage.tsx`, no import in `App.tsx` |
| Asset history report | No report UI | No dedicated report found | history tables exist | no dedicated report endpoint | N/A | N/A | N/A | NOT IMPLEMENTED | search across Reports module |
| Inventory movement report | No report UI | No dedicated report found | stock_transactions exist | no dedicated report endpoint | N/A | N/A | N/A | NOT IMPLEMENTED | search across Reports module |
| Maintenance cost/history report | No report UI | No dedicated report found | maintenances exist | no dedicated report endpoint | N/A | N/A | N/A | NOT IMPLEMENTED | search across Reports module |
| Audit log report | No Reports tab | Audit API exists only | audit_logs | `/audit-logs` | Auditor/admin | Yes | Not report-verified | NOT IMPLEMENTED | `backend/app/Modules/AuditLog/Routes/api.php` |

# 3. P0 FINDINGS

| Finding | Evidence | Risk | Recommended fix |
|---|---|---|---|
| Production environment is unsafe for deployment | `backend/.env:2` has `APP_ENV=local`; `backend/.env:4` has `APP_DEBUG=true`; `backend/.env:52` has `MAIL_MAILER=log` | Debug exposure, local-only behavior, and no real email delivery | Prepare production env values, disable debug, configure real mail, queue, cache, storage, HTTPS, CORS, and process supervision before deployment. |
| Reissuance report authorization is inconsistent | `GET /api/v1/reports/reissuances` is registered in `backend/app/Modules/Asset/Routes/api.php:45` inside only `auth:sanctum`; normal report routes use role middleware at `backend/app/Modules/Report/Routes/api.php:6-18` | Sensitive transfer/reissuance report data may be exposed to any authenticated user | Move reissuance report routes into Report module RBAC group or add equivalent route middleware/internal authorization. |
| Frontend quality gate fails | `npm run lint` failed with 93 errors and 23 warnings | Build passes, but lint/type quality is not production-clean; `@ts-nocheck` hides core page errors | Fix lint blockers before deployment, starting with `AssetPage.tsx:1`, `ReportPage.tsx:350-352`, React compiler errors, and unused expressions. |

# 4. P1 FINDINGS

| Finding | Evidence | Risk | Recommended fix |
|---|---|---|---|
| Borrow extension approve/reject routes are too broad | `backend/app/Modules/Borrowing/Routes/api.php:19-20` uses only the module auth group | Any authenticated user may reach approval endpoints unless service-level checks fully cover it | Add role middleware or explicit controller authorization for staff/admin reviewers. |
| Permanent issuance lookup/search routes are too broad | `backend/app/Modules/Asset/Routes/api.php:49-51` are inside only `auth:sanctum`; only assign has `authorize('issue')` in `PermanentIssuanceController.php:83` | User directory/search data may be visible to roles that should not browse issuance targets | Restrict lookup routes or scope employee self-service lookups separately. |
| Report exports are incomplete | `DocumentExportService.php:449-457` has titles for reservations/user activity; switch cases at `:470-537` omit row support | Official exports can be empty or inconsistent with UI | Add export row cases and tests for every visible/existing report. |
| Reservations report exists but is not surfaced | `reportService.getReservations()` exists at `frontend/src/services/reportService.ts:74`; `ReportPage.tsx:16-25` excludes `reservations` | Backend capability is implemented but users cannot access it from Reports page | Add a reservations tab/columns/export or intentionally remove/deprecate the unused path. |
| Email is not production SMTP/provider-ready | Current `.env` uses log mailer; `.env.example` has placeholders only | Password reset/overdue email cannot reach users in current config | Configure provider-neutral mail env, queue worker, failed job monitoring, and delivery test process. |

# 5. P2 FINDINGS

| Finding | Evidence | Risk | Recommended fix |
|---|---|---|---|
| Reports are basic, not enterprise detailed | ReportPage tabs only cover basic data; no asset history/inventory movement/maintenance/disposal/audit report tabs | Reporting roadmap remains incomplete | Stabilize existing reports first, then add Phase 2 detailed reporting. |
| Generic report filters are insufficient | `ReportPage.tsx` loads reports without context-specific filter controls; service supports generic params | Users cannot reliably produce operationally precise reports | Add per-report filters after export parity is fixed. |
| Export/display parity is not guaranteed | UI JSON mapping is in `ReportController`; exports rebuild rows separately in `DocumentExportService` | Screen and official exports can diverge | Add shared transformers or parity tests per report type. |
| Mobile web needs authenticated runtime verification | Static responsive code exists, but no authenticated viewport run was completed | Dense tables/modals may be unusable on mobile | Test 320/360/375/390/414/768/desktop for high-use workflows. |
| Workflow engine integration is uneven | Workflow module/routes exist, but domain operations can proceed via direct service paths/fallbacks | Approval governance may not match configured workflow expectations | Define required workflow-governed operations and verify integration per domain. |

# 6. P3 FINDINGS

| Finding | Current state | Recommended timing |
|---|---|---|
| Scheduled reports | Not implemented | After existing reports and email delivery are stable |
| Email report delivery | Not implemented | After mail provider, queue, report exports, and recipient model are production-ready |
| Saved report/filter presets | Not implemented | Only after users prove repeatable filter patterns are valuable |
| Advanced workflow integration | Workflow engine exists but is not uniformly enforced | After P0/P1 authorization and core workflows stabilize |

# 7. SECURITY / RBAC MATRIX

| Severity | Route | Current middleware | Expected authorization | Evidence | Risk | Recommended fix |
|---|---|---|---|---|---|---|
| P0 | `GET /api/v1/reports/reissuances` | `auth:sanctum` via Asset module | Same report roles as other reports or internal report authorization | `backend/app/Modules/Asset/Routes/api.php:45`; `backend/app/Modules/Report/Routes/api.php:6` | Authenticated users may access sensitive report data | Move route or add role middleware/authorization. |
| P1 | `GET /api/v1/reports/reissuances/export` | `auth:sanctum` route; controller export previously traced with internal authorization | Route should visibly match report RBAC | `backend/app/Modules/Asset/Routes/api.php:46` | Route contract differs from data endpoint and report module | Align route middleware with Report module. |
| P1 | `PATCH /api/v1/extension-requests/{id}/approve` | `auth:sanctum` | Staff/admin reviewer roles | `backend/app/Modules/Borrowing/Routes/api.php:19` | User could attempt approving own/others extension if service misses a case | Add role middleware or controller policy. |
| P1 | `PATCH /api/v1/extension-requests/{id}/reject` | `auth:sanctum` | Staff/admin reviewer roles | `backend/app/Modules/Borrowing/Routes/api.php:20` | Same as approve route | Add role middleware or controller policy. |
| P1 | `GET /api/v1/permanent-issuances/users` | `auth:sanctum` | Issuance-capable roles or scoped self-service | `backend/app/Modules/Asset/Routes/api.php:50` | User directory exposure | Restrict route or split admin directory from self lookup. |
| P1 | `GET /api/v1/permanent-issuances/users/search` | `auth:sanctum` | Issuance-capable roles or scoped self-service | `backend/app/Modules/Asset/Routes/api.php:49` | Searchable user data exposure | Add role middleware/scope. |
| P2 | `/reports/*` except reissuances | `auth:sanctum` + report role middleware | Report roles | `backend/app/Modules/Report/Routes/api.php:6-18` | Mostly correct | Keep as baseline. |
| P2 | `GET /api/v1/audit-logs*` | `auth:sanctum` + Super/System/Auditor | Auditor/admin | `backend/app/Modules/AuditLog/Routes/api.php:6-12` | Correct pattern | Keep. |
| P2 | `GET /api/v1/qr/history` | `auth:sanctum` + role middleware | Staff/admin inventory roles | `backend/app/Modules/QrScan/Routes/api.php:24-27` | Correct pattern for full history | Keep. |
| P2 | Asset attachment download/delete | `auth:sanctum`, controller policy | Asset view/update policy | `backend/app/Modules/Asset/Controllers/AssetAttachmentController.php:59-75` | Good internal policy; recently added | Add tests and runtime verification. |
| P2 | Import endpoints | `auth:sanctum` + role middleware | Inventory/admin staff roles | `backend/app/Modules/Import/Routes/api.php:6-17` | Correct route-level restriction | Keep and test imports. |
| P2 | Frontend page routes | ProtectedRoute auth only | Role-aware route guard or graceful unauthorized page | `frontend/src/routes/ProtectedRoute.tsx:5-16` | Direct URL access reaches pages hidden from sidebar | Add frontend role route guard for UX; keep backend enforcement. |

# 8. EMAIL AUDIT

Database notifications:

| Use case | Current state | Evidence |
|---|---|---|
| Low stock | Sends DB notifications to staff/admin | `backend/app/Console/Commands/SendLowStockAlerts.php` |
| Maintenance reminders | Sends DB notifications to staff/admin | `backend/app/Console/Commands/SendMaintenanceReminders.php` |
| Insurance expiration | Sends DB notifications to admins | `backend/app/Console/Commands/CheckInsuranceExpiration.php` |
| General notification API | Notification list/read/unread APIs exist | `backend/app/Modules/Notification/Routes/api.php` |

Email notifications:

| Use case | Current state | Evidence |
|---|---|---|
| Password reset | Laravel password broker path exists | `backend/app/Modules/Auth/Services/AuthService.php:69-72` |
| Overdue reminder | Queued notification exists and is invoked by scheduler command | `backend/app/Notifications/OverdueBorrowingReminder.php`, `backend/app/Console/Commands/SendOverdueBorrowingReminders.php:77` |
| BorrowNotification | Class exists but no active caller was confirmed | `backend/app/Notifications/BorrowNotification.php` |
| Report delivery email | Not implemented | No route/job found |

Queued email:

- `OverdueBorrowingReminder` implements queued notification behavior and depends on the Laravel queue.
- `QUEUE_CONNECTION=database` is present in `backend/.env:38`.
- Queue worker deployment is required; scheduler registration alone is insufficient.

Scheduler-triggered email:

- `borrowings:send-overdue-reminders` is scheduled daily in `backend/routes/console.php:12`.
- The command only reaches users if they have email notifications enabled, mail is configured, and a worker processes queued jobs.

Current configuration:

- `backend/.env:52` has `MAIL_MAILER=log`.
- `backend/.env.example:50-57` contains SMTP placeholders.

Production requirements:

- Use provider-neutral Laravel mail env configuration.
- Set real `MAIL_MAILER`, host/provider, credentials, from address, and queue worker.
- Configure failed job handling and delivery monitoring.
- Keep database notifications separate from email delivery semantics.
- Validate password reset URL/domain in production.
- Architecture can support provider changes through env/config, but current `.env.example` should be hardened for the chosen deployment model.

# 9. REPORT RECONCILIATION

| Report | UI tab | Frontend service | API endpoint | Controller/query | Authorization | Filters | Displayed columns | Export columns | Excel | CSV | Print/PDF | Tests | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Assets | Yes | `getAssets` | `GET /reports/assets` | `ReportController::assets` + ReportService | Report role group | params accepted | property/asset/name/category/status/accountability/location | ID/property/asset/name/category/manufacturer/office/location/status/accountability/condition/cost | Yes | Yes | Browser print only | Report API tests | IMPLEMENTED BUT INCOMPLETE |
| Borrowings | Yes | `getBorrowings` | `GET /reports/borrowings` | `ReportController::borrowings` | Report role group | params accepted | asset/borrower/borrow date/due/status | ID/asset/borrower/borrow/due/status/remarks | Yes | Yes | Browser print only | Report API tests | FULLY IMPLEMENTED & USED |
| Overdue | Yes | `getOverdue` | `GET /reports/overdue` | `ReportController::overdue` | Report role group | limited | asset/borrower/due/days overdue | ID/asset/borrower/borrow/due/status/remarks | Yes | Yes | Browser print only | Report API tests | FULLY IMPLEMENTED & USED |
| Inventory | Yes | `getInventory` | `GET /reports/inventory` | `ReportController::inventory` | Report role group | params accepted | sku/name/quantity/reorder | ID/name/sku/quantity/unit/reorder/manufacturer/office/location | Yes | Yes | Browser print only | Report API tests | FULLY IMPLEMENTED & USED |
| Low stock | Yes | `getLowStock` | `GET /reports/low-stock` | `ReportController::lowStock` | Report role group | limited | name/current qty/alert level | ID/name/sku/quantity/unit/reorder/manufacturer/office/location | Yes | Yes | Browser print only | Report API tests | IMPLEMENTED BUT INCOMPLETE |
| User activity | Yes | `getUserActivity` | `GET /reports/user-activity` | `ReportController::userActivity` | Report role group | params accepted | user/asset/action/date | Falls to default empty rows | Broken | Broken | Browser print only | Report API tests likely data only | BROKEN / INCONSISTENT |
| Reissuances | Yes | `getReissuances` | `GET /reports/reissuances` | `AssetReissuanceController::report` | Auth-only route group | params accepted | asset/from/to/transferred/date/reason | Special export path | Yes via special path | Yes via special path | Browser print only | Partial | BROKEN / INCONSISTENT |
| Reservations | No | `getReservations` | `GET /reports/reservations` | `ReportController::reservations` | Report role group | params accepted | N/A | Falls to default empty rows | Broken/unreachable from UI | Broken/unreachable from UI | Not visible | Unknown | IMPLEMENTED BUT UNUSED / UNWIRED |

Enterprise reporting roadmap gap:

| Enterprise report | Current status |
|---|---|
| Asset Register / detailed Asset report | Basic asset report exists; not full lifecycle/detail report. |
| Asset History | Not implemented as Reports page report. |
| Inventory Stock | Basic inventory report exists. |
| Inventory Movement | Stock transactions exist; no report tab/export. |
| Inventory Count / Variance | Count session feature exists; no report tab/export. |
| Borrowing History / Overdue | Basic borrowing and overdue reports exist. |
| Reservation History | Backend endpoint/service exists; UI tab missing. |
| Maintenance History / Cost | Maintenance module exists; no report tab/export. |
| Disposal History | Disposal fields/workflow exist; no report tab/export. |
| Audit Log | Audit API exists; no Reports page report/export. |

# 10. RECENTLY IMPLEMENTED FEATURES

| Feature | Frontend | Backend | Database | API | Authorization | Tests | Runtime concerns | Status |
|---|---|---|---|---|---|---|---|---|
| Inventory transfer | InventoryPage transfer modal/action | `InventoryController::transfer`, `InventoryService::transfer` | transfer metadata on stock_transactions | `POST /inventory/{item}/transfer` | Inventory role middleware | Some inventory tests touched | Needs real inventory/location scenario testing and export/history parity | RECENTLY IMPLEMENTED - NEEDS VERIFICATION |
| Inventory count | InventoryPage count session UI | count session methods in InventoryController/Service | inventory_count_sessions/items | count-session routes | Inventory role middleware | Not clearly isolated | Needs count/reconcile workflow tests and UI verification | RECENTLY IMPLEMENTED - NEEDS VERIFICATION |
| Asset attachments | AssetPage upload/download/delete | AssetAttachmentController | asset_attachments | attachment routes | AssetPolicy view/update | No focused test found | Needs upload/download/delete runtime test, storage permissions, file validation check | RECENTLY IMPLEMENTED - NEEDS VERIFICATION |
| Low-stock scheduler | No config UI | SendLowStockAlerts command | inventory_items + notifications | scheduler command | Console | schedule:list only | Needs duplicate/idempotency and notification volume review | RECENTLY IMPLEMENTED - NEEDS VERIFICATION |
| Maintenance scheduler | No config UI | SendMaintenanceReminders command | maintenances + notifications | scheduler command | Console | schedule:list only | Needs duplicate/idempotency and production cron verification | RECENTLY IMPLEMENTED - NEEDS VERIFICATION |

# 11. UNUSED / ORPHANED CODE

| Code | Search evidence | Classification | Impact |
|---|---|---|---|
| `ExpendableInventoryPage` | File exists; no import in `frontend/src/App.tsx`; direct search only found its own export | IMPLEMENTED BUT UNUSED / UNWIRED | Old split inventory UI is not routed. |
| `NonExpendableInventoryPage` | File exists; no import in `frontend/src/App.tsx`; direct search only found its own export | IMPLEMENTED BUT UNUSED / UNWIRED | Old split inventory UI is not routed. |
| `InventorySelectionPage` | File exists; no import in `frontend/src/App.tsx`; direct search only found its own export | IMPLEMENTED BUT UNUSED / UNWIRED | Old selection UI is not routed. |
| `AssetQrScanner` | `frontend/src/components/AssetQrScanner.tsx` exists; search found no consumer | IMPLEMENTED BUT UNUSED / UNWIRED | Possible legacy scanner implementation. |
| Reservations report service | `reportService.getReservations` exists; `ReportPage` lacks tab/type case | IMPLEMENTED BUT UNUSED / UNWIRED | Backend report capability is unreachable from UI. |
| `withMockFallback` | Defined in `frontend/src/services/api.ts`; no business service consumer found | Low-risk unused helper | Does not appear to silently return fake data in production path. |
| `BorrowNotification` | Notification class exists; no active caller confirmed by search | IMPLEMENTED BUT UNUSED / UNWIRED | Email notification path may be leftover. |
| `backend/database/dump/DemoDataSeeder.php` | Demo data seeder exists | Development-only artifact | Not production-impacting unless manually run. |

# 12. FRONTEND QUALITY

Lint:

- `npm run lint` failed.
- Result: 116 problems, 93 errors, 23 warnings.

TypeScript/build:

- `npm run build` passed.
- Vite produced a large chunk warning: main built JS chunk around 1.9 MB before gzip.

`@ts-nocheck`:

- `frontend/src/pages/AssetPage.tsx:1` disables TypeScript checking on a core page.

Representative lint/type issues:

| File | Issue |
|---|---|
| `frontend/src/pages/ReportPage.tsx:350-352` | `any` casts at table boundary. |
| `frontend/src/components/AccessibilityQaPanel.tsx:29` | React compiler immutability issue: uses `getSelector` before declaration. |
| `frontend/src/components/qr/BorrowRequestModal.tsx:17` | `Date.now()` purity violation during render. |
| `frontend/src/pages/WorkflowsPage.tsx:116` | Unused expression error. |
| `frontend/src/pages/AssetPage.tsx:1` | banned `@ts-nocheck`. |

Route protection:

- `ProtectedRoute` only checks authenticated user.
- Sidebar hides links by role, but this is not authorization.
- Backend must remain the source of truth; frontend role route guards would improve UX.

API contract issues:

- Reservations report service exists but Reports page type/tabs omit it.
- Reissuance report export uses a special endpoint while other reports use shared export.
- Export row fields are built separately from displayed controller mappings, risking divergence.

# 13. DATABASE / DATA INTEGRITY

Foreign keys and relationships:

- Core tables use foreign keys broadly: assets, asset identifiers, borrowings, reservations, inventory, maintenance, notifications, workflows, generated documents, attachments, count sessions.
- Many relationships use `cascadeOnDelete`, `nullOnDelete`, `restrictOnDelete`, indexes, and unique constraints.

Status consistency:

- Statuses are mostly string fields enforced by app-level enums/validation rather than DB enums.
- Borrowing statuses include uppercase values like `BORROWED`/`RETURNED`; extension status enum uses lower-case values. This is workable but requires consistent transforms.

Migrations:

- Recent migrations exist for transfer metadata, inventory counts, and asset attachments:
  - `backend/database/migrations/2026_08_16_200000_add_transfer_metadata_to_stock_transactions_table.php`
  - `backend/database/migrations/2026_08_16_201000_create_inventory_count_tables.php`
  - `backend/database/migrations/2026_08_16_202000_create_asset_attachments_table.php`

Duplicate/legacy tables:

- Both `borrows` and `borrowings` exist, and there is a legacy `backend/app/Http/Controllers/BorrowController.php` alongside module borrowing controllers.
- This may be compatibility, but it should be reviewed before deployment to avoid split workflow semantics.

Data integrity risks:

- Recently added count/reconcile and transfer features need targeted tests for stock quantity correctness.
- Report exports do not always use the same transform as displayed data.
- Scheduler-generated notifications need idempotency review for low-stock and maintenance reminders.

# 14. DEPLOYMENT READINESS CHECKLIST

READY:

| Item | Evidence |
|---|---|
| Backend automated tests | `php artisan test` passed: 363 tests, 1428 assertions. |
| Backend route registration | `php artisan route:list` passed: 234 routes. |
| Scheduler registration | `php artisan schedule:list` shows 4 commands. |
| Frontend production build | `npm run build` passed. |
| Queue schema | jobs table migration exists; `QUEUE_CONNECTION=database`. |

NOT READY:

| Item | Evidence / issue |
|---|---|
| `APP_ENV` | `backend/.env:2` is `local`. |
| `APP_DEBUG` | `backend/.env:4` is `true`. |
| Mail | `backend/.env:52` is `MAIL_MAILER=log`. |
| Frontend lint | `npm run lint` fails. |
| Security/RBAC | P0/P1 route authorization findings remain. |
| HTTPS/security deployment | No production web server/HTTPS verification in audit. |
| Process supervision | Queue worker and scheduler cron/process manager not verified. |
| Report export completeness | User activity/reservations export incomplete. |

NEEDS VERIFICATION:

| Item | Verification needed |
|---|---|
| `APP_KEY` | Confirm production value exists and is not shared. |
| Database | Confirm PostgreSQL production credentials, migrations, backups. |
| Storage | Confirm symlink/private disk permissions for uploads/templates/generated docs. |
| Cache | Confirm production cache driver and config caching process. |
| Queue | Confirm worker process, failed job monitoring, retry policy. |
| Scheduler | Confirm cron/process manager runs `schedule:run`. |
| CORS | Confirm allowed production frontend origin. |
| Frontend API URL | Confirm production `VITE_API_BASE_URL`. |
| Web server | Confirm Laravel public root, Vite assets, headers, upload limits. |
| Mobile web | Authenticated viewport and camera testing. |

# 15. RECOMMENDED DEVELOPMENT SEQUENCE

1. P0 security/deployment blockers: production env readiness, reissuance report RBAC, frontend lint gate.
2. P1 authorization and production infrastructure: extension approval RBAC, permanent issuance lookup scoping, mail/queue/scheduler deployment.
3. Stabilize existing reports: reservations tab decision, user activity mapping, export cases, export/display parity tests.
4. Verify recently implemented inventory/asset features: transfer, count/reconciliation, asset attachments, low-stock scheduler, maintenance scheduler.
5. Mobile web runtime verification across the requested widths and QR camera workflows.
6. Phase 2 detailed reporting: asset history, inventory movement, count/variance, maintenance history/cost, disposal history, audit log.
7. Email/report automation: scheduled reports, configurable recipients, report delivery.
8. Saved presets only if proven useful by repeated real-world filter usage.

# 16. CHANGE LOG / WHAT IS ALREADY DONE

What was already implemented before this audit:

- Authentication, profile, password reset/change, sessions.
- User, role, and permission management.
- Asset CRUD, identifiers, QR scan support, archive/restore/transfer scaffolding, issuance/reissuance/disposal flows.
- Inventory CRUD, stock in/out/adjustment, import/export, item types.
- Borrowing, returns, extension request model/service/UI.
- Reservations, approval/release/reject/cancel.
- Maintenance CRUD, scheduling, completion, damage reporting.
- Document templates, DOCX upload/versioning/preview/generation.
- Workflow configuration module and engine tables/services.
- Database notifications and notification bell.
- Audit logs and QR scan history APIs.
- Basic reports and report exports for several report types.

What was recently implemented:

- Inventory transfer metadata.
- Inventory count sessions/items and reconciliation.
- Asset attachments.
- Low-stock scheduler command.
- Maintenance reminder scheduler command.

What is now fixed compared with the previous audit:

- No source-code fixes were made during this audit. The verified state remains materially the same as the previous baseline: backend tests/build pass, frontend lint fails, reports/security/email/mobile gaps remain.

What remains unfinished:

- P0/P1 authorization and deployment blockers.
- Frontend lint/type cleanup.
- Report export completeness and reservations report surfacing.
- Runtime verification of recent inventory/asset work.
- Production mail/queue/scheduler configuration.
- Authenticated mobile web testing.
- Phase 2 enterprise detailed reports.

What should NOT be redone:

- Do not rebuild authentication.
- Do not rebuild asset CRUD.
- Do not rebuild inventory CRUD/stock operations.
- Do not rebuild borrowing/returns/reservations from scratch.
- Do not rebuild document template architecture.
- Do not replace Laravel notification architecture before configuring/verifying it.
- Do not start Phase 2 reports before stabilizing existing reports and exports.
- Do not treat native mobile as part of the current audit scope.

# 17. FINAL SOURCE-OF-TRUTH SUMMARY

COMPLETED:

- Authentication/session/profile foundation.
- User and role management.
- Core asset management.
- Core inventory CRUD and stock operations.
- Borrowing and returns.
- Maintenance CRUD/completion.
- Document templates/versioning/preview/generation.
- Database notifications.
- Backend route/test baseline.

PARTIAL:

- Permissions/product UX.
- RBAC consistency.
- Asset lifecycle governance.
- Permanent issuance.
- Borrowing extensions.
- Reservations conflict/runtime behavior.
- Inventory import/export parity.
- Reports and exports.
- Email delivery.
- Scheduler deployment.
- Mobile web.
- Workflow/domain integration.

RECENT:

- Inventory transfer metadata.
- Inventory count/reconciliation.
- Asset attachments.
- Low-stock scheduler.
- Maintenance reminder scheduler.

BROKEN:

- Reissuance report route authorization mismatch.
- Frontend lint gate.
- User activity/reservations report exports.
- Reservations report service not surfaced in UI.
- Current deployment env is local/debug/log-mail.

MISSING:

- Barcode-specific workflows.
- Asset history report.
- Inventory movement report.
- Inventory count/variance report.
- Maintenance history/cost report.
- Disposal history report.
- Audit log report in Reports page.
- Scheduled/email report delivery.

DO NOT REDO:

- Existing Laravel/React architecture.
- Existing auth/session architecture.
- Existing core CRUD modules.
- Existing document-template system.
- Existing notification foundation.
- Existing QR workflow foundation.

NEXT ACTION:

Fix P0 blockers first: production env readiness, reissuance report RBAC, and frontend lint. Then resolve P1 authorization/email/report issues before adding new detailed reports or automation.
