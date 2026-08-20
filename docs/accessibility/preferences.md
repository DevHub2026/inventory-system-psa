# Accessibility preferences

## Purpose

This document describes the current user-level accessibility preference architecture.

## Current implementation

The frontend reads and writes accessibility preferences through `frontend/src/utils/accessibilityPreferences.ts`.

The preference model currently includes:

- `fontSize` (`default` or `large`)
- `highContrast` (`true` or `false`)
- `reducedMotion` (`true` or `false`)

## Persistence model

Preferences are persisted in a per-user browser storage pattern and are re-applied during auth bootstrap. The app also normalizes backend preferences into the frontend shape when a server payload is present.

This architecture prevents a single user’s preference change from being blindly reused across unrelated users.

## Application flow

1. User logs in.
2. App boots and loads the authenticated user state.
3. Server preference payload is normalized.
4. Local preference state is written and applied.
5. UI settings update immediately.
6. Reload restores the same stored preference state for the current user.

## Relevant files

- `frontend/src/utils/accessibilityPreferences.ts`
- `frontend/src/hooks/AuthProvider.tsx`
- `backend/app/Models/User.php`
- `backend/app/Http/Controllers/AuthController.php`

## Scope

This covers the implemented preference system. It does not claim a broader accessibility certification beyond the current verified behavior and automated checks.
