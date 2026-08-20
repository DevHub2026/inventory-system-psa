# Debugging and Troubleshooting (implementation-backed)

This document collects verified symptoms and troubleshooting steps based on the project's configuration and typical Laravel/Vite workflows.

1) Backend server will not start

Symptom:
- php artisan serve fails or returns a runtime error

Likely causes:
- Missing PHP extensions
- Composer dependencies not installed
- Invalid .env or missing APP_KEY

How to diagnose:
- Check PHP version: php -v (project targets PHP ^8.3 per composer.json)
- Check composer install: composer install
- Check APP_KEY: grep APP_KEY .env

Resolution:
- Install required PHP version and extensions
- Run composer install and php artisan key:generate
- Ensure .env exists (copy .env.example if necessary) and correct DB_CONNECTION for local dev

2) Missing PHP extensions or incompatible PHP version

Symptom:
- Composer or artisan commands fail with extension-related errors

Diagnosis:
- composer diagnose
- php -m

Resolution:
- Install required PHP extensions (pdo, pdo_pgsql for PostgreSQL, xml, mbstring, tokenizer, json) depending on the environment

3) Composer dependency or autoload issues

Symptom:
- Class not found exceptions or autoload errors

Diagnosis:
- composer dump-autoload -o
- composer install --no-interaction

Resolution:
- Run composer install and regenerate autoload

4) Frontend dev server issues (Vite)

Symptom:
- npm run dev fails or HMR not working

Diagnosis:
- Ensure Node version matches repo expectations (package.json engines or CI uses Node 20 in GH Actions)
- Check frontend/vite.config.ts for proxy settings and HTTPS certs

Resolution:
- Install Node packages (npm install)
- If HTTPS certs are missing, run dev without HTTPS or provide certs in frontend/certs

5) Tests failing locally but passing in CI

Symptom:
- php artisan test fails locally, but CI passes

Likely causes:
- Local DB configuration differs from phpunit.xml (CI/test uses sqlite in-memory)
- Missing test seeders or environment variables

Diagnosis:
- Compare backend/phpunit.xml with local .env
- Run php artisan migrate --env=testing or ensure tests use sqlite

Resolution:
- Use the testing configuration in phpunit.xml for running unit/integration tests
- Seed test data if needed

6) Accessibility test failures

Symptom:
- npm run a11y:test returns violations or script times out

Diagnosis:
- Inspect frontend/tests/a11y/run-axe-puppeteer.js and reports (violations.json)
- Confirm CI secrets (A11Y_TEST_EMAIL/PASSWORD) or local test user exist

Resolution:
- Fix ARIA/semantic issues reported by axe-core
- Ensure the test user exists locally or adjust the script for local credentials

7) Database connection errors

Symptom:
- PDO exceptions when connecting to DB

Diagnosis:
- Verify backend/.env DB_CONNECTION, DB_HOST, DB_PORT and credentials
- php artisan tinker and DB::connection()->getPdo() for testing connectivity (read-only checks recommended)

Resolution:
- Use correct DB configuration per environment
- Ensure the DB server is running and reachable

When to escalate

- If errors persist after following these steps, collect logs, recent git commits, and exact error output. Open an issue with reproduction steps and environment details.

Source references

- backend/composer.json
- backend/phpunit.xml
- frontend/vite.config.ts
- frontend/package.json
