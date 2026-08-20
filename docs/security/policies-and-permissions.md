# Policies and Permissions (implementation-backed)

This file catalogs available policy classes and where they are used. It is intentionally concise and based on the code under `backend/app/Policies/` and controller references.

Existing policy classes

- UserPolicy — backend/app/Policies/UserPolicy.php — controls view/create/update/delete user actions. Called from UserController and FormRequests.
- RolePolicy — backend/app/Policies/RolePolicy.php — controls role management (viewAny, view, create, update, delete, forceDelete).
- PermissionPolicy — backend/app/Policies/PermissionPolicy.php — permission management checks.
- InventoryItemPolicy — backend/app/Policies/InventoryItemPolicy.php — inventory-specific checks including Supply Officer special cases.
- AssetPolicy — backend/app/Policies/AssetPolicy.php — asset CRUD and issuance authorization.

Where policies are called

- Controllers often call $this->authorize('action', $resource) before carrying out sensitive operations. Example: backend/app/Modules/Asset/Controllers/AssetController.php
- FormRequest::authorize() implementations delegate to policies for endpoints that create or modify resources (see backend/app/Modules/Inventory/Requests/StoreInventoryItemRequest.php and many others).

Table of policy usage (representative, not exhaustive)

| Policy | Resource | Actions/Abilities | Called From |
| ------ | -------- | ----------------- | ----------- |
| UserPolicy | User model | view, create, update, delete | backend/app/Modules/User/Controllers/* and FormRequests |
| InventoryItemPolicy | InventoryItem | create, update, delete, manage | backend/app/Modules/Inventory/Controllers/* and StoreInventoryItemRequest |
| AssetPolicy | Asset | view, update, transfer, dispose | backend/app/Modules/Asset/Controllers/* |
| RolePolicy | Role | manage roles | backend/app/Modules/Role/Controllers/* |

Relationship between role middleware and policies

- Role middleware enforces coarse-grained, route-level requirements ("must be Supply Officer or System Administrator"). Policies provide resource-level, fine-grained decisions.
- Both are used together across the codebase. Do not assume one replaces the other.

Source references

- backend/app/Policies/
- backend/app/Modules/*/Controllers/*
- backend/app/Modules/*/Requests/*

Notes

- There is not a single centralized permission table (permissions are implemented through a combination of role middleware strings, policy classes, and permission helpers on the User model). A follow-up mapping pass is recommended if an endpoint-level matrix is required.
