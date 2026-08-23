# Frontend (React + TypeScript + Vite)

This directory contains the React frontend for the PSA Inventory Management System. The application is a Vite + React + TypeScript interface used to interact with the Laravel API, manage users and roles, inventory, assets, borrowing flows, QR scanning, reports, FAQ/help access, and accessibility preferences.

## Verified stack

- React 19
- TypeScript
- Vite
- Axios for API calls
- React Router for route-based navigation
- Local browser storage for user-scoped frontend state and accessibility preferences

## Local frontend workflow

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 4173
```

## Common validation commands

```bash
cd frontend
npm run lint
npm run build
npm run a11y:test
```

## Project scripts

The repository includes the actual frontend scripts defined in `frontend/package.json`:

- `npm run dev` — local Vite development server
- `npm run build` — TypeScript check plus production build
- `npm run lint` — ESLint validation
- `npm run preview` — preview the production build locally
- `npm run a11y:test` — route-based accessibility checks using Puppeteer and axe

## Accessibility and CI

Accessibility validation is implemented in `frontend/tests/a11y/run-axe-puppeteer.js`. The repository also includes a CI workflow at `.github/workflows/accessibility.yml` to run the route checks in automated environments.

## Security and RBAC note

The UI uses frontend role helpers such as `src/utils/roleHelpers.ts` for presentation and route visibility. Backend authorization remains the authoritative enforcement layer and is defined by the Laravel API and policy checks.

## Key source files

- `src/App.tsx` — application bootstrap and route layout
- `src/layouts/AppLayout.tsx` — global shell and mounted controls
- `src/utils/roleHelpers.ts` — canonical role category helpers used by the UI
- `src/services/` — API service layer
- `src/pages/` — route-level pages and workflows
- `tests/a11y/run-axe-puppeteer.js` — accessibility regression runner

## Project documentation

- [../README.md](../README.md)
- [../docs/README.md](../docs/README.md)
- [../docs/getting-started/installation.md](../docs/getting-started/installation.md)
- [../docs/architecture/README.md](../docs/architecture/README.md)
- [../docs/security/README.md](../docs/security/README.md)
- [../docs/accessibility/overview.md](../docs/accessibility/overview.md)
- [../docs/features/README.md](../docs/features/README.md)

## Documentation note

This README reflects the current repository implementation rather than the default Vite starter template. Use the implementation and the `docs/` folder as the source of truth for workflows, commands, and accessibility requirements.
