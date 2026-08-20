# Domain Model

| Field | Value |
|--------|-------|
| Document | 09_Domain_Model.md |
| Version | 1.0 |
| Status | Draft |
| Last Updated | July 13, 2026 |
| Prepared By | Computer Science OJT Team |
| Client | Philippine Statistics Authority (PSA) Region XII |
| Depends On | 01_Business_Requirements.md, 02_Functional_Requirements.md, 05_Business_Rules.md, 08_System_Workflows.md |

---

# 1. Purpose

This document defines the core business entities of the Office Asset, Equipment Reservation, Borrowing, and Inventory Management System.

The Domain Model represents the real-world concepts managed by the system and forms the foundation for the database design, API specification, and software architecture.

---

# 2. Domain Overview

The system consists of several interconnected domains.

```

Office Management

│

├── User Domain

├── Asset Domain

├── Reservation Domain

├── Borrowing Domain

├── Inventory Domain

├── Maintenance Domain

├── Reporting Domain

├── Notification Domain

└── Administration Domain

```

---

# 3. User Domain

Represents every person authorized to access the system.

Responsibilities

- Authenticate
- Borrow assets
- Reserve assets
- Receive notifications
- View history

Relationships

- Has one or more Roles
- Creates Reservations
- Creates Borrowings
- Receives Notifications

---

# 4. Role Domain

Defines permissions and access control.

Responsibilities

- Manage permissions
- Restrict access
- Control modules

Relationships

- Assigned to Users
- Contains Permissions

---

# 5. Permission Domain

Represents individual system capabilities.

Examples

- asset.create
- asset.update
- asset.delete
- reservation.approve
- report.generate

---

# 6. Asset Domain

Represents all non-consumable office assets.

Examples

- Laptop
- Desktop
- Projector
- Speaker
- Monitor
- Router
- Printer

Responsibilities

- Asset lifecycle
- Identification
- Accountability
- Reservation
- Borrowing
- Maintenance

Relationships

- Belongs to Category
- Located at Location
- Assigned to Department
- Has Maintenance Records
- Has Borrowing History
- Has Reservation History
- Has Asset Identifiers

---

# 7. Asset Identifier Domain

Represents all supported asset identification methods.

Supported identifiers

- Asset ID
- Property Number (ICS)
- QR Code
- Barcode
- Asset Tag
- Serial Number

Future

- RFID
- NFC

Responsibilities

- Unique identification
- Fast retrieval
- Scanning support

---

# 8. Reservation Domain

Represents reservation requests.

Responsibilities

- Schedule reservation
- Approval workflow
- Conflict detection

Relationships

- Created by User
- References Asset
- May become Borrowing

---

# 9. Borrowing Domain

Represents actual borrowing transactions.

Responsibilities

- Check Out
- Due Date
- Return Tracking
- Receipt Generation

Relationships

- References Reservation
- References Asset
- References User
- Generates Return Record

---

# 10. Return Domain

Represents completed returns.

Responsibilities

- Record return
- Inspection
- Damage assessment

Relationships

- References Borrowing
- Updates Asset Status
- Creates Damage Report (if necessary)

---

# 11. Property Accountability Domain

Represents permanent assignment of assets.

Examples

Desktop PC assigned to Employee

Laptop assigned to Staff

Responsibilities

- Ownership tracking
- Accountability transfer
- Assignment history

Relationships

- References Asset
- References Employee

---

# 12. Inventory Domain

Represents consumable office supplies.

Examples

- Bond Paper
- Ink
- Toner
- Batteries
- Envelopes

Responsibilities

- Stock In
- Stock Out
- Inventory Adjustment
- Low Stock

---

# 13. Supplier Domain

Represents inventory suppliers.

Responsibilities

- Supply inventory
- Purchase history

Relationships

- Supplies Inventory Items

---

# 14. Maintenance Domain

Represents repair and preventive maintenance.

Responsibilities

- Maintenance scheduling
- Technician assignment
- Cost tracking

Relationships

- References Asset

---

# 15. Damage Report Domain

Represents damaged assets.

Responsibilities

- Record damage
- Track repair
- Upload evidence

Relationships

- References Asset
- References Return

---

# 16. Notification Domain

Represents user notifications.

Examples

Reservation Approved

Low Stock

Borrow Due

Maintenance

Responsibilities

- Notify users
- Track read status

---

# 17. Audit Domain

Represents immutable activity history.

Responsibilities

- Record transactions
- Compliance
- Accountability

Relationships

References

- User
- Module
- Entity

---

# 18. Report Domain

Represents generated reports.

Examples

Inventory Report

Borrow Report

Reservation Report

Audit Report

Responsibilities

- Data aggregation
- Export

---

# 19. Department Domain

Represents office departments.

Responsibilities

- Organize assets
- Organize users

Relationships

Contains

- Users
- Assets

---

# 20. Location Domain

Represents physical asset locations.

Examples

Storage Room

Conference Room

ICT Office

Responsibilities

- Track asset location

---

# 21. Branch Domain (Future)

Supports multiple PSA offices.

Relationships

Contains

Departments

Assets

Users

---

# 22. Domain Relationships

```

User

│

├── creates → Reservation

├── creates → Borrowing

├── receives → Notification

└── belongs to → Department

Reservation

↓

Borrowing

↓

Return

↓

Inspection

↓

Asset Available

Asset

├── belongs to → Category

├── located at → Location

├── assigned to → Department

├── has → Identifiers

├── has → Maintenance

├── has → Borrow History

└── has → Reservation History

```

---

# 23. Future Domains

The architecture shall support future domains.

- Procurement
- Purchase Orders
- Asset Disposal
- Asset Depreciation
- RFID
- NFC
- Vehicle Management
- Calibration
- GIS Mapping
