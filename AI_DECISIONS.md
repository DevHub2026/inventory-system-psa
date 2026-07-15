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