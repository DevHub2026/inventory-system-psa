# Local development setup (implementation-backed)

This document lists the verified steps to set up the project locally. All commands below are present in the repository (composer.json, package.json, Vite config, and GitHub workflows).

Verified required software

- PHP 8.3+ (composer.json requires "php": "^8.3").
- Composer (for PHP dependency management).
- Node.js (recommended Node 20+ is used in GitHub Actions) and npm.
- Git.
- A database server for development (the repository includes Postgres configuration in backend/.env; backend/config/database.php defaults to SQLite if DB_CONNECTION is not set). Use the database appropriate for your environment. Tests and CI use SQLite in-memory.

Verified setup steps

1. Clone the repository:

   git clone https://github.com/DevHub2026/inventory-system-psa.git
   cd inventory-system-psa

2. Backend (Laravel) setup — verified commands

- Install PHP dependencies:

  cd backend
  composer install

- Create or copy environment file (the repo includes .env.example):

  cp .env.example .env

- Generate application key (Laravel):

  php artisan key:generate

- Configure database credentials in .env (see environment-configuration.md)

- Run migrations (read-only verification earlier confirmed migrations are applied in the live dev DB; migrating locally will create the schema):

  php artisan migrate

- Run tests (see testing-and-quality.md):

  composer test
  OR
  php artisan test

3. Frontend setup — verified commands (from frontend/package.json)

- Install dependencies:

  cd frontend
  npm install

- Start dev server (Vite):

  npm run dev

  The Vite dev server listens on port 5173 by default (see frontend/vite.config.ts). Vite proxies /api to http://127.0.0.1:8000 by default for local development when the backend is served locally.

- Build for production:

  npm run build

- Lint frontend code:

  npm run lint

- Run accessibility regression script:

  npm run a11y:test

4. Optional: run combined dev (composer scripts)

- The backend composer.json defines a "dev" script that attempts to run a combined developer environment (php artisan serve, queue listener, pail, and npm run dev) via npx concurrently. This is provided as a convenience but requires npx and the configured tools to be present. Use with caution and consult composer.json scripts before running.

Optional tools (useful but not required)

- Docker / docker-compose — not required by the repository but may be used by developers in some environments. The repo does not include a docker-compose.yaml at the repository root.
- PostgreSQL client tools (psql) if using Postgres locally.
- A code editor with PHP and TypeScript support (VS Code recommended).

Not verified / Not present

- No repository-wide Makefile or start.bat/stop.bat in the project root was found (only composer and npm scripts are used). If you require a local Docker-based runner or other wrappers, they are not currently part of the repository.

Notes

- The repo defaults to SQLite when DB_CONNECTION is not set; this is a lightweight option for local experimentation. For production-like testing use Postgres per backend/.env if available.
- The GitHub accessibility workflow uses Node 20 and PHP 8.1 in CI; match CI versions when replicating CI locally where possible.
