# Installation

## Requirements

### Backend

- PHP 8.1 or newer
- Composer
- Laravel-compatible runtime dependencies
- PostgreSQL database for the project environment

### Frontend

- Node.js 20 LTS or newer
- npm

### Optional local tooling

- Git
- A local database client for manual inspection

## Backend setup

1. Navigate to `backend/`.
2. Copy the environment template if available: `.env.example` to `.env`.
3. Configure the database connection in `.env`.
4. Install dependencies:

```bash
composer install
```

5. Generate the Laravel application key if needed:

```bash
php artisan key:generate
```

6. Run migrations:

```bash
php artisan migrate --force
```

7. Start the API:

```bash
php artisan serve --host=127.0.0.1 --port=8000
```

## Frontend setup

1. Navigate to `frontend/`.
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev -- --host 127.0.0.1 --port 4173
```

4. Build for production:

```bash
npm run build
```

## Verified project configuration

The project’s active configuration currently uses PostgreSQL settings in `backend/.env`, with Laravel reading the configured database connection through Laravel’s config system.

## Environment notes

- Do not commit secrets or private environment values to the repository.
- Local frontend authentication checks may rely on app-local storage keys such as `prototype_user` and `prototype_token` when running in browser-based testing.
- Accessibility testing uses environment variables such as `A11Y_TEST_EMAIL` and `A11Y_TEST_PASSWORD` when present.

## Related files

- `backend/.env.example`
- `backend/composer.json`
- `frontend/package.json`
- `frontend/tests/a11y/run-axe-puppeteer.js`
