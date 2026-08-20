# Testing & Quality Assurance

| Field | Value |
|--------|-------|
| Document | 21_Testing_Quality_Assurance.md |
| Version | 1.0 |
| Status | Draft |
| Last Updated | July 13, 2026 |
| Prepared By | Computer Science OJT Team |
| Client | Philippine Statistics Authority (PSA) Region XII |
| Depends On | 02_Functional_Requirements.md, 04_User_Roles_RBAC.md, 14_System_Architecture.md, 20_Development_Roadmap.md |

---

# 1. Purpose

This document defines the testing strategy and quality assurance process for the Office Asset, Equipment Reservation, Borrowing, and Inventory Management System.

The objective is to ensure that all modules function correctly, meet business requirements, and provide a secure and reliable user experience before deployment.

---

# 2. Testing Objectives

The testing process shall:

- Verify all functional requirements.
- Validate business rules.
- Ensure data integrity.
- Verify security controls.
- Detect and resolve defects.
- Confirm system stability.
- Ensure user acceptance.

---

# 3. Testing Scope

The following areas shall be tested:

- Authentication
- User Management
- Role-Based Access Control (RBAC)
- Asset Management
- Asset Identification
- Reservation
- Borrowing
- Returns
- Inventory
- Maintenance
- Notifications
- Reports
- Dashboard
- Mobile Application
- API
- Database

---

# 4. Testing Levels

## Unit Testing

Purpose

Test individual methods, services, and classes.

Examples

- Borrowing Service
- Reservation Service
- Asset Availability Engine
- Inventory Service

---

## Integration Testing

Purpose

Verify interaction between modules.

Examples

- Reservation → Borrowing
- Borrowing → Return
- Return → Maintenance
- Inventory → Reports

---

## System Testing

Purpose

Verify complete workflows.

Examples

- Register Asset
- Borrow Asset
- Return Asset
- Generate Report

---

## User Acceptance Testing (UAT)

Purpose

Validate the system with actual PSA users.

Participants

- Property Custodian
- Inventory Officer
- Employees
- Department Heads

---

# 5. Functional Testing

The following functions shall be tested:

- Login
- Logout
- Password Reset
- Register Asset
- Edit Asset
- Search Asset
- QR Code Scan
- Barcode Scan
- Reserve Asset
- Approve Reservation
- Reject Reservation
- Borrow Asset
- Return Asset
- Stock In
- Stock Out
- Maintenance
- Notifications
- Reports

---

# 6. Non-Functional Testing

The following quality attributes shall be verified:

- Performance
- Reliability
- Security
- Scalability
- Responsiveness
- Usability
- Accessibility

---

# 7. Security Testing

Verify:

- Authentication
- Authorization
- RBAC
- Input Validation
- Session Management
- Password Security
- SQL Injection Protection
- XSS Protection
- CSRF Protection

---

# 8. Performance Testing

Measure:

- Dashboard loading time
- Asset search performance
- QR scanning response
- Barcode scanning response
- Report generation
- Database queries
- API response time

---

# 9. Compatibility Testing

Supported Platforms

Desktop

- Google Chrome
- Microsoft Edge
- Mozilla Firefox

Mobile

- Android

Future

- iOS

---

# 10. Mobile Testing

Verify:

- Login
- Scanner
- Borrowing
- Returns
- Notifications
- Responsive Layout
- Offline Handling (Future)

---

# 11. API Testing

Verify:

- Authentication
- Authorization
- Validation
- CRUD Operations
- Error Responses
- Pagination
- Filtering
- Sorting

---

# 12. Database Testing

Verify:

- Relationships
- Constraints
- Foreign Keys
- Unique Keys
- Data Consistency
- Soft Deletes
- Audit Records

---

# 13. Test Environment

Development

Local Development Environment

Testing

Dedicated Testing Environment

Production

Live Environment

---

# 14. Bug Severity Levels

Critical

- System crash
- Data corruption
- Security vulnerability

High

- Major feature unavailable
- Incorrect business logic

Medium

- UI issue
- Validation issue
- Incorrect message

Low

- Typographical error
- Minor layout issue

---

# 15. Test Case Documentation

Each test case shall include:

- Test Case ID
- Module
- Requirement Reference
- Preconditions
- Test Steps
- Expected Result
- Actual Result
- Status
- Tester
- Test Date

---

# 16. Requirement Traceability

Every test case shall reference:

- Business Requirement ID
- Functional Requirement ID
- Business Rule ID
- User Story ID
- Use Case ID

This ensures complete traceability from requirements to testing.

---

# 17. Acceptance Criteria

A module shall be accepted when:

- All critical test cases pass.
- No Critical defects remain.
- No High severity defects remain.
- Business requirements are satisfied.
- Functional requirements are implemented.
- User Acceptance Testing is approved.

---

# 18. Regression Testing

Regression testing shall be performed after:

- Bug fixes
- New features
- Major updates
- Database changes

---

# 19. Test Deliverables

The testing phase shall produce:

- Test Plan
- Test Cases
- Test Execution Report
- Bug Report
- UAT Report
- Final QA Report

---

# 20. Future Testing

Future versions shall include:

- Automated Testing
- Load Testing
- Stress Testing
- Penetration Testing
- Accessibility Testing
- Continuous Integration Testing