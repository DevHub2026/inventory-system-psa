# AI Context

## Purpose

This document preserves the current state of the project so every AI assistant can continue development without requiring the entire conversation history.

Every AI session MUST read this file before performing any work.

---

# Project

**Name**
Office Asset, Equipment Reservation, Borrowing, and Inventory Management System

**Organization**
Philippine Statistics Authority (PSA)

---

# Technology Stack

Backend
- Laravel 12
- PHP
- SQLite (Development)
- PostgreSQL (Production)
- Laravel Sanctum

Frontend
- React
- TypeScript
- Vite
- Tailwind CSS

Mobile
- Flutter

---

# Current Project Status

## Completed

- Backend authentication implemented.
- Login API working.
- Database migrations updated.
- Authentication provider implemented.
- Login form connected to authentication service.
- User model updated.
- API service configured.
- Frontend build now compiles successfully.

---

## Current Task

Stabilize the authentication flow and protected app navigation for the frontend.

---

## Current Known Facts

- The frontend build completes successfully with npm run build.
- The login form now calls the existing auth context and navigates to the dashboard on success.
- The app shell now uses routing with protected navigation.
- The shared Button component supports the outline variant required by the settings screen.

---

## Current Issues

Issue:
End-to-end login behavior still depends on the backend being reachable and returning a valid auth response.

Status:
Pending runtime verification in the browser or API environment.

---

## Next Investigation

Verify the login experience in a running environment and confirm that the dashboard route loads correctly after authentication.

---

## Important Decisions

- Preserve the existing authentication architecture.
- Do not rewrite backend authentication.
- Use AuthProvider globally.
- Prefer minimal fixes over refactoring.

---

## AI Rules

Every AI assistant MUST:

- Read this document before working.
- Continue from the latest project state.
- Never repeat previously completed work.
- Never guess.
- Verify every conclusion using source code.
- Ask before making major architectural changes.

Update this file whenever the project status changes.