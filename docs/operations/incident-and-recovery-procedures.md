# Incident & Recovery Procedures (implementation-backed)

This section provides implementation-backed guidance for common incidents. It documents only actions supported or implied by the repository; infrastructure-level recovery is the responsibility of the deployment team.

1) Application unavailable (500 errors)

Symptoms
- Users receive 500 responses or application pages fail to load.

How to diagnose
- Inspect backend/storage/logs/laravel.log for stack traces and recent exceptions.
- Check web server logs and process status (php-fpm, php artisan serve in dev).

Safe immediate actions
- Restart the application process or PHP-FPM service.
- If recent deployments occurred, consider rolling back the last release via your deployment tooling (not implemented in repo).

When to escalate
- If stack traces indicate database connection failures or missing migrations, escalate to the DBA/DevOps team.

2) Background jobs not processing (notifications delayed)

Symptoms
- Emails and queued notifications are not delivered.

Diagnosis
- Check queue worker processes (ps aux | grep queue:work) and queue failed jobs (failed_jobs table).
- Check backend/storage/logs for queue-related errors.

Safe immediate actions
- Start or restart queue workers: php artisan queue:work --tries=3
- Inspect failed jobs: php artisan queue:failed and retry as needed.

3) Database connection failure

Symptoms
- PDO exceptions, inability to run artisan migrate:status, or 500 errors referencing DB connection.

Diagnosis
- Verify environment DB settings (backend/.env) and network reachability to DB host.
- Use DB client or artisan tinker (DB::connection()->getPdo()) for read-only checks.

Safe immediate actions
- If using a managed DB, check instance health on the provider console.
- If local, ensure DB server process is running and listening on configured port.

4) Corrupted or inconsistent data after import

Symptoms
- Duplicate records, referential integrity errors, or unexpected NULLs.

Diagnosis
- Check import logs and recently created records. Use audit_logs and domain history tables where available.

Safe immediate actions
- Stop further imports.
- Use backups to restore affected tables in a staging environment and run reconciliation scripts. The repository does not include restore scripts; restoration is an infrastructure operation.

5) Failed migration or upgrade

Symptoms
- artisan migrate fails mid-run or application breaks due to missing columns.

Diagnosis
- Inspect migration:status (php artisan migrate:status) and last migration file run.

Safe immediate actions
- Do not attempt schema-destructive fixes on production without a tested backup and restore plan.
- Recreate the production schema in staging and test the migration sequence.

Source-of-truth files

- backend/storage/logs/
- backend/database/migrations/
- backend/routes/console.php
- backend/app/Console/Commands/*

> **WARNING**: Many recovery actions (database restores, rolling back schema) are infrastructure-level operations and are not implemented by this repository. Coordinate with your platform/DBA team for restores.
