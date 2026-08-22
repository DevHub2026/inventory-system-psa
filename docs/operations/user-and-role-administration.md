# User & Role Administration (implementation-backed)

Summary

The repository implements role-based access using a roles table and an App\Enums\UserRole enum. Roles are referenced throughout controllers, services and policies to gate access to administrative actions.

Implemented and verified

- Roles defined in code: backend/app/Enums/UserRole.php (cases include Super Administrator, System Administrator, Property Custodian, Inventory Officer, Department Head, Employee, Auditor, Supply Officer).
- User creation and management APIs:
  - Controllers and FormRequests exist under backend/app/Modules/Auth (StoreUserRequest, UpdateUserRequest, UserProfileController).
  - Import handlers support importing users with role mapping (Modules/Auth/Services/UserImportService, Modules/Import/Handlers/UserImportHandler).
- Assigning and removing roles:
  - The User model exposes helper methods (assignRole, hasRole, hasAnyRole, syncWithoutDetaching) — see backend/app/Models/User.php.
- Password management:
  - Password setting and reset flows follow Laravel conventions via the Auth module; developers should inspect modules/Auth for exact endpoints.
- Authorization enforcement:
  - Policies and explicit role checks are used broadly (e.g., AssetPolicy, InventoryItemPolicy, ReservationController). Backend enforcement is the source of truth; frontend visibility alone is not sufficient.

Partially implemented / notes

- Delegated role management UI exists in the frontend but exact admin pages and flows should be verified in the frontend code if UI-level instructions are required.
- Role assignment during import uses heuristics; ensure CSV imports map role names exactly or provide mapping in import config.

Source-of-truth files

- backend/app/Enums/UserRole.php
- backend/app/Models/User.php
- backend/app/Modules/Auth/Controllers/
- backend/app/Modules/Auth/Services/UserImportService.php
- backend/app/Modules/Import/Handlers/UserImportHandler.php
- backend/app/Policies/*
