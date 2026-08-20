# Users and Roles Schema (implementation-backed)

This document describes how users, roles, permissions, and sessions are persisted.

Users table

- Migration: backend/database/migrations/0001_01_01_000000_create_users_table.php
- Primary key: id
- Notable columns (selected):
  - employee_number (nullable)
  - first_name, middle_name, last_name
  - department_id → departments.id (nullable, ON DELETE SET NULL)
  - status (string) — default 'active' (matches App\Enums\UserStatus)
  - email (unique)
  - email_verified_at (timestamp nullable)
  - password
  - timestamps, softDeletes
- Model: backend/app/Models/User.php
- Casts: accessibility_preferences stored as array (see User::$casts in model)

Roles and pivot

- Roles table migration: backend/database/migrations/2026_07_14_110001_create_roles_table.php
- Pivot table: role_user (migration: 2026_07_14_110003_create_role_user_table.php)
  - role_user has foreign keys to roles.id and users.id and uses a composite primary key [role_id, user_id]
- Models: backend/app/Models/Role.php and User::roles() relationship
- Role assignment: User::assignRole uses syncWithoutDetaching — users can hold multiple roles simultaneously

Permissions

- The repo includes a permissions table and permission_role pivot (migrations: create_permissions_table.php and create_permission_role_table.php). The User::hasPermission helper checks role->permissions relationship via roles.
- Permissions are implemented at the application level via role→permission relationships; there is no separate per-user permission pivot in the migrations.

Sessions / Authentication

- user_sessions table (backend/database/migrations/2026_07_28_140004_create_user_sessions_table.php)
  - Tracks per-user sessions: device_name, browser, platform, ip_address, last_activity, login_at, is_active (boolean)
  - Foreign key: user_id → users.id (cascade)
- Laravel Sanctum Personal Access Tokens are used by the application (PersonalAccessToken migration present: 2026_07_14_052108_create_personal_access_tokens_table.php). The application links Sanctum tokens and UserSession entries for per-session revocation.

Accessibility preferences

- The User model casts accessibility_preferences as array. Migration that adds this column: backend/database/migrations/2026_08_19_001000_add_accessibility_preferences_to_users_table.php (verify exact migration file for column type). This is stored as JSON/JSONB depending on DB driver.

Important notes

- Roles are stored as a separate table and attached via a pivot; do not assume roles are a string column on users.
- The codebase includes convenience methods (hasRole, hasAnyRole, hasPermission) in the User model that operate against pivot/permission relationships.

Source references

- backend/database/migrations/0001_01_01_000000_create_users_table.php
- backend/database/migrations/2026_07_14_110001_create_roles_table.php
- backend/database/migrations/2026_07_14_110003_create_role_user_table.php
- backend/app/Models/User.php
- backend/app/Models/Role.php
- backend/database/migrations/2026_07_14_052108_create_personal_access_tokens_table.php
- backend/database/migrations/2026_07_28_140004_create_user_sessions_table.php
