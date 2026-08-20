# Database environments (implementation-backed)

This document records which database drivers are configured for each environment in the repository and where the configuration is defined.

Summary table

| Environment       | Driver     | Configuration source | Verified status |
| ----------------- | ---------- | -------------------- | --------------- |
| Local development | PostgreSQL | backend/.env (DB_CONNECTION=pgsql) | Verified from backend/.env (present in repo) |
| Fallback / Default | SQLite    | backend/config/database.php and backend/.env.example (DB_CONNECTION=sqlite) | Verified from config and .env.example |
| Testing           | SQLite (in-memory) | backend/phpunit.xml (DB_CONNECTION=sqlite, DB_DATABASE=:memory:) | Verified from phpunit.xml |
| Production        | Not explicitly configured in repo | backend/.env.example contains production checklist comments (suggests MySQL/Postgres) | Config-only — no live production config provided in repository

Notes and evidence

- The Laravel database config file `backend/config/database.php` sets the default connection to env('DB_CONNECTION', 'sqlite'), so if DB_CONNECTION is unset the application will use SQLite by default. See: backend/config/database.php

- The repository contains `backend/.env` (local development example checked in here) that sets DB_CONNECTION=pgsql and provides Postgres connection details. This indicates this particular working copy is configured to use PostgreSQL. See: backend/.env

- PHPUnit test configuration forces SQLite in-memory for tests. See: backend/phpunit.xml (DB_CONNECTION=sqlite, DB_DATABASE=:memory:).

- `backend/.env.example` documents a production checklist with commented examples for MySQL and Postgres, but these are placeholders and not authoritative for runtime. See: backend/.env.example

Security note

- Do not copy secrets from backend/.env into documentation. The repository contains a checked-in backend/.env in this workspace; documentation will not reproduce its secret values. If you deploy, set secrets via environment or a secrets manager.
