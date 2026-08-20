# System Architecture Documentation

Purpose

This folder documents the actual system architecture as implemented in the repository. These documents describe how the project is organized, how its major parts interact, and where responsibilities live in the code. The documentation is implementation-backed: controllers, route registrations, models, requests and services referenced here are the authoritative source of truth.

Architecture map

- system-overview.md — high-level architecture, major boundaries, and responsibilities
- frontend-architecture.md — React app structure, routing, services, hooks and API integration
- backend-architecture.md — Laravel module organization, routing, middleware, controllers, services, requests, resources and response patterns
- module-architecture.md — per-module responsibilities, routes, controllers and frontend integration
- request-data-flow.md — representative end-to-end flows (authentication, inventory, asset, borrowing)
- authentication-and-authorization-flow.md — detailed auth and RBAC behavior (middleware, policies, session handling)
- database-architecture.md — migration- and model-backed description of the primary domain entities and relationships
- qr-scanning-architecture.md — QR resolution, scan actions, history and integration points
- inventory-and-asset-architecture.md — relationship and responsibilities between Inventory and Asset modules
- architecture-decisions.md — ADR-style summary of verified architecture decisions

Relationship to other docs

- Feature documentation (what the system does): docs/features/
- API documentation (how clients interact): docs/api/
- Deployment and operational guides: docs/deployment/

Source-of-truth

Be guided by these files when reading the architecture docs:
- backend/routes/api.php
- backend/app/Modules/*/Routes/api.php
- backend/app/Modules/*/Controllers/*
- backend/app/Modules/*/Requests/*
- backend/app/Modules/*/Resources/*
- frontend/src/pages/* and frontend/src/services/*

If the code and legacy docs conflict, the code is authoritative. Update these architecture documents when the code changes.
