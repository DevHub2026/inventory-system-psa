# System overview

## Purpose

This document summarizes the current architecture of the PSA Inventory Management System as implemented in the repository.

## Current implementation

The project is split into a Laravel backend and a React frontend:

- `backend/` contains the API, models, migrations, middleware, and module logic.
- `frontend/` contains the user-facing application shell and route-based UI.
- `mobile/` contains the separate mobile app work.

## Architectural layers

### Presentation layer

The frontend uses a route-based React application with a shared app layout and protected route flow. The main entry is `frontend/src/App.tsx` and the shell is `frontend/src/layouts/AppLayout.tsx`.

Common responsibilities include:

- authentication bootstrap
- protected route gating
- dashboard and inventory navigation
- role-aware UI rendering
- user settings and accessibility preferences
- help and FAQ surfaces

### API layer

The backend defines REST-style API endpoints under `backend/routes/api.php` and module-specific route files under `backend/app/Modules/*/Routes/api.php`.

The API is organized by feature area rather than a single monolithic controller. Modules include:

- authentication and user management
- inventory
- assets
- borrowing
- reservations
- reports
- system setup
- FAQs
- access and role enforcement

### Persistence layer

The Laravel application persists data through Eloquent models and migrations. The database schema is versioned in `backend/database/migrations/` and reflects the operational business model for assets, inventory, users, roles, borrowing activity, and system configuration.

## Workflow summary

1. Users authenticate through the backend API.
2. The frontend bootstraps the signed-in user and caches session data locally.
3. Route-level and server-side checks restrict access to protected actions.
4. Feature modules manage their own domain logic and validation.
5. UI surfaces and reports read the backend API data and display role-aware information.

## Key implementation notes

- Role handling is defined in `backend/app/Enums/UserRole.php` and is treated as canonical.
- Authorization is enforced both in the backend and in the route/UI layer.
- Accessibility features are implemented at the application shell level and include user-level preference persistence.
- FAQ content is backed by the backend and role-filtered in the API/UI layer.

## Related files

- `backend/routes/api.php`
- `backend/app/Modules/`
- `backend/app/Enums/UserRole.php`
- `frontend/src/App.tsx`
- `frontend/src/layouts/AppLayout.tsx`
- `frontend/src/hooks/AuthProvider.tsx`
