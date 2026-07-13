# System Workflows

| Field | Value |
|--------|-------|
| Document | 08_System_Workflows.md |
| Version | 1.0 |
| Status | Draft |
| Last Updated | July 13, 2026 |
| Prepared By | Computer Science OJT Team |
| Client | Philippine Statistics Authority (PSA) Region XII |
| Depends On | 01_Business_Requirements.md, 02_Functional_Requirements.md, 05_Business_Rules.md, 07_Use_Cases.md |

---

# 1. Purpose

This document defines the end-to-end business workflows of the Office Asset, Equipment Reservation, Borrowing, and Inventory Management System.

Each workflow describes how users, departments, and the system interact to complete business processes while ensuring accountability, security, and data consistency.

---

# 2. Asset Registration Workflow

Property Custodian

↓

Login

↓

Open Asset Management

↓

Register Asset

↓

Enter Asset Information

↓

Generate Asset  

↓

Generate QR Code

↓

Generate Barcode

↓

Assign Property Number (ICS)

↓

Assign Location

↓

Save Asset

↓

Asset Available

---

# 3. Equipment Reservation Workflow

Employee

↓

Login

↓

Search Asset

↓

Check Availability

↓

Submit Reservation

↓

Department Head Review

↓

Approved?

├── Yes

│ ↓

│ Reserved

│

└── No

↓

Reservation Rejected

↓

Employee Notified

---

# 4. Borrowing Workflow

Employee

↓

Reservation Approved (if required)

↓

Property Custodian

↓

Scan Asset

(QR / Barcode / Asset Tag / Property Number)

↓

Verify Asset

↓

Verify Borrower

↓

Record Borrowing

↓

Generate Receipt

↓

Update Asset Status

↓

Borrowed

---

# 5. Return Workflow

Employee

↓

Return Asset

↓

Property Custodian

↓

Scan Asset

↓

Retrieve Borrowing Record

↓

Inspect Asset

↓

Condition Good?

├── Yes

│ ↓

│ Available

│

└── No

↓

Damage Report

↓

Maintenance Queue

↓

Under Maintenance

↓

Available

---

# 6. Inventory Stock-In Workflow

Inventory Officer

↓

Login

↓

Select Inventory Item

↓

Enter Quantity

↓

Record Supplier

↓

Save

↓

Update Stock

↓

Generate Inventory Log

---

# 7. Inventory Stock-Out Workflow

Inventory Officer

↓

Select Item

↓

Enter Quantity

↓

Validate Stock

↓

Update Quantity

↓

Generate Transaction

↓

Check Low Stock

↓

Notification (if applicable)

---

# 8. Maintenance Workflow

Property Custodian

↓

Select Asset

↓

Create Maintenance Request

↓

Assign Technician

↓

Maintenance In Progress

↓

Maintenance Completed

↓

Inspection

↓

Available

---

# 9. Asset Transfer Workflow

Property Custodian

↓

Select Asset

↓

Choose New Department

↓

Update Accountable Person

↓

Confirm Transfer

↓

Generate Transfer Record

↓

Audit Log

↓

Asset Updated

---

# 10. Property Accountability Workflow

Assign Asset

↓

Assign Employee

↓

Generate Accountability Record

↓

Employee Acknowledges

↓

Employee Responsible

↓

Transfer Responsibility (if needed)

↓

New Accountability Record

---

# 11. Report Generation Workflow

Authorized User

↓

Select Report

↓

Choose Filters

↓

Generate Report

↓

Preview

↓

Export

├── PDF

├── Excel

└── CSV

---

# 12. User Management Workflow

Administrator

↓

Create User

↓

Assign Department

↓

Assign Role

↓

Generate Credentials

↓

Activate Account

↓

User Login

---

# 13. Authentication Workflow

User

↓

Enter Credentials

↓

Validate Credentials

↓

Account Active?

├── No

│

└── Access Denied

↓

Yes

↓

Determine Role

↓

Load Dashboard

↓

Create Session

↓

Audit Log

---

# 14. QR / Barcode Workflow

User

↓

Open Scanner

↓

Scan

├── QR Code

├── Barcode

↓

Retrieve Asset

↓

Display Asset Information

↓

Perform Action

├── View

├── Reserve

├── Borrow

├── Return

└── Maintenance

---

# 15. Notification Workflow

Business Event

↓

Notification Created

↓

Determine Recipient

↓

Determine Notification Type

├── In-App

├── Email (Future)

├── SMS (Future)

└── Push Notification (Future)

↓

Deliver Notification

↓

Mark as Read

---

# 16. Audit Logging Workflow

Business Event

↓

Validate Transaction

↓

Create Audit Record

↓

Store

↓

Available for Reports

---

# 17. Exception Workflows

## Asset Already Borrowed

Scan Asset

↓

Status = Borrowed

↓

Display Warning

↓

Stop Transaction

---

## Reservation Conflict

Reservation Request

↓

Check Calendar

↓

Conflict Found

↓

Reject Reservation

↓

Suggest Alternative Schedule

---

## Asset Damaged

Return Asset

↓

Inspection

↓

Damaged

↓

Create Damage Report

↓

Maintenance Queue

↓

Asset Unavailable

---

## Lost Asset

Asset Missing

↓

Create Lost Asset Report

↓

Update Status

↓

Notify Administrator

↓

Audit Log

---

## Low Stock

Stock Out

↓

Below Minimum?

↓

Yes

↓

Low Stock Notification

↓

Inventory Officer

---

# 18. Future Workflows

The system should support future workflows for:

- RFID Asset Identification
- NFC Asset Identification
- Multi-Branch Asset Transfers
- Procurement Requests
- Purchase Orders
- Asset Disposal
- Asset Depreciation
- Supplier Management
- Asset Calibration
- Vehicle Management