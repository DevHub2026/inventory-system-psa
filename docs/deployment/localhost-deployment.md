# Localhost deployment

## Purpose

This guide explains how to run the PSA Inventory System locally for development, testing, and demonstrations. All commands reflect the current repository implementation (Laravel backend and React + Vite frontend).

## Requirements (observed in repository)

- PHP >= 8.3 (from `backend/composer.json` requirement)
- Composer (for PHP dependency management)
- PostgreSQL (recommended) or SQLite for quick setups
- Node.js (LTS) and npm
- Git

Notes:
- The backend composer.json requires PHP ^8.3 and Laravel 13.x.
- The frontend uses Vite and scripts in `frontend/package.json` (dev, build, lint, a11y:test).

## Clone the project

```bash
git clone https://github.com/DevHub2026/inventory-system-psa.git
cd inventory-system-psa
```

Project layout (important folders):

```
project-root/
├── backend/
├── frontend/
└── docs/
```

## Backend setup

1. Change to backend folder:

```bash
cd backend
```

2. Install PHP dependencies:

```bash
composer install
```

3. Copy environment template (if not present):

```bash
cp .env.example .env
```

4. Set the database connection in `.env`.

- For quick local runs without PostgreSQL, the project supports SQLite by default (`DB_CONNECTION=sqlite`).
- For a realistic local environment, configure PostgreSQL variables: `DB_CONNECTION=pgsql`, `DB_HOST`, `DB_PORT` (default 5432), `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`.

5. Generate the application key (Laravel):

```bash
php artisan key:generate
```

6. Create or prepare the database and run migrations:

- SQLite quick setup (creates a file-based DB):

```bash
# from backend/
php -r "file_exists('database/database.sqlite') || touch('database/database.sqlite');"
php artisan migrate --force
```

- PostgreSQL setup:

```bash
# create database using psql or your DB client, then:
php artisan migrate --force
```

7. Optional: Seed deterministic data used by tests and accessibility runner (if provided by the repo):

```bash
php artisan db:seed --class=AccessibilityTestSeeder
# or run the general seeder if available
php artisan db:seed
```

8. Start the backend server (development):

```bash
php artisan serve --host=127.0.0.1 --port=8000
```

The API base path used in this project is `/api/v1` (see `backend/routes/api.php`). The bootstrap endpoint for frontend is `/api/v1/me`.

## Frontend setup

1. Open a new terminal and change to the frontend folder:

```bash
cd frontend
```

2. Install Node dependencies:

```bash
npm install
```

3. Development server:

The frontend is configured to run with Vite. The repository's Vite configuration sets the dev port to 5173 by default.

```bash
npm run dev
```

This will start the app on http://localhost:5173 (or the port you configure when invoking the script). The Vite config proxies `/api` to `http://127.0.0.1:8000` by default so the frontend can reach the backend during development.

4. Build for production (local preview):

```bash
npm run build
npm run preview
```

## Start sequence

1. Start PostgreSQL (if using pgsql)
2. Start backend: `php artisan serve --host=127.0.0.1 --port=8000`
3. Start frontend: `npm run dev`
4. Visit the app in your browser at `http://localhost:5173`

## Local verification checklist

- [ ] Database is running and migrations applied
- [ ] Backend `/api/v1/me` responds
- [ ] Frontend loads at the configured Vite port (default 5173)
- [ ] Login works (use seeded/test user credentials or create a user)
- [ ] Protected routes are accessible after login
- [ ] Help & Accessibility hub opens and preferences persist
- [ ] Accessibility runner can be run with `npm run a11y:test` after starting backend and frontend

## Local accessibility testing

Run the accessibility runner from the frontend directory:

```bash
npm run a11y:test
```

Environment variables used by the accessibility runner may include `FRONTEND_URL`, `API_BASE`, `A11Y_TEST_EMAIL`, and `A11Y_TEST_PASSWORD`. Verify the runner script and provide credentials for a deterministic A11Y user if necessary. Do not hardcode secrets; prefer environment variables.

## Local troubleshooting

### Problem: Backend cannot connect to database

Symptoms: `php artisan migrate` or `php artisan serve` fail with DB connection errors.

Likely cause: `.env` DB_* values are not set or DB server not running.

Resolution:

- For SQLite, ensure `database/database.sqlite` exists and `.env` has `DB_CONNECTION=sqlite`.
- For PostgreSQL, ensure the DB service is running and credentials in `.env` are correct.

### Problem: Frontend cannot reach API (CORS / proxy errors)

Symptoms: Browser console shows 401/403/CORS when frontend calls `/api`.

Likely cause: Backend not running or misconfigured proxy, or CORS config restricting allowed origins.

Resolution:

- Confirm backend started at `http://127.0.0.1:8000`.
- Confirm Vite proxy in `frontend/vite.config.ts` points to the backend address.
- For production, configure CORS and SANCTUM settings as required.

## Notes

- This guide documents the observed project configuration. If your environment or developer machine differs (e.g., different ports or hostnames), adapt the `.env` and Vite config accordingly.
- Do not commit `.env` with real secrets into version control.
