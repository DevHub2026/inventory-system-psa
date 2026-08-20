# Environment configuration (implementation-backed)

This document lists environment variables and configuration sources verified from the repository. Never place secrets in repository documentation.

Backend environment (source: backend/.env.example and backend/.env when present)

Common variables (present in .env.example):

- APP_NAME — application name
- APP_ENV — environment name (local, production)
- APP_KEY — Laravel app key (generated with php artisan key:generate)
- APP_DEBUG — debug mode (true/false)
- APP_URL — application URL (e.g., http://localhost)

Database
- DB_CONNECTION — database driver (sqlite, mysql, pgsql). Default in config/database.php is sqlite when DB_CONNECTION is unset.
- DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD — host/port/name/credentials for DB when not using sqlite.

Sessions / Cache / Queues
- SESSION_DRIVER — session storage driver (file, database)
- CACHE_STORE — cache driver (database, redis, array)
- QUEUE_CONNECTION — queue connection (database, sync)

Email / Third-party
- MAIL_MAILER, MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD — mail transport
- RESEND_KEY — example third-party API key used by Resend integration

Sanctum / CORS
- SANCTUM_STATEFUL_DOMAINS — list of stateful domains for Sanctum (commented in .env.example)
- CORS_ALLOWED_ORIGINS — suggested production CORS origin (commented in .env.example)

Frontend environment (source: frontend/.env.example)

- VITE_USE_MOCK — optional flag used by frontend to enable client-side mock mode (commented)
- VITE_API_BASE_URL — base path for API calls (defaults to /api/v1 when using Vite proxy)

Notes on Vite config

- Vite dev server runs on port 5173 by default (frontend/vite.config.ts). It is configured to proxy /api to http://127.0.0.1:8000 by default.
- Vite config references local HTTPS cert files under frontend/certs (not guaranteed to exist); if certs are absent Vite will fall back to HTTP unless you add certificates.

Testing environment (source: backend/phpunit.xml)

- phpunit.xml sets environment values for tests:
  - APP_ENV=testing
  - DB_CONNECTION=sqlite
  - DB_DATABASE=:memory:
  - Other test-friendly settings: CACHE_STORE=array, QUEUE_CONNECTION=sync, SESSION_DRIVER=array

Security note

- Do not commit real credentials into .env. Use environment-specific secret management.
- The repository contains a sample backend/.env.example — copy it to .env and populate secrets via your local secrets manager or environment variables.

Source references

- backend/.env.example
- backend/config/database.php
- frontend/.env.example
- backend/phpunit.xml
- frontend/vite.config.ts
