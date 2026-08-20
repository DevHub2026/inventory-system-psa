# Use Case Specification

| Field | Value |
|--------|-------|
| Document | 07_Use_Cases.md |
| Version | 1.0 |
| Status | Draft |
| Last Updated | July 13, 2026 |
| Prepared By | Computer Science OJT Team |
| Client | Philippine Statistics Authority (PSA) Region XII |
| Depends On | 00_Project_Overview.md, 01_Business_Requirements.md, 02_Functional_Requirements.md, 04_User_Roles_RBAC.md, 05_Business_Rules.md, 06_User_Stories.md |

---

# 1. Purpose

This document describes how users interact with the Office Asset, Equipment Reservation, Borrowing, and Inventory Management System to accomplish business tasks.

Each use case defines:

- Actors
- Preconditions
- Main Success Scenario
- Alternative Flows
- Exception Flows
- Postconditions

---

# UC-001 Login

## Primary Actor

User

## Description

Allows an authorized user to securely access the system.

## Preconditions

- User account exists
- User account is active

## Main Flow

1. User opens login page.
2. User enters username/email.
3. User enters password.
4. User clicks Login.
5. System validates credentials.
6. System determines assigned role.
7. User is redirected to dashboard.

## Alternative Flow

- Invalid credentials
- Account disabled
- Password expired

## Postconditions

- Session created
- Audit log recorded

---

# UC-002 Search Asset

## Primary Actor

Employee

## Description

Allows users to locate an asset using multiple identification methods.

## Preconditions

- User logged in

## Main Flow

1. User opens Asset Search.
2. User enters one of:
   - Asset Name
   - QR Code
   - Barcode
   - Property Number (ICS)
   - Asset Tag
   - Serial Number
3. System searches database.
4. Matching assets displayed.
5. User opens asset details.

## Alternative Flow

No matching asset found.

## Postconditions

Asset details displayed.

---

# UC-003 Register Asset

## Primary Actor

Property Custodian

## Preconditions

- User has Asset Management permission

## Main Flow

1. Open Register Asset.
2. Enter asset details.
3. Select category.
4. Select location.
5. Enter Property Number (ICS).
6. Enter Serial Number.
7. Generate Asset ID.
8. Generate QR Code.
9. Generate Barcode.
10. Save asset.

## Alternative Flow

Duplicate Property Number.

Duplicate Serial Number.

Duplicate Asset Tag.

## Postconditions

Asset created successfully.

---

# UC-004 Reserve Equipment

## Primary Actor

Employee

## Preconditions

- User logged in
- Asset available

## Main Flow

1. Search asset.
2. View availability.
3. Select reservation date.
4. Submit reservation.
5. Department Head receives request.
6. Reservation approved.
7. Asset status changes to Reserved.

## Alternative Flow

Reservation rejected.

Reservation conflict detected.

Asset unavailable.

## Postconditions

Reservation recorded.

---

# UC-005 Borrow Equipment

## Primary Actor

Employee

## Supporting Actor

Property Custodian

## Preconditions

- Reservation approved (if required)
- Asset available

## Main Flow

1. Property Custodian scans QR Code or Barcode.
2. System retrieves asset.
3. Verify borrower.
4. Confirm borrowing.
5. Record borrowing date.
6. Record due date.
7. Generate receipt.
8. Asset status changes to Borrowed.

## Alternative Flow

Asset already borrowed.

Asset under maintenance.

Asset retired.

## Postconditions

Borrow transaction completed.

---

# UC-006 Return Equipment

## Primary Actor

Employee

## Supporting Actor

Property Custodian

## Preconditions

- Asset currently borrowed

## Main Flow

1. Scan QR Code or Barcode.
2. Retrieve borrowing record.
3. Inspect condition.
4. Record return.
5. Generate return receipt.
6. Update asset status.

## Alternative Flow

Asset damaged.

Asset lost.

Late return.

## Postconditions

Borrowing completed.

Audit log created.

---

# UC-007 Inventory Stock In

## Primary Actor

Inventory Officer

## Preconditions

Inventory item exists.

## Main Flow

1. Open Inventory.
2. Select item.
3. Enter quantity received.
4. Save transaction.
5. Update stock quantity.

## Alternative Flow

Invalid quantity.

## Postconditions

Inventory updated.

---

# UC-008 Inventory Stock Out

## Primary Actor

Inventory Officer

## Preconditions

Stock available.

## Main Flow

1. Select inventory item.
2. Enter quantity.
3. Save transaction.
4. Reduce stock.

## Alternative Flow

Insufficient stock.

## Postconditions

Inventory updated.

---

# UC-009 Generate Reports

## Primary Actor

Administrator

## Preconditions

Authorized user.

## Main Flow

1. Select report.
2. Choose filters.
3. Generate report.
4. View report.
5. Export PDF / Excel / CSV.

## Alternative Flow

No records found.

## Postconditions

Report generated.

---

# UC-010 Manage Users

## Primary Actor

Administrator

## Main Flow

1. Open User Management.
2. Add/Edit/Delete user.
3. Assign role.
4. Save changes.

## Alternative Flow

Duplicate email.

Duplicate employee ID.

## Postconditions

User updated.

---

# UC-011 Scan Asset

## Primary Actor

Employee

## Description

Quickly retrieve asset information using an identifier.

## Main Flow

1. Open Scanner.
2. Scan:
   - QR Code
   - Barcode
3. System retrieves asset.
4. Display details.

## Alternative Flow

Manual lookup using:

- Property Number
- Asset Tag
- Serial Number

## Postconditions

Asset displayed.

---

# UC-012 View Dashboard

## Primary Actor

All Users

## Main Flow

1. Login.
2. Open Dashboard.
3. System loads dashboard according to user role.
4. Display KPIs.
5. Display recent activity.
6. Display notifications.

## Postconditions

Dashboard displayed.

---

# UC-013 Manage Maintenance

## Primary Actor

Property Custodian

## Main Flow

1. Select asset.
2. Schedule maintenance.
3. Assign technician.
4. Update maintenance status.
5. Close maintenance.

## Alternative Flow

Maintenance cancelled.

## Postconditions

Maintenance history updated.

---

# UC-014 View Audit Logs

## Primary Actor

Auditor

## Main Flow

1. Open Audit Logs.
2. Apply filters.
3. View activity.
4. Export report.

## Postconditions

Audit history displayed.

---

# UC-015 Mobile Borrowing

## Primary Actor

Employee

## Main Flow

1. Open Mobile App.
2. Scan QR Code or Barcode.
3. View asset.
4. Borrow.
5. Confirmation displayed.

## Postconditions

Borrow transaction completed.

---

# Future Use Cases

The system shall support future use cases including:

- RFID Asset Identification
- NFC Asset Identification
- Multi-Office Transfers
- Procurement Requests
- Purchase Orders
- Asset Depreciation
- Asset Disposal
- Supplier Portal
- AI Maintenance Prediction