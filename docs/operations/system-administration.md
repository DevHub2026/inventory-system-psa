# System administration (implementation-backed)

Purpose

This document summarizes administrator-level capabilities implemented in the repository and where they are enforced.

Implemented and verified capabilities

- System Setup / Document Templates
  - Purpose: Manage document templates and generate documents used by other modules (e.g., reports, procurement notices).
  - Who can perform it: Controlled by policies that check for administrative roles (Super Administrator or System Administrator). See SystemSetup policies.
  - Where: System Setup module controllers and routes: backend/app/Modules/SystemSetup/Controllers/DocumentTemplateController.php and backend/app/Modules/SystemSetup/Routes/api.php.
  - Backend enforcement: DocumentTemplatePolicy is registered in SystemSetupServiceProvider and used by controller actions.
  - Limitations: Template files (docx) are uploaded and versioned; rendering is provided by services in the module. No UI screenshots are included here.

- Administrative dashboard and management pages
  - Purpose: Views and APIs for system-level dashboards are implemented in modules (DashboardService, etc.).
  - Who: Role-restricted by policies referencing App\Enums\UserRole.
  - Source: backend/app/Modules/Dashboard/Services/DashboardService.php and related controllers.

- Notifications and in-app notification management
  - Purpose: System can create, store, and deliver notifications to users (DB records plus queued email notifications).
  - Where: App\Models\Notification, backend/app/Notifications, NotificationService module.
  - Enforcement: NotificationController and NotificationService with policy checks for which staff can send certain notifications.

Notable limitations / responsibilities outside the app

- User/role management UI exists in the frontend and APIs in backend; however runtime RBAC enforcement depends on policies and middleware (see UserRole enum and policies). Ensure admin accounts are managed securely.
- Backup/restore, external monitoring, and server-level maintenance are infrastructure responsibilities and are not implemented inside this repository (see backup-and-recovery.md and monitoring-and-logging.md).

Source-of-truth files

- backend/app/Modules/SystemSetup/Controllers/DocumentTemplateController.php
- backend/app/Modules/SystemSetup/Policies/DocumentTemplatePolicy.php
- backend/app/Modules/SystemSetup/Providers/SystemSetupServiceProvider.php
- backend/app/Modules/Notification/*
- backend/app/Enums/UserRole.php
