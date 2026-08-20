# Online / Production deployment

This document explains a provider-neutral approach to deploying the PSA Inventory System in production.

It describes two conceptual models and the configuration required. The details are intentionally provider-neutral — supply provider-specific instructions (e.g., for AWS, Azure, DigitalOcean) when you have a chosen platform.

## Deployment architecture (conceptual)

Users
 ↓
HTTPS / Domain
 ↓
Frontend Hosting (static files)
 ↓
Backend API Hosting (Laravel / PHP)
 ↓
PostgreSQL Database

Recommended separation of concerns:

- Host the frontend as static assets behind a CDN (e.g., Netlify, Vercel, S3 + CloudFront) or serve static files from the application server.
- Host the backend on a managed PHP host or container (e.g., AWS ECS, DigitalOcean App Platform, or a VM with PHP 8.3 and Nginx).
- Use a managed PostgreSQL offering where possible for reliability and backups.
- Protect the API behind HTTPS and configure CORS and SANCTUM stateful domains when required.

## Production requirements (observed in repo)

- PHP >= 8.3 (composer.json requires ^8.3)
- Laravel 13.x
- Composer
- Node tooling for building the frontend (during CI/CD)
- PostgreSQL database (recommended for production; the repository supports multiple drivers)
- HTTPS (TLS certificate)
- A secure environment management system (secrets manager, environment variables)

## Model A — Separate frontend and backend (recommended for scale)

Overview:

- Frontend: static SPA served from a CDN or static host at `https://inventory.example.gov.ph`
- Backend API: `https://api.inventory.example.gov.ph`
- Database: Managed PostgreSQL

Key configuration:

- API_BASE (frontend) must point to `https://api.inventory.example.gov.ph/api/v1`
- CORS and SANCTUM stateful domains must include the frontend domain if cookie-based authentication is used.

When to use:

- Multiple deployments (staging/prod)
- High traffic and CDN caching for frontend
- Independent scaling of backend and frontend

## Model B — Single server deployment (monolithic)

Overview:

- Nginx (or Apache) serves the static built frontend and proxies API requests to the Laravel PHP backend running via PHP-FPM.
- Database is a managed or co-located PostgreSQL database.

Key configuration:

- Serve built `frontend/dist` as static files.
- Proxy `/api` to the Laravel `public/index.php` entry point.
- Use HTTPS and a reverse proxy (Nginx) for TLS termination.

When to use:

- Simpler deployments where high scalability is not required
- Smaller teams or internal deployments

## Production backend deployment steps (provider neutral)

1. Provision server(s) or containers.
2. Install runtime requirements: PHP >= 8.3, Composer, necessary PHP extensions (pdo_pgsql or pdo_sqlite depending on driver), and any queue/cron services your deployment requires.
3. Clone repository to the server (or deploy build artifacts).
4. Copy and configure `.env` with production values. Example placeholders:

```
APP_ENV=production
APP_DEBUG=false
APP_URL=https://inventory.example.gov.ph
DB_CONNECTION=pgsql
DB_HOST=YOUR_DB_HOST
DB_PORT=5432
DB_DATABASE=YOUR_DB_NAME
DB_USERNAME=YOUR_DB_USER
DB_PASSWORD=YOUR_DB_PASSWORD

# Other production keys
MAIL_MAILER=smtp
MAIL_HOST=your.smtp.host
MAIL_USERNAME=YOUR_SMTP_USER
MAIL_PASSWORD=YOUR_SMTP_PASSWORD
```

5. Install Composer dependencies:

```bash
composer install --no-dev --optimize-autoloader
```

6. Generate the app key (only if not already set):

```bash
php artisan key:generate --force
```

7. Run migrations and seeders (review before applying):

```bash
php artisan migrate --force
# php artisan db:seed --class=SomeSeeder (only if safe for prod)
```

8. Configure permissions for storage and bootstrap cache directories:

```bash
chown -R www-data:www-data storage bootstrap/cache
chmod -R ug+rwx storage bootstrap/cache
```

9. Configure the web server (Nginx/Apache) to point to `backend/public` as the document root and enable PHP-FPM.
10. Configure background services (queues, cron jobs) as required by the project.
11. Configure HTTPS (TLS) using a certificate provider.
12. Configure logging and monitoring.

## Production frontend deployment

1. Build frontend assets during your CI pipeline (or locally):

```bash
cd frontend
npm ci
npm run build
```

2. Deploy the generated static files (e.g., `dist/`) to your static host or copy them to the backend `public/` folder if using single-server deployment.

3. Configure the frontend to use the production API base URL (Vite environment variables or server rewrite rules). The backend API base path is `/api/v1`.

## Environment variables

See `./environment-variables.md` for a curated list of variables observed in the repository.

## Security checklist (production highlights)

- [ ] APP_DEBUG=false
- [ ] Secure environment variables via secret manager
- [ ] TLS enabled for all public endpoints
- [ ] Database not publicly exposed to the Internet (restrict to app hosts)
- [ ] Backup strategy for database enabled and tested
- [ ] Logging and monitoring in place
- [ ] RBAC tested for critical operations (user management, system setup, FAQs)
- [ ] Accessibility CI passing on pre-release builds

## Verification smoke tests after deployment

- Frontend loads at the configured domain
- Backend responds to `/api/v1/me`
- Authentication works
- Protected routes reject unauthorized requests
- FAQ loads and role filtering functions
- Accessibility preferences persist for users

## Rollback guidance

A general rollback approach:

1. Stop the failed release (load balancer / service scheduler)
2. Re-deploy the previous working artifact (frontend and/or backend)
3. If database migrations were applied that are incompatible, restore database from backup and note data loss implications
4. Verify application health
5. Record incident and root cause

Do not restore or expose production secrets in source control. Use proper secret management during rollback.

## Notes and assumptions

- This guide is provider-neutral; implement provider-specific steps in your platform's deployment documentation.
- The repository contains a `composer.json` that requires PHP ^8.3 and Laravel 13.x.
- The project uses a PostgreSQL-friendly schema in migrations; prefer managed Postgres for production.
- If cookie-based authentication (Sanctum) is used, configure `SANCTUM_STATEFUL_DOMAINS` and CORS appropriately for your domains.
