# Security & RBAC Documentation

Purpose

This folder documents how authentication, authorization, roles, permissions, policies, and API protections are implemented in the current codebase. All material is implementation-backed — the backend code is the authoritative source of truth.

Security docs map

- [authentication.md](./authentication.md) — login/logout/session management, token behavior, rate limits
- [roles-and-rbac.md](./roles-and-rbac.md) — canonical role definitions, role assignment and storage, role middleware
- [authorization.md](./authorization.md) — route middleware, policy and controller authorization flow
- [policies-and-permissions.md](./policies-and-permissions.md) — policy classes, resources protected and where they are applied
- [multi-role-authorization.md](./multi-role-authorization.md) — how multiple roles combine (storage / methods / additive behavior)
- [supply-officer-authorization.md](./supply-officer-authorization.md) — Supply Officer-specific authorization behavior verified in Inventory policies
- [api-security.md](./api-security.md) — API boundary protections, throttling, session checks, CORS and security headers
- [security-boundaries.md](./security-boundaries.md) — trust/boundary table and known limitations
- [security-decisions.md](./security-decisions.md) — ADR-style record of verified security decisions

Relationship to other docs

- Architecture docs (how components interact): docs/architecture/
- API docs (what endpoints exist and their auth requirements): docs/api/
- Feature docs (what the system does): docs/features/
- Deployment docs and environment guidance: docs/deployment/

Source-of-truth

Major files referenced by these documents:
- backend/routes/api.php
- backend/app/Enums/UserRole.php
- backend/app/Http/Middleware/*
- backend/app/Policies/*
- backend/app/Modules/*/Routes/api.php
- backend/app/Modules/*/Requests/*
- backend/app/Modules/*/Controllers/*
- frontend/src/hooks/AuthProvider.tsx
- frontend/src/utils/roleHelpers.ts

Important: frontend role helpers only affect UI visibility. Backend middleware and policies are the authoritative access control enforcement.
