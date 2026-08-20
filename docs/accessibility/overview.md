# Accessibility overview

## Purpose

This document covers the active accessibility implementation in the current project.

## Current implementation

The frontend includes a global accessibility layer centered around the app shell and the Help & Accessibility experience.

Verified implementation areas include:

- global Quick Access launcher
- Help & Accessibility hub modal
- settings controls for font size, high contrast, and reduced motion
- FAQ access and role-aware filtering
- My Role and Diagnostics surfaces
- keyboard and focus handling
- per-user preference persistence
- automated accessibility checks via the frontend test runner

## Key components

- `frontend/src/components/GlobalQuickAccess.tsx`
- `frontend/src/components/HelpAccessibilityHub.tsx`
- `frontend/src/utils/accessibilityPreferences.ts`
- `frontend/tests/a11y/run-axe-puppeteer.js`
- `.github/workflows/accessibility.yml`

## Preference model

Accessibility preferences are applied per user and stored in local browser state while also being normalized with the backend payload when the session is bootstrapped.

The current preference controls include:

- font size
- high contrast
- reduced motion

## FAQ and help context

The Help hub surfaces FAQ items from the backend and filters them according to the current user role. This keeps the FAQ content authoritative while still respecting visibility constraints.

## Testing and regression protection

Accessibility checks are automated through the browser-based axe runner and related CI workflow. The runner validates the live UI rather than relying only on static code inspection.

## Related files

- `frontend/src/layouts/AppLayout.tsx`
- `frontend/src/utils/accessibilityPreferences.ts`
- `frontend/src/components/HelpAccessibilityHub.tsx`
- `frontend/tests/a11y/run-axe-puppeteer.js`
- `.github/workflows/accessibility.yml`
