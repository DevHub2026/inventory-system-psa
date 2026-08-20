# Authorization (implementation-backed)

This document describes how authorization is enforced across the stack and the real runtime flow for an authenticated request.

Verified authorization flow

1. Authentication middleware (auth:sanctum) verifies the bearer token and populates the authenticated user. See: backend/routes/api.php
2. EnsureSessionTokenActive middleware checks the presented token against the UserSession record to enforce per-session revocation. See: backend/app/Http/Middleware/EnsureSessionTokenActive.php
3. Optional role middleware (EnsureUserHasRole) checks required role(s) registered on the route. See: backend/app/Http/Middleware/EnsureUserHasRole.php and module route files under backend/app/Modules/*/Routes/api.php
4. Controller-level authorization or FormRequest authorize() is executed. Controllers use $this->authorize(...) or FormRequests implement authorize() to check policies. See: backend/app/Policies/* and controller usage across backend/app/Modules/*/Controllers
5. Service-layer checks run where controllers delegate business logic. Service classes may run additional checks and throw AuthorizationException on failure. See: backend/app/Modules/*/Services/*

Where authorization is enforced

- Route middleware: role checks at route registration time. See: backend/app/Modules/Inventory/Routes/api.php for examples.
- Policies: resource-specific, action-based checks implemented in backend/app/Policies/*. Controllers commonly call $this->authorize('action', $resource) or FormRequests call policies via authorize() method.
- Service layer: additional application-specific checks exist in Services classes.

HTTP semantics observed

- Unauthenticated requests receive a 401 from auth middleware (auth:sanctum) when no valid token is presented.
- Authenticated but unauthorized requests receive a 403 when role middleware or policy checks fail.

Why frontend role checks are not sufficient

- Frontend helpers only control visibility. Every sensitive operation has backend checks (middleware/policies). The backend is the authoritative guard — the frontend is convenience only.

Sources

- backend/routes/api.php
- backend/app/Http/Middleware/EnsureSessionTokenActive.php
- backend/app/Http/Middleware/EnsureUserHasRole.php
- backend/app/Policies/*
- backend/app/Modules/*/Controllers/*

Notes and caveats

- Not every route uses all layers of authorization. Some routes rely solely on middleware, others additionally call policies. This is an implementation distribution rather than a single consistent enforcement layer.
- If a resource/action must be protected in all paths, verify both route middleware and controller authorize() usage.
