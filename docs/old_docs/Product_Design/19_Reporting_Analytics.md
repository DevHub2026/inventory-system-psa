# Reporting & Analytics

| Field | Value |
|--------|-------|
| Document | 19_Reporting_Analytics.md |
| Version | 1.0 |
| Status | Draft |
| Last Updated | July 13, 2026 |
| Prepared By | Computer Science OJT Team |
| Client | Philippine Statistics Authority (PSA) Region XII |
| Depends On | 02_Functional_Requirements.md, 05_Business_Rules.md, 08_System_Workflows.md, 14_System_Architecture.md |

---

# 1. Purpose

This document defines the reporting and analytics capabilities of the Office Asset, Equipment Reservation, Borrowing, and Inventory Management System.

The reporting module provides operational reports, inventory summaries, audit reports, and analytical insights to support decision-making, accountability, and compliance.

---

# 2. Objectives

The reporting system shall:

- Provide accurate reports.
- Support operational decision-making.
- Improve accountability.
- Reduce manual report preparation.
- Support government reporting requirements.
- Export reports in multiple formats.

---

# 3. Report Categories

The system shall provide reports for:

- Assets
- Reservations
- Borrowings
- Returns
- Inventory
- Maintenance
- Accountability
- Audit Logs
- Users
- Dashboard Analytics

---

# 4. Asset Reports

The system shall generate:

- Asset Inventory Report
- Asset Availability Report
- Asset Condition Report
- Asset Location Report
- Asset Category Report
- Asset Utilization Report
- Asset Assignment Report
- Asset Transfer History
- Retired Assets Report
- Disposed Assets Report

---

# 5. Reservation Reports

The system shall generate:

- Reservation Summary
- Reservation History
- Approved Reservations
- Rejected Reservations
- Cancelled Reservations
- Reservation Utilization
- Reservation Conflicts

---

# 6. Borrowing Reports

The system shall generate:

- Borrowing Summary
- Borrowing History
- Active Borrowings
- Completed Borrowings
- Overdue Borrowings
- Borrowing Frequency
- Most Borrowed Assets
- Borrowing by Department
- Borrowing by Employee

---

# 7. Return Reports

The system shall generate:

- Returned Assets
- Damaged Returns
- Lost Assets
- Late Returns
- Return Inspection Summary

---

# 8. Inventory Reports

The system shall generate:

- Inventory Summary
- Stock Levels
- Stock In History
- Stock Out History
- Stock Adjustment History
- Low Stock Report
- Out of Stock Report
- Inventory Valuation (Future)

---

# 9. Maintenance Reports

The system shall generate:

- Maintenance Schedule
- Maintenance History
- Maintenance Cost Summary
- Assets Under Maintenance
- Frequent Repairs
- Maintenance Completion Report

---

# 10. Accountability Reports

The system shall generate:

- Employee Asset Accountability
- Department Asset Accountability
- Accountability Transfer History
- Unassigned Assets

---

# 11. User Reports

The system shall generate:

- User List
- Active Users
- Inactive Users
- User Activity Summary
- Login History

---

# 12. Audit Reports

The system shall generate:

- Audit Trail
- User Activity Logs
- Permission Changes
- System Configuration Changes
- Failed Login Attempts

---

# 13. Dashboard Analytics

The dashboard shall display:

## Asset Metrics

- Total Assets
- Available Assets
- Borrowed Assets
- Reserved Assets
- Assets Under Maintenance
- Lost Assets
- Retired Assets

---

## Reservation Metrics

- Pending Reservations
- Approved Reservations
- Rejected Reservations
- Reservation Utilization Rate

---

## Borrowing Metrics

- Active Borrowings
- Overdue Borrowings
- Monthly Borrowings
- Borrowing Trends

---

## Inventory Metrics

- Total Inventory Items
- Low Stock Items
- Out of Stock Items
- Recent Stock Movements

---

## Maintenance Metrics

- Assets Under Maintenance
- Completed Maintenance
- Pending Maintenance

---

# 14. Report Filters

Reports shall support filtering by:

- Date Range
- Department
- User
- Asset Category
- Asset Status
- Asset Condition
- Asset Location
- Reservation Status
- Borrowing Status
- Maintenance Status

---

# 15. Search

Reports shall support searching by:

- Asset Name
- Asset ID
- Property Number (ICS)
- Asset Tag
- QR Code
- Barcode
- Serial Number
- Employee Name
- Department

---

# 16. Sorting

Reports shall support sorting by:

- Asset Name
- Date
- Category
- Department
- Borrow Count
- Reservation Count
- Return Date
- Maintenance Date

---

# 17. Export Formats

The system shall support exporting reports to:

- PDF
- Excel (.xlsx)
- CSV

Future:

- Word (.docx)

---

# 18. Printing

Reports shall support:

- Print Preview
- Direct Printing
- Page Orientation
- Page Size Selection

---

# 19. Scheduled Reports (Future)

The system architecture shall support:

- Daily Reports
- Weekly Reports
- Monthly Reports
- Quarterly Reports
- Annual Reports

Delivery Methods

- Email
- Download
- Dashboard

---

# 20. Access Control

Reports shall be accessible only to authorized users.

Examples

Employee

- Own Borrowing History
- Own Reservation History

Department Head

- Department Reports

Property Custodian

- Asset Reports

Inventory Officer

- Inventory Reports

Administrator

- All Reports

Auditor

- Audit Reports
- Read-Only Access

---

# 21. Report Performance

The system shall:

- Generate reports efficiently.
- Support pagination for large datasets.
- Allow filtering before report generation.
- Minimize database load during report generation.

---

# 22. Data Accuracy

Reports shall always reflect the latest committed transaction data.

Report calculations shall follow approved business rules.

---

# 23. Future Analytics

Future versions shall support:

- Asset Utilization Dashboard
- Predictive Maintenance
- Inventory Forecasting
- Department Performance Metrics
- Asset Life Cycle Analysis
- Procurement Analytics
- AI-Based Insights

---

# 24. Acceptance Criteria

The reporting module shall be considered complete when:

- Reports display accurate information.
- Authorized users can generate reports.
- Reports can be filtered and exported.
- Dashboard metrics reflect current data.
- Reporting performance meets system requirements.