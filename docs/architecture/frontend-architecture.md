# Frontend architecture

## Purpose

This document describes the current frontend architecture used in the web app.

## Current implementation

The frontend is a React + Vite application under `frontend/`.

Main entry points include:

- `frontend/src/App.tsx` for route setup
- `frontend/src/layouts/AppLayout.tsx` for the shared app shell
- `frontend/src/hooks/AuthProvider.tsx` for session state and bootstrap
- `frontend/src/services/` for API interaction
- `frontend/src/utils/` for shared helpers and preference logic

## App shell and routing

The app is organized around a protected route pattern. The top-level shell mounts navigation, global controls, and page content according to the authenticated user role and route context.

The currently active shell includes:

- global app layout
- navigation routes
- global Quick Access launcher
- Help & Accessibility hub
- settings and personal preferences

## Authentication flow

The frontend loads a cached user from browser local storage before revalidating with the backend using the current session token. This logic is managed in `AuthProvider`.

The app keeps a `prototype_user` object and a token in local storage for session continuity and access checks.

## Shared UI and utility modules

The frontend uses reusable helpers for:

- role detection and display
- accessibility preferences
- date and formatting helpers
- API request handling
- form validation and messages

Notable files:

- `frontend/src/utils/accessibilityPreferences.ts`
- `frontend/src/utils/roleHelpers.ts`
- `frontend/src/services/authService.ts`
- `frontend/src/components/GlobalQuickAccess.tsx`
- `frontend/src/components/HelpAccessibilityHub.tsx`

## Accessibility features

The app includes a global accessibility experience that supports:

- Quick Access launcher
- Help & Accessibility modal
- font size preference
- high contrast preference
- reduced motion preference
- per-user persistence via browser local storage and backend preference payloads

## Related files

- `frontend/src/App.tsx`
- `frontend/src/layouts/AppLayout.tsx`
- `frontend/src/hooks/AuthProvider.tsx`
- `frontend/src/components/GlobalQuickAccess.tsx`
- `frontend/src/components/HelpAccessibilityHub.tsx`
