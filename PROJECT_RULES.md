# PROJECT_RULES.md

> Office Asset, Equipment Reservation, Borrowing & Inventory Management System
>
> Philippine Statistics Authority (PSA) Region XII

---

# Document Information

| Field | Value |
|--------|-------|
| Document | PROJECT_RULES.md |
| Version | 1.0 |
| Status | Active |
| Last Updated | July 2026 |
| Repository | Office Asset, Equipment Reservation, Borrowing & Inventory Management System |
| Applies To | All Developers and AI Assistants |

---

# 1. Purpose

PROJECT_RULES.md is the official engineering handbook and single source of truth for the project.

It defines:

- Architecture
- Folder Structure
- Naming Conventions
- Database Standards
- API Standards
- Development Workflow
- Coding Rules
- AI Development Rules
- Team Collaboration Rules

All developers and AI assistants must follow this document.

If generated code conflicts with this document, this document takes precedence.

---

# 2. Project Overview

The Office Asset, Equipment Reservation, Borrowing & Inventory Management System is an enterprise asset management platform developed for the Philippine Statistics Authority (PSA) Region XII.

The system centralizes:

- Asset Management
- Equipment Reservation
- Borrowing
- Returning
- Inventory Management
- Maintenance
- Reporting
- Notifications
- Audit Logging

The goal is to replace manual tracking with a secure, scalable, and maintainable digital solution.

---

# 3. Project Scope

Version 1 (MVP)

Included Modules

- Authentication
- User Management
- Role & Permission Management
- Dashboard
- Asset Management
- Asset Categories
- Asset Identifiers
- Reservation
- Borrowing
- Asset Return
- Inventory
- Maintenance
- Notifications
- Reports
- Audit Logs

Future Versions

- RFID
- NFC
- Multi-Office Support
- Procurement
- Purchase Orders
- Asset Depreciation
- Asset Disposal
- AI Analytics
- Cloud Synchronization

Future features shall not be implemented unless explicitly approved.

---

# 4. Technology Stack

Backend

- Laravel 12
- PHP 8.4+

Frontend

- React
- TypeScript
- Tailwind CSS

Mobile

- Flutter

Database

- PostgreSQL

Authentication

- Laravel Sanctum

Development Tools

- VS Code
- Git
- GitHub
- Docker (Optional)
- Postman
- DBeaver
- Figma
- Draw.io

AI Development

- Kilo Code
- ChatGPT
- Claude
- Ollama

---

# 5. Supported Platforms

The system shall support:

- Web Application
- Mobile Application (Android)
- Responsive Mobile Web

Future

- iOS
- Desktop Application (Optional)

---

# 6. Project Principles

Every decision shall prioritize:

1. Maintainability
2. Scalability
3. Security
4. Readability
5. Reusability
6. Consistency
7. Performance

The project shall favor long-term maintainability over short-term convenience.

---

# 7. Architecture Principles

The system shall follow:

- Modular Architecture
- Layered Architecture
- Service Layer Pattern
- RESTful API Design
- Role-Based Access Control (RBAC)
- Event-Driven Design (where appropriate)
- Separation of Concerns
- SOLID Principles
- DRY (Don't Repeat Yourself)
- KISS (Keep It Simple)
- YAGNI (You Aren't Gonna Need It)

---

# 8. Repository Structure

The repository shall follow this structure.

/
├── backend/
├── frontend/
├── mobile/
├── docs/
├── PROJECT_RULES.md
├── PROMPT_INSTRUCTIONS.md
├── README.md
└── .gitignore

Rules

- backend/ contains all Laravel code.
- frontend/ contains all React code.
- mobile/ contains all Flutter code.
- docs/ contains all project documentation.
- No new top-level directories shall be created without team approval.

---

# 9. Team Ownership

Backend Architecture

Owner

Marc

Responsibilities

- Database
- Laravel Backend
- API
- Business Logic
- Deployment
- Mobile
- Documentation

---

Frontend

Owner

Carl

Responsibilities

- React
- TypeScript
- UI Components
- Dashboard
- Responsive Design

---

Authentication

Owner

Eman

Responsibilities

- Authentication Module
- Login
- Logout
- User Profile
- RBAC Integration

---

Shared Responsibilities

All members shall:

- Review pull requests.
- Follow coding standards.
- Follow naming conventions.
- Update documentation when required.
- Review AI-generated code before merging.

---

# 10. Documentation Rules

Documentation is part of the source code.

Whenever introducing:

- New Module
- New Table
- New Endpoint
- New Workflow
- New Business Rule

The corresponding documentation must be updated before or together with implementation.

Documentation shall never be considered optional.

---

# 11. Source of Truth

The following documents define the project.

Priority Order

1. PROJECT_RULES.md
2. PROMPT_INSTRUCTIONS.md
3. Documentation inside /docs
4. Approved Architecture Decisions
5. Source Code

If two sources conflict, the higher-priority document takes precedence.

---

# 12. General Rules

All contributors shall:

- Follow this document.
- Use official naming conventions.
- Reuse existing code whenever possible.
- Avoid duplicate functionality.
- Maintain backward compatibility where possible.
- Keep modules isolated.
- Write clean, readable, maintainable code.

No contributor shall:

- Invent new naming conventions.
- Rename official classes.
- Modify unrelated modules.
- Bypass business rules.
- Ignore documentation.
- Commit unreviewed AI-generated code.

---

# End of Segment 1

# 13. Official Naming Standards

This section defines the official names used throughout the project.

These names SHALL be used consistently across:

- Database
- Backend
- Frontend
- Mobile
- API
- Documentation
- AI-generated code

Alternative names are NOT allowed unless approved by the team.

---

# 14. Official Module Names

Every feature belongs to one module.

## Core

Auth

User

Role

Permission

Dashboard

Notification

Report

AuditLog

SystemSetting

---

## Asset Management

Asset

AssetCategory

AssetIdentifier

Manufacturer

Office

Location

---

## Reservation

Reservation

ReservationItem

---

## Borrowing

Borrowing

BorrowingItem

---

## Inventory

InventoryCategory

InventoryItem

StockTransaction

Supplier

---

## Maintenance

MaintenanceRequest

MaintenanceLog

DamageReport

---

## Future Modules

PurchaseOrder

AssetDepreciation

AssetDisposal

RFID

NFC

MultiOffice

---

Never use:

Equipment

Item

Inventory

Stock

Borrow

Return

Product

Department

---

# 15. Official Model Names

All Eloquent models must use these names.

Core

User

Role

Permission

Office

Location

Manufacturer

Notification

AuditLog

SystemSetting

Assets

Asset

AssetCategory

AssetIdentifier

Reservation

Reservation

ReservationItem

Borrowing

Borrowing

BorrowingItem

Inventory

InventoryCategory

InventoryItem

StockTransaction

Supplier

Maintenance

MaintenanceRequest

MaintenanceLog

DamageReport

Never create models named:

Equipment

Item

Product

Return

ReturnRecord

Stock

Inventory

---

# 16. Official Database Table Names

Tables must use plural snake_case.

users

roles

permissions

offices

locations

manufacturers

assets

asset_categories

asset_identifiers

reservations

reservation_items

borrowings

borrowing_items

inventory_categories

inventory_items

stock_transactions

suppliers

maintenance_requests

maintenance_logs

damage_reports

notifications

audit_logs

system_settings

Never use:

tbl_users

equipment

items

returns

stocks

inventory

---

# 17. Official Controller Names

Controllers must use the following names.

AuthController

UserController

RoleController

PermissionController

DashboardController

AssetController

AssetCategoryController

AssetIdentifierController

ManufacturerController

OfficeController

LocationController

ReservationController

BorrowingController

InventoryController

MaintenanceController

NotificationController

ReportController

AuditLogController

SystemSettingController

Controllers shall only:

- Receive Requests
- Validate Requests
- Authorize Requests
- Call Services
- Return Resources

Business logic belongs inside Services.

---

# 18. Official Service Names

Business logic belongs in Services.

AuthService

UserService

RoleService

PermissionService

DashboardService

AssetService

AssetCategoryService

AssetIdentifierService

ManufacturerService

OfficeService

LocationService

ReservationService

BorrowingService

InventoryService

MaintenanceService

NotificationService

ReportService

AuditLogService

QRCodeService

BarcodeService

ReceiptService

SearchService

AssetAvailabilityService

---

# 19. Official Request Classes

Validation always uses Form Requests.

LoginRequest

ChangePasswordRequest

UpdateProfileRequest

StoreUserRequest

UpdateUserRequest

StoreAssetRequest

UpdateAssetRequest

StoreReservationRequest

ApproveReservationRequest

RejectReservationRequest

CancelReservationRequest

BorrowAssetRequest

ReturnBorrowedAssetRequest

StoreInventoryItemRequest

UpdateInventoryItemRequest

StoreMaintenanceRequest

UpdateMaintenanceRequest

---

# 20. Official Resource Classes

All API responses use Resources.

UserResource

RoleResource

PermissionResource

AssetResource

AssetCategoryResource

AssetIdentifierResource

ReservationResource

BorrowingResource

InventoryItemResource

MaintenanceResource

NotificationResource

DashboardResource

ReportResource

---

# 21. Official Policies

Every protected model must have a Policy.

UserPolicy

RolePolicy

PermissionPolicy

AssetPolicy

ReservationPolicy

BorrowingPolicy

InventoryPolicy

MaintenancePolicy

NotificationPolicy

AuditLogPolicy

---

# 22. Official Event Names

Events shall use the Past Tense.

UserLoggedIn

UserLoggedOut

PasswordChanged

AssetCreated

AssetUpdated

AssetArchived

ReservationCreated

ReservationApproved

ReservationRejected

ReservationCancelled

AssetBorrowed

AssetReturned

InventoryAdjusted

StockInRecorded

StockOutRecorded

MaintenanceStarted

MaintenanceCompleted

NotificationCreated

---

# 23. Official Listener Names

SendNotification

WriteAuditLog

UpdateAssetAvailability

GenerateBorrowReceipt

GenerateReturnReceipt

UpdateInventory

---

# 24. Official Enum Names

AssetStatus

ReservationStatus

BorrowingStatus

ConditionStatus

InventoryStatus

MaintenanceStatus

NotificationStatus

UserStatus

---

# 25. Official Variable Names

Objects

$user

$asset

$reservation

$borrowing

$inventoryItem

$office

$location

$manufacturer

$category

Identifiers

$userId

$assetId

$reservationId

$borrowingId

$inventoryItemId

$officeId

$locationId

$manufacturerId

$categoryId

Asset Fields

$assetNumber

$propertyNumber

$serialNumber

$assetTag

$identifierValue

$identifierType

Dates

$borrowedAt

$dueAt

$returnedAt

$reservedAt

$approvedAt

$createdAt

$updatedAt

Never use

$item

$itemId

$equipment

$equipmentId

$equipId

$assetCode

$propNo

$reserveId

---

# 26. Official Route Parameters

Always use Laravel Route Model Binding.

{user}

{asset}

{reservation}

{borrowing}

{inventoryItem}

{office}

{location}

Never use:

{id}

{item}

{equipment}

{inventory}

---

# 27. Reserved Words

The following names shall not be used as Models, Controllers, or Modules.

Return

Class

Function

Object

Equipment

Item

Inventory

Stock

Use instead:

BorrowingItem

InventoryItem

StockTransaction

Asset

# 28. Database Standards

The system shall use PostgreSQL as the primary relational database.

All database objects shall follow Laravel conventions unless explicitly stated otherwise.

The database shall prioritize:

- Data Integrity
- Scalability
- Performance
- Maintainability
- Security
- Auditability

---

# 29. Database Naming Standards

## Tables

- Use plural names.
- Use snake_case.

Examples

users

assets

borrowings

reservation_items

inventory_items

Never use

tbl_users

Asset

assetTable

Equipment

---

## Columns

Use snake_case.

Examples

asset_number

office_id

borrowed_at

identifier_value

Never use

assetNumber

OfficeID

BorrowDate

---

## Primary Keys

Every table shall use:

id BIGINT UNSIGNED AUTO_INCREMENT

Laravel default primary keys shall be used.

---

## Foreign Keys

Always use singular table names.

Examples

user_id

asset_id

office_id

location_id

manufacturer_id

reservation_id

borrowing_id

inventory_category_id

unit_id

Never use

userid

assetID

officeID

---

# 30. Required Laravel Columns

Every master table shall include:

id

created_at

updated_at

deleted_at

Transaction tables shall include:

id

created_at

updated_at

Transaction history shall never use Soft Deletes.

---

# 31. Master Tables

Master tables contain reusable business data.

users

roles

permissions

offices

locations

manufacturers

asset_categories

assets

asset_identifiers

inventory_categories

inventory_items

units

suppliers

system_settings

---

# 32. Transaction Tables

These record business operations.

reservations

reservation_items

borrowings

borrowing_items

stock_transactions

maintenance_requests

maintenance_logs

damage_reports

notifications

audit_logs

---

# 33. Lookup Tables

Reusable reference values.

units

Examples

Piece

Box

Pack

Bottle

Roll

Set

Meter

Liter

Kilogram

Ream

Cartridge

Pair

Bundle

---

# 34. Asset Identifiers

An asset may have multiple identifiers.

Table

asset_identifiers

Columns

id

asset_id

identifier_type

identifier_value

is_primary

created_at

updated_at

Identifier Types

QR_CODE

BARCODE

SERIAL_NUMBER

PROPERTY_NUMBER

ASSET_TAG

Future

RFID

NFC

Never store multiple identifier columns inside assets.

---

# 35. Reservation Structure

One Reservation

↓

Many Reservation Items

Reservation

Stores

Employee

Purpose

Status

Reservation Date

Approval Information

ReservationItem

Stores

Reservation

Asset

Reserved From

Reserved Until

Status

Remarks

---

# 36. Borrowing Structure

One Borrowing

↓

Many Borrowing Items

Borrowing

Stores

Employee

Purpose

Borrow Date

Due Date

Status

BorrowingItem

Stores

Borrowing

Asset

Condition Before

Condition After

Borrowed At

Due At

Returned At

Returned By

Status

Remarks

A returned asset is represented by updating BorrowingItem.

A separate AssetReturn table SHALL NOT exist.

---

# 37. Asset Relationships

One Office

↓

Many Assets

One Location

↓

Many Assets

One Manufacturer

↓

Many Assets

One Asset Category

↓

Many Assets

One Asset

↓

Many Asset Identifiers

One Asset

↓

Many Reservation Items

One Asset

↓

Many Borrowing Items

---

# 38. Inventory Relationships

One Inventory Category

↓

Many Inventory Items

One Unit

↓

Many Inventory Items

One Supplier

↓

Many Inventory Items

One Inventory Item

↓

Many Stock Transactions

---

# 39. Unique Constraints

The following values must be unique.

email

asset_number

identifier_value

role_name

permission_name

supplier_code

Duplicate asset identifiers shall never exist.

---

# 40. Nullable Fields

Nullable fields shall only exist when required.

Examples

returned_at

condition_after

approved_by

remarks

rejection_reason

All business-critical fields shall remain NOT NULL.

---

# 41. Database Transactions

The following operations must execute inside database transactions.

Borrow Asset

Return Asset

Approve Reservation

Reject Reservation

Cancel Reservation

Inventory Adjustment

Bulk Asset Import

Bulk Inventory Import

Any failure shall automatically rollback all changes.

---

# 42. Cascade Rules

Historical transaction records shall never be automatically deleted.

Use

RESTRICT

or

NO ACTION

instead of CASCADE DELETE for transaction history.

Master data may use CASCADE UPDATE.

---

# 43. Indexing Standards

Create indexes for frequently searched fields.

asset_number

identifier_value

status

office_id

location_id

asset_category_id

manufacturer_id

borrowed_at

due_at

returned_at

created_at

---

# 44. Status Standards

Status values shall be controlled by application Enums.

Asset Status

AVAILABLE

RESERVED

BORROWED

MAINTENANCE

UNAVAILABLE

RETIRED

DISPOSED

Reservation Status

PENDING

APPROVED

REJECTED

CANCELLED

EXPIRED

Borrowing Status

ACTIVE

PARTIALLY_RETURNED

RETURNED

OVERDUE

Condition Status

GOOD

FAIR

DAMAGED

LOST

UNDER_REPAIR

Inventory Status

IN_STOCK

LOW_STOCK

OUT_OF_STOCK

DISCONTINUED

Maintenance Status

PENDING

ONGOING

COMPLETED

CANCELLED

---

# 45. Audit Logging

Every critical operation shall create an Audit Log.

Examples

Login

Logout

Create Asset

Update Asset

Archive Asset

Reserve Asset

Approve Reservation

Borrow Asset

Return Asset

Inventory Adjustment

Permission Changes

System Settings Update

Audit logs shall never be manually edited or deleted.

---

# 46. Historical Data Policy

Historical records shall be permanently preserved.

Never delete

Borrowings

Reservations

Stock Transactions

Maintenance Logs

Damage Reports

Audit Logs

Historical data is required for accountability, auditing, and reporting.

---

# 47. Normalization Rules

The database shall follow Third Normal Form (3NF).

Avoid duplicated information.

Reference master tables through foreign keys.

Store only the current state in master tables.

Store historical changes in transaction tables.

---

# 48. Schema Change Policy

No developer or AI assistant may:

- Create new tables
- Rename tables
- Rename columns
- Delete columns
- Delete relationships

without first updating:

- PROJECT_RULES.md
- Database Architecture Documentation
- ERD
- API Documentation

The documentation shall always be considered the source of truth.

# 49. API Standards

The backend shall expose a RESTful JSON API.

The API shall serve:

- React Web Application
- Flutter Mobile Application
- Future Integrations

All API responses shall follow the standards defined below.

---

# 50. API Versioning

All endpoints shall be versioned.

Base URL

/api/v1

Examples

/api/v1/login

/api/v1/assets

/api/v1/reservations

Future versions

/api/v2

Never expose unversioned APIs.

---

# 51. Authentication

Authentication shall use Laravel Sanctum.

Public Endpoints

POST /login

POST /forgot-password

POST /reset-password

Protected Endpoints

POST /logout

GET /me

PUT /profile

PUT /change-password

Every protected endpoint requires authentication.

---

# 52. REST Naming Convention

Resources shall use plural names.

Examples

GET     /assets

POST    /assets

GET     /assets/{asset}

PUT     /assets/{asset}

DELETE  /assets/{asset}

Never use verbs.

Incorrect

/getAssets

/createAsset

/updateAsset

---

# 53. Standard CRUD Pattern

Every resource follows:

GET

POST

GET by ID

PUT

DELETE

Example

GET     /assets

POST    /assets

GET     /assets/{asset}

PUT     /assets/{asset}

DELETE  /assets/{asset}

---

# 54. Official API Endpoints

## Auth

POST    /login

POST    /logout

GET     /me

PUT     /profile

PUT     /change-password

---

## Users

GET     /users

POST    /users

GET     /users/{user}

PUT     /users/{user}

DELETE  /users/{user}

---

## Roles

GET

POST

PUT

DELETE

---

## Permissions

GET

POST

PUT

DELETE

---

## Assets

GET

POST

PUT

DELETE

GET     /assets/{asset}

GET     /assets/search

POST    /assets/import

POST    /assets/export

---

## Asset Categories

GET

POST

PUT

DELETE

---

## Asset Identifiers

GET

POST

PUT

DELETE

GET /asset-identifiers/{identifier}

---

## Reservations

GET

POST

PUT

DELETE

GET /reservations/{reservation}

POST /reservations/{reservation}/approve

POST /reservations/{reservation}/reject

POST /reservations/{reservation}/cancel

---

## Borrowings

GET

POST

GET /borrowings/{borrowing}

POST /borrowings/{borrowing}/return

POST /borrowings/{borrowing}/extend

---

## Inventory

GET

POST

PUT

DELETE

POST /inventory/stock-in

POST /inventory/stock-out

POST /inventory/adjust

---

## Maintenance

GET

POST

PUT

DELETE

POST /maintenance/{maintenance}/start

POST /maintenance/{maintenance}/complete

---

## Reports

GET /reports/dashboard

GET /reports/assets

GET /reports/borrowings

GET /reports/reservations

GET /reports/inventory

---

## Notifications

GET

PUT

DELETE

GET /notifications/unread

POST /notifications/read-all

---

# 55. Route Parameters

Always use Laravel Route Model Binding.

Examples

{user}

{asset}

{reservation}

{borrowing}

{inventoryItem}

Never use

{id}

{item}

{equipment}

---

# 56. Standard Success Response

Every successful response shall follow this format.

{
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
}

---

# 57. Standard Error Response

{
    "success": false,
    "message": "An error occurred.",
    "errors": {}
}

---

# 58. Validation Error Response

HTTP 422

{
    "success": false,
    "message": "Validation failed.",
    "errors": {
        "asset_number": [
            "The asset number field is required."
        ]
    }
}

---

# 59. Pagination

Collection endpoints shall use pagination.

Example

GET /assets?page=1&per_page=20

Response

data

links

meta

---

# 60. Filtering

Resources may be filtered using query parameters.

Examples

/assets?status=AVAILABLE

/assets?office=Admin

/assets?category=Projector

/assets?manufacturer=Epson

---

# 61. Searching

Search shall use

search

parameter.

Examples

/assets?search=Projector

/users?search=Juan

---

# 62. Sorting

Sorting shall use

sort

parameter.

Examples

/assets?sort=asset_number

/assets?sort=-created_at

Negative means descending.

---

# 63. HTTP Status Codes

200 OK

201 Created

204 No Content

400 Bad Request

401 Unauthorized

403 Forbidden

404 Not Found

409 Conflict

422 Validation Error

500 Internal Server Error

---

# 64. File Uploads

Uploads shall support

Images

PDF

Excel

CSV

Maximum size shall be configurable.

---

# 65. Import / Export

Supported imports

Excel

CSV

Supported exports

Excel

CSV

PDF

---

# 66. API Security

All protected endpoints require authentication.

Authorization shall use Policies.

Input shall always be validated.

Sensitive fields shall never be returned.

---

# 67. API Documentation

Every endpoint shall include

Purpose

Request

Response

Validation

Authorization

Possible Errors

Example Request

Example Response

The API documentation shall always match the implementation.

---

# 68. API Change Policy

No developer or AI assistant may

Create new endpoints

Rename endpoints

Modify request structures

Modify response structures

without updating

PROJECT_RULES.md

API Documentation

Relevant Frontend Code

Relevant Mobile Code

All API changes shall be reviewed before implementation.

# 69. Backend Standards

The backend shall be developed using Laravel.

The backend is responsible for:

- Authentication
- Authorization
- Business Logic
- Database Access
- API
- Validation
- File Management
- Notifications
- Audit Logging

Frontend and Mobile applications shall never implement business logic.

---

# 70. Backend Folder Structure

backend/

app/

Modules/

Auth/

User/

Role/

Permission/

Asset/

AssetCategory/

AssetIdentifier/

Reservation/

Borrowing/

Inventory/

Maintenance/

Notification/

Report/

Dashboard/

Shared/

Core/

Each module shall contain only the folders it needs.

Controllers/

Models/

Services/

Requests/

Resources/

Policies/

Actions/

Events/

Listeners/

Enums/

DTOs/

Repositories/

Traits/

Tests/

Routes/

Never place unrelated files inside another module.

---

# 71. Controllers

Controllers are responsible for:

- Receiving HTTP Requests
- Authorization
- Calling Services
- Returning Resources

Controllers SHALL NOT

- Contain business logic
- Perform complex calculations
- Execute large database queries
- Access multiple repositories directly

Controllers should remain small.

Target

Less than 200 lines.

---

# 72. Services

Business logic belongs inside Services.

Examples

AssetService

BorrowingService

ReservationService

InventoryService

MaintenanceService

NotificationService

Services may call multiple Models.

Services may call other Services.

Services SHALL NOT return JSON.

---

# 73. Models

Models represent database entities.

Models should contain

- Relationships
- Scopes
- Accessors
- Mutators
- Casts

Models SHALL NOT contain large business logic.

---

# 74. Form Requests

Validation shall always use Form Requests.

Examples

StoreAssetRequest

UpdateAssetRequest

BorrowAssetRequest

ReturnBorrowedAssetRequest

Validation SHALL NOT exist inside Controllers.

---

# 75. Resources

Every API response shall use Resources.

Example

AssetResource

BorrowingResource

ReservationResource

Never return Eloquent Models directly.

---

# 76. Policies

Authorization shall always use Policies.

Examples

AssetPolicy

BorrowingPolicy

ReservationPolicy

UserPolicy

Never hardcode permissions.

Never compare role names manually.

Incorrect

if ($user->role == 'Admin')

Correct

$this->authorize()

or

Policy

---

# 77. Repositories

Repositories are optional.

Only create Repositories when queries become complex.

Do not create repositories for simple CRUD.

---

# 78. Actions

Actions represent one business operation.

Examples

ApproveReservationAction

RejectReservationAction

BorrowAssetAction

ReturnBorrowedAssetAction

GenerateReceiptAction

Actions should perform one task only.

---

# 79. Events

Events shall be used when one action affects multiple modules.

Example

AssetBorrowed

↓

Update Availability

↓

Create Audit Log

↓

Send Notification

Controllers shall not manually execute unrelated operations.

---

# 80. Listeners

Listeners respond to Events.

Examples

UpdateAssetAvailability

WriteAuditLog

SendBorrowNotification

GenerateBorrowReceipt

Each Listener shall have one responsibility.

---

# 81. Enums

Business status values shall use PHP Enums.

Never hardcode status strings.

Incorrect

$status = "Borrowed";

Correct

BorrowingStatus::ACTIVE

---

# 82. DTOs

DTOs may be used when transferring structured data between layers.

Examples

BorrowAssetData

CreateAssetData

ReservationData

DTOs improve readability and testing.

---

# 83. Traits

Traits shall only contain reusable helper behavior.

Examples

HasAuditLogs

HasStatus

HasIdentifiers

Never use Traits for unrelated business logic.

---

# 84. Exception Handling

Business exceptions shall use custom Exceptions.

Examples

AssetNotAvailableException

ReservationExpiredException

BorrowLimitExceededException

Never expose stack traces through the API.

---

# 85. Database Queries

Prefer Eloquent ORM.

Use Query Builder for reporting.

Avoid Raw SQL unless necessary.

Always eager-load relationships.

Never allow N+1 queries.

---

# 86. Transactions

The following operations must use DB::transaction().

Borrow Asset

Return Asset

Approve Reservation

Inventory Adjustment

Bulk Import

---

# 87. Logging

Laravel Logs

↓

Application Errors

Audit Logs

↓

Business Activities

Never confuse the two.

Audit logs belong in the database.

Errors belong in Laravel logs.

---

# 88. Caching

Frequently accessed reference data may be cached.

Examples

Asset Categories

Offices

Locations

Manufacturers

System Settings

Never cache transaction data.

---

# 89. Queues

Long-running operations shall use Queues.

Examples

Send Email

Generate PDF

Generate Reports

Bulk Import

Notification Delivery

---

# 90. File Storage

Laravel Storage shall manage uploaded files.

Supported files

Images

PDF

Excel

CSV

Never store uploaded files inside the public root directly.

---

# 91. Testing

Every Service should be testable.

Priority

Feature Tests

Unit Tests

API Tests

Regression Tests

---

# 92. Backend Checklist

Before merging

✓ Validation exists

✓ Authorization exists

✓ Resource exists

✓ Service exists

✓ Policy exists

✓ Tests pass

✓ Documentation updated

✓ No duplicated code

✓ Follows PROJECT_RULES.md

JAY CARL M. PRESBETERO

# 93. Frontend Standards

The frontend shall be developed using:

- React
- TypeScript
- Tailwind CSS
- Vite

The frontend is responsible for:

- User Interface (UI)
- User Experience (UX)
- Form Validation (Client-side)
- API Communication
- State Management
- Navigation

Business logic SHALL remain in the backend.

---

# 94. Frontend Folder Structure

frontend/

src/

app/

assets/

components/

features/

hooks/

layouts/

lib/

pages/

routes/

services/

stores/

types/

utils/

Each feature shall be isolated.

Example

features/

auth/

asset/

reservation/

borrowing/

inventory/

maintenance/

notification/

dashboard/

---

# 95. Components

Components shall be reusable.

Examples

Button

Input

Textarea

Select

Table

Badge

Card

Modal

Dialog

Drawer

SearchBar

Pagination

DatePicker

QRCodeScanner

BarcodeScanner

Never duplicate UI components.

---

# 96. Page Naming

Pages shall use PascalCase.

Examples

LoginPage

DashboardPage

AssetPage

BorrowingPage

ReservationPage

InventoryPage

MaintenancePage

ProfilePage

SettingsPage

---

# 97. Component Naming

Use PascalCase.

Examples

AssetCard

BorrowButton

BorrowTable

InventoryChart

NotificationCard

Never abbreviate component names.

---

# 98. Hooks

Custom hooks shall begin with "use".

Examples

useAuth()

useAsset()

useReservation()

useBorrowing()

useInventory()

useNotification()

Never place API calls directly inside components.

---

# 99. API Layer

Every API request shall go through the Services layer.

Examples

AuthService.ts

AssetService.ts

ReservationService.ts

BorrowingService.ts

InventoryService.ts

Never call Axios directly inside components.

---

# 100. State Management

Use:

React Context

or

Zustand

Global State

- Logged User
- Theme
- Notifications
- Sidebar State

Feature State

- Tables
- Forms
- Filters

Do not place everything inside global state.

---

# 101. Routing

Every page shall use React Router.

Examples

/login

/dashboard

/assets

/reservations

/borrowings

/inventory

/reports

/settings

Unknown routes shall redirect to:

404 Page

---

# 102. Forms

Forms shall use:

React Hook Form

Validation

Zod

Never manually validate every input.

---

# 103. Tables

All tables shall support:

Search

Pagination

Sorting

Filtering

Export

Responsive Layout

---

# 104. Dashboard

Dashboard widgets shall be reusable.

Examples

MetricCard

RecentBorrowings

RecentReservations

LowStockCard

NotificationPanel

QuickActions

---

# 105. Styling

Tailwind CSS shall be used.

Rules

No inline CSS.

Avoid duplicated utility classes.

Reusable styles shall become components.

---

# 106. Icons

Use Lucide React.

Avoid mixing icon libraries.

---

# 107. Theme

The application shall support:

Light Theme

Dark Theme (Future)

Colors shall follow the Design System.

---

# 108. Responsive Design

The application must support:

Desktop

Tablet

Mobile Browser

Common breakpoints

sm

md

lg

xl

2xl

---

# 109. Error Handling

Display user-friendly messages.

Never display raw backend errors.

Examples

Unable to save asset.

Network error.

Session expired.

---

# 110. Loading States

Every asynchronous request shall display:

Loading Spinner

Skeleton Loader

Progress Indicator

Never leave users waiting without feedback.

---

# 111. Empty States

Provide meaningful empty states.

Examples

No Assets Found

No Reservations

No Notifications

No Inventory Records

---

# 112. Notifications

Notifications shall use Toasts.

Success

Warning

Error

Info

---

# 113. Accessibility

The frontend shall support:

Keyboard Navigation

Proper Labels

ARIA Attributes

Color Contrast

Focus States

---

# 114. Frontend Checklist

Before merging

✓ Responsive

✓ Uses Services

✓ Uses Hooks

✓ Uses Shared Components

✓ No duplicated UI

✓ Loading State

✓ Error State

✓ Empty State

✓ API follows PROJECT_RULES.md

✓ Code reviewed

# 115. Mobile Standards

The mobile application shall be developed using:

- Flutter
- Dart

The mobile application shall consume the Laravel REST API.

Business logic SHALL remain in the backend.

The mobile application is responsible only for:

- User Interface
- User Experience
- QR / Barcode Scanning
- API Communication
- Local Caching
- Offline Support (Future)

---

# 116. Mobile Folder Structure

mobile/

lib/

core/

config/

constants/

services/

utils/

models/

repositories/

features/

shared/

routes/

widgets/

main.dart

Every feature shall be isolated.

Example

features/

auth/

dashboard/

asset/

reservation/

borrowing/

inventory/

maintenance/

notification/

profile/

---

# 117. Feature Structure

Each feature shall contain only the files it needs.

Example

asset/

models/

repositories/

screens/

widgets/

controllers/

services/

---

# 118. Screens

Screen names shall end with "Screen".

Examples

LoginScreen

DashboardScreen

AssetScreen

BorrowingScreen

ReservationScreen

InventoryScreen

MaintenanceScreen

ProfileScreen

SettingsScreen

---

# 119. Widgets

Widgets shall be reusable.

Examples

AssetCard

BorrowButton

SearchField

StatusBadge

QRScannerWidget

BarcodeScannerWidget

NotificationTile

MetricCard

Never duplicate widgets.

---

# 120. State Management

The project shall use:

Riverpod

Future versions may adopt:

Bloc

Only if required.

Local UI state

- Form Fields
- Expansion Tiles
- Selected Tabs

Global State

- Authentication
- Logged User
- Theme
- Notifications

---

# 121. API Communication

Every request shall pass through a Repository.

Example

AuthRepository

AssetRepository

ReservationRepository

BorrowingRepository

InventoryRepository

Never call Dio or HTTP directly inside Screens.

---

# 122. Models

Models shall match backend Resources.

Examples

AssetModel

ReservationModel

BorrowingModel

InventoryItemModel

NotificationModel

Never invent properties.

Models shall always match the API.

---

# 123. JSON Serialization

Use

json_serializable

or

freezed

Manual parsing should be avoided.

---

# 124. Navigation

Use

GoRouter

Routes

/login

/dashboard

/assets

/reservations

/borrowings

/inventory

/profile

/settings

---

# 125. QR / Barcode Scanner

The mobile application shall support:

QR Code

Barcode

Future

RFID

NFC

The scanner shall decode the value and send it to the backend.

Asset lookup shall always occur on the server.

Never determine asset ownership locally.

---

# 126. Offline Behavior

Version 1

Internet connection required.

Future

Offline Mode

Cached Assets

Pending Synchronization

Background Sync

---

# 127. Local Storage

Use

flutter_secure_storage

Authentication Tokens

Use

SharedPreferences

User Preferences

Theme

Settings

Never store passwords.

---

# 128. File Downloads

Supported Downloads

PDF

Excel

CSV

Files shall open using the device's default applications.

---

# 129. Error Handling

Never display raw backend errors.

Show user-friendly messages.

Examples

Unable to connect.

Asset not found.

Session expired.

Reservation failed.

---

# 130. Loading States

Every network request shall display:

Loading Indicator

Skeleton Loader

Progress Dialog

Never freeze the UI.

---

# 131. Empty States

Examples

No Assets

No Borrowings

No Reservations

No Notifications

No Inventory Records

---

# 132. Notifications

Use

Local Notifications

for reminders.

Future

Push Notifications

Firebase Cloud Messaging

---

# 133. Mobile Security

Always

Use HTTPS

Validate JWT/Sanctum Token

Secure Token Storage

Logout on Unauthorized

Never

Store Passwords

Store Sensitive Data in Plain Text

Disable SSL Validation

---

# 134. Mobile Checklist

Before merging

✓ Responsive UI

✓ API matches backend

✓ Uses Repository

✓ Uses Models

✓ Uses Riverpod

✓ Loading State

✓ Empty State

✓ Error State

✓ QR Scanner Working

✓ Barcode Scanner Working

✓ Code Reviewed

# 135. Development Workflow

All development shall follow a structured workflow.

Planning

↓

Documentation

↓

Database Design

↓

Backend Development

↓

Frontend Development

↓

Mobile Development

↓

Testing

↓

Review

↓

Deployment

No feature shall be developed without approved documentation.

---

# 136. Git Branch Strategy

The repository shall use the following branches.

main

Production-ready code.

develop

Integration branch.

feature/*

New features.

bugfix/*

Bug fixes.

hotfix/*

Production fixes.

release/*

Release preparation.

---

# 137. Branch Naming

Feature

feature/auth

feature/assets

feature/reservations

feature/borrowings

feature/inventory

feature/dashboard

feature/mobile

Bug Fix

bugfix/login

bugfix/assets

Hot Fix

hotfix/security

Release

release/v1.0.0

Never create random branch names.

---

# 138. Team Ownership

Backend Lead

Marc

Responsibilities

Database

API

Architecture

Flutter

Deployment

Code Review

Documentation

---

Frontend Lead

Carl

Responsibilities

React

UI

Components

Responsive Design

Dashboard

---

Authentication Lead

Eman

Responsibilities

Authentication

Authorization

RBAC

User Management

Profile

---

Shared Responsibilities

Testing

Bug Fixes

Documentation

Code Reviews

Integration

---

# 139. Module Ownership

Only the assigned owner may approve architectural changes.

Module

Owner

Auth

Eman

Users

Eman

Roles

Eman

Permissions

Eman

Assets

Marc

Reservations

Marc

Borrowings

Marc

Inventory

Marc

Maintenance

Marc

Reports

Marc

Flutter

Marc

Frontend

Carl

UI Components

Carl

Shared modules may be modified only after discussion.

---

# 140. Development Order

Development shall follow this sequence.

1

Project Setup

2

Authentication

3

Users

4

Roles

5

Permissions

6

Assets

7

Reservations

8

Borrowings

9

Inventory

10

Maintenance

11

Notifications

12

Reports

13

Dashboard

14

Flutter

15

Deployment

---

# 141. Commit Message Standard

Every commit shall follow Conventional Commits.

Examples

feat: add asset management module

fix: resolve login validation issue

docs: update project documentation

refactor: simplify borrowing service

test: add asset service tests

style: format code

chore: update dependencies

Never use

update

fix

asdf

test

without proper descriptions.

---

# 142. Pull Requests

Every Pull Request shall contain.

Purpose

Summary

Files Changed

Testing Performed

Screenshots (if UI)

Related Issues

No Pull Request shall be merged without review.

---

# 143. Code Reviews

Every Pull Request shall be reviewed.

Checklist

Architecture

Naming

Business Rules

Validation

Authorization

Performance

Security

Documentation

Tests

No code shall be merged without review.

---

# 144. Merge Rules

Merge Order

feature/*

↓

develop

↓

main

Never merge directly into main.

---

# 145. Daily Development Process

Each developer shall.

1.

Pull latest develop.

2.

Create feature branch.

3.

Implement feature.

4.

Test locally.

5.

Commit changes.

6.

Push branch.

7.

Open Pull Request.

8.

Review.

9.

Merge into develop.

---

# 146. Database Changes

Only the Backend Lead may modify.

Database Schema

Migrations

Relationships

Indexes

Foreign Keys

Before changing the schema.

Update documentation.

Update ERD.

Review with team.

---

# 147. API Changes

Only Backend Lead may.

Create Endpoints

Rename Endpoints

Modify Response Format

Modify Request Structure

Frontend and Mobile must be informed before merging.

---

# 148. Frontend Changes

Frontend shall never.

Invent API Endpoints.

Rename Backend Fields.

Modify Backend Logic.

Assume Missing Data.

Frontend follows API contracts.

---

# 149. Mobile Changes

Flutter shall never.

Implement Business Logic.

Modify API Contracts.

Rename Backend Fields.

Assume Missing Data.

Flutter follows API contracts.

---

# 150. Documentation Policy

Whenever introducing.

New Table

New Endpoint

New Feature

New Module

New Workflow

Documentation must be updated.

Documentation is part of the codebase.

---

# 151. AI Collaboration

AI is considered a development assistant.

Every AI-generated change must be.

Reviewed

Tested

Verified

Documented

AI output shall never be merged without human review.

---

# 152. AI Ownership Rules

AI shall never.

Rename Models.

Rename Variables.

Rename Tables.

Rename Endpoints.

Rewrite Unrelated Files.

Delete Existing Logic.

Generate Entire Projects.

AI shall only implement the requested feature.

---

# 153. Conflict Resolution

If two developers modify the same module.

Stop development.

Discuss changes.

Review architecture.

Merge only after agreement.

Never overwrite another developer's work.

---

# 154. Definition of Done

A feature is complete only when.

✓ Backend Complete

✓ Frontend Complete

✓ Mobile Complete (if applicable)

✓ Validation Complete

✓ Authorization Complete

✓ Tests Pass

✓ Documentation Updated

✓ Code Reviewed

✓ Successfully Merged

Only then is a feature considered finished.

# 155. AI Development Policy

Artificial Intelligence (AI) is an assistant to the development team.

AI SHALL assist in:

- Code Generation
- Code Refactoring
- Documentation
- Unit Testing
- Bug Fixing
- Code Review Suggestions

AI SHALL NOT make architectural decisions.

All architectural decisions belong to the development team.

---

# 156. Approved AI Tools

The following AI tools are approved.

Primary

- Kilo Code

Secondary

- ChatGPT
- Claude
- Ollama

Only approved AI tools shall be used when generating project code.

---

# 157. Required Documents

Before generating code, AI MUST read the following documents.

1. PROJECT_RULES.md

2. PROMPT_INSTRUCTIONS.md

3. docs/

4. Database Documentation

5. API Documentation

If these documents are unavailable, AI shall stop and request them.

---

# 158. AI Responsibilities

AI SHALL

Read existing code.

Reuse existing classes.

Follow architecture.

Follow naming conventions.

Follow folder structure.

Follow API contracts.

Generate maintainable code.

Generate secure code.

Generate clean code.

Generate readable code.

Generate documented code.

---

# 159. AI Restrictions

AI SHALL NEVER

Rename Models.

Rename Tables.

Rename Variables.

Rename Endpoints.

Rename Services.

Rename Controllers.

Rename Requests.

Rename Policies.

Rename Resources.

Modify unrelated files.

Generate duplicate functionality.

Invent business rules.

Invent API endpoints.

Invent database columns.

Invent new modules.

Delete existing code unless requested.

---

# 160. AI Workflow

Every AI request shall follow this process.

Read Documentation

↓

Analyze Existing Code

↓

Explain Implementation Plan

↓

Wait if clarification is required

↓

Generate Requested Code

↓

Summarize Changes

AI shall never immediately generate code without understanding the project.

---

# 161. AI Output Standards

Generated code shall.

Compile successfully.

Follow Laravel standards.

Follow React standards.

Follow Flutter standards.

Follow PROJECT_RULES.md.

Follow Coding Standards.

Include meaningful comments only when necessary.

Avoid unnecessary complexity.

---

# 162. Scope Limitation

AI shall only modify files related to the requested feature.

Example

Request

Implement Asset Module

Allowed

AssetController

AssetService

Asset Model

Asset Requests

Asset Resources

Not Allowed

AuthController

BorrowingService

InventoryController

Dashboard

Unless explicitly requested.

---

# 163. Existing Code Policy

Whenever possible,

AI shall extend existing code instead of replacing it.

Avoid rewriting complete files.

Preserve existing architecture.

Maintain backward compatibility.

---

# 164. Code Quality Standards

Generated code shall.

Use descriptive names.

Avoid duplicated logic.

Follow SOLID Principles.

Follow DRY.

Follow KISS.

Follow Laravel conventions.

Avoid unnecessary abstractions.

---

# 165. Security Standards

AI shall.

Validate every request.

Authorize every protected action.

Prevent SQL Injection.

Prevent Mass Assignment.

Prevent XSS.

Prevent CSRF.

Protect sensitive information.

Never expose passwords.

Never expose tokens.

---

# 166. Database Rules

AI shall never.

Create new tables.

Rename tables.

Rename columns.

Modify relationships.

Delete migrations.

Without documentation approval.

---

# 167. API Rules

AI shall never.

Create new endpoints.

Rename endpoints.

Modify response structures.

Modify request structures.

Without approval.

---

# 168. Frontend Rules

AI shall never.

Invent API fields.

Rename backend properties.

Call APIs directly from components.

Duplicate components.

Ignore responsive design.

---

# 169. Mobile Rules

AI shall never.

Duplicate backend logic.

Store passwords.

Ignore API contracts.

Invent fields.

Perform business logic locally.

---

# 170. Testing

Whenever possible,

AI should generate.

Unit Tests

Feature Tests

API Tests

Widget Tests

Only for modified modules.

---

# 171. Documentation

If architecture changes,

AI shall recommend updating.

PROJECT_RULES.md

API Documentation

Database Documentation

ERD

Business Requirements

AI shall never silently change architecture.

---

# 172. Code Review

AI shall review generated code for.

Naming

Architecture

Performance

Security

Readability

Consistency

Potential Bugs

---

# 173. AI Response Format

Every AI response should include.

1. Objective

2. Files to Modify

3. Implementation Plan

4. Code

5. Summary

6. Testing Instructions

7. Notes

This allows developers to understand every generated change.

---

# 174. AI Approval Rules

AI shall ask for confirmation before.

Deleting files.

Renaming files.

Changing database schema.

Changing API contracts.

Changing authentication.

Changing architecture.

Large refactoring.

---

# 175. Definition of AI Success

A successful AI-generated feature is one that.

✓ Compiles Successfully

✓ Passes Tests

✓ Follows PROJECT_RULES.md

✓ Uses Existing Architecture

✓ Does Not Break Existing Features

✓ Updates Documentation (if needed)

✓ Is Approved During Code Review

