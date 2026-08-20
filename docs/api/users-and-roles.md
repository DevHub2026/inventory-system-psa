# Users and Roles

Base path prefix: /api/v1

This section documents user and role management endpoints as implemented in backend/routes/api.php and App\Modules\Auth controllers.

Users

GET /api/v1/users
- Purpose: List users (paginated)
- Method: GET
- Controller: App\Modules\Auth\Controllers\UserController::index
- Authentication: Required (auth:sanctum + session.token)
- Authorization: gate can:viewAny, App\Models\User (see Policy for allowed roles)
- Query params: standard listing and filters (search, per_page, page, sort) — consult controller/service for exact filterable fields
- Success: JSON { success: true, message, data: { items: [...], meta, links } }

POST /api/v1/users
- Purpose: Create a user
- Method: POST
- Controller: UserController::store
- Authentication: Required
- Authorization: can:create, App\Models\User

Request body (StoreUserRequest):

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| employee_number | string | nullable | Employee number (unique)
| username | string | nullable | Username (auto-generated if omitted)
| first_name | string | nullable | Given name
| middle_name | string | nullable | Middle name
| last_name | string | nullable | Family name
| email | string | required | User email (unique)
| password | string | nullable | Optional initial password (min 8, letters + numbers)
| department_id | integer | nullable | FK to departments
| office_id | integer | nullable | FK to offices
| status | string | sometimes | One of UserStatus enum values
| roles | array | sometimes | Role ids to attach
| email_notifications_enabled | boolean | sometimes | Enable email notifications

Source of truth:
- backend/app/Modules/Auth/Requests/StoreUserRequest.php
- backend/app/Modules/Auth/Requests/UpdateUserRequest.php
- backend/routes/api.php
- backend/app/Policies/UserPolicy.php


GET /api/v1/users/{user}
- Purpose: Get a specific user
- Authentication: Required
- Authorization: can:view,user
- Controller: UserController::show

PUT /api/v1/users/{user}
- Purpose: Update user
- Authorization: can:update,user
- Request body: per validation in controller/request

PUT /api/v1/users/{user}/password
- Purpose: Update user's password (admin change)
- Authorization: can:update,user

POST /api/v1/users/{user}/reset-password
- Purpose: Admin-triggered password reset for a user
- Authorization: can:update,user

DELETE /api/v1/users/{user}
- Purpose: Archive/delete user
- Authorization: can:delete,user

Additional user endpoints
- GET /api/v1/users/{user}/profile — user profile (UserProfileController@profile)
- GET /api/v1/users/{user}/issued-assets — issued assets for user
- GET /api/v1/users/{user}/borrowing-history — borrowing history for user

Roles

GET /api/v1/roles
- Purpose: List roles
- Authorization: can:viewAny, App\Models\Role
- Controller: App\Modules\Auth\Controllers\RoleController::index

POST /api/v1/roles
- Purpose: Create role
- Authorization: can:create, App\Models\Role

GET /api/v1/roles/{role}
- Purpose: Show role
- Authorization: can:view,role

PUT /api/v1/roles/{role}
- Purpose: Update role
- Authorization: can:update,role

DELETE /api/v1/roles/{role}
- Purpose: Delete role
- Authorization: can:delete,role

Permissions
- Permission endpoints are restricted to Super Administrator role and registered under backend/routes/api.php (PermissionController)

Source of truth
- backend/routes/api.php
- backend/app/Modules/Auth/Controllers/UserController.php
- backend/app/Modules/Auth/Controllers/RoleController.php
- backend/app/Policies/* (UserPolicy, RolePolicy) for exact allowed actions
- backend/app/Enums/UserRole.php
