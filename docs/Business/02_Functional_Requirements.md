# Functional Requirements Specification (FRS)

| Field | Value |
|--------|-------|
| Document | 02_Functional_Requirements.md |
| Version | 1.0 |
| Status | Draft |
| Last Updated | July 13, 2026 |
| Prepared By | Computer Science OJT Team |
| Client | Philippine Statistics Authority (PSA) Region XII |
| Depends On | 00_Project_Overview.md, 01_Business_Requirements.md |

---

# 1. Purpose

This document defines the functional requirements of the Office Asset, Equipment Reservation, Borrowing, and Inventory Management System.

It describes the features and services that the system must provide to meet the operational requirements of the Philippine Statistics Authority (PSA) Region XII.

---

# 2. Functional Modules

The system shall consist of the following major modules:

- Authentication
- User Management
- Asset Management
- Inventory Management
- Equipment Reservation
- Borrowing Management
- Return Management
- QR Code Management
- Reports
- Notifications
- Audit Logs
- System Administration

---

# 3. Authentication Module

### Description

Allows authorized users to securely access the system.

### Functional Requirements

- User login
- User logout
- Password reset
- Change password
- Session management
- Remember login (optional)
- Role verification
- Backend role enforcement for protected API modules
- Account activation/deactivation

---

# 4. User Management Module

### Description

Manage user accounts and access permissions.

### Functional Requirements

- Create users
- Edit user information
- Disable user accounts
- Assign user roles
- Reset passwords
- View user profiles
- Search users
- Filter users
- View account status
- Bulk import employee accounts from CSV, JSON, or XLSX files
- Generate employee login usernames from last name and PSA ID number
- Assign imported employees the configured temporary initial password
- Report imported, skipped, and failed rows during employee import

---

# 5. Role-Based Access Control (RBAC)

### Description

Restrict system functionality according to user roles.

### Functional Requirements

- Assign roles
- Assign permissions
- Edit permissions
- Restrict module access
- Restrict page access
- Restrict actions
- View permission matrix

---

# 6. Asset Management Module

### Description

Manage all non-consumable office assets.

### Functional Requirements

- Register asset
- Edit asset information
- Archive asset
- Transfer asset
- Update asset status
- Assign accountable employee
- Assign office location
- Upload asset image
- Generate QR Code
- Print QR Code
- View asset history
- View maintenance history
- Search assets
- Filter assets

---

# 7. Inventory Management Module

### Description

Manage consumable office supplies.

### Functional Requirements

- Register inventory item
- Edit inventory item
- Stock-in
- Stock-out
- Stock adjustment with required reason
- View stock balance
- Low stock monitoring
- View stock movement history
- Search inventory
- Filter inventory
- Paginate inventory results
- Prevent duplicate item codes
- Display clear inventory statuses: In Stock, Low Stock, Out of Stock

---

# 8. Equipment Reservation Module

### Description

Allow employees to reserve office equipment.

### Functional Requirements

- Create reservation
- View reservation
- Edit reservation
- Cancel reservation
- Approve reservation
- Reject reservation
- Check equipment availability
- Prevent reservation conflicts
- Extend reservation
- View reservation calendar

---

# 9. Borrowing Module

### Description

Manage borrowing transactions.

### Functional Requirements

- Borrow equipment
- Verify borrower
- Scan QR Code
- Generate borrowing receipt
- Record borrowing date
- Record due date
- Update borrowing status
- View borrowing history
- Search borrowing records

---

# 10. Return Module

### Description

Manage returned equipment.

### Functional Requirements

- Scan QR Code
- Return equipment
- Record return date
- Record condition
- Upload damage photo
- Generate return receipt
- Calculate overdue
- Forward damaged items for inspection

---

# 11. Maintenance Module

### Description

Manage equipment maintenance.

### Functional Requirements

- Schedule maintenance
- Record maintenance
- Assign technician
- Record maintenance cost
- View maintenance history
- Update maintenance status

---

# 12. Asset Identification & Tracking

### Description

Provide multiple methods of identifying and tracking office assets throughout their lifecycle.

The system shall support various identification technologies to improve flexibility and future scalability.

### Functional Requirements

The system shall:

- Generate QR Codes for assets.
- Generate Barcodes for assets.
- Generate permanent PSA-owned asset QR identifiers separate from manufacturer identifiers.
- Render PSA asset QR labels dynamically from stored identifier values.
- Support manual serial number lookup.
- Support Property Number (ICS) lookup.
- Support Asset Tag lookup.
- Scan QR Codes using supported devices.
- Scan PSA asset QR codes using the device camera where browser support is available.
- Scan Barcodes using supported scanners.
- Search assets by serial number.
- Search assets by property number.
- Search assets by asset tag.
- Retrieve complete asset information instantly.
- Resolve scanned identifiers through the backend AssetIdentifier records.
- Validate asset identity before transactions.
- Print identification labels.
- Reprint damaged labels.
- Record identification history.

### Supported Identification Methods

Version 1

- QR Code
- Barcode (Code 128 / Code 39)
- Property Number (ICS)
- Serial Number
- Asset Tag

Future Versions

- RFID
- NFC
- OCR
- Bluetooth Beacons 

---

# 13. Reports Module

### Description

Generate operational and management reports.

### Functional Requirements

Generate reports for:

- Assets
- Borrowing
- Reservations
- Inventory
- Maintenance
- User Activity
- Audit Logs
- Overdue Items
- Low Stock

Support export to:

- PDF
- Excel
- CSV

---

# 14. Notification Module

### Description

Notify users of important events.

### Functional Requirements

Notify users when:

- Reservation approved
- Reservation rejected
- Borrowing due
- Item overdue
- Low stock
- Maintenance scheduled
- Asset returned
- Password changed

---

# 15. Dashboard Module

### Description

Provide an overview of system activities.

### Functional Requirements

Display:

- Total assets
- Available assets
- Borrowed assets
- Reserved assets
- Low stock items
- Pending approvals
- Recent transactions
- Monthly statistics
- Notifications

---

# 16. Search and Filtering

### Functional Requirements

Search by:

- Asset Name
- Property Number
- ICS Number
- QR Code
- Serial Number
- Category
- Employee
- Department

Filter by:

- Status
- Category
- Location
- Condition
- Branch
- Date Acquired

---

# 17. Audit Logs

### Description

Record important system activities.

### Functional Requirements

Record:

- Login
- Logout
- Borrow
- Return
- Reservation
- Asset Updates
- Inventory Updates
- User Management
- Role Changes

View:

- User
- Timestamp
- Action
- Module
- IP Address

---

# 18. System Administration

### Functional Requirements

- Manage categories
- Manage departments
- Manage locations
- Manage suppliers
- Manage offices
- Manage manufacturers
- Maintain common setup/reference data without code changes
- Provide admin shortcuts for users, roles, permissions, and QR labels
- Restrict system setup tools to administrator roles
- Manage system settings
- Manage notifications
- Backup database (manual)
- Restore database (authorized users)

---

# 19. Mobile Application Functions

The mobile application shall support:

- Login
- Dashboard
- QR Code Scanner
- Borrow Equipment
- Return Equipment
- My Reservations
- My Borrowings
- Notifications
- Profile

---

# 20. General Functional Requirements

The system shall:

- Prevent duplicate asset registration.
- Prevent duplicate property numbers.
- Prevent duplicate QR Codes.
- Validate required fields.
- Record timestamps automatically.
- Maintain transaction history.
- Support responsive web design.
- Support mobile devices.
- Display meaningful error messages.
- Maintain data consistency.

---

# 21. Future Functional Enhancements

The system should be designed to support future implementation of:

- RFID
- NFC
- Mobile Push Notifications
- Multi-Branch Support
- Barcode Scanners
- Asset Depreciation
- ERP Integration
- AI Analytics
- Predictive Maintenance
