# State Diagrams

| Field | Value |
|--------|-------|
| Document | 10_State_Diagrams.md |
| Version | 1.0 |
| Status | Draft |
| Last Updated | July 13, 2026 |
| Prepared By | Computer Science OJT Team |
| Client | Philippine Statistics Authority (PSA) Region XII |
| Depends On | 05_Business_Rules.md, 08_System_Workflows.md, 09_Domain_Model.md |

---

# 1. Purpose

This document defines the lifecycle (state transitions) of major business entities in the Office Asset, Equipment Reservation, Borrowing, and Inventory Management System.

State diagrams describe how entities change from one state to another during normal business operations.

---

# 2. Asset Lifecycle

```

Available

↓

Reserved

↓

Borrowed

↓

Returned

↓

Inspection

↓

Available

```

Alternative States

```

Available

↓

Reserved

↓

Cancelled

↓

Available

```

```

Borrowed

↓

Overdue

↓

Returned

↓

Inspection

↓

Available

```

```

Returned

↓

Damaged

↓

Under Maintenance

↓

Inspection

↓

Available

```

```

Borrowed

↓

Lost

↓

Investigation

↓

Disposed / Recovered

```

```

Available

↓

Retired

↓

Disposed

```

---

# Asset States

| State | Description |
|---------|------------|
| Available | Ready for borrowing |
| Reserved | Reserved by a user |
| Borrowed | Currently checked out |
| Returned | Returned to office |
| Inspection | Awaiting condition verification |
| Under Maintenance | Under repair |
| Lost | Reported missing |
| Retired | No longer in service |
| Disposed | Permanently removed |

---

# 3. Reservation Lifecycle

```

Draft

↓

Submitted

↓

Pending Approval

↓

Approved

↓

Reserved

↓

Borrowed

```

Alternative

```

Submitted

↓

Rejected

```

```

Submitted

↓

Cancelled

```

```

Approved

↓

Expired

```

---

Reservation States

- Draft
- Submitted
- Pending Approval
- Approved
- Reserved
- Cancelled
- Rejected
- Expired
- Completed

---

# 4. Borrowing Lifecycle

```

Pending

↓

Borrowed

↓

Due

↓

Returned

↓

Completed

```

Alternative

```

Borrowed

↓

Overdue

↓

Returned

↓

Completed

```

```

Borrowed

↓

Lost

↓

Investigation

```

```

Borrowed

↓

Damaged

↓

Maintenance

↓

Completed

```

---

Borrowing States

- Pending
- Borrowed
- Due
- Overdue
- Returned
- Completed
- Lost
- Damaged

---

# 5. Return Lifecycle

```

Returned

↓

Inspection

↓

Good

↓

Completed

```

Alternative

```

Inspection

↓

Damaged

↓

Maintenance

↓

Completed

```

```

Inspection

↓

Lost Components

↓

Investigation

```

---

Return States

- Returned
- Inspection
- Good
- Damaged
- Lost Components
- Completed

---

# 6. Maintenance Lifecycle

```

Scheduled

↓

Assigned

↓

In Progress

↓

Completed

↓

Inspection

↓

Available

```

Alternative

```

In Progress

↓

Cancelled

```

```

In Progress

↓

Replacement Needed

```

---

Maintenance States

- Scheduled
- Assigned
- In Progress
- Completed
- Inspection
- Cancelled
- Replacement Needed

---

# 7. Inventory Transaction Lifecycle

Stock In

```

Pending

↓

Approved

↓

Completed

```

Stock Out

```

Requested

↓

Approved

↓

Released

↓

Completed

```

Inventory Adjustment

```

Requested

↓

Verified

↓

Adjusted

↓

Completed

```

---

# 8. User Account Lifecycle

```

Registered

↓

Active

↓

Inactive

↓

Archived

```

Alternative

```

Registered

↓

Suspended

↓

Active

```

```

Active

↓

Password Reset

↓

Active

```

---

# 9. Notification Lifecycle

```

Created

↓

Queued

↓

Delivered

↓

Read

↓

Archived

```

Alternative

```

Queued

↓

Failed

↓

Retry

↓

Delivered

```

---

# 10. Damage Report Lifecycle

```

Reported

↓

Verified

↓

Maintenance

↓

Resolved

```

Alternative

```

Reported

↓

Replacement Required

```

---

# 11. Property Accountability Lifecycle

```

Assigned

↓

Active

↓

Transferred

↓

Active

```

Alternative

```

Assigned

↓

Returned

↓

Closed

```

---

# 12. Audit Log Lifecycle

```

Business Event

↓

Audit Record Created

↓

Stored

↓

Archived

```

Audit logs shall never be modified.

---

# 13. Future State Support

Future versions shall support state transitions for:

- RFID Assets
- Procurement
- Purchase Orders
- Asset Disposal
- Asset Depreciation
- Multi-Office Transfers
- Vehicle Management

---

# 14. General State Transition Rules

The system shall:

- Prevent invalid state transitions.
- Record every state transition in the audit log.
- Record timestamps for every transition.
- Record the responsible user.
- Prevent skipping mandatory workflow states.
- Validate business rules before changing state.
- Trigger notifications where applicable.

Examples:

- Available → Borrowed ❌ (without borrowing process)
- Under Maintenance → Borrowed ❌
- Disposed → Available ❌
- Lost → Reserved ❌