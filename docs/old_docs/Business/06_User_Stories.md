# User Stories

| Field | Value |
|--------|-------|
| Document | 06_User_Stories.md |
| Version | 1.0 |
| Status | Draft |
| Last Updated | July 13, 2026 |
| Prepared By | Computer Science OJT Team |
| Client | Philippine Statistics Authority (PSA) Region XII |
| Depends On | 00_Project_Overview.md, 01_Business_Requirements.md, 02_Functional_Requirements.md, 04_User_Roles_RBAC.md, 05_Business_Rules.md |

---

# 1. Purpose

This document defines the user stories for the Office Asset, Equipment Reservation, Borrowing, and Inventory Management System.

Each user story describes a specific goal from the perspective of a system user and serves as a guide for system design, development, testing, and acceptance.

---

# 2. Employee User Stories

## US-EMP-001 — Login

**As an Employee,**

I want to securely log into the system,

**so that**

I can access only the functions that I am authorized to use.

---

## US-EMP-002 — Browse Assets

**As an Employee,**

I want to browse available office assets,

**so that**

I can determine whether the equipment I need is currently available.

---

## US-EMP-003 — Search Assets

**As an Employee,**

I want to search assets using keywords, QR Codes, Barcodes, Property Numbers (ICS), Asset Tags, or Serial Numbers,

**so that**

I can quickly locate a specific asset.

---

## US-EMP-004 — Reserve Equipment

**As an Employee,**

I want to reserve equipment in advance,

**so that**

I am assured that the asset will be available when needed.

---

## US-EMP-005 — Borrow Equipment

**As an Employee,**

I want to borrow approved equipment,

**so that**

I can use it for official office activities.

---

## US-EMP-006 — Return Equipment

**As an Employee,**

I want to return borrowed equipment,

**so that**

my borrowing record is updated accurately.

---

## US-EMP-007 — View Borrowing History

**As an Employee,**

I want to view my borrowing history,

**so that**

I can review my previous transactions.

---

## US-EMP-008 — Receive Notifications

**As an Employee,**

I want to receive reminders for due dates and reservation updates,

**so that**

I do not miss important deadlines.

---

# 3. Property Custodian User Stories

## US-PC-001 — Register Asset

**As a Property Custodian,**

I want to register new office assets,

**so that**

they become available for tracking and accountability.

---

## US-PC-002 — Generate Asset Identifiers

**As a Property Custodian,**

I want to generate QR Codes and Barcodes,

**so that**

assets can be identified quickly during transactions.

---

## US-PC-003 — Update Asset Information

**As a Property Custodian,**

I want to update asset details,

**so that**

asset records remain accurate and up to date.

---

## US-PC-004 — Verify Returns

**As a Property Custodian,**

I want to inspect returned assets,

**so that**

their condition is properly recorded.

---

## US-PC-005 — Transfer Assets

**As a Property Custodian,**

I want to transfer assets between departments,

**so that**

accountability records remain accurate.

---

# 4. Inventory Officer User Stories

## US-INV-001 — Register Inventory

**As an Inventory Officer,**

I want to register consumable inventory,

**so that**

office supplies are properly monitored.

---

## US-INV-002 — Stock In

**As an Inventory Officer,**

I want to record incoming inventory,

**so that**

stock quantities remain accurate.

---

## US-INV-003 — Stock Out

**As an Inventory Officer,**

I want to record inventory releases,

**so that**

stock balances are automatically updated.

---

## US-INV-004 — Monitor Low Stock

**As an Inventory Officer,**

I want to receive low-stock alerts,

**so that**

I can replenish supplies before they run out.

---

# 5. Department Head User Stories

## US-DH-001 — Approve Reservation

**As a Department Head,**

I want to approve equipment reservations,

**so that**

employees under my department can use office assets responsibly.

---

## US-DH-002 — Reject Reservation

**As a Department Head,**

I want to reject reservation requests when necessary,

**so that**

office assets remain available for higher-priority needs.

---

## US-DH-003 — Monitor Department Borrowings

**As a Department Head,**

I want to monitor equipment borrowed by my department,

**so that**

I can ensure accountability.

---

# 6. Administrator User Stories

## US-ADM-001 — Manage Users

**As an Administrator,**

I want to manage user accounts,

**so that**

authorized personnel can access the system.

---

## US-ADM-002 — Manage Roles

**As an Administrator,**

I want to assign system roles,

**so that**

users receive appropriate permissions.

---

## US-ADM-003 — View Reports

**As an Administrator,**

I want to generate reports,

**so that**

management can make informed decisions.

---

## US-ADM-004 — Configure System

**As an Administrator,**

I want to configure system settings,

**so that**

the application adapts to organizational policies.

---

# 7. Auditor User Stories

## US-AUD-001 — Review Audit Logs

**As an Auditor,**

I want to review audit logs,

**so that**

I can verify accountability and compliance.

---

## US-AUD-002 — Review Reports

**As an Auditor,**

I want to access historical reports,

**so that**

I can perform audit activities efficiently.

---

# 8. Mobile User Stories

## US-MOB-001 — Scan Asset

**As a Mobile User,**

I want to scan a QR Code or Barcode,

**so that**

I can immediately retrieve asset information.

---

## US-MOB-002 — Borrow Using Mobile

**As a Mobile User,**

I want to borrow equipment directly from my phone,

**so that**

transactions can be completed quickly.

---

## US-MOB-003 — Return Using Mobile

**As a Mobile User,**

I want to return equipment using my phone,

**so that**

the system updates the transaction immediately.

---

## US-MOB-004 — Receive Mobile Notifications

**As a Mobile User,**

I want to receive push notifications,

**so that**

I stay informed about reservations, due dates, and approvals.

---

# 9. Future User Stories

The system should support future user stories involving:

- RFID scanning
- NFC identification
- Multi-office asset transfers
- Procurement workflows
- Asset depreciation
- Supplier management
- Predictive maintenance
- AI-powered asset recommendations