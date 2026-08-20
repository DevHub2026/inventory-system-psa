# Authorization and RBAC

## Purpose

This document describes the current authorization model used by the application.

## Current implementation

The canonical role definitions are stored in `backend/app/Enums/UserRole.php` and are used across the backend resource checks and frontend role-aware workflows.

The system supports role-based access control and multiple-role assignment for a given user. Authorization is enforced in the backend route/service layer and complemented by frontend UI guards.

## Canonical roles

The current canonical set includes:

- Super Administrator
- System Administrator
- Property Custodian
- Inventory Officer
- Department Head
- Employee
- Auditor
- Supply Officer

## Verified behavior

The codebase enforces role-aware access patterns in several places, including:

- route-level authorization guards
- service-layer restrictions
- model or policy checks
- UI role filtering for visible actions and navigation

The frontend uses helpers such as `roleHelpers.ts` to keep presentation aligned with the backend-defined role names.

## Important constraints

- The backend is the source of truth for authorization enforcement.
- The frontend should hide or show actions as a usability layer, not as the sole protection mechanism.
- Multiple-role users must be evaluated using the combined set of granted capabilities rather than a single overriding role.

## Related files

- `backend/app/Enums/UserRole.php`
- `backend/app/Models/User.php`
- `backend/app/Models/Role.php`
- `frontend/src/utils/roleHelpers.ts`
- `backend/routes/api.php`
