# AI Decisions

## Purpose

Record every important architectural decision made during development.

This document explains WHY decisions were made.

It is not a changelog.

Never remove previous decisions.

Always append new decisions.

---

# Decision Template

## Decision

Describe the decision.

---

### Date

YYYY-MM-DD

---

### AI

Name:

Model:

---

### Reason

Why was this decision made?

---

### Alternatives Considered

List every alternative.

Example:

Option A

Option B

Option C

---

### Selected Option

State the chosen option.

---

### Why This Option

Explain why it was selected.

---

### Impact

Describe the impact on the project.

---

### Future Notes

Anything future developers should know.

---

## Example

Decision

Use AuthProvider globally.

Date

2026-07-15

AI

Name:
Windsurf

Model:
Claude Sonnet 4

Reason

LoginForm now consumes useAuth().

Alternatives

- Wrap only LoginPage.
- Wrap only LoginForm.
- Global AuthProvider.

Selected Option

Global AuthProvider.

Why

Future protected routes require the same context.

Impact

Authentication context is available throughout the application.

Future Notes

Avoid wrapping nested providers unless necessary.

## Decision

Use a router-based app shell with a protected route boundary for authenticated screens.

Date

2026-07-16

AI

Name:
GitHub Copilot

Model:
MAI-Code-1-Flash

Reason

The frontend needed a consistent way to redirect authenticated users to the dashboard while keeping unauthenticated users on the login page.

Alternatives

- Keep everything rendered from a single conditional component.
- Add per-page manual redirects.
- Introduce a shared protected route wrapper.

Selected Option

A shared protected route wrapper with top-level routing.

Why

This keeps the app structure consistent and makes it easier to expand to additional authenticated pages without repeating navigation logic.

Impact

The app now has a clearer authenticated/unauthenticated split, and the login page can redirect to the dashboard automatically after successful sign-in.

Future Notes

Extend the protected route tree as more pages are fully connected to the backend.