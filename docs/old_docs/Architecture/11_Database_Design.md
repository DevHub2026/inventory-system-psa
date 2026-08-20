# Database Architecture

| Field | Value |
|--------|-------|
| Document | 11_Database_Architecture.md |
| Version | 1.0 |
| Status | Draft |
| Last Updated | July 13, 2026 |
| Prepared By | Computer Science OJT Team |
| Client | Philippine Statistics Authority (PSA) Region XII |
| Depends On | 09_Domain_Model.md, 10_State_Diagrams.md |

---

# 1. Purpose

This document defines the logical database architecture for the Office Asset, Equipment Reservation, Borrowing, and Inventory Management System.

The objective is to provide a scalable, normalized, secure, and maintainable relational database capable of supporting office operations, future expansion, and government accountability requirements.

---

# 2. Database Design Principles

The database shall follow:

- Third Normal Form (3NF)
- Referential Integrity
- Soft Deletes where appropriate
- Auditability
- Scalability
- Extensibility
- Data Consistency
- Minimal Data Duplication

---

# 3. Database Naming Standards

## Tables

Plural

Examples

users

assets

reservations

borrowings

inventory_items

---

## Primary Keys

id

---

## Foreign Keys

user_id

asset_id

department_id

reservation_id

---

## Pivot Tables

role_user

permission_role

asset_category

---

## Timestamps

created_at

updated_at

deleted_at

---

# 4. Core Domains

Identity

Asset

Reservation

Borrowing

Inventory

Maintenance

Administration

Reporting

---

# 5. Identity Domain

## users

Purpose

Stores all system users.

Columns

- id
- employee_number
- first_name
- middle_name
- last_name
- email
- password
- department_id
- status
- created_at
- updated_at

Indexes

- email
- employee_number

---

## roles

Purpose

Stores user roles.

Columns

- id
- name
- description

---

## permissions

Purpose

Stores permissions.

Columns

- id
- name
- module
- description

---

## role_permission

Purpose

Many-to-many relationship.

---

## user_role

Purpose

Assign roles to users.

---

# 6. Asset Domain

## assets

Purpose

Stores all non-consumable assets.

Columns

- id
- asset_number
- asset_tag
- property_number
- serial_number
- asset_name
- category_id
- manufacturer_id
- model
- location_id
- department_id

Availability Status

Condition Status

Lifecycle Status

Accountability Status

purchase_date

purchase_cost

warranty_until

remarks

created_at

updated_at

deleted_at

Indexes

- asset_number
- property_number
- serial_number
- asset_tag

Unique

- asset_number
- property_number
- asset_tag

---

## asset_identifiers

Purpose

Stores every supported identification method.

Columns

- id
- asset_id
- type

QR

Barcode

RFID

NFC

ICS

Serial

Asset Tag

value

status

Future Proof

Instead of adding more columns later,
simply insert another identifier.

---

## asset_categories

Purpose

Asset categories.

---

## manufacturers

Purpose

Stores manufacturers.

---

## locations

Purpose

Physical locations.

---

## departments

Purpose

Office departments.

---

# 7. Reservation Domain

## reservations

Purpose

Stores reservation requests.

---

## reservation_items

Purpose

Allows one reservation to contain multiple assets.

---

# 8. Borrowing Domain

## borrowings

Purpose

Borrow transaction.

---

## borrowing_items

Purpose

Multiple borrowed assets.

---

## returns

Purpose

Stores returns.

---

# 9. Accountability Domain

## accountability_records

Purpose

Permanent assignment.

Examples

Desktop PC

Office Chair

Printer

---

# 10. Inventory Domain

inventory_items

inventory_categories

stock_transactions

suppliers

purchase_orders

purchase_order_items

---

# 11. Maintenance Domain

maintenance_requests

maintenance_logs

damage_reports

---

# 12. Administration Domain

notifications

audit_logs

activity_logs

system_settings

sessions

api_tokens

---

# 13. Reporting Domain

Generated dynamically.

No report tables unless caching is needed.

---

# 14. Relationships

User

↓

Reservations

↓

Borrowings

↓

Returns

Asset

↓

Reservation Items

↓

Borrowing Items

↓

Maintenance

↓

Damage Reports

Department

↓

Users

↓

Assets

Location

↓

Assets

Supplier

↓

Inventory

---

# 15. Constraints

- Foreign Key Constraints
- Unique Constraints
- Check Constraints
- Cascade Rules
- Soft Deletes

---

# 16. Index Strategy

Index

- Property Number
- Asset Number
- Serial Number
- QR Value
- Barcode Value
- Reservation Status
- Borrow Status
- Inventory Item

---

# 17. Audit Strategy

Every important table shall include

created_by

updated_by

deleted_by

timestamps

---

# 18. Soft Delete Strategy

Soft Delete

Users

Assets

Inventory

Reservations

Hard Delete

Notifications

Sessions

Temporary Files

---

# 19. Future Expansion

Prepared for

- RFID
- NFC
- Procurement
- Multi-Branch
- Asset Depreciation
- Asset Disposal
- GIS