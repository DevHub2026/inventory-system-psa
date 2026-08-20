# Accessibility testing (implementation-backed)

This repository includes an automated accessibility regression system used in CI and available locally.

How it is implemented (verified)

- Script entrypoint (frontend): `npm run a11y:test` runs `node tests/a11y/run-axe-puppeteer.js` as defined in frontend/package.json.
- CI workflow: .github/workflows/accessibility.yml builds the backend and frontend, starts Laravel and a preview server for the frontend, then runs the accessibility script. It expects A11Y_TEST_EMAIL and A11Y_TEST_PASSWORD secrets to perform authenticated flows.

What the a11y script does (repo inspection)

- The script uses Puppeteer to drive a headless browser and axe-core to scan pages. See frontend/tests/a11y/run-axe-puppeteer.js for exact behavior and pages covered.
- The CI workflow prepares a SQLite DB, runs migrations, optionally runs an AccessibilityTestSeeder (if present), and then performs the scans against the preview server.

Running locally

- Install dependencies:
  - cd frontend
  - npm install

- Ensure the backend is running and accessible (php artisan serve or equivalent). The Vite proxy can be used during development; CI uses built frontend preview on port 5173.

- Seed a test user (if your local environment does not already have a deterministic test user) matching the credentials you pass to the script.

- Run the a11y script:
  - npm run a11y:test

CI expectations and secrets

- The CI workflow sets these environment variables for the script:
  - FRONTEND_URL (http://localhost:5173 in CI)
  - API_BASE (http://127.0.0.1:8000/api/v1)
  - A11Y_TEST_EMAIL and A11Y_TEST_PASSWORD (should be stored as GitHub Secrets for the workflow)

Limitations and guidance

- Passing automated axe-core checks is a regression detection step; it does not guarantee full WCAG compliance.
- The script focuses on the pages and flows implemented in tests/a11y; changes to uncovered pages will not be detected automatically.
- If the script requires an accessibility test user and the repository does not provide an AccessibilityTestSeeder, the CI step attempts to run the seeder but continues if absent — locally you may need to create a suitable test user.

Source references

- frontend/package.json (script: a11y:test)
- frontend/tests/a11y/run-axe-puppeteer.js
- .github/workflows/accessibility.yml
