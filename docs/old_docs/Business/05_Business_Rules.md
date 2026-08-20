# Business Rules Specification

| Field | Value |
|--------|-------|
| Document | 05_Business_Rules.md |
| Version | 1.0 |
| Status | Draft |
| Last Updated | July 13, 2026 |
| Prepared By | Computer Science OJT Team |
| Client | Philippine Statistics Authority (PSA) Region XII |
| Depends On | 00_Project_Overview.md, 01_Business_Requirements.md, 02_Functional_Requirements.md, 04_User_Roles_RBAC.md |

---

# 1. Purpose

This document defines the business rules governing the Office Asset, Equipment Reservation, Borrowing, and Inventory Management System.

Business rules ensure that office policies, accountability procedures, and operational standards are consistently enforced by the system.

---

# 2. General Business Rules

### BR-001

Every user must authenticate before accessing the system.

---

### BR-002

Every user shall be assigned at least one role.

---

### BR-003

System permissions shall be determined by the assigned role(s).

---

### BR-004

Every asset shall have a unique Asset ID.

---

### BR-005

Every borrowable asset shall have at least one identification method.

Supported identification methods include:

- QR Code
- Barcode
- Property Number (ICS)
- Asset Tag
- Serial Number

---

### BR-006

Property Numbers (ICS) must be unique.

---

### BR-007

Asset Tags must be unique.

---

### BR-008

QR Codes must uniquely identify one asset.

---

### BR-009

Barcodes must uniquely identify one asset.

---

### BR-010

Serial Numbers shall be unique whenever provided by the manufacturer.

---

# 3. Asset Management Rules

### BR-011

An archived asset cannot be borrowed.

---

### BR-012

A disposed asset cannot be modified.

---

### BR-013

Assets under maintenance shall not be available for reservation or borrowing.

---

### BR-014

Assets marked as Lost shall be unavailable.

---

### BR-015

Every asset status change shall be recorded.

---

### BR-016

Asset transfers shall record:

- Previous department
- New department
- Transfer date
- Authorized personnel

---

# 4. Reservation Rules

### BR-017

Only available assets may be reserved.

---

### BR-018

Reservation conflicts are not allowed.

---

### BR-019

Reservations require approval when applicable.

---

### BR-020

Cancelled reservations release the asset immediately.

---

### BR-021

Expired reservations automatically become available.

---

### BR-022

Employees cannot reserve retired assets.

---

# 5. Borrowing Rules

### BR-023

Only approved reservations may proceed to borrowing.

(If reservation is required.)

---

### BR-024

Borrowing requires an authenticated user.

---

### BR-025

Borrowing records must include:

- Borrower
- Asset
- Borrow Date
- Due Date
- Status

---

### BR-026

A borrowed asset cannot be borrowed by another user.

---

### BR-027

Borrowing shall generate a transaction receipt.

---

### BR-028

Borrowing shall update asset status automatically.

Available

↓

Borrowed

---

# 6. Return Rules

### BR-029

Returned assets must undergo condition verification.

---

### BR-030

Returned assets may be marked:

- Good
- Damaged
- Lost

---

### BR-031

Damaged assets shall automatically be referred for maintenance inspection.

---

### BR-032

Returned assets shall automatically update transaction history.

---

### BR-033

Returning an asset updates its availability status after inspection.

---

# 7. Inventory Rules

### BR-034

Inventory quantity shall never become negative.

---

### BR-035

Stock Out cannot exceed available quantity.

---

### BR-036

Every stock movement shall be recorded.

---

### BR-037

Low stock alerts shall be generated when minimum quantity is reached.

---

### BR-038

Inventory adjustments require authorized personnel.

---

# 8. Maintenance Rules

### BR-039

Assets under maintenance cannot be borrowed.

---

### BR-040

Maintenance history shall never be deleted.

---

### BR-041

Maintenance records shall include:

- Technician
- Date
- Cost
- Description
- Status

---

# 9. User Management Rules

### BR-042

Inactive users cannot log in.

---

### BR-043

Deleted users shall not remove historical transactions.

---

### BR-044

Password resets require authorized personnel or user verification.

---

# 10. Audit Rules

### BR-045

Every critical transaction shall generate an audit log.

---

### BR-046

Audit logs shall not be editable.

---

### BR-047

Audit logs shall not be deleted by ordinary users.

---

### BR-048

Audit logs shall include:

- User
- Date
- Time
- Action
- Module
- Device
- IP Address (when applicable)

---

# 11. Reporting Rules

### BR-049

Reports shall display only data authorized for the requesting user.

---

### BR-050

Generated reports shall reflect current system data.

---

# 12. Notification Rules

### BR-051

Users shall receive notifications for:

- Reservation Approval
- Reservation Rejection
- Borrowing Due
- Overdue Assets
- Low Stock
- Maintenance Schedule

---

# 13. Data Integrity Rules

### BR-052

Duplicate Asset IDs are prohibited.

---

### BR-053

Duplicate Property Numbers are prohibited.

---

### BR-054

Duplicate QR Codes are prohibited.

---

### BR-055

Duplicate Barcodes are prohibited.

---

### BR-056

Relationships between records must maintain referential integrity.

---

# 14. Future Business Rules

The system shall be designed to accommodate future rules involving:

- RFID Identification
- NFC Identification
- Multi-Office Asset Transfers
- Asset Depreciation
- Asset Disposal Workflow
- Procurement Workflow
- Multi-Level Approvals