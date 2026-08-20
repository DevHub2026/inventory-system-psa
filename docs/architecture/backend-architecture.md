# Backend architecture

## Purpose

This document summarizes the current Laravel backend implementation used by the application.

## Current implementation

The backend is organized as a Laravel application under `backend/` and uses the framework’s standard request, route, model, and migration patterns. It is not a single-class backend; it is split into feature modules under `backend/app/Modules/` and a shared API route registrar.

## Route organization

The canonical API entry point is defined in `backend/routes/api.php` and references module-specific route files. This keeps domain logic separated by feature area.

Current areas include:

- authentication and user sessions
- users and roles
- inventory
- assets
- borrowing and extensions
- reservations
- reports
- FAQs and help content
- system setup

## Module pattern

Each feature module typically includes:

- routes
- controllers
- services
- models
- related validation logic
- tests

This makes it easier to isolate domain behavior while keeping a common Laravel foundation.

## Authorization model

Authorization is currently defined in the backend via role enum definitions and middleware/guard patterns. The canonical role list lives in `backend/app/Enums/UserRole.php` and is used by policy and route checks.

This architecture supports:

- role-based access checks
- multiple-role assignment for a single user
- feature-level enforcement in the API layer
- RBAC-aligned UI filtering for front-end views

## Persistence and database design

The backend uses Laravel migrations in `backend/database/migrations/`. The schema represents operational data for users, roles, inventory, assets, borrowing and returns, QR-linked records, and settings.

## Testing organization

The project includes backend feature tests under `backend/tests/Feature/` for authentication, authorization, FAQs, accessibility preferences, and domain-specific workflows.

## Related files

- `backend/routes/api.php`
- `backend/app/Modules/`
- `backend/app/Enums/UserRole.php`
- `backend/app/Models/`
- `backend/database/migrations/`
