# Backup & Recovery (implementation-backed)

Important note

The repository does not implement automated database backups or restore utilities. Backup and recovery are deployment/infrastructure responsibilities unless an application-level feature exists; none was found in the codebase.

Verified repository facts

- Database configuration
  - See backend/.env.example and backend/config/database.php. The application supports multiple drivers (sqlite, pgsql, mysql) via Laravel's configuration, but does not include an application-level backup command.
  - Tests use sqlite in-memory (backend/phpunit.xml).

- Uploaded files and attachments
  - Application likely writes uploads to configured filesystem disks (config/filesystems.php) and references storage. No built-in backup orchestration found in repo.

Recommended responsibilities (infrastructure)

- Database backups:
  - Configure automated backups appropriate for your DB engine (pg_dump for PostgreSQL, mysqldump for MySQL, filesystem snapshots for SQLite DB files). This is outside the application repository and must be implemented by your infrastructure team.

- File storage backups:
  - Back up storage disks where attachments are stored (S3 buckets, mounted volumes, etc.).

- Restoration guidance (manual, infrastructure-level):
  - Always test restores in a staging environment before applying to production.
  - If restoring database tables that the application expects to have specific foreign keys or migrations, ensure migrations are not applied over mismatched schemas.

What the repository does provide

- Migrations to recreate schema (backend/database/migrations/). Use migrations only after restoring data sets where appropriate.
- No application-level backup/restore endpoints or utilities were discovered.

Source-of-truth files

- backend/.env.example
- backend/config/database.php
- backend/database/migrations/
- backend/phpunit.xml

> **WARNING — Destructive operations**
>
> The repository does not include restore utilities. Do not run destructive SQL on production databases without verified backups and tested restore procedures.
