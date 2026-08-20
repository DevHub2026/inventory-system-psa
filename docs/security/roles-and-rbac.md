# Roles and RBAC (implementation-backed)

This document records the canonical roles and how role-based access control is enforced in the codebase. All claims are traced to source files.

Canonical roles

Roles are defined in:
- backend/app/Enums/UserRole.php

Verified canonical role names (string values used across middleware and policies):
- Super Administrator
- System Administrator
- Property Custodian
- Inventory Officer
- Department Head
- Employee
- Auditor
- Supply Officer

How roles are stored and assigned

- Roles are modeled by the Role model and attached to User via a belongsToMany relation. See: backend/app/Models/User.php and backend/app/Models/Role.php
- Convenience methods on the User model exist: hasRole(), hasAnyRole(), assignRole(), hasPermission(). See: backend/app/Models/User.php
- assignRole() preserves existing roles (uses syncWithoutDetaching or equivalent) — verified from the User model implementation. This means users may hold multiple roles simultaneously.

How role checks are performed

- Route-level role enforcement uses middleware that checks role membership. Example: module route files register role middleware strings; see: backend/app/Modules/*/Routes/api.php (e.g. Inventory, Asset, Borrowing routes).
- Middleware used: backend/app/Http/Middleware/EnsureUserHasRole.php — this middleware examines the authenticated user and returns an HTTP 403 if role checks fail.
- Policies and service-level checks may also rely on hasRole() or hasPermission() helpers provided by the User model.

Frontend role helpers

- The frontend includes helper utilities used for UI visibility: frontend/src/utils/roleHelpers.ts and frontend/src/hooks/AuthProvider.tsx. These are convenience helpers for hiding or showing UI elements and are NOT the authoritative security boundary.

Role visibility vs. backend enforcement

- Visibility in the UI is provided by frontend helpers. The backend enforces access with middleware and policies. Where both exist, backend checks are the authoritative enforcement.

Source references

- backend/app/Enums/UserRole.php
- backend/app/Models/User.php
- backend/app/Http/Middleware/EnsureUserHasRole.php
- backend/app/Modules/*/Routes/api.php
- frontend/src/utils/roleHelpers.ts

Notes

- This document does not attempt to produce a complete per-endpoint permission matrix (this information is implemented across route middleware and policies). If a complete mapping is required, run a follow-up scan of `backend/app/Policies/` and `backend/app/Modules/*/Controllers` for calls to `$this->authorize(...)`.
