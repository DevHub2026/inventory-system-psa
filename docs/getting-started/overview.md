# Project overview

## Purpose

This repository contains a PSA inventory and asset management system used for tracking, issuing, borrowing, returning, and reporting operational resources. The current implementation is structured as a Laravel API backend and a React + Vite web application.

## Current verified implementation

### Backend

The backend is a Laravel application under `backend/`.

Verified areas include:

- authentication and session management
- user management and role assignment
- inventory management
- asset management and lifecycle data
- borrowing and return workflows
- reservation handling
- QR scanning support
- extension requests
- FAQ management
- system setup and admin configuration
- accessibility preference persistence

### Frontend

The frontend is a React application under `frontend/`.

Verified areas include:

- login and protected routes
- dashboards and operational pages
- inventory and asset pages
- borrowing and reservations pages
- reports and system setup pages
- users, roles, permissions, and settings pages
- Quick Access and Help & Accessibility hub
- accessibility preference controls

### Data and persistence

The current codebase uses Laravel migrations and a PostgreSQL configuration in the active project environment. The migration history under `backend/database/migrations/` shows the project’s current operational model, including tables for users, roles, permissions, assets, inventory, borrowings, reservations, asset issuance, QR scan history, FAQ, and accessibility preferences.

## Major functional areas

### Inventory

Inventory is managed through the `InventoryController` and inventory module routes. The code supports stock operations, SKU validation, stock adjustment, import/export flows, inventory counts, and category-aware access patterns.

### Assets

Assets are managed through asset and maintenance-related modules and include property/accountability data, QR identifiers, assignment, disposal, and reporting flows.

### Borrowing and returns

Borrowing actions and extension requests are implemented in the borrowing module. Routes include list, create, scan, return, and extension approval/rejection endpoints.

### Reservations

Reservation workflows are present in the reservation module and route set; they are integrated with the broader asset/borrowing lifecycle.

### System administration

The app includes admin routes for users, roles, permissions, system setup, workflows, sessions, and documentation access.

## Scope boundaries

This documentation intentionally covers only the features that are verified in the current repository. Legacy planning documents under `docs/old_docs/` are retained as historical/reference material and may describe earlier designs or assumptions that are not current product behavior.

## Related files

- `backend/routes/api.php`
- `backend/app/Modules/`
- `frontend/src/App.tsx`
- `frontend/src/layouts/AppLayout.tsx`
- `backend/app/Enums/UserRole.php`
