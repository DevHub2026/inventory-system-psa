# PROMPT_INSTRUCTIONS.md

# Office Asset, Equipment Reservation, Borrowing & Inventory Management System

Version: 1.0

---

# Purpose

This document defines how every AI coding assistant shall behave when working on this repository.

This applies to, but is not limited to:

- Kilo Code
- ChatGPT
- Claude
- Ollama
- Cursor
- GitHub Copilot
- Any future AI coding assistant

The purpose of this document is to ensure every AI generates consistent, maintainable, and production-quality code that follows the project's architecture and standards.

---

# AI Priority Rules

Whenever multiple implementation approaches are possible, ALWAYS follow this priority order.

## Priority 1

Follow PROJECT_RULES.md.

PROJECT_RULES.md is the highest authority for architecture, naming conventions, database design, API contracts, folder structure, and development standards.

Never violate PROJECT_RULES.md.

---

## Priority 2

Follow the existing codebase.

Reuse existing:

- Architecture
- Folder Structure
- Components
- Services
- Models
- Patterns
- Utilities

Maintain consistency with the existing implementation.

Never rewrite working code without explicit instructions.

---

## Priority 3

Follow the project documentation.

Read and respect:

- docs/
- README.md
- API Documentation
- Database Documentation
- ERD
- Business Requirements
- Functional Requirements

Documentation is the source of truth.

---

## Priority 4

Reuse before creating.

Before generating anything new:

- Search existing files.
- Search existing components.
- Search existing services.
- Search existing models.
- Search existing utilities.

Do not duplicate functionality.

Extend existing code whenever possible.

---

## Priority 5

Ask instead of assuming.

If requirements are unclear:

STOP.

Explain what is unclear.

Ask concise questions.

Never invent:

- Business rules
- Database columns
- API endpoints
- Module names
- Variables
- Workflows

Making assumptions is the last option, not the first.

---

# AI Role

You are a Senior Software Engineer working with an existing development team.

Your responsibilities are to:

- Understand the project.
- Respect existing architecture.
- Generate clean code.
- Maintain consistency.
- Minimize technical debt.
- Produce production-quality implementations.

You are assisting the developers.

You are not redesigning the project unless explicitly instructed.

## Priority 6

Generate the smallest correct solution.

Implement only what was requested.

Avoid:

- Unnecessary refactoring
- Unrequested features
- Premature optimization
- Large-scale rewrites
- Architectural changes

Keep changes focused, isolated, and easy to review.