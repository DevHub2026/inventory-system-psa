# Production deployment checklist

Use this checklist before and after a production deployment.

## Before deployment

- [ ] Prepare production environment and secret store
- [ ] Set `APP_ENV=production` and `APP_DEBUG=false`
- [ ] Ensure `APP_KEY` is configured
- [ ] Configure database credentials in the secret store
- [ ] Ensure TLS certificates or managed HTTPS are provisioned
- [ ] Configure `SANCTUM_STATEFUL_DOMAINS` and CORS if using cookie auth
- [ ] Configure backups for the database
- [ ] Ensure logging and monitoring endpoints are configured
- [ ] Run CI checks (lint, build, tests, accessibility)

## Database

- [ ] Database is reachable from the backend hosts
- [ ] Backup schedule configured and tested
- [ ] Migration plan reviewed (no destructive or irreversible migrations without backup)

## Backend

- [ ] Composer dependencies installed (`composer install --no-dev`)
- [ ] Migrations applied (`php artisan migrate --force`)
- [ ] Permissions on `storage/` and `bootstrap/cache` set
- [ ] Queue workers and cron jobs configured if required
- [ ] Error logging and monitoring configured

## Frontend

- [ ] Frontend build completed (`npm ci && npm run build`)
- [ ] Static assets deployed to CDN or server
- [ ] API base URL configured for production
- [ ] SPA fallback routing configured

## Security

- [ ] Secrets not present in source control
- [ ] TLS enabled for all public endpoints
- [ ] Database is not publicly exposed
- [ ] Production monitoring and alerts configured

## Accessibility

- [ ] Accessibility CI passing for this build (if configured)
- [ ] Spot-check Quick Access and Help & Accessibility hub
- [ ] Accessibility preferences persist for users

## Final verification

- [ ] Frontend loads at the production domain
- [ ] `/api/v1/me` returns authenticated user after login
- [ ] Protected endpoints reject unauthorized access
- [ ] FAQ loads and respects role-based visibility
- [ ] Borrowing and extension workflows function for sample data
- [ ] Reports load and export where applicable

## Rollback readiness

- [ ] Have a tested database restore or snapshot available
- [ ] Have the previous application artifact available for redeploy
- [ ] Have the incident response and communication plan prepared

## Post-deployment

- [ ] Confirm monitoring/metrics are green
- [ ] Confirm logs show normal operation (no new critical errors)
- [ ] Notify stakeholders of the release
- [ ] Schedule follow-up for any deferred migration work
