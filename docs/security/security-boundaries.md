# Security Boundaries (implementation-backed)

This document describes the trust boundaries and who enforces what in the system.

Boundaries overview

Browser / Frontend
- Trusted/Untrusted input: Input from the user (untrusted). The frontend may store tokens in localStorage (verify in frontend implementation).
- Enforcement: UI visibility, route gating, and input validation before sending requests. Not authoritative for permission enforcement.
- Important limitation: Any authorization enforced only in the frontend can be bypassed by calling the API directly.

API Boundary
- Trusted/Untrusted input: Receives requests from potentially untrusted clients.
- Enforcement: Authentication (auth:sanctum), EnsureSessionTokenActive, role middleware (EnsureUserHasRole), FormRequest validation, controller authorize() calls and policies, and service-layer checks.
- Important limitation: CORS is permissive (Access-Control-Allow-Origin: *). Production deployment should restrict origins if required.

Authentication Layer
- Responsible for establishing identity (Sanctum tokens) and maintaining sessions (UserSession records).
- Enforcement: auth:sanctum middleware, EnsureSessionTokenActive.

Authorization Layer
- Responsible for role checks and resource-level policies.
- Enforcement: Route middleware (EnsureUserHasRole), policies in backend/app/Policies, controller authorize() calls, and FormRequest authorize() methods.

Controllers / Services
- Controllers perform request validation and call services.
- Services implement domain logic and may run additional authorization checks or business validations.

Models / Database
- Models express relationships and helper methods (hasRole, hasPermission).
- Sensitive enforcement is implemented at higher layers (middleware/policies). There is no evidence of row-level security (RLS) policies in the database migrations.

Table: Boundary responsibilities

| Boundary | Trusted/Untrusted Input | Enforcement | Important Limitation |
|---------|-------------------------|-------------|----------------------|
| Frontend | User input, local token | UI gating, client-side validation | Not authoritative; can be bypassed via direct API calls |
| API | HTTP requests | auth:sanctum, EnsureSessionTokenActive, EnsureUserHasRole, FormRequests, Policies | CORS set to `*` in code; restrict in deployment if needed |
| Controllers/Services | Authenticated requests and business data | authorize(), services checks | Must ensure all entrypoints perform required checks |
| Database | Persisted records | Model constraints, migrations | No verified RLS or DB-enforced row-level policies in repository codebase |

Known security limitations / Not confirmed by code

- Secrets management, encryption-at-rest and backup security are not represented in the repository and are therefore Not Confirmed from the current implementation.
- Production TLS/HTTPS enforcement is assumed at deployment; code sets HSTS in production via SecurityHeaders but does not manage certificates.

Source references

- backend/app/Http/Middleware/EnsureSessionTokenActive.php
- backend/app/Http/Middleware/EnsureUserHasRole.php
- backend/app/Http/Middleware/HandleCors.php
- backend/app/Http/Middleware/SecurityHeaders.php
- backend/routes/api.php
- frontend/src/hooks/AuthProvider.tsx
