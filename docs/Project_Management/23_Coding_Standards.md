# Coding Standards

| Field | Value |
|--------|-------|
| Document | 23_Coding_Standards.md |
| Version | 1.0 |
| Status | Draft |
| Last Updated | July 13, 2026 |
| Prepared By | Computer Science OJT Team |
| Client | Philippine Statistics Authority (PSA) Region XII |

---

# 1. Purpose

This document defines the coding standards and development conventions for the Office Asset, Equipment Reservation, Borrowing, and Inventory Management System.

Its purpose is to ensure that all source code remains readable, maintainable, scalable, and consistent regardless of the developer or AI assistant generating the code.

---

# 2. General Principles

The development team shall follow:

- SOLID Principles
- DRY (Don't Repeat Yourself)
- KISS (Keep It Simple, Stupid)
- YAGNI (You Aren't Gonna Need It)
- Separation of Concerns
- Clean Code
- Convention over Configuration

---

# 3. Naming Conventions

## Classes

PascalCase

Examples

AssetService

BorrowingController

ReservationPolicy

---

## Methods

camelCase

Examples

createBorrowing()

returnAsset()

generateQRCode()

---

## Variables

camelCase

Examples

assetId

borrowingDate

currentUser

---

## Constants

UPPER_SNAKE_CASE

Examples

MAX_BORROW_DAYS

DEFAULT_PAGE_SIZE

---

## Database Tables

Plural

Examples

users

assets

borrowings

returns

---

## Database Columns

snake_case

Examples

asset_number

property_number

serial_number

created_at

---

# 4. Folder Organization

Code shall be organized by business modules.

Example

app/

Modules/

Shared/

Core/

Avoid placing all controllers, models, and services into one large folder.

---

# 5. Controller Guidelines

Controllers shall:

- Be lightweight.
- Handle HTTP requests only.
- Validate requests.
- Delegate business logic to Services or Actions.
- Return API Resources.

Controllers shall NOT contain business logic.

---

# 6. Service Guidelines

Services shall:

- Implement business logic.
- Coordinate multiple models.
- Enforce business rules.
- Remain framework-independent where practical.

---

# 7. Model Guidelines

Models shall:

- Represent database entities.
- Define relationships.
- Define scopes.
- Avoid complex business logic.

---

# 8. Validation

Validation shall be implemented using Form Requests.

Validation rules shall never be duplicated across controllers.

---

# 9. Authorization

Authorization shall be handled using Policies and Gates.

Permission checks shall never be hardcoded inside controllers.

---

# 10. Error Handling

The application shall:

- Throw meaningful exceptions.
- Catch exceptions at the appropriate layer.
- Return standardized API responses.
- Log unexpected errors.

---

# 11. API Standards

The API shall:

- Follow REST principles.
- Return JSON.
- Use consistent status codes.
- Use API Resources for responses.

---

# 12. Database Standards

The database shall:

- Use migrations.
- Use seeders for sample data.
- Use factories for testing.
- Enforce foreign keys.

Direct SQL should be minimized unless justified.

---

# 13. Logging

Critical business operations shall be logged.

Examples

- Login
- Borrow Asset
- Return Asset
- Inventory Adjustment
- Role Changes

---

# 14. Git Standards

Branch Naming

feature/asset-management

feature/reservation-module

bugfix/login-validation

hotfix/security-patch

---

Commit Messages

Examples

feat: implement asset borrowing

fix: resolve duplicate reservation issue

refactor: simplify asset service

docs: update API documentation

test: add borrowing service tests

---

# 15. Documentation

Every module shall include:

- Purpose
- Dependencies
- Public Methods
- Important Business Rules

Complex logic shall be documented.

---

# 16. Code Review Checklist

Before merging:

- Code compiles successfully.
- Tests pass.
- Naming follows conventions.
- No duplicated code.
- Business rules are enforced.
- Documentation updated.
- No unnecessary comments.

---

# 17. AI-Assisted Development

AI-generated code shall:

- Be reviewed by a developer.
- Follow project architecture.
- Follow naming conventions.
- Pass testing before merging.
- Never be accepted without review.

---

# 18. Future Standards

Future versions may adopt:

- Static Analysis (PHPStan)
- Code Formatting (Laravel Pint)
- Automated Refactoring
- Continuous Code Quality Monitoring