# TEAM_RESPONSIBILITIES.md

# Office Asset, Equipment Reservation, Borrowing & Inventory Management System

Version: 1.0

Last Updated: July 2026

---

# Purpose

This document defines the responsibilities, ownership, and workflow of every team member.

Each member is responsible for their assigned modules and must coordinate with the team before modifying protected files.

---

# Team Structure

| Member | Primary Role |
|----------|----------------------------|
| **Marc** | Backend Lead • Database Architect • API Lead • Deployment Lead |
| **Carl** | Frontend Lead • UI/UX Lead • Responsive Web & PWA Lead |
| **Eman** | Authentication & Security Lead • RBAC Lead |

---

# 👨‍💻 Marc

## Primary Responsibilities

- Laravel Backend
- PostgreSQL Database
- Database Design
- API Development
- System Architecture
- Deployment
- Documentation
- Code Review

---

## Modules

- Dashboard
- Assets
- Reservations
- Borrowings
- Inventory
- Maintenance
- Reports
- Notifications

---

## Backend Ownership

```text
backend/

app/Models/

app/Services/

app/Repositories/

app/Actions/

app/Enums/

app/Traits/

database/

routes/

config/
```

---

## Protected Files

Only Marc may modify these unless approved.

```text
database/

database/migrations/

app/Models/

app/Services/

routes/api.php

config/

composer.json
```

---

# 👨‍💻 Carl

## Primary Responsibilities

- React
- TypeScript
- Tailwind CSS
- UI / UX
- Responsive Design
- Progressive Web App (PWA)

---

## Modules

- Dashboard UI
- Asset UI
- Reservation UI
- Borrowing UI
- Inventory UI
- Maintenance UI
- Reports UI
- Shared Components

---

## Frontend Ownership

```text
frontend/

src/components/

src/features/

src/layouts/

src/pages/

src/hooks/

src/routes/

src/services/

src/stores/

src/types/

src/utils/

src/assets/
```

---

## Protected Files

Only Carl may modify these unless approved.

```text
frontend/src/components/

frontend/src/layouts/

frontend/src/routes/

frontend/src/styles/
```

---

# 👨‍💻 Eman

## Primary Responsibilities

- Authentication
- Authorization
- User Management
- Roles
- Permissions
- Profile
- Security

---

## Modules

- Login
- Logout
- Profile
- Users
- Roles
- Permissions

---

## Backend Ownership

```text
backend/

app/Http/Controllers/Auth/

app/Http/Controllers/User/

app/Http/Controllers/Role/

app/Http/Controllers/Permission/

app/Policies/

app/Http/Requests/

app/Http/Resources/
```

---

## Protected Files

Only Eman may modify these unless approved.

```text
Auth/

User/

Role/

Permission/

Policies/

Authentication Configuration
```

---

# Shared Responsibilities

Every team member is responsible for:

- Documentation
- Testing
- Bug Fixes
- Pull Requests
- Code Reviews
- Git Management

---

# Folder Ownership

| Folder | Owner |
|----------|--------|
| backend/database | Marc |
| backend/app/Models | Marc |
| backend/app/Services | Marc |
| backend/routes | Marc |
| frontend/src | Carl |
| backend/Auth | Eman |
| backend/User | Eman |
| docs | Everyone |

---

# Module Ownership

| Module | Backend | Frontend |
|------------|------------|-------------|
| Authentication | Eman | Carl |
| Users | Eman | Carl |
| Roles | Eman | Carl |
| Permissions | Eman | Carl |
| Dashboard | Marc | Carl |
| Assets | Marc | Carl |
| Reservations | Marc | Carl |
| Borrowings | Marc | Carl |
| Inventory | Marc | Carl |
| Maintenance | Marc | Carl |
| Reports | Marc | Carl |
| Notifications | Marc | Carl |

---

# Development Workflow

## Marc

```text
Database
        │
        ▼
API
        │
        ▼
Architecture
        │
        ▼
Deployment
```

---

## Carl

```text
UI Design
        │
        ▼
Components
        │
        ▼
Responsive Layout
        │
        ▼
API Integration
```

---

## Eman

```text
Authentication
        │
        ▼
Users
        │
        ▼
Roles
        │
        ▼
Permissions
```

---

# Collaboration Rules

Every member shall:

- Work only within assigned modules.
- Pull the latest changes before starting work.
- Push changes to a feature branch.
- Open a Pull Request before merging.
- Update documentation when required.

---

# Change Approval Rules

The following require approval from the owner:

- Database Schema
- API Contract
- Authentication Flow
- Shared Components
- Folder Structure
- Architecture Changes

---

# Code Review

Every Pull Request must be reviewed by at least one team member.

Checklist

- Architecture follows PROJECT_RULES.md
- Naming follows NAMING_CONVENTIONS.md
- No duplicate code
- API contract preserved
- Documentation updated
- Successfully tested

---

# Communication

Before implementing a major feature:

1. Discuss the approach with the team.
2. Confirm the affected modules.
3. Avoid duplicate work.
4. Update documentation if necessary.

---

# Definition of Done

A feature is complete only when:

- Backend implementation is complete.
- Frontend integration is complete.
- Authentication and authorization are verified (if applicable).
- Code has been reviewed.
- Documentation has been updated.
- Feature has been tested.
- Pull Request has been approved and merged.