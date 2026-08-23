# PSA Region XII Inventory Management System

This repository contains the PSA Region XII Inventory Management System, with a Laravel backend API, a Vite + React frontend, and supporting mobile and operational assets under the `mobile/` folder.

The documentation in `docs/` is the maintained source of truth for implementation-backed project guidance. The repository root README is a concise entry point to the verified project structure and local setup.

## Verified project layout

- Backend API: `backend/`
- Web frontend: `frontend/`
- Documentation: `docs/`
- Mobile project code: `mobile/`
- CI workflows: `.github/workflows/`

## Verified stack

- Backend: Laravel + PHP
- Frontend: React + TypeScript + Vite
- Database: PostgreSQL is the active project configuration in `backend/.env`; SQLite remains usable for lightweight local testing when configured explicitly.
- Authentication: Laravel Sanctum-based API authentication plus frontend session cache bootstrap
- Authorization: role-based checks backed by `backend/app/Enums/UserRole.php`
- Accessibility: frontend a11y runner and CI workflow in `frontend/tests/a11y/run-axe-puppeteer.js` and `.github/workflows/accessibility.yml`

## Quick start

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --force
php artisan serve --host=127.0.0.1 --port=8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 4173
```

### Validation commands used in this repository

```bash
cd backend
php artisan test --filter=FaqApiTest
php artisan test --filter=AccessibilityPreferencesTest
php artisan test --filter=SupplyOfficerAuthorizationTest

cd ../frontend
npm run lint
npm run build
npm run a11y:test
```

## Documentation

Start here:

- [docs/README.md](./docs/README.md)
- [docs/getting-started/installation.md](./docs/getting-started/installation.md)
- [docs/getting-started/development-setup.md](./docs/getting-started/development-setup.md)
- [docs/architecture/README.md](./docs/architecture/README.md)
- [docs/security/README.md](./docs/security/README.md)
- [docs/features/README.md](./docs/features/README.md)
- [docs/accessibility/overview.md](./docs/accessibility/overview.md)

## Role and authorization notes

Canonical role values are defined in `backend/app/Enums/UserRole.php` and include:

- Super Administrator
- System Administrator
- Property Custodian
- Inventory Officer
- Department Head
- Employee
- Auditor
- Supply Officer

The frontend role helpers in `frontend/src/utils/roleHelpers.ts` are presentation and UI gating helpers; backend authorization remains the authoritative enforcement layer.

## Borrowing and extension notes

Documentation for extension requests should be treated as implementation-backed and should follow the existing backend contract, including the `has_pending_extension` field returned by borrowing list responses and the extension routes under `backend/app/Modules/Borrowing/`.

## Accessibility notes

Accessibility verification is implemented in `frontend/tests/a11y/run-axe-puppeteer.js`. The repository includes a CI workflow at `.github/workflows/accessibility.yml` that builds the frontend, starts the backend, and runs route-based accessibility checks.

## Scope and repository conventions

- This repository is a working system implementation, not a generated project scaffold.
- Documentation should be validated against the current codebase before being treated as authoritative.
- Legacy material under `docs/old_docs/` is retained only for historical context; it is not the maintained documentation source.

## License and governance

This repository does not currently declare a project license in the root directory. Review the repository state before publishing or distributing binaries. Use the project documentation and existing codebase as the source of truth for operational guidance.
