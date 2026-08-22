# Operations & Administration (implementation-backed)

This folder documents how to operate and administer the system based on the current implementation in the repository. Each page is implementation-backed and references the source-of-truth files found in the codebase.

Recommended administrator journey

1. System Administration
2. User & Role Administration
3. Inventory & Asset Operations
4. Borrowing & Reservation Operations
5. FAQ & Help Administration
6. Reports & Data Export
7. Audit Logs & Activity
8. System Configuration
9. Backup & Recovery
10. Monitoring & Logging
11. Maintenance & Scheduled Tasks
12. Incident & Recovery Procedures
13. Operations Checklist

Documents in this folder

- system-administration.md
- user-and-role-administration.md
- inventory-and-asset-operations.md
- borrowing-and-reservation-operations.md
- faq-and-help-administration.md
- reports-and-data-export.md
- audit-logs-and-activity.md
- system-configuration.md
- backup-and-recovery.md
- monitoring-and-logging.md
- maintenance-and-scheduled-tasks.md
- incident-and-recovery-procedures.md
- operations-checklist.md

Related canonical documentation

- [Deployment](/docs/deployment/)
- [Features](/docs/features/)
- [API](/docs/api/)
- [Architecture](/docs/architecture/)
- [Security & RBAC](/docs/security/)
- [Database](/docs/database/)
- [Development & Contribution](/docs/development/README.md)

Source-of-truth files referenced frequently in these docs

- backend/routes/console.php
- backend/app/Console/Commands/*
- backend/config/queue.php
- backend/config/logging.php
- backend/database/migrations/*
- backend/app/Enums/UserRole.php
- backend/app/Http/Controllers/FaqController.php
- backend/app/Notifications/*
- backend/app/Modules/SystemSetup/*
- backend/storage/logs/

If you find discrepancies between these docs and the repository, treat the repository as authoritative and open an issue to request documentation updates.
