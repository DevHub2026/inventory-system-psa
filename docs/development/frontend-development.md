# Frontend development (implementation-backed)

This document describes the verified frontend developer workflow and project layout for the web UI.

Verified commands (from frontend/package.json)

- Install dependencies:
  - npm install

- Run dev server (Vite):
  - npm run dev
  - Vite dev server default: port 5173 (see frontend/vite.config.ts)

- Build for production:
  - npm run build
  - This runs: tsc -b && vite build (per package.json)

- Preview built assets:
  - npm run preview

- Linting:
  - npm run lint (runs eslint .)

- Accessibility regression script:
  - npm run a11y:test (runs node tests/a11y/run-axe-puppeteer.js)

Project structure (high level)

- src/ — main TypeScript React application
  - pages/ — top-level page components (e.g., AssetPage, BorrowingPage)
  - components/ — reusable components (tables, forms, modals)
  - services/ — API service wrappers (assetService.ts, borrowingService.ts, authService.ts)
  - hooks/ — React hooks (AuthProvider and others)
  - utils/ — utilities and role helpers (roleHelpers.ts)
  - App.tsx — SPA entry and router

- tests/a11y/ — accessibility regression scripts (axe + Puppeteer)

Vite configuration

- frontend/vite.config.ts sets dev server options (host 0.0.0.0, port 5173), HTTPS certs if provided, and a proxy for /api pointing to http://127.0.0.1:8000.
- Alias: '@' → ./src for simplified imports

API integration

- The frontend uses services (frontend/src/services/*) that call API endpoints under /api/v1 by default. During dev, the Vite proxy forwards /api to the backend server.
- Frontend environment variables (frontend/.env.example) recommend leaving VITE_API_BASE_URL unset in dev so the Vite proxy is used.

TypeScript and linting

- TypeScript config: frontend/tsconfig.app.json
- Linting is performed with ESLint (script "lint": "eslint .")

Notes and caveats

- The repo's Vite config references local HTTPS cert files in frontend/certs; these certs may not be present in a fresh clone — dev will still work using HTTP unless you provide cert files.
- The accessibility test requires an authenticated test user in CI (GitHub Actions reads A11Y_TEST_EMAIL and A11Y_TEST_PASSWORD from secrets); locally you can run the script but may need to seed a test user.

Source references

- frontend/package.json
- frontend/vite.config.ts
- frontend/.env.example
- frontend/src/
- frontend/tests/a11y/run-axe-puppeteer.js
