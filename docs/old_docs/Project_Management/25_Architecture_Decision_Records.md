# AI Development Guidelines

| Field | Value |
|--------|-------|
| Document | 25_AI_Development_Guidelines.md |
| Version | 1.0 |
| Status | Draft |
| Last Updated | July 13, 2026 |
| Prepared By | Computer Science OJT Team |
| Client | Philippine Statistics Authority (PSA) Region XII |
| Depends On | All Project Documentation |

---

# 1. Purpose

This document defines the rules, standards, and expectations for AI-assisted software development within the Office Asset, Equipment Reservation, Borrowing, and Inventory Management System.

These guidelines apply to all AI tools used during development, including:

- Kilo Code
- ChatGPT
- Claude
- Ollama
- Future AI coding assistants

The goal is to ensure AI-generated code remains consistent with the project's architecture, business rules, coding standards, and development practices.

---

# 2. AI Development Principles

AI shall assist developers but shall not replace developer responsibility.

All AI-generated code must:

- Follow project architecture.
- Follow coding standards.
- Respect business rules.
- Be reviewed by a developer.
- Pass testing before integration.

---

# 3. Required Documentation Review

Before generating code, the AI shall review the following documents when relevant:

- 00_Project_Overview.md
- 01_Business_Requirements.md
- 02_Functional_Requirements.md
- 03_Non_Functional_Requirements.md
- 04_User_Roles_RBAC.md
- 05_Business_Rules.md
- 06_User_Stories.md
- 07_Use_Cases.md
- 08_System_Workflows.md
- 09_Domain_Model.md
- 10_State_Diagrams.md
- 11_Database_Architecture.md
- 12_Entity_Relationship_Design.md
- 13_API_Architecture.md
- 14_System_Architecture.md
- 15_Security_Architecture.md
- 24_Coding_Standards.md

---

# 4. Architecture Rules

AI shall:

- Follow Modular Architecture.
- Keep modules independent.
- Respect Separation of Concerns.
- Avoid tight coupling.
- Follow Service Layer architecture.

---

# 5. Business Rules

AI shall never:

- Ignore documented business rules.
- Circumvent approval workflows.
- Bypass asset availability checks.
- Allow invalid state transitions.
- Generate functionality that conflicts with documented workflows.

---

# 6. Database Rules

AI shall not:

- Modify the database schema without updating documentation.
- Remove foreign key constraints.
- Remove unique constraints.
- Introduce duplicate data structures.

Database changes must be reflected in:

- Database Architecture
- ERD
- API Documentation
- Related Models

---

# 7. API Rules

AI shall:

- Follow REST principles.
- Use API versioning.
- Return standardized JSON responses.
- Validate requests.
- Respect RBAC permissions.

---

# 8. Laravel Development Standards

AI shall use:

- Controllers
- Form Requests
- Policies
- Services
- API Resources
- Events
- Listeners
- Queued Jobs (when appropriate)

Avoid placing business logic inside controllers.

---

# 9. Frontend Standards

AI shall:

- Reuse components.
- Follow the Design System.
- Maintain responsive layouts.
- Avoid duplicate UI components.

---

# 10. Mobile Standards

AI shall:

- Reuse backend APIs.
- Maintain feature parity with the web application where appropriate.
- Follow Flutter best practices.

---

# 11. Code Generation Rules

Before generating new code, AI shall:

- Search for existing implementations.
- Reuse existing services.
- Reuse existing components.
- Avoid duplicate functionality.

---

# 12. Documentation Updates

When AI introduces changes affecting architecture or functionality, it shall recommend updates to the relevant documentation.

Examples:

- New database table
- New API endpoint
- New workflow
- New business rule

---

# 13. Testing Expectations

AI-generated code should include or support:

- Unit Tests
- Feature Tests
- Validation Tests
- API Tests

---

# 14. Security Requirements

AI shall:

- Validate user input.
- Enforce authorization.
- Prevent SQL Injection.
- Prevent XSS.
- Prevent CSRF where applicable.
- Avoid exposing sensitive information.

---

# 15. Prohibited Actions

AI shall never:

- Remove authentication.
- Disable authorization.
- Hardcode credentials.
- Expose secrets.
- Delete audit logs.
- Skip validation.
- Bypass documented workflows.
- Generate undocumented breaking changes.

---

# 16. Code Review Checklist

Before recommending code, AI should verify:

- Business requirements are satisfied.
- Coding standards are followed.
- Naming conventions are correct.
- Business rules are enforced.
- Existing components are reused.
- Documentation remains accurate.

---

# 17. AI Collaboration Workflow

Recommended workflow:

1. Read project documentation.
2. Understand the requested feature.
3. Identify affected modules.
4. Generate an implementation plan.
5. Generate code.
6. Suggest tests.
7. Recommend documentation updates if needed.

---

# 18. AI Roles

Suggested use of AI tools:

## Kilo Code

- Feature implementation
- Refactoring
- Code navigation
- Project-wide changes

## ChatGPT

- Architecture
- Design reviews
- Documentation
- Debugging
- Code explanations

## Claude

- Long-form planning
- Technical writing
- Large document analysis

## Ollama

- Local code generation
- Offline development
- Privacy-sensitive tasks

---

# 19. Future Enhancements

Future AI capabilities may include:

- Automated code reviews
- Documentation generation
- Test generation
- Performance optimization
- Security analysis
- Refactoring suggestions

---

# 20. Acceptance Criteria

AI-assisted development shall be considered successful when:

- Generated code complies with project architecture.
- Business rules are respected.
- Coding standards are followed.
- Documentation remains synchronized.
- Human developers review and approve all changes before merging.