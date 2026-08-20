# Deployment troubleshooting

This file contains common troubleshooting steps based on the current repository and stack.

## Backend

### Problem: `php artisan migrate` fails with "could not find driver"

Symptoms:
- Migration fails with "could not find driver" or PDO error.

Likely cause:
- Missing PHP PDO extension for the chosen database driver (e.g., `pdo_pgsql` for PostgreSQL).

Resolution:
- Install the required PHP extension (e.g., `sudo apt-get install php8.3-pgsql` on Debian/Ubuntu) and restart PHP-FPM or your PHP process.

### Problem: 500 or 419 CSRF when calling API from frontend

Symptoms:
- API calls from the SPA return 419 or 500 when attempting authenticated requests.

Likely cause:
- CSRF or Sanctum misconfiguration, or the frontend is not including cookies/credentials for stateful auth.

Resolution:
- If using cookie-based auth (Sanctum), ensure `SANCTUM_STATEFUL_DOMAINS` includes the frontend domain and that the frontend calls the `/sanctum/csrf-cookie` endpoint before login.
- Alternatively, use token-based auth via API tokens.

### Problem: Background queue workers not running

Symptoms:
- Jobs are not processed; queue backlog grows.

Likely cause:
- Queue worker not started or configured incorrectly.

Resolution:
- Start queue worker: `php artisan queue:work --tries=1` or configure a worker supervisor (systemd, supervisor, or your platform provider).

## Frontend

### Problem: Vite dev server fails to start (port in use)

Symptoms:
- `npm run dev` fails due to port conflict.

Resolution:
- Change the port via CLI `npm run dev -- --port 5174` or update `vite.config.ts`.

### Problem: Frontend shows blank page after build

Symptoms:
- Production build serves a blank page or 404 errors for SPA routes.

Likely cause:
- SPA fallback not configured on the static host or server.

Resolution:
- Configure the server to always serve `index.html` for SPA routes (Nginx try_files or static host rewrite rules).

## Database

### Problem: Cannot connect to PostgreSQL

Symptoms:
- Connection refused or authentication failures.

Likely cause:
- DB not running, port blocked, incorrect credentials, or PostgreSQL config binding only to localhost.

Resolution:
- Start PostgreSQL, check listen_addresses in `postgresql.conf`, verify credentials, and ensure firewall rules allow connections from app hosts.

## Authentication / RBAC

### Problem: UI shows actions but backend denies access

Symptoms:
- Frontend displays buttons or actions to the user (due to UI role check), but the backend rejects the operation with 403.

Cause:
- Backend authorization is the source of truth. The frontend-only checks are only for convenience.

Resolution:
- Verify the user's roles and backend policies. Use the backend admin endpoints to inspect user roles: `/api/v1/users` (requires appropriate permissions).

## Accessibility testing issues

### Problem: `npm run a11y:test` fails with navigation errors

Symptoms:
- The axe runner reports navigation errors or cannot reach the frontend.

Likely cause:
- Backend or frontend not running, or incorrect `FRONTEND_URL`/`API_BASE` env variables.

Resolution:
- Start backend and frontend, confirm URLs, and set environment variables for the runner.

## General advice

- Inspect backend logs (`storage/logs/laravel.log`) for server-side errors.
- Use `php artisan config:clear` and `php artisan cache:clear` when troubleshooting config issues.
- Confirm `.env` file contains the correct settings and that secrets are not in source control.
- When in doubt, reproduce the issue in a staging environment before applying changes to production.
