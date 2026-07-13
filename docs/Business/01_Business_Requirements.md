# Business Requirements Document (BRD)

| Field | Value |
|--------|-------|
| Document | 01_Business_Requirements.md |
| Version | 1.0 |
| Status | Draft |
| Last Updated | July 13, 2026 |
| Prepared By | Computer Science OJT Team |
| Client | Philippine Statistics Authority (PSA) Region XII |
| Depends On | 00_Project_Overview.md |

---

# 1. Purpose

The purpose of this document is to define the business requirements for the Office Asset, Equipment Reservation, Borrowing, and Inventory Management System.

This document identifies the current operational challenges, business needs, stakeholders, and objectives that the proposed system must satisfy before technical design and software development begin.

---

# 2. Business Background

The Philippine Statistics Authority (PSA) Region XII manages various office assets and consumable inventory required for daily operations.

Currently, many asset borrowing transactions and inventory records are maintained manually using paper forms and logbooks. This process makes it difficult to accurately monitor equipment availability, identify current borrowers, generate reports, and maintain accountability.

The proposed system aims to digitize these business processes through a centralized and secure information system.

---

# 3. Business Goals

The organization aims to achieve the following goals:

- Improve accountability of office assets.
- Digitize borrowing and return transactions.
- Eliminate paper-based asset logs.
- Improve inventory visibility.
- Simplify reservation of shared equipment.
- Improve report generation.
- Reduce lost or unreturned equipment.
- Maintain complete transaction history.
- Improve operational efficiency.

---

# 4. Current Business Process

Current asset management is primarily manual.

Typical workflow:

1. Employee requests an item.
2. Staff manually records the transaction.
3. Item is released.
4. Return is manually recorded.
5. Reports are manually prepared.

Problems encountered include:

- Missing records
- Incomplete borrower information
- Lost paper forms
- Difficult report generation
- No real-time asset availability

---

# 5. Business Problems

The current process presents several operational challenges.

## Asset Tracking

- Borrowed assets are difficult to monitor.
- Current borrower is sometimes unknown.
- Equipment may be returned without proper documentation.

## Reservation

- No centralized reservation process.
- Reservation conflicts may occur.
- Equipment availability is difficult to verify.

## Inventory

- Consumable inventory is updated manually.
- Stock levels are not visible in real time.
- Reordering decisions rely on manual checking.

## Reporting

- Reports require manual preparation.
- Historical transactions are difficult to retrieve.
- Asset utilization cannot be easily analyzed.

---

# 6. Business Requirements

The business requires a system capable of:

## Asset Management

- Register office assets.
- Track asset location.
- Track asset condition.
- Track accountable person.
- Record asset history.
- Maintain asset status.

---

## Equipment Reservation

- Reserve equipment in advance.
- Prevent reservation conflicts.
- Approve reservation requests.
- Cancel reservations.
- Extend reservations.

---

## Borrowing Management

- Borrow equipment.
- Return equipment.
- Record borrowing dates.
- Record return dates.
- Track overdue items.
- Generate borrowing receipts.

---

## Inventory Management

- Register consumable items.
- Record stock-in.
- Record stock-out.
- Monitor stock levels.
- Alert low inventory.

---

## QR Code Tracking

- Generate QR Codes.
- Scan QR Codes.
- Retrieve asset information instantly.
- Speed up borrowing and returning.

---

## Reporting

Generate reports for:

- Asset Inventory
- Borrowing History
- Reservation History
- Inventory Status
- Low Stock
- Overdue Assets
- Asset Utilization

---

# 7. Stakeholders

## Primary Stakeholders

- PSA Management
- Property Custodian
- Inventory Officer
- Administrative Staff
- Employees

## Secondary Stakeholders

- Auditors
- IT Personnel
- OJT Developers

---

# 8. Business Constraints

The project should consider the following constraints.

- Government office procedures.
- Limited project budget.
- Existing asset numbering standards (ICS / Property Numbers).
- Existing office workflows.
- Limited implementation timeframe.
- Available office hardware.

---

# 9. Assumptions

The following assumptions are made.

- Every asset will have a unique identifier.
- Every authorized employee has a system account.
- Office internet connectivity is available.
- Existing paper records can be encoded into the new system.
- Users will receive training before deployment.

---

# 10. Expected Business Benefits

Implementation of the system is expected to provide:

- Improved accountability.
- Faster transaction processing.
- Better inventory control.
- Accurate asset tracking.
- Reduced paperwork.
- Faster report generation.
- Better decision making.
- Improved transparency.
- Higher operational efficiency.

---

# 11. Success Indicators

The project will be considered successful if:

- Borrowing transactions are fully digitized.
- Manual paper logs are significantly reduced.
- Asset information is available in real time.
- Reports can be generated instantly.
- Users can easily locate assets.
- Management can monitor office resources efficiently.
