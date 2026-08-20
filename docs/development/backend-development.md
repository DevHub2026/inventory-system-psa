# Backend development (implementation-backed)

This document describes the verified backend developer workflow and project layout.

Verified prerequisites

- PHP ^8.3 (composer.json requires "php": "^8.3")
- Composer

Verified commands (from backend/composer.json)

- Install dependencies:

  cd backend
  composer install

- Composer scripts available (examples):
  - composer setup — runs composer install, copies .env.example to .env, generates app key, runs migrate --force, installs npm packages and builds frontend (this setup script may run migrations and should be used with care in production).
  - composer dev — attempts to run a combined developer environment using "npx concurrently" to start php artisan serve, queue listener, pail, and npm run dev (requires npx and additional tools).
  - composer test — runs php artisan config:clear and php artisan test

- Artisan commands (Laravel):
  - php artisan key:generate
  - php artisan migrate
  - php artisan migrate:status
  - php artisan db:seed
  - php artisan serve
  - php artisan test (alias for running PHPUnit tests via Artisan)

Project layout (high level)

- app/ — application code
  - Modules/ — domain modules (Asset, Inventory, Borrowing, Reservation, etc.), each with Controllers, Models, Services, Requests, Routes
  - Policies/ — authorization policy classes
  - Http/Middleware/ — middleware (EnsureSessionTokenActive, EnsureUserHasRole, CORS, etc.)
- routes/api.php and module routes under app/Modules/*/Routes/api.php — API endpoint registration
- database/migrations/ — migrations (authoritative schema)
- database/seeders/ — seeders (if present)
- config/ — application configuration

Testing and test environment

- PHPUnit configured via backend/phpunit.xml — test environment uses sqlite in-memory for fast tests (DB_CONNECTION=sqlite, DB_DATABASE=:memory:)
- Run backend tests:

  cd backend
  php artisan test
  OR
  ./vendor/bin/phpunit

Notes and cautions

- composer setup runs php artisan migrate --force as part of its steps — understand the environment before running on any DB containing real data.
- composer dev uses npx concurrently and starts several processes; ensure you understand the command and have required tools installed before running.

Source references

- backend/composer.json
- backend/phpunit.xml
- backend/routes/api.php
- backend/app/Modules/
