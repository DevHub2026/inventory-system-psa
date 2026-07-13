# Entity Relationship Design (ERD)

| Field | Value |
|--------|-------|
| Document | 12_Entity_Relationship_Design.md |
| Version | 1.0 |
| Status | Draft |
| Last Updated | July 13, 2026 |
| Prepared By | Computer Science OJT Team |
| Client | Philippine Statistics Authority (PSA) Region XII |
| Depends On | 09_Domain_Model.md, 10_State_Diagrams.md, 11_Database_Architecture.md |

---

# 1. Purpose

This document defines the logical relationships between entities within the Office Asset, Equipment Reservation, Borrowing, and Inventory Management System.

It serves as the basis for the Entity Relationship Diagram (ERD), database implementation, API design, and application architecture.

---

# 2. Relationship Types

The database shall utilize:

- One-to-One (1:1)
- One-to-Many (1:N)
- Many-to-Many (M:N)

---

# 3. Identity Domain Relationships

## Users ↔ Roles

Relationship

Many-to-Many

Reason

A user may have multiple roles.

A role may belong to multiple users.

Bridge Table

user_role

---

## Roles ↔ Permissions

Relationship

Many-to-Many

Bridge Table

role_permission

---

## Departments ↔ Users

Relationship

One-to-Many

One department contains many users.

---

# 4. Asset Domain Relationships

## Category ↔ Asset

One Category

↓

Many Assets

---

## Manufacturer ↔ Asset

One Manufacturer

↓

Many Assets

---

## Location ↔ Asset

One Location

↓

Many Assets

---

## Department ↔ Asset

One Department

↓

Many Assets

---

## Asset ↔ Asset Identifier

Relationship

One-to-Many

One asset can have multiple identifiers.

Examples

- QR Code
- Barcode
- Property Number
- Asset Tag
- Serial Number
- RFID (Future)

---

## Asset ↔ Asset Image

Relationship

One-to-Many

Supports multiple images.

---

# 5. Reservation Relationships

## User ↔ Reservation

One User

↓

Many Reservations

---

## Reservation ↔ Reservation Items

One Reservation

↓

Many Reservation Items

---

## Reservation Item ↔ Asset

Many Reservation Items

↓

One Asset

---

# 6. Borrowing Relationships

## User ↔ Borrowing

One User

↓

Many Borrowings

---

## Borrowing ↔ Borrowing Items

One Borrowing

↓

Many Borrowing Items

---

## Borrowing Item ↔ Asset

Many Borrowing Items

↓

One Asset

---

## Borrowing ↔ Return

Relationship

One-to-One

Every borrowing has one return.

---

# 7. Accountability Relationships

## User ↔ Accountability Record

One User

↓

Many Accountability Records

---

## Asset ↔ Accountability Record

One Asset

↓

Many Accountability Records

History is preserved.

---

# 8. Inventory Relationships

## Inventory Category ↔ Inventory Item

One Category

↓

Many Items

---

## Supplier ↔ Purchase Order

One Supplier

↓

Many Purchase Orders

---

## Purchase Order ↔ Purchase Order Item

One Purchase Order

↓

Many Purchase Order Items

---

## Purchase Order Item ↔ Inventory Item

Many Purchase Order Items

↓

One Inventory Item

---

## Inventory Item ↔ Stock Transaction

One Inventory Item

↓

Many Stock Transactions

---

# 9. Maintenance Relationships

## Asset ↔ Maintenance Request

One Asset

↓

Many Maintenance Requests

---

## Maintenance Request ↔ Maintenance Log

One Request

↓

Many Logs

---

## Asset ↔ Damage Report

One Asset

↓

Many Damage Reports

---

# 10. Notification Relationships

## User ↔ Notification

One User

↓

Many Notifications

---

# 11. Audit Relationships

## User ↔ Audit Log

One User

↓

Many Audit Logs

---

## Audit Log ↔ Entity

One Audit Log

↓

References One Entity

Examples

- Asset
- Reservation
- Borrowing
- Inventory

---

# 12. System Settings Relationships

System Settings

Independent Entity

Used by all modules.

Examples

- Borrowing Days
- Low Stock Threshold
- Password Policy

---

# 13. Cardinality Summary

Users

↓

M:N

Roles

↓

M:N

Permissions

----------------------

Department

↓

1:N

Users

----------------------

Department

↓

1:N

Assets

----------------------

Category

↓

1:N

Assets

----------------------

Manufacturer

↓

1:N

Assets

----------------------

Location

↓

1:N

Assets

----------------------

Asset

↓

1:N

Asset Identifiers

----------------------

Asset

↓

1:N

Reservation Items

----------------------

Reservation

↓

1:N

Reservation Items

----------------------

Borrowing

↓

1:N

Borrowing Items

----------------------

Borrowing

↓

1:1

Return

----------------------

Asset

↓

1:N

Maintenance

----------------------

Inventory Item

↓

1:N

Stock Transactions

----------------------

Supplier

↓

1:N

Purchase Orders

----------------------

Purchase Order

↓

1:N

Purchase Order Items

----------------------

User

↓

1:N

Notifications

----------------------

User

↓

1:N

Audit Logs

---

# 14. Future Relationships

The ERD shall support future relationships for:

- RFID Readers
- NFC Devices
- Procurement Requests
- Asset Depreciation
- Asset Disposal
- Vehicle Management
- Multi-Branch Deployment

---

# 15. Design Principles

The ERD shall follow:

- Third Normal Form (3NF)
- Referential Integrity
- Foreign Key Constraints
- Soft Deletes
- Auditability
- Extensibility
- Scalability