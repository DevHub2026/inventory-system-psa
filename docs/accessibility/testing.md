# Accessibility testing

## Purpose

This document describes the current automated accessibility validation used for the project.

## Current implementation

The frontend includes a browser-based accessibility runner in:

- `frontend/tests/a11y/run-axe-puppeteer.js`

The project also includes CI configuration for accessibility checks in:

- `.github/workflows/accessibility.yml`

## What the runner checks

The runner exercises the actual application under a browser, including:

- page navigation
- element-level accessibility violations
- keyboard focus behavior
- modal and dialog escape behavior
- navigation error capture
- known app flows such as Quick Access and Help & Accessibility hub interaction

## Commands

From `frontend/`:

```bash
npm run a11y:test
```

For a standard build check:

```bash
npm run build
npm run lint
```

## Safety and validation model

The accessibility suite is intended to catch regressions in the live app rather than only checking static markup. It is designed to fail when critical or serious issues are introduced and to give a verified baseline for the current app shell.

## Related files

- `frontend/tests/a11y/run-axe-puppeteer.js`
- `.github/workflows/accessibility.yml`
- `frontend/src/components/GlobalQuickAccess.tsx`
- `frontend/src/components/HelpAccessibilityHub.tsx`
