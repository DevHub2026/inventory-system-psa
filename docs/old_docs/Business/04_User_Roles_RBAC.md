# Role-Based Access Control (RBAC)

| Field | Value |
|--------|-------|
| Document | 04_User_Roles_RBAC.md |
| Version | 1.0 |
| Status | Draft |
| Last Updated | July 13, 2026 |
| Prepared By | Computer Science OJT Team |
| Client | Philippine Statistics Authority (PSA) Region XII |
| Depends On | 00_Project_Overview.md, 01_Business_Requirements.md, 02_Functional_Requirements.md |

---

# 1. Purpose

This document defines the Role-Based Access Control (RBAC) model for the Office Asset, Equipment Reservation, Borrowing, and Inventory Management System.

RBAC ensures that users can only access modules and perform actions based on their assigned responsibilities.

---

# 2. Design Principles

The RBAC implementation follows these principles:

- Least Privilege Principle
- Separation of Duties
- Role-Based Authorization
- Centralized Permission Management
- Auditability
- Future Scalability

---

# 3. User Roles

## 3.1 Super Administrator

### Description

Has unrestricted access to the entire system.

Usually assigned to the IT Administrator responsible for maintaining the system.

### Responsibilities

- Manage entire system
- Configure system settings
- Manage users
- Manage roles
- Manage permissions
- Backup and restore database
- Access all reports
- View audit logs

---

## 3.2 System Administrator

### Description

Responsible for daily administration of the application.

### Responsibilities

- Manage users
- Manage departments
- Manage categories
- Manage locations
- Generate reports
- Manage notifications

---

## 3.3 Property Custodian

### Description

Responsible for all accountable office assets.

### Responsibilities

- Register assets
- Update assets
- Generate QR Codes
- Generate Barcodes
- Assign assets
- Transfer assets
- Record maintenance
- Verify returned equipment

---

## 3.4 Inventory Officer

### Description

Responsible for consumable inventory.

### Responsibilities

- Register inventory items
- Stock In
- Stock Out
- Inventory Adjustment
- Low Stock Monitoring
- Supplier Records

---

## 3.5 Department Head

### Description

Responsible for approving reservations made by employees under their department.

### Responsibilities

- Approve reservations
- Reject reservations
- View department reports
- View department assets

---

## 3.6 Employee

### Description

Standard system user.

### Responsibilities

- Login
- Reserve equipment
- Borrow equipment
- Return equipment
- View own transactions
- Update profile

---

## 3.7 Auditor

### Description

Read-only access for auditing purposes.

### Responsibilities

- View reports
- View audit logs
- View transaction history
- View inventory history

Cannot modify any system data.

---

# 4. Permission Categories

Permissions are grouped into the following categories:

- User Management
- Asset Management
- Property Accountability
- Inventory Management
- Reservation
- Borrowing
- Returns
- Maintenance
- Reports
- Notifications
- Audit Logs
- System Configuration

---

# 5. Permission Matrix

| Permission | Super Admin | Admin | Property Custodian | Inventory Officer | Department Head | Employee | Auditor |
|------------|:-----------:|:-----:|:------------------:|:-----------------:|:---------------:|:--------:|:-------:|
| Login | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage Users | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage Roles | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Register Assets | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Edit Assets | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Archive Assets | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Inventory | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Reserve Equipment | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Approve Reservation | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Borrow Equipment | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Return Equipment | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Generate Reports | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| View Audit Logs | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Manage System Settings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

# 6. Dashboard Access

## Super Administrator

Dashboard includes:

- Total Assets
- Inventory Summary
- Active Borrowings
- Reservations
- Reports
- User Statistics
- Audit Logs
- System Health

---

## Administrator

Dashboard includes:

- Assets
- Inventory
- Reservations
- Reports
- Notifications

---

## Property Custodian

Dashboard includes:

- Assets
- Borrowings
- Returns
- Maintenance
- QR Generation

---

## Inventory Officer

Dashboard includes:

- Inventory
- Stock Levels
- Low Stock Alerts
- Suppliers

---

## Department Head

Dashboard includes:

- Pending Approvals
- Department Borrowings
- Reservation Requests

---

## Employee

Dashboard includes:

- My Borrowings
- My Reservations
- Notifications
- QR Scanner

---

## Auditor

Dashboard includes:

- Reports
- Audit Logs
- Transaction History

---

# 7. Approval Authority

| Process | Approver |
|----------|----------|
| Reservation | Department Head |
| Asset Registration | Property Custodian |
| Asset Transfer | Property Custodian |
| Maintenance Completion | Property Custodian |
| User Creation | Administrator |
| Role Assignment | Super Administrator |

---

# 8. Permission Rules

The system shall:

- Deny unauthorized access.
- Hide unauthorized modules.
- Hide unauthorized buttons and actions.
- Validate permissions on both frontend and backend.
- Record permission violations in audit logs.
- Require re-authentication for sensitive actions.

---

# 9. Future Roles

The RBAC design should allow future addition of:

- Regional Administrator
- Branch Manager
- Technician
- Procurement Officer
- Supplier Portal User
- Guest User
- External Auditor

---

# 10. Role Assignment Rules

- Every user must have at least one role.
- A user may have multiple roles if authorized.
- Permissions are inherited from assigned roles.
- Super Administrator has unrestricted access.
- Auditors have read-only access.
- Employees can only access their own transactions unless granted additional permissions.

---

# 11. Security Considerations

The RBAC implementation shall:

- Prevent privilege escalation.
- Validate permissions for every request.
- Log all permission changes.
- Log failed authorization attempts.
- Support future integration with Single Sign-On (SSO).