# Development checklist (implementation-backed)

Use this checklist when preparing changes for review and merging.

## Before coding

- [ ] Pull the latest default branch (main) and rebase if needed
- [ ] Read affected feature/API/architecture documentation under docs/
- [ ] Identify frontend and backend impact
- [ ] Identify RBAC/security impact
- [ ] Identify database/migration impact

## Before committing

- [ ] Review changed files with git diff
- [ ] Run relevant backend tests (cd backend && php artisan test)
- [ ] Run frontend lint if frontend changed (cd frontend && npm run lint)
- [ ] Run frontend build if frontend changed (cd frontend && npm run build)
- [ ] Run accessibility tests if UI/accessibility behavior changed (cd frontend && npm run a11y:test)
- [ ] Check database migrations if schema changed (php artisan migrate:status)
- [ ] Confirm no secrets (.env) are included in commits
- [ ] Confirm no debug artifacts remain (console.log, dd(), var_dump)
- [ ] Update documentation if behavior changed (docs/)

## Before merging / deployment

- [ ] Ensure CI checks pass (backend tests, frontend build/lint, accessibility CI if configured)
- [ ] Confirm database migrations are reviewed and safe for production
- [ ] Ensure any run-time configuration or secrets are documented for deployment
- [ ] Tag or document release notes as appropriate

Source references

- README.md and docs/
- backend/composer.json (test script)
- frontend/package.json (lint/build/a11y scripts)
