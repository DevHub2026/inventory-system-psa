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

---

## Current Task

Describe the current feature or bug being worked on.

Example:

Investigating why the frontend remains on the Login page after successful authentication.

---

## Current Known Facts

Write only verified facts.

Example:

- POST /api/v1/login returns HTTP 200.
- GET /api/v1/me returns HTTP 200.
- AuthProvider is working.
- Token generation succeeds.
- Backend authentication succeeds.
- LoginForm calls useAuth().login().

Do NOT include assumptions.

---

## Current Issues

List only active issues.

Example:

Issue:
Frontend does not navigate away from LoginPage after successful login.

Status:
Investigating.

---

## Next Investigation

Describe the next debugging step.

Example:

Trace App.tsx rendering logic after authentication.

---

## Important Decisions

List architecture decisions currently in effect.

Example:

- Preserve existing authentication architecture.
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