# PSA Inventory System Documentation

This directory is the canonical Markdown documentation source for the project.

The codebase is the source of truth. Legacy material under `docs/old_docs/` is retained for historical context only and must not be treated as current product documentation.

## Documentation policy

- `docs/` is the maintained project documentation set.
- `docs/old_docs/` is a historical/reference archive.
- New documentation must be based on the current implementation in the repository, not on legacy assumptions.
- Features must only be documented when they are verified in the current source tree.

## Current implementation snapshot

The project currently includes:

- Laravel backend under `backend/`
- React + Vite frontend under `frontend/`
- mobile app work under `mobile/`
- PostgreSQL-backed data model with Laravel migrations
- user and role management
- inventory and asset management
- borrowing and return workflows
- reservations and QR scanning
- extension requests
- reports, FAQ, and system setup
- accessibility preferences and keyboard support tools

## Documentation index

### Getting started

- [Getting started overview](./getting-started/overview.md)
- [Installation](./getting-started/installation.md)
- [Development setup](./getting-started/development-setup.md)

### Architecture

- [System overview](./architecture/system-overview.md)
- [Frontend architecture](./architecture/frontend-architecture.md)
- [Backend architecture](./architecture/backend-architecture.md)

### Security and access control

- [Authentication](./security/authentication.md)
- [Authorization and RBAC](./security/authorization-rbac.md)
- [Role model and permissions](./security/roles.md)

### Accessibility

- [Accessibility overview](./accessibility/overview.md)
- [Accessibility preferences](./accessibility/preferences.md)
- [Accessibility testing](./accessibility/testing.md)

## Documentation inventory and status

### Created and maintained in this pass

- Getting started docs
- Architecture overview docs
- Security and authorization docs
- Accessibility docs

### Deferred until the feature is verified or expanded

- Features-specific reference pages for inventory, assets, borrowings, reservations, QR scanning, reports, and system setup
- Detailed API module documentation
- Deployment operations guide
- Troubleshooting reference
- Documentation management/admin console guide

### Legacy/reference only

- `docs/old_docs/` contains the previous project documentation set.
- It remains available for historical comparison, but it is not the maintained source of truth.

## Source of truth for this documentation

This documentation was verified against the current repository implementation, especially:

- `backend/routes/api.php`
- `backend/app/Modules/*`
- `backend/app/Enums/UserRole.php`
- `backend/app/Models/User.php`
- `backend/app/Models/Role.php`
- `backend/database/migrations/`
- `frontend/src/App.tsx`
- `frontend/src/layouts/AppLayout.tsx`
- `frontend/src/hooks/AuthProvider.tsx`
- `frontend/src/utils/roleHelpers.ts`
- `frontend/tests/a11y/run-axe-puppeteer.js`

## Maintenance approach

- Treat the codebase as authoritative.
- Update docs when routes, roles, data structure, or workflows change.
- Keep legacy documents archived and clearly separated from maintained docs.
- Prefer concise, code-backed documentation over speculative descriptions.
