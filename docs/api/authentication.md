# Authentication

Base path prefix: /api/v1

All authentication endpoints are registered in backend/routes/api.php and implemented by App\Modules\Auth\Controllers\AuthController and SessionController.

Login

- Method: POST
- Route: /api/v1/login
- Purpose: Authenticate a user and issue a session/token.
- Authentication: Not required
- Middleware: throttle:5,1 applied (rate limiting)
- Request body:
  | Field | Type | Required | Description |
  | ----- | ---- | -------- | ----------- |
  | email | string | required | User email address
  | password | string | required | User password

- Success response: JSON wrapper { success: true, message, data: { token, user } }

Forgot password - Request body:

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| email | string | required | Email to send reset instructions to

Reset password - Request body:

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| token | string | required | Password reset token from email
| email | string | required | User email
| password | string | required | New password (confirmed) |
| password_confirmation | string | required | Confirm new password

Source of truth:
- backend/routes/api.php
- backend/app/Modules/Auth/Requests/LoginRequest.php
- backend/app/Modules/Auth/Requests/ForgotPasswordRequest.php
- backend/app/Modules/Auth/Requests/ResetPasswordRequest.php
- backend/app/Modules/Auth/Controllers/AuthController.php
- Errors: 422 for validation errors, 401 for invalid credentials

Forgot password

- Method: POST
- Route: /api/v1/forgot-password
- Purpose: Initiate password reset (sends email / token)
- Authentication: Not required
- Middleware: throttle:3,1
- Request body: email
- Success: 200 with message

Reset password

- Method: POST
- Route: /api/v1/reset-password
- Purpose: Complete password reset with token
- Authentication: Not required
- Middleware: throttle:3,1
- Request body: token, email, password, password_confirmation
- Success: 200 with message

Authenticated endpoints (session/token)

Most API endpoints require sanctum authentication and the session.token middleware as registered in backend/routes/api.php. Examples:

- POST /api/v1/logout — logout authenticated user (AuthController::logout)
- GET /api/v1/me — current authenticated user info (AuthController::me)
- PUT /api/v1/profile — update profile (AuthController::updateProfile)
- PUT /api/v1/change-password — change current user's password (AuthController::changePassword)

Session management

- GET /api/v1/sessions — list active sessions for the current user (SessionController@index)
- POST /api/v1/sessions/{id}/revoke — revoke a particular session
- POST /api/v1/sessions/revoke-all — revoke all sessions

Accessibility preferences

- PUT /api/v1/me/accessibility-preferences — update authenticated user's accessibility settings (AuthController::updateAccessibilityPreferences)

Source of truth

- backend/routes/api.php
- backend/app/Modules/Auth/Controllers/AuthController.php
- backend/app/Modules/Auth/Controllers/SessionController.php
