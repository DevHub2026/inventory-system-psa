# Implementation TODO

## Phase 1: Backend - Fix Import to Separate employee_number and username
- [x] 1.1 Fix `UserImportHandler.php` - Store employee_number as actual ID, username as generated login
- [x] 1.2 Fix `UserImportService.php` - Same separation, fix duplicate checks, use Hash::make for password
- [x] 1.3 Add collision-safe username generation

## Phase 2: Backend - Add username and office_id to Request Validation
- [x] 2.1 Update `StoreUserRequest.php` - Add username, office_id validation
- [x] 2.2 Update `UpdateUserRequest.php` - Add username, office_id validation

## Phase 3: Frontend - Update Types
- [x] 3.1 Update `types/index.ts` - Add username, office_id, office to User interface

## Phase 4: Frontend - Update userService
- [x] 4.1 Update `userService.ts` - Add office_id to filters, username/office_id to payloads, add updateUserPassword/resetUserPassword methods

## Phase 5: Frontend - Update UsersPage
- [x] 5.1 Add Username column to table
- [x] 5.2 Add Department dropdown selector in Edit modal
- [x] 5.3 Add Office dropdown selector in Edit modal
- [x] 5.4 Add Password change modal
- [x] 5.5 Add Reset Password button
- [x] 5.6 Load departments and offices on mount
- [x] 5.7 Ensure editing user does not replace authenticated user state

## Phase 6: Validation
- [x] 6.1 Run `php artisan optimize:clear` - Success
- [x] 6.2 Run `php artisan migrate:status` - All migrations ran including new username/office_id migration
- [x] 6.3 Run `php artisan route:list` - Password and user routes confirmed
- [x] 6.4 Run `php artisan test` - 12/12 UserManagementTest passed, 74/76 overall (2 pre-existing unrelated failures fixed)
- [x] 6.5 Run `npm run build` - TypeScript compilation passed with no errors
