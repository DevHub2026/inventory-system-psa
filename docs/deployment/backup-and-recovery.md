# Backup and recovery

## Purpose

This document recommends a backup and recovery approach consistent with the current project stack and describes what should be backed up.

## What to back up

1. Database (PostgreSQL recommended for production)
2. Uploaded files and storage (if the app uses S3 or local filesystem for attachments)
3. Environment configuration (only non-secret metadata — secrets should live in a secrets manager)
4. Application artifacts (optional — built frontend assets, deployment manifests)

## Database backups (PostgreSQL)

Recommended approach:

- Use managed PostgreSQL automated backups when available.
- Schedule daily logical or physical backups depending on RTO/RPO requirements.
- Keep backups retained for a period appropriate to your policy (e.g., 30 days).
- Verify backups regularly by performing a restore to a staging instance.

Example tools:

- `pg_dump` for logical backups
- Managed provider snapshots (AWS RDS snapshots, DigitalOcean backups)

Example `pg_dump` command (do not store credentials in scripts):

```bash
PGHOST=YOUR_DB_HOST PGPORT=5432 PGUSER=YOUR_USER PGPASSWORD=YOUR_PASSWORD pg_dump -Fc -f psa_inventory_$(date +%F).dump YOUR_DB_NAME
```

Restore example (to a test DB):

```bash
pg_restore -d restored_db_name psa_inventory_2026-08-01.dump
```

## Filesystem / uploaded files

- If your app stores uploads on the local filesystem, ensure the `storage/` folder is included in your backup strategy.
- Prefer using object storage (S3-compatible) for uploaded assets in production to simplify backups and replication.

## Environment and secrets

- Do not keep secrets in the repository. Use a secrets manager or environment service to store production values.
- Backup environment metadata (variable names and non-secret defaults) in a secure, access-controlled location.

## Backup retention and rotation

- Establish retention policies (e.g., daily backups kept for 30 days, weekly backups kept for 6 months).
- Rotate backups and verify integrity periodically.

## Emergency restore guidance

1. Assess the incident and determine the required restore point.
2. If the database schema changed in a way that is incompatible, prefer restoring to a staging instance and testing the app before switching production traffic.
3. If a full restore is required:
   - Stop write traffic
   - Restore the latest valid backup to a new DB instance
   - Point the application to the restored instance after verification
4. If partial data is required, use logical restores (e.g., `pg_restore` with table selection) where possible.

## Testing backups

- Schedule periodic restore drills to validate backup integrity.
- Document the restore process and store it in an access-controlled ops runbook.

## Notes and assumptions

- The repository does not include an opinionated backup tool; choose a solution that matches your hosting platform and operational requirements.
- The app may store uploaded files locally in development; in production prefer object storage for simpler backup and restore.
