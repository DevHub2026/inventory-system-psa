# Environment variables

This document lists deployment-relevant environment variables observed in the repository. Values shown are placeholders; do not store real secrets in source control.

The primary source of truth is `backend/.env.example` and `backend/.env` in local development. Review those files when preparing an environment.

## Backend (Laravel)

| Variable | Required | Purpose | Example |
| -------- | -------- | ------- | ------- |
| APP_NAME | yes | Human-friendly application name | PSA Inventory System |
| APP_ENV | yes | Environment name (local, production) | production |
| APP_DEBUG | yes | Debug mode — must be false in prod | false |
| APP_URL | yes | Public application URL | https://inventory.example.gov.ph |
| APP_KEY | yes | Laravel application key | (auto-generated) |
| DB_CONNECTION | yes | Database driver (pgsql/sqlite/mysql) | pgsql |
| DB_HOST | required for pgsql/mysql | Database host | db.example.internal |
| DB_PORT | required for pgsql/mysql | Database port | 5432 |
| DB_DATABASE | required for pgsql/mysql | Database name | psa_inventory |
| DB_USERNAME | required for pgsql/mysql | DB username | psa_app |
| DB_PASSWORD | required for pgsql/mysql | DB password | YOUR_DB_PASSWORD |
| CACHE_STORE | optional | Cache driver | database |
| SESSION_DRIVER | optional | Session driver | file or database |
| QUEUE_CONNECTION | optional | Queue driver | database |
| REDIS_HOST | optional | Redis host if used | 127.0.0.1 |
| MAIL_MAILER | optional | Mail transport | smtp |
| MAIL_HOST | optional | SMTP host | smtp.example.com |
| RESEND_KEY | optional | Resend API key (if using Resend) | YOUR_RESEND_KEY |
| VITE_APP_NAME | optional | Frontend Vite app name | PSA Inventory System |
| SANCTUM_STATEFUL_DOMAINS | conditional | Used when cookie-based auth is used by SPA | inventory.example.gov.ph |
| CORS_ALLOWED_ORIGINS | conditional | Allowed origins for CORS | https://inventory.example.gov.ph |

Notes:
- Use a secrets manager or environment configuration system for production values.
- Never commit `.env` containing real production secrets.

## Frontend

The frontend uses Vite. In this repository, the frontend build expects the API to be reachable at the production API base URL. Configure the following at build time (as Vite environment variables or via CI):

| Variable | Purpose | Example |
| -------- | ------- | ------- |
| VITE_APP_NAME | Optional display name | PSA Inventory System |
| API_BASE or similar | Frontend should be configured to point to the API base URL at build time | https://api.inventory.example.gov.ph/api/v1 |
| FRONTEND_URL | Optional, used by accessibility runner | https://inventory.example.gov.ph |

## Accessibility testing variables (local/CI)

- A11Y_TEST_EMAIL — email for deterministic accessibility test user
- A11Y_TEST_PASSWORD — password for the deterministic user

Add these only to CI or local environment and keep them secret. The accessibility runner in `frontend/tests/a11y/run-axe-puppeteer.js` reads these values when present.

## How to manage secrets

- For production, use a secrets manager (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault) or your hosting platform's environment variable management.
- Restrict access to secret values by role.
- Rotate credentials and maintain an audit trail for changes.

## Verification

Before deploying, verify environment variables:

- `php artisan config:clear` and `php artisan config:cache` run successfully
- `APP_KEY` is set
- Database credentials work (test by running `php artisan migrate --pretend` or connecting using a DB client)

## Sources in repository

- `backend/.env.example`
- `backend/.env` (local, DO NOT COPY TO PROD)
- `frontend/vite.config.ts`
- `frontend/package.json` (scripts for build/dev)
