# Supply Officer Authorization (implementation-backed)

This document focuses on the Supply Officer role and the verified behavior enforced by policies and middleware in the Inventory/Asset domain.

Canonical role

- The Supply Officer role string is defined in: backend/app/Enums/UserRole.php — value: "Supply Officer".

Where Supply Officer is enforced

- Inventory routes and controllers apply role middleware that includes Supply Officer for certain operations. See: backend/app/Modules/Inventory/Routes/api.php
- InventoryItemPolicy contains Supply Officer-specific checks that limit what a Supply Officer may create or manage. See: backend/app/Policies/InventoryItemPolicy.php

Verified behavioral summary

- Supply Officers may perform inventory operations only for items classified as SUPPLY (or other classification explicitly permitted in the policy). This is enforced in InventoryItemPolicy and in StoreInventoryItemRequest authorize() logic.
- If a user has additional roles (e.g., System Administrator or Inventory Officer), the stricter Supply Officer-only restriction is relaxed and the user may manage more categories — this is implemented via role-check branching in the policy, not by middleware replacement.

Examples (implementation traces)

- StoreInventoryItemRequest::authorize() calls InventoryItemPolicy which inspects the requested classification and the user's roles to decide whether the operation is allowed.
- Inventory routes register middleware that requires Supply Officer OR other roles for particular endpoints; the policy provides a final per-resource decision.

Source references

- backend/app/Enums/UserRole.php
- backend/app/Policies/InventoryItemPolicy.php
- backend/app/Modules/Inventory/Requests/StoreInventoryItemRequest.php
- backend/app/Modules/Inventory/Routes/api.php

Notes

- Supply Officer frontend UI elements are shown/hidden by role helpers (frontend/src/utils/roleHelpers.ts) but backend enforcement is via policy and middleware.
- If a stricter, centralized category-based permission model is desired, consider extracting category checks into a shared policy or permission that can be reused by controllers and services.
