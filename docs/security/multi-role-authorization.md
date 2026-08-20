# Multi-role Authorization (implementation-backed)

This document explains how the implementation treats users who hold multiple roles.

Storage and methods

- Users have a belongsToMany relationship to Role. See: backend/app/Models/User.php and backend/app/Models/Role.php
- User methods present in the model include: hasRole(), hasAnyRole(), hasPermission(), assignRole(). These methods are used by middleware, controllers and policies.
- assignRole() in the User model is implemented to preserve existing roles (uses syncWithoutDetaching or equivalent). This allows users to accumulate roles rather than replacing them.

Additive authorization behavior

- Role checks are evaluated with hasRole() / hasAnyRole() helpers and therefore act additively: if any role satisfies the required role check, the user is authorized at that middleware checkpoint.
- Policies may further refine behavior based on role combinations (for example: InventoryItemPolicy and AssetPolicy include code paths that behave differently depending on whether the user has Supply Officer role plus another role).

Frontend aggregation

- The frontend aggregates roles from the /me endpoint and provides helpers that consider multiple roles for UI visibility. See: frontend/src/utils/roleHelpers.ts

Examples observed in code

- Supply Officer restrictions are applied in InventoryItemPolicy when the user only has Supply Officer role; if the user also has higher-level roles (e.g., System Administrator), stricter Supply Officer-only checks are bypassed.

Source references

- backend/app/Models/User.php
- backend/app/Policies/InventoryItemPolicy.php
- backend/app/Http/Middleware/EnsureUserHasRole.php
- frontend/src/utils/roleHelpers.ts

Notes

- This document reflects the current implementation. If the product wishes to make role combinations have different semantics (for example, make the most-permissive or most-restrictive role win), that would be a behavior change and should be spec'd and implemented explicitly.
