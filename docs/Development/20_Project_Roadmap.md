You are a Senior Software Engineer performing a professional code review on an existing production project.

IMPORTANT:
- DO NOT modify any files.
- DO NOT generate code.
- DO NOT refactor anything yet.
- ONLY inspect and analyze the entire repository.

Your goal is to identify everything that should be improved before adding new features.

Analyze the entire project and produce a structured report with the following sections.

# 1. Project Health Score

Rate from 1-10:

- Architecture
- Code Quality
- Readability
- Maintainability
- Scalability
- Performance
- Security
- Folder Structure
- API Design
- Database Design
- Documentation
- Error Handling
- Validation
- Testing

Explain every score.

---

# 2. Folder Structure Review

Inspect the entire project.

Identify:

- Unused folders
- Misplaced files
- Duplicate files
- Missing folders
- Better folder organization
- Dead code
- Legacy code

---

# 3. Code Smells

Find:

- Long functions
- Large classes
- Duplicate logic
- Magic numbers
- Hardcoded values
- Repeated code
- Poor naming
- Inconsistent naming
- Deep nesting
- Unused imports
- Unused variables
- Unreachable code

Rank them by severity.

---

# 4. Architecture Review

Evaluate:

- Separation of concerns
- Modularity
- Layering
- Dependency management
- Routing structure
- State management
- API organization

Suggest architectural improvements.

---

# 5. Database Review

Inspect the MongoDB design.

Identify:

- Collections
- Relationships
- Embedded documents
- References
- Missing indexes
- Redundant fields
- Validation issues
- Possible schema improvements

Suggest improvements.

---

# 6. API Review

Review every endpoint.

Check for:

- REST conventions
- Naming consistency
- Status codes
- Validation
- Error responses
- Authentication
- Authorization

---

# 7. Security Review

Look for:

- Hardcoded secrets
- Missing authentication
- Missing authorization
- JWT issues
- Input validation
- NoSQL injection risks
- CORS problems
- File upload vulnerabilities
- Sensitive logging
- Environment variable misuse

Rank issues by severity.

---

# 8. Performance Review

Find:

- Expensive queries
- Missing indexes
- Large payloads
- Repeated database queries
- N+1 query problems
- Blocking operations
- Slow loops
- Inefficient algorithms

Suggest optimizations.

---

# 9. Flutter Review

Inspect the Flutter application.

Check:

- Folder structure
- Widget organization
- State management
- Reusable widgets
- Theme consistency
- Navigation
- API integration
- Error handling

---

# 10. UI / UX Review

Identify:

- Inconsistent design
- Poor spacing
- Accessibility issues
- Poor responsiveness
- Confusing navigation
- Missing loading indicators
- Missing empty states
- Missing error states

---

# 11. Documentation Review

Determine whether the project lacks:

- README
- Installation guide
- API documentation
- Environment setup
- Folder explanations
- Code comments

---

# 12. Technical Debt

List all technical debt.

Classify each as:

Critical

High

Medium

Low

---

# 13. Missing Features

Based on the existing system, identify features that are commonly expected but missing.

Examples:

- Audit Logs
- Activity History
- Soft Delete
- Search
- Filtering
- Pagination
- Backup
- Restore
- Notifications
- Role Management
- Export
- Import
- Settings
- Dashboard analytics

Explain why each would be useful.

---

# 14. Cleanup Checklist

Create a prioritized checklist.

Example:

Critical
- ...

High
- ...

Medium
- ...

Low
- ...

---

# 15. Refactoring Roadmap

Create a step-by-step improvement roadmap.

Phase 1 - Critical Fixes

Phase 2 - Code Cleanup

Phase 3 - Architecture Improvements

Phase 4 - Performance

Phase 5 - New Features

---

# 16. Final Verdict

Summarize:

- Biggest strengths
- Biggest weaknesses
- Highest priority improvements
- Files that should never be modified without caution
- Files that should be refactored first
- Overall maintainability score

Do NOT modify any files.
Only generate a review report.