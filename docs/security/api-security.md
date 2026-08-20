# API Security (implementation-backed)

This document lists the security controls applied at the API boundary and where they are implemented.

Security controls observed

- Authentication middleware: auth:sanctum applied to API route groups. See: backend/routes/api.php
- Per-session token checks: EnsureSessionTokenActive middleware enforces that a presented token corresponds to an active UserSession record. See: backend/app/Http/Middleware/EnsureSessionTokenActive.php
- Role middleware: EnsureUserHasRole checks required roles declared on routes. See: backend/app/Http/Middleware/EnsureUserHasRole.php and backend/app/Modules/*/Routes/api.php
- FormRequest validation: Request classes validate shape and types of incoming data. See: backend/app/Modules/*/Requests/*
- Throttling: throttle middleware is applied to authentication and other public endpoints (e.g. throttle:5,1). See: backend/routes/api.php
- CORS: A custom HandleCors middleware sets Access-Control-Allow-Origin: * and allows common methods/headers. See: backend/app/Http/Middleware/HandleCors.php
- Security headers: SecurityHeaders middleware sets X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, and HSTS in production. See: backend/app/Http/Middleware/SecurityHeaders.php

Notable behaviors and implications

- CORS allows any origin (Access-Control-Allow-Origin: *). This is functional for public API access but increases the attack surface; if a narrower origin policy is required in production, update HandleCors.php to restrict allowed origins.

- Per-session checks mean revoking a session requires both deleting the related Sanctum token and marking the UserSession inactive. EnsureSessionTokenActive inspects the token id prefix (Sanctum token format) before checking UserSession.

- Throttle settings on auth endpoints help mitigate brute-force login attempts.

HTTP response semantics

- Authentication failures return 401 when no valid token is presented.
- Authorization failures (role/policy) return 403.
- Validation failures return 422 with standard Laravel validation structure.

Where to look for API-level protections

- backend/routes/api.php — route registration, middleware groups
- backend/app/Http/Middleware/EnsureSessionTokenActive.php
- backend/app/Http/Middleware/EnsureUserHasRole.php
- backend/app/Http/Middleware/HandleCors.php
- backend/app/Http/Middleware/SecurityHeaders.php
- backend/app/Modules/*/Requests/*

Recommendations (implementation-backed suggestions)

- Consider restricting CORS origins in production deployment config rather than using `*` in code.
- Keep throttle values tuned for real-world load; authentication endpoints should remain rate-limited.

Notes

- CSRF protection is not applicable to token-based API endpoints unless cookies are used. Do not assume CSRF protection for bearer-token endpoints unless cookie-based auth is in use.
