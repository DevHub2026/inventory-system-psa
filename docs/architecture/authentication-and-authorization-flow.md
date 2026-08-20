# Authentication and Authorization Flow

This document describes the real authentication and authorization behavior implemented in the repository.

Authentication (verified)

Mechanism
- Laravel Sanctum is used for API authentication. Authenticated routes are protected with the auth:sanctum middleware in backend/routes/api.php.
- Public auth endpoints: POST /api/v1/login, POST /api/v1/forgot-password, POST /api/v1/reset-password (rate-limited via throttle middleware).
- Session management: SessionController exposes GET /api/v1/sessions, POST /api/v1/sessions/{id}/revoke and POST /api/v1/sessions/revoke-all for authenticated users.
- Current user: GET /api/v1/me returns authenticated user info (AuthController::me).
- Profile and password: PUT /api/v1/profile, PUT /api/v1/change-password, and admin password endpoints are provided.

Token/Session behavior
- The code uses Sanctum tokens/sessions; the frontend stores the token via the api client and AuthProvider updates state accordingly. See frontend/src/hooks/AuthProvider.tsx and frontend/src/services/api.ts.

Accessibility preferences
- Per-user accessibility preferences are persisted via PUT /api/v1/me/accessibility-preferences (AuthController::updateAccessibilityPreferences). Frontend also applies preferences immediately to the UI.

Authorization (verified)

Role middleware
- Many routes are enclosed in role middleware strings such as:
  role:Super Administrator,System Administrator,Property Custodian,Inventory Officer,Supply Officer,Department Head
  (see module route files under backend/app/Modules/*/Routes/api.php)
- This middleware enforces module-level access.

Policies and AuthorizesRequests
- Controllers use $this->authorize(...) (AuthorizesRequests) for fine-grained checks. Policy classes (App/Policies/*) implement authorization logic per model (e.g., UserPolicy, AssetPolicy, InventoryItemPolicy).
- FormRequest classes sometimes implement authorize() to enforce policy-based checks before validation (e.g., StoreInventoryItemRequest authorizes based on classification and user policy).

Ownership checks
- Several endpoints require either manager roles or object ownership (e.g., borrowers can create extension requests for their own borrowing). Check corresponding controllers and request classes for `can:view`, `can:update`, and `authorize()` hooks.

Canonical roles (verified)
- Roles referenced directly in route middleware and code include: Super Administrator, System Administrator, Property Custodian, Inventory Officer, Supply Officer, Department Head, Auditor. Use backend/app/Enums/UserRole.php for canonical enumeration.

Frontend role helpers
- The frontend exposes role helper utilities in frontend/src/utils/roleHelpers.ts which are used to hide/show UI elements. The frontend helpers are convenience utilities only; backend policies and middleware are authoritative for access control.

Supply Officer specific behavior (verified)
- Supply Officer appears in route middleware allowing access to Inventory routes and some Asset/Reports endpoints. Inventory middleware explicitly includes Supply Officer. Supply-item classification rules (e.g., asset borrowable flag) are enforced in AssetController::setBorrowable where a check rejects enabling borrowable for items classified as 'SUPPLY'. This is a backend-enforced business rule.

Source of truth
- backend/routes/api.php
- backend/app/Modules/*/Routes/api.php
- backend/app/Policies/*
- backend/app/Modules/Auth/Requests/* (LoginRequest, ResetPasswordRequest)
- frontend/src/hooks/AuthProvider.tsx
- frontend/src/utils/roleHelpers.ts
