# Notification Architecture

| Field | Value |
|--------|-------|
| Document | 18_Notification_Architecture.md |
| Version | 1.0 |
| Status | Draft |
| Last Updated | July 13, 2026 |
| Prepared By | Computer Science OJT Team |
| Client | Philippine Statistics Authority (PSA) Region XII |
| Depends On | 02_Functional_Requirements.md, 05_Business_Rules.md, 07_Use_Cases.md, 14_System_Architecture.md |

---

# 1. Purpose

This document defines the notification architecture for the Office Asset, Equipment Reservation, Borrowing, and Inventory Management System.

The notification system informs users about important business events, reminders, approvals, system activities, and operational alerts.

---

# 2. Objectives

The notification system shall:

- Inform users of important events.
- Reduce missed deadlines.
- Improve communication.
- Increase accountability.
- Support future notification channels.
- Allow notification preferences.

---

# 3. Notification Channels

## Version 1

- In-App Notifications

## Future Versions

- Email
- SMS
- Push Notifications
- Microsoft Teams
- Google Chat

---

# 4. Notification Categories

## Reservation

Examples

- Reservation Submitted
- Reservation Approved
- Reservation Rejected
- Reservation Cancelled
- Reservation Expired

---

## Borrowing

Examples

- Borrowing Confirmed
- Borrowing Due Soon
- Borrowing Overdue
- Borrowing Extended

---

## Returns

Examples

- Return Completed
- Return Verified
- Damage Report Filed

---

## Inventory

Examples

- Low Stock
- Out of Stock
- Stock Adjustment
- New Inventory Received

---

## Maintenance

Examples

- Maintenance Scheduled
- Maintenance In Progress
- Maintenance Completed
- Asset Available Again

---

## Asset Management

Examples

- Asset Registered
- Asset Updated
- Asset Archived
- Asset Transferred

---

## User Management

Examples

- Welcome
- Password Changed
- Password Reset
- Account Activated
- Account Disabled

---

## System

Examples

- Scheduled Maintenance
- Backup Completed
- System Update
- New Feature Announcement

---

# 5. Notification Priorities

## Low

General information.

Examples

- Welcome message
- Profile updated

---

## Medium

Business information.

Examples

- Reservation approved
- Reservation rejected

---

## High

Requires user attention.

Examples

- Borrow due tomorrow
- Maintenance scheduled
- Pending approval

---

## Critical

Immediate action required.

Examples

- Asset overdue
- Low stock
- Security alert

---

# 6. Notification Lifecycle

Created

↓

Queued

↓

Delivered

↓

Viewed

↓

Archived

Alternative

Queued

↓

Failed

↓

Retry

↓

Delivered

---

# 7. Notification Components

Each notification shall contain:

- Notification ID
- Title
- Message
- Category
- Priority
- Recipient
- Related Module
- Related Record
- Timestamp
- Read Status

Optional

- Action Button
- Deep Link
- Attachment

---

# 8. Notification Triggers

## Reservation

- Reservation Created
- Reservation Approved
- Reservation Rejected
- Reservation Cancelled
- Reservation Expired

---

## Borrowing

- Borrowing Created
- Borrow Due Reminder
- Borrow Overdue
- Borrow Returned

---

## Inventory

- Stock Below Minimum
- Stock Replenished

---

## Maintenance

- Maintenance Scheduled
- Maintenance Completed

---

## User

- Login from New Device (Future)
- Password Changed

---

## Administration

- Role Changed
- Permission Updated
- User Created

---

# 9. Notification Recipients

Employee

Department Head

Property Custodian

Inventory Officer

Administrator

Super Administrator

Auditor (when applicable)

---

# 10. User Preferences

Users may configure:

- Enable Notifications
- Disable Notifications
- Mark as Read
- Mark All as Read
- Delete Notification
- Notification Sound (Future)

---

# 11. Notification Display

Web

- Notification Bell
- Dropdown
- Notification Center

Mobile

- Notification List
- Badge Counter
- Future Push Notifications

---

# 12. Notification Rules

The system shall:

- Prevent duplicate notifications for the same event.
- Deliver notifications to authorized recipients only.
- Record delivery timestamps.
- Record read timestamps.
- Support bulk notifications.

---

# 13. Notification Templates

Template fields:

- Title
- Message
- Variables
- Category
- Priority

Example

Title:

Reservation Approved

Message:

Your reservation for {AssetName} has been approved.

---

# 14. Notification Retention

Unread notifications shall remain available until viewed.

Read notifications may be archived after a configurable retention period.

Archived notifications shall remain searchable by authorized users.

---

# 15. Future Notification Features

The architecture shall support:

- Email Templates
- SMS Gateway
- Firebase Push Notifications
- Scheduled Notifications
- Reminder Engine
- Notification Analytics
- User Subscription Preferences

---

# 16. Acceptance Criteria

The notification system shall be considered complete when:

- Business events generate notifications.
- Notifications reach the correct recipients.
- Read and unread status is tracked.
- Notifications are searchable.
- Notifications integrate with the web dashboard.