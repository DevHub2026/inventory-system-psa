# API Architecture

| Field | Value |
|--------|-------|
| Document | 13_API_Architecture.md |
| Version | 1.0 |
| Status | Draft |
| Last Updated | July 13, 2026 |
| Prepared By | Computer Science OJT Team |
| Client | Philippine Statistics Authority (PSA) Region XII |
| Depends On | 11_Database_Architecture.md, 12_Entity_Relationship_Design.md |

---

# 1. Purpose

This document defines the API architecture for the Office Asset, Equipment Reservation, Borrowing, and Inventory Management System.

The API serves as the communication layer between:

- Web Application
- Mobile Application
- Future Third-Party Systems

The API follows RESTful principles and returns JSON responses.

---

# 2. API Standards

The API shall:

- Follow REST conventions.
- Use HTTPS.
- Return JSON.
- Support API Versioning.
- Require authentication where applicable.
- Validate all requests.
- Return standardized error messages.
- Record audit logs for critical actions.

---

# 3. API Versioning

Current Version

/api/v1

Future

/api/v2

---

# 4. Authentication

Authentication

Laravel Sanctum

Authorization

Role-Based Access Control (RBAC)

Session

Personal Access Tokens

---

# 5. Standard API Response

Successful Response

{
    success,
    message,
    data
}

Error Response

{
    success,
    message,
    errors
}

Pagination

{
    data,
    meta,
    links
}

---

# 6. Authentication Endpoints

POST

/login

/logout

/forgot-password

/reset-password

/me

/change-password

---

# 7. User Endpoints

GET

/users

/users/{id}

POST

/users

/users/import

PUT

/users/{id}

DELETE

/users/{id}

---

# 8. Role Endpoints

GET

/roles

POST

/roles

PUT

/roles/{id}

DELETE

/roles/{id}

---

# 9. Permission Endpoints

GET

/permissions

GET

/roles/{id}/permissions

PUT

/roles/{id}/permissions

---

# 10. Asset Endpoints

GET

/assets

/assets/{id}

POST

/assets

PUT

/assets/{id}

DELETE

/assets/{id}

Search

/assets/search

Identifiers

/assets/{id}/identifiers

/assets/scan

Scanner clients send the decoded identifier value to `/assets/scan?value={identifier}`.
The backend resolves the value through `asset_identifiers.identifier_value` and returns the matching asset resource.
Scanning identifies an asset only; privileged actions still require authenticated API calls and backend authorization.

Scanner clients may also send the decoded value to `POST /assets/scan` to complete an already authorized borrowing transaction or return an active borrowing. This endpoint accepts permanent asset QR identifiers and supported receipt references such as `PSA-RES-{reservation}` and `PSA-BOR-{borrowing}`. The backend remains authoritative for transaction state changes.

Transfer

/assets/{id}/transfer

Archive

/assets/{id}/archive

---

# 11. Reservation Endpoints

GET

/reservations

POST

/reservations

PUT

/reservations/{id}

DELETE

/reservations/{id}

Approve

/reservations/{id}/approve

Scan Authorize

/reservations/scan-authorize

Authorized staff may scan a pending borrow request receipt (`PSA-RES-{reservation}`) or a permanent asset QR linked to a pending request to authorize the request. Duplicate authorization attempts are rejected.

Reject

/reservations/{id}/reject

---

# 12. Borrowing Endpoints

GET

/borrowings

POST

/borrowings

PUT

/borrowings/{id}

Return

/borrowings/{id}/return

Scan Borrow / Return

/assets/scan

Receipt

/borrowings/{id}/receipt

---

# 13. Inventory Endpoints

GET

/inventory

POST

/inventory

PUT

/inventory/{id}

Stock In

/inventory/{id}/stock-in

Stock Out

/inventory/{id}/stock-out

Adjustment

/inventory/{id}/adjust

History

/inventory/{id}/history

Inventory list responses return paginated payloads:

{
    items,
    meta,
    links
}

Inventory item status is derived from quantity and `reorder_level`:

- quantity <= 0: OUT_OF_STOCK
- quantity <= reorder_level: LOW_STOCK
- otherwise: IN_STOCK

---

# 14. Maintenance Endpoints

GET

/maintenance

POST

/maintenance

PUT

/maintenance/{id}

Complete

/maintenance/{id}/complete

---

# 15. Report Endpoints

GET

/reports/assets

/reports/borrowings

/reports/inventory

/reports/maintenance

/reports/audit

Export

/reports/export/pdf

/reports/export/excel

/reports/export/csv

---

# 16. Dashboard Endpoints

GET

/dashboard

/dashboard/statistics

/dashboard/recent

/dashboard/charts

---

# 17. Notification Endpoints

GET

/notifications

PUT

/notifications/{id}/read

DELETE

/notifications/{id}

---

# 18. Audit Endpoints

GET

/audit-logs

/audit-logs/{id}

---

# 19. Search Endpoints

Search by

QR Code

Barcode

Property Number (ICS)

Serial Number

Asset Tag

Asset Name

Employee

Department

---

# 20. Filtering

Support filtering by:

Status

Category

Department

Location

Availability

Condition

Lifecycle

Date

---

# 21. Sorting

Support sorting by:

Newest

Oldest

Asset Name

Property Number

Borrow Date

Return Date

Category

---

# 22. Pagination

Support:

Page Number

Page Size

Total Records

Last Page

---

# 23. Future APIs

The architecture shall support future APIs for:

- RFID
- NFC
- Procurement
- Purchase Orders
- Asset Depreciation
- Multi-Branch
- ERP Integration
- Accounting Integration
