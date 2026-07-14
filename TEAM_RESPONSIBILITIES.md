# TEAM_RESPONSIBILITIES.md

## Team Members

Marc
Backend Lead / Mobile Lead

Carl
Frontend Lead

Eman
Authentication Lead

---

# Marc

Primary Responsibilities

- Laravel Backend
- PostgreSQL Database
- API Development
- Flutter Mobile App
- System Architecture
- Deployment
- Documentation

Modules

- Assets
- Reservations
- Borrowings
- Inventory
- Maintenance
- Reports
- Dashboard APIs

Owns

- Database
- API Contracts
- Migrations
- Services
- Architecture Decisions

Cannot Be Modified Without Approval

- Database Schema
- API Response Structure
- Folder Structure

---

# Carl

Primary Responsibilities

- React
- TypeScript
- Tailwind CSS
- Responsive UI
- Dashboard
- Shared Components

Modules

- Dashboard
- Assets UI
- Reservations UI
- Borrowings UI
- Inventory UI
- Reports UI

Owns

- Components
- Layouts
- Hooks
- Frontend Services

Cannot Be Modified Without Approval

- Shared UI Components
- Frontend Architecture

---

# Eman

Primary Responsibilities

- Authentication
- Authorization
- User Management
- Roles
- Permissions
- Profile

Modules

- Auth
- Users
- Roles
- Permissions
- Profile

Owns

- Login
- Logout
- Password Reset
- Sanctum Integration
- RBAC

Cannot Be Modified Without Approval

- Authentication Flow
- Authorization Rules

---

# Shared Responsibilities

All Members

- Bug Fixes
- Code Reviews
- Documentation
- Testing
- Git

---

# Development Rules

Each member works only on assigned modules.

If another module requires changes:

1. Inform the module owner.
2. Discuss the change.
3. Update documentation if needed.
4. Merge only after approval.

Never overwrite another member's work without discussion.

---

# Integration Rules

Backend APIs are completed before frontend/mobile integration.

Frontend and Mobile shall strictly follow the API contract.

No member may invent new endpoints, fields, or database columns.

---

# Code Review

Every Pull Request must be reviewed by at least one other team member before merging.

Large architectural changes require agreement from all three members.