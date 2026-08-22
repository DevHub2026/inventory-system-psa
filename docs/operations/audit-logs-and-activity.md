# Audit Logs & Activity (implementation-backed)

Overview

The repository includes an audit_logs table and related models/migrations for recording application-level audit events. Separate history tables (e.g., qr_scan_histories) exist for specific domains.

Implemented and verified

- audit_logs table
  - Migration: backend/database/migrations/2026_07_16_050943_create_audit_logs_table.php defines audit_logs with fields user_id, action, module, description, old_values, new_values, ip_address, user_agent, timestamps.
  - Purpose: store high-level audit events produced by the application.

- Domain-specific history
  - QR scan histories: backend/database/migrations/*create_qr_scan_histories_table.php records scans with asset_id, user_id, action_performed, device, platform, browser, ip_address and timestamps.
  - Borrowing, maintenance, and other modules also maintain their own history/audit-like tables (see migrations and module models).

- Access & filtering
  - There is no global UI-level audit management described in the repository docs; controllers and services can query audit_logs; access to viewing audit entries is governed by policies (check backend/app/Policies and controllers that expose audit data where present).

- Retention / deletion
  - No automatic retention or deletion policy was found in the repository. Retention/archival is an operational concern for deployment and databases.

Operational notes

- Treat audit_logs as authoritative for recorded events, but recognize modules may also maintain separate domain-specific history tables.
- If you require retention policies, implement DB-level or scheduled job-based cleanup (not present in repository).

Source-of-truth files

- backend/database/migrations/2026_07_16_050943_create_audit_logs_table.php
- backend/database/migrations/*create_qr_scan_histories_table.php
- backend/app/Modules/* (various modules that write history/audit entries)
