# FAQ & Help Administration (implementation-backed)

Summary

FAQ entries are implemented as a persisted model (Faq) with API endpoints for listing, creating, updating and deleting. The implementation includes role-based visibility filtering and admin-only management.

Implemented and verified

- CRUD API for FAQ entries
  - Controller: backend/app/Http/Controllers/FaqController.php implements index, store, update, destroy with validation and role checks.
  - Creation and updates require administrative roles (Super Administrator or System Administrator) — enforced by the isAdmin() helper in FaqController.

- Role-filtered visibility
  - FAQ entries may include a roles array; index applies a visibility filter so only allowed roles see role-restricted FAQs. The visibility check uses a case-insensitive DB comparison when matching role names.

- Search and categories
  - Index supports category filter and case-insensitive search over question, answer, and category using LOWER(...) like queries.

Source-of-truth files

- backend/app/Http/Controllers/FaqController.php
- backend/app/Models/Faq.php

Operational notes

- FAQ management is enforced at the backend; frontend may expose admin UI but permissions are validated server-side.
- Deletion uses model delete(); if soft-deletes are required check the Faq model implementation before assuming recoverability.
