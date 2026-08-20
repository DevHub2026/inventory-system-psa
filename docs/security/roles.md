# Role model and permissions

## Purpose

This page summarizes the current canonical roles present in the repository and the operational intent behind each role.

## Source of truth

The authoritative role enumeration is defined in:

- `backend/app/Enums/UserRole.php`

## Role list

### Super Administrator

High-level administrative access across the platform.

### System Administrator

Operational administration and general configuration responsibilities.

### Property Custodian

Property-level oversight and asset accountability responsibilities.

### Inventory Officer

Inventory management and stock operations responsibilities.

### Department Head

Department-level operational oversight and approval context.

### Employee

General operational user role for day-to-day request and use workflows.

### Auditor

Read-oriented audit and compliance responsibilities.

### Supply Officer

Supply-specific access behavior is implemented through role-aware category logic, including restricted supply categories and combined access scenarios.

## Implementation notes

- Role labels are intentionally used consistently across the backend and frontend.
- The frontend uses helper logic to present role labels without inventing new names.
- Multiple-role users are expected to retain the combined authorization set, rather than a single role replacing another.

## Related files

- `backend/app/Enums/UserRole.php`
- `frontend/src/utils/roleHelpers.ts`
- `backend/routes/api.php`
- `backend/app/Models/User.php`
