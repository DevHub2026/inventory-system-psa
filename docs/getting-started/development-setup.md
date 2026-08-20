# Development setup

## Local workflow

A typical developer workflow for this repository is:

1. Start the Laravel backend.
2. Start the Vite frontend.
3. Sign in with an authenticated user.
4. Use the app through the protected routes.
5. Run focused backend tests and frontend validation on changes.

## Backend commands

From `backend/`:

```bash
php artisan serve --host=127.0.0.1 --port=8000
php artisan migrate --force
php artisan test
```

For targeted tests:

```bash
php artisan test --filter=FaqApiTest
php artisan test --filter=AccessibilityPreferencesTest
php artisan test --filter=SupplyOfficerAuthorizationTest
```

## Frontend commands

From `frontend/`:

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 4173
npm run build
npm run lint
npm run a11y:test
```

## Authentication and app bootstrap

The frontend authenticates through the backend API and stores the resulting session data in browser local storage. The app bootstraps user state through `AuthProvider` and reads the cached `prototype_user` and `prototype_token` values before rehydrating from the server.

## Role-aware development notes

The allowed role labels are defined in `backend/app/Enums/UserRole.php` and are used throughout the app:

- Super Administrator
- System Administrator
- Property Custodian
- Inventory Officer
- Department Head
- Employee
- Auditor
- Supply Officer

## Accessibility development notes

Accessibility verification can be run locally with the script at `frontend/tests/a11y/run-axe-puppeteer.js`.

Typical environment variables:

```bash
FRONTEND_URL=http://127.0.0.1:4173
API_BASE=http://127.0.0.1:8000/api/v1
A11Y_TEST_EMAIL=a11y@example.test
A11Y_TEST_PASSWORD=Password123!
```

## Related files

- `frontend/src/App.tsx`
- `frontend/src/hooks/AuthProvider.tsx`
- `frontend/src/utils/accessibilityPreferences.ts`
- `backend/app/Enums/UserRole.php`
- `frontend/tests/a11y/run-axe-puppeteer.js`
