# Database Documentation (implementation-backed)

Purpose

This folder documents the actual database configuration and schema as implemented in the repository. All content in these files is drawn directly from the application's configuration and migration sources; migrations are the authoritative source of truth for the schema.

Confirmed database technology

- Primary verified runtime configuration (backend/.env): PostgreSQL (pgsql)
- Default/fallback configuration (backend/.env.example and config/database.php): SQLite (used by default when DB_CONNECTION is not set)
- Test environment (backend/phpunit.xml): SQLite in-memory (DB_CONNECTION=sqlite, DB_DATABASE=:memory:)

Source-of-truth hierarchy used for this documentation

1. Active migrations: backend/database/migrations/
2. Application database configuration: backend/config/database.php and backend/.env
3. Eloquent models: backend/app/Models/ and backend/app/Modules/*/Models/
4. PHP enums: backend/app/Enums/ and backend/app/Modules/*/Enums/
5. Controllers/Services/Requests for behavioral context
6. Documentation files (this folder)

Documents in this folder

- database-overview.md
- database-environments.md
- entity-relationship-overview.md
- core-entities.md
- user-and-role-schema.md
- inventory-and-asset-schema.md
- borrowing-and-reservation-schema.md
- qr-and-history-schema.md
- audit-and-history-schema.md
- enums-and-statuses.md
- migrations.md
- data-integrity-and-constraints.md

Warning

Migrations are authoritative for the exact schema. If you need to change or verify columns, constraints, or types, consult the migration files in backend/database/migrations/ and the Eloquent models that map to them.

Links

- Migrations: backend/database/migrations/
- Database config: backend/config/database.php
- Environment example: backend/.env.example
- Local env (if present): backend/.env
- PHPUnit (testing): backend/phpunit.xml
