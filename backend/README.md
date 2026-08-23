# Backend API (Laravel)

This directory contains the Laravel backend for the PSA Inventory Management System. It exposes the authenticated API for user management, inventory and asset workflows, borrowings and returns, reservations, QR processing, reports, FAQs, system setup, audit data, and accessibility preferences.

## Verified implementation

The current backend is a Laravel 13 application with Sanctum-based authentication and module-oriented code under `app/Modules/`.

Key implementation-backed sources of truth:

- `routes/api.php` — authenticated API routes and RBAC boundaries
- `app/Enums/UserRole.php` — canonical role values
- `app/Models/User.php` — user role resolution
- `app/Modules/*` — domain modules such as `Auth`, `Inventory`, `Asset`, `Borrowing`, `Report`, and `Import`
- `database/migrations/` — schema evolution and database state
- `tests/` — backend regression coverage

## Runtime configuration

The active project configuration uses PostgreSQL in `backend/.env` for the runtime database. SQLite may still be used for some lightweight local or test scenarios when explicitly configured, but it is not the default runtime configuration for this project.

## Local backend workflow

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --force
php artisan serve --host=127.0.0.1 --port=8000
```

## Common validation commands

```bash
cd backend
php artisan test
php artisan test --filter=FaqApiTest
php artisan test --filter=AccessibilityPreferencesTest
php artisan test --filter=SupplyOfficerAuthorizationTest
```

## Backend command notes

The repository includes a project-level composer script in `backend/composer.json`:

```bash
cd backend
composer run setup
```

This script installs PHP dependencies, creates `.env` if missing, generates the app key, runs migrations, installs frontend dependencies, and builds the frontend bundle.

## Security and RBAC

Authorization and role enforcement are implemented in the backend. Frontend role helpers are UI convenience functions only and are not a replacement for backend authorization checks.

Relevant files:

- `app/Enums/UserRole.php`
- `app/Models/User.php`
- `app/Modules/Auth/` and route middleware in `routes/api.php`
- domain policies and services under `app/Modules/`

## Project documentation

- [../README.md](../README.md)
- [../docs/README.md](../docs/README.md)
- [../docs/getting-started/installation.md](../docs/getting-started/installation.md)
- [../docs/security/README.md](../docs/security/README.md)
- [../docs/architecture/README.md](../docs/architecture/README.md)
- [../docs/features/README.md](../docs/features/README.md)

## Documentation note

This README reflects the current repository implementation instead of the default Laravel starter kit. Use the codebase and the `docs/` directory as the authoritative source for project behavior and workflows.
