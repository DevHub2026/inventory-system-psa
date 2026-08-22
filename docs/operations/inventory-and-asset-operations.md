# Inventory & Asset Operations (implementation-backed)

Overview

This section documents the operational workflows for inventory and asset management that are implemented in the repository.

Implemented workflows (verified)

- Inventory item creation, updates, stock adjustments, and transfers
  - Source: backend/app/Modules/Inventory/Services/InventoryService.php and related controllers and requests.
  - Authorization: policies like InventoryItemPolicy gate access; roles such as Inventory Officer and Property Custodian are typically allowed.

- Stock alerts and low-stock notifications
  - Implemented via a scheduled command: inventory:send-low-stock-alerts (backend/app/Console/Commands/SendLowStockAlerts.php) which creates notifications via NotificationService.
  - Operational note: requires scheduler to run daily and a queue worker to process notification jobs (see maintenance-and-scheduled-tasks.md).

- Asset lifecycle operations (issuance, reissuance, disposal, maintenance)
  - Implemented controllers and services include AssetIssuanceService, DisposalController, AssetReissuanceController, and maintenance models.
  - Disposal and reissuance are guarded by policy checks and business rules (e.g., assets under active maintenance cannot be disposed).

- Asset identifiers and QR workflows
  - Asset identifiers and QR scan histories are persisted (qr_scan_histories table) and scanned actions recorded. See backend/database/migrations/* and Modules/QrScan services.

- Import/Export
  - Inventory import handlers exist and use System Setup reference data for units, offices and manufacturers. Export/reporting services also exist (Report module uses Template rendering services).

Operational cautions

- Many asset and inventory operations are non-destructive when using updates, but disposal may be irreversible. Confirm business rules and backups before performing mass disposals.
- Audit logs record many actions (see audit-logs-and-activity.md) — check these logs when reconciling operational changes.

Source-of-truth files

- backend/app/Modules/Inventory/Services/InventoryService.php
- backend/app/Modules/Asset/Services/*
- backend/app/Console/Commands/SendLowStockAlerts.php
- backend/database/migrations/* (inventory and asset-related migrations)
- backend/app/Modules/QrScan/
