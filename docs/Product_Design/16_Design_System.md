# Design System

| Field | Value |
|--------|-------|
| Document | 16_Design_System.md |
| Version | 1.0 |
| Status | Draft |
| Last Updated | July 13, 2026 |
| Prepared By | Computer Science OJT Team |
| Client | Philippine Statistics Authority (PSA) Region XII |
| Depends On | 02_Functional_Requirements.md, 14_System_Architecture.md |

---

# 1. Purpose

This document defines the design system for the Office Asset, Equipment Reservation, Borrowing, and Inventory Management System.

The design system establishes consistent visual styles, reusable components, interaction patterns, and responsive behavior across the Web and Mobile applications.

---

# 2. Design Principles

The user interface shall be:

- Clean
- Professional
- Minimal
- Consistent
- Responsive
- Accessible
- Easy to learn
- Fast to navigate

---

# 3. Design Goals

The interface should:

- Minimize user clicks.
- Reduce user errors.
- Highlight important information.
- Support office workflows.
- Maintain visual consistency.
- Work well on desktop, tablet, and mobile devices.

---

# 4. Branding

Client

Philippine Statistics Authority (PSA)

Theme

Professional Government System

Style

Minimalistic

Modern

Flat Design

---

# 5. Color Palette

Primary

Blue

Secondary

White

Accent

Green

Warning

Orange

Danger

Red

Success

Green

Information

Light Blue

Neutral

Gray

Dark

Dark Gray

---

# 6. Typography

Primary Font

Inter

Fallback

Roboto

Arial

Guidelines

- Use consistent heading sizes.
- Use readable body text.
- Avoid decorative fonts.

---

# 7. Icons

Preferred Icon Library

Heroicons

Alternative

Lucide

Material Icons

Icons shall be used consistently throughout the application.

---

# 8. Layout

Desktop

Sidebar

Top Navigation

Content Area

Right Utility Panel (Future)

---

Tablet

Collapsible Sidebar

Top Navigation

Content Area

---

Mobile

Bottom Navigation

Top App Bar

Scrollable Content

Floating Action Button (where appropriate)

---

# 9. Grid System

Desktop

12 Columns

Tablet

8 Columns

Mobile

4 Columns

---

# 10. Spacing

Use consistent spacing throughout the application.

Recommended spacing scale:

- XS
- Small
- Medium
- Large
- XL

Margins and padding should follow the same spacing system.

---

# 11. Border Radius

Cards

Rounded

Buttons

Rounded

Inputs

Rounded

Dialogs

Rounded

Maintain consistent border radius across all components.

---

# 12. Shadows

Use subtle elevation.

Avoid excessive shadow depth.

---

# 13. Navigation

Primary Navigation

Sidebar

Secondary Navigation

Breadcrumbs

Context Navigation

Tabs

Quick Actions

Dashboard Cards

---

# 14. Components

Reusable components include:

Buttons

Cards

Tables

Forms

Input Fields

Dropdowns

Search Bars

Badges

Status Chips

Modals

Drawers

Alerts

Toast Notifications

Pagination

Date Picker

QR Scanner Button

Barcode Scanner Button

---

# 15. Forms

Forms shall:

- Display required fields clearly.
- Validate before submission.
- Display inline validation.
- Display success confirmation.
- Prevent duplicate submissions.

---

# 16. Tables

Tables shall support:

- Sorting
- Searching
- Filtering
- Pagination
- Column Visibility
- Export

---

# 17. Cards

Cards shall display:

- Asset Image
- Asset Name
- Category
- Status
- Availability
- Location
- Quick Actions

---

# 18. Status Indicators

Asset Availability

Available

Reserved

Borrowed

Inspection

Maintenance

Unavailable

Asset Condition

Good

Damaged

Lost

Retired

Disposed

Status shall be represented using consistent color-coded badges.

---

# 19. Dashboard Widgets

Widgets include:

- Total Assets
- Available Assets
- Borrowed Assets
- Reserved Assets
- Inventory Levels
- Low Stock
- Pending Approvals
- Recent Activity
- Notifications

---

# 20. Search Experience

Global Search

Supports:

- Asset Name
- QR Code
- Barcode
- Property Number (ICS)
- Serial Number
- Asset Tag
- Employee
- Department

Search results should appear quickly and clearly.

---

# 21. Responsive Design

Desktop

Primary working environment.

Tablet

Administrative use.

Mobile

Operational tasks.

The interface shall adapt automatically to screen size.

---

# 22. Accessibility

The interface shall:

- Maintain sufficient color contrast.
- Support keyboard navigation.
- Provide descriptive labels.
- Avoid relying solely on color.
- Support screen readers where practical.

---

# 23. Empty States

The system shall display friendly empty-state messages.

Examples:

- No Assets Found
- No Reservations
- No Notifications
- No Reports Available

---

# 24. Error States

The system shall provide:

- Friendly validation messages.
- Clear error descriptions.
- Suggested corrective actions.

---

# 25. Loading States

Loading indicators shall be displayed during:

- API requests
- Report generation
- File uploads
- QR scanning
- Authentication

---

# 26. Notifications

Notification styles:

- Success
- Error
- Warning
- Information

Notifications should be consistent across Web and Mobile.

---

# 27. Dark Mode

Version 1

Not Included

Future Version

Supported

---

# 28. Future Design Enhancements

The design system should support future additions:

- Dark Mode
- High Contrast Mode
- Multiple Themes
- Custom Branding
- Multi-language Support
- Right-to-Left Layouts