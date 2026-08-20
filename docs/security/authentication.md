# Authentication

## Purpose

This document describes the current authenticated access model used by the project.

## Current implementation

The backend exposes authentication endpoints through the Laravel API and the frontend consumes them through the auth service layer.

Verified flow:

1. The user submits login credentials.
2. The backend validates the credentials and establishes a session or API token.
3. The frontend stores the authenticated user state and token in browser local storage for a continued session.
4. The app rehydrates the user from the saved state and confirms the server session through `/me` or equivalent bootstrap calls.

## Verified files

- `backend/routes/api.php`
- `backend/app/Modules/Auth/`
- `frontend/src/services/authService.ts`
- `frontend/src/hooks/AuthProvider.tsx`

## Session and bootstrap behavior

The frontend stores a `prototype_user` object and a `prototype_token` when the user signs in. `AuthProvider` rehydrates the app using the cached user while also fetching fresh data from the server.

The app applies user-level accessibility preferences from the server-supplied payload during bootstrap when present.

## Security expectations

- Authentication must be enforced by the backend.
- Frontend route gating is a convenience layer and does not replace backend access control.
- Sensitive operations must validate the current user identity and role on the server.

## Related security documentation

- [Authorization and RBAC](./authorization-rbac.md)
- [Role model and permissions](./roles.md)
