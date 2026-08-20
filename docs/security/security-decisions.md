# Security Decisions (implementation-backed ADR-style)

This document records verified security-related architecture decisions and the reasoning visible in code.

Decision: Backend authorization is authoritative

## Decision
The backend enforces authentication and authorization using middleware and policies; frontend checks are considered convenience only.

## Context
Frontend contains role helpers; policies and route middleware exist on the backend.

## Current Implementation
- auth:sanctum middleware on API routes (backend/routes/api.php)
- EnsureUserHasRole middleware protects route groups
- Policies are implemented in backend/app/Policies/* and used in controllers/FormRequests

## Security Impact
This places the authoritative boundary on the server side and prevents UI-only controls from being the final gate.

## Trade-offs / Limitations
Because enforcement is distributed across middleware and policies, auditing an endpoint requires checking both the route registration and controller/policies.

## Source References
- backend/routes/api.php
- backend/app/Http/Middleware/EnsureUserHasRole.php
- backend/app/Policies/


Decision: Per-session token checks via UserSession

## Decision
Per-session tokens are tracked via a UserSession model and VerifySessionTokenActive middleware checks tokens against those records.

## Context
Sanctum tokens alone cannot carry a separate active/inactive state beyond deletion. The app stores a UserSession record to support session metadata and revocation semantics.

## Current Implementation
- EnsureSessionTokenActive reads the Sanctum token id prefix and checks backend/app/Models/UserSession.php
- SessionController attempts to mark or delete both the Sanctum token and corresponding UserSession entry on logout/revocation.

## Security Impact
This provides per-session revocation semantics and administrative controls for active sessions.

## Trade-offs / Limitations
If EnsureSessionTokenActive is not applied to a route group, per-session revocation may not be enforced for those endpoints.

## Source References
- backend/app/Http/Middleware/EnsureSessionTokenActive.php
- backend/app/Modules/Auth/Controllers/SessionController.php


Decision: CORS default is permissive in middleware

## Decision
HandleCors middleware sets Access-Control-Allow-Origin: *.

## Context
This simplifies cross-origin access for clients (mobile, web) but increases exposure surface.

## Security Impact
Increased potential for cross-origin requests. Rely on server-side auth and tokens to protect sensitive operations.

## Trade-offs / Limitations
Recommend updating CORS to restrict origins in production deployments.

## Source References
- backend/app/Http/Middleware/HandleCors.php


Notes
All decisions above are recorded based on current implementation and may be revisited if architecture changes. Where a decision is inferred from how code is written (for example, why the UserSession model exists), that inference is flagged as implementation-based rather than explicitly documented design rationale in the repository.
