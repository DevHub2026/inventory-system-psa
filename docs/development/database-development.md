# Database development (implementation-backed)

This document summarizes the verified database developer workflow and links to the full database docs.

Reference

- Canonical database documentation is under: [docs/database/README.md](/docs/database/README.md). Use migrations in backend/database/migrations/ as the authoritative schema.

Verified commands and practices

- Configure DB connection in backend/.env (DB_CONNECTION, DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD). The repo's backend/.env.example and backend/config/database.php show defaults and options.

- Run migrations:

  cd backend
  php artisan migrate

- Check migration status (safe, read-only):

  php artisan migrate:status

- Rollback last batch (destructive to data in the rolled-back batch):

  php artisan migrate:rollback

- Refresh migrations (destructive — recreates schema):

  php artisan migrate:refresh

  Use with caution and only in local/test environments.

- Seed the database (if seeders provided):

  php artisan db:seed --class=SeederClassName

- Testing: PHPUnit in phpunit.xml uses sqlite in-memory (DB_CONNECTION=sqlite, DB_DATABASE=:memory:) so backend tests run fast and isolated by default.

Important verification notes

- The repository contains migrations for all core tables and migrate:status in this workspace confirmed those migrations are applied to the configured runtime DB.
- Do not run destructive migration commands against production databases. Use backups and staging environments.

Source references

- backend/database/migrations/
- backend/.env.example
- backend/config/database.php
- backend/phpunit.xml
- docs/database/README.md
