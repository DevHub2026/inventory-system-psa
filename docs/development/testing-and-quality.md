# Testing and Quality (implementation-backed)

This document records the project's verified testing and quality commands and CI checks.

Backend tests

- PHPUnit / Artisan test runner (configured via backend/phpunit.xml):

  cd backend
  php artisan test
  # or
  ./vendor/bin/phpunit

- The repository's composer.json defines a "test" script that runs `php artisan test` after clearing config.

Test environment

- backend/phpunit.xml sets APP_ENV=testing and DB_CONNECTION=sqlite with DB_DATABASE=:memory: so tests run using an in-memory SQLite DB by default.

Frontend quality checks

- Linting (ESLint):

  cd frontend
  npm run lint

- TypeScript typing is enforced via the build step which runs `tsc -b` as part of `npm run build`.

- Frontend build (verifies build-time errors):

  cd frontend
  npm run build

Accessibility testing (CI & local)

- The repository includes an accessibility CI workflow (.github/workflows/accessibility.yml) which builds the frontend, starts Laravel (using SQLite in CI), and runs the frontend accessibility script `npm run a11y:test`.
- The frontend provides a local accessibility script: `npm run a11y:test` that executes node tests/a11y/run-axe-puppeteer.js. This script may require a seeded test user for authenticated flows.

CI checks

- A GitHub Actions workflow for accessibility exists at .github/workflows/accessibility.yml and is triggered on push and pull_request to main and develop branches.
- The workflow installs PHP and Node, prepares a SQLite DB, runs migrations, builds the frontend, starts servers, then runs the a11y script. It expects A11Y_TEST_EMAIL / A11Y_TEST_PASSWORD secrets for authenticated tests.

Quality recommendations (implementation-backed)

- Run backend tests before pushing feature branches: `cd backend && php artisan test`.
- Run frontend lint and build before pushing UI changes: `cd frontend && npm run lint && npm run build`.
- Run accessibility script locally when modifying UI flows that affect keyboard navigation or ARIA attributes: `npm run a11y:test` (may require seeding or creating a test user).

Source references

- backend/phpunit.xml
- backend/composer.json
- frontend/package.json
- .github/workflows/accessibility.yml
- frontend/tests/a11y/run-axe-puppeteer.js
