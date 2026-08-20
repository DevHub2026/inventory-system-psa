# QR and History Schema (implementation-backed)

QR (scan) history

- Migration: backend/database/migrations/2026_07_29_200000_create_qr_scan_histories_table.php
- Table: qr_scan_histories
- Important columns:
  - asset_id (FK to assets) — required
  - user_id (nullable FK to users) — who performed the scan
  - action_performed (string, default 'VIEW')
  - device, platform, browser, ip_address
  - scanned_at (timestamp, useCurrent)
  - soft deletes
- Indexes on asset_id, user_id and action_performed for efficient queries
- Model: backend/app/Modules/QrScan/Models/QrScanHistory.php (or within module)

Asset issuance and history

- Asset issuance histories are recorded in asset_issuance_histories (migration: create_asset_issuance_histories_table.php)
- Columns track issuance events (issued_by, issued_to_user_id, issuance_type, timestamps) and link to assets

Audit logs and activity

- audit_logs migration exists (2026_07_16_050943_create_audit_logs_table.php) and stores general audit events; check migration for exact columns and indices

Notes

- QR scanning is implemented as a resolution + history recording flow: QR resolution endpoints map identifiers to an asset or other resource; history entries are recorded independently (QR resolution does not implicitly modify borrowing state unless an explicit domain action endpoint is called).

Source references

- backend/database/migrations/2026_07_29_200000_create_qr_scan_histories_table.php
- backend/database/migrations/2026_07_29_090000_create_asset_issuance_histories_table.php
- backend/database/migrations/2026_07_16_050943_create_audit_logs_table.php
- backend/app/Modules/QrScan/
- backend/app/Modules/Asset/
