# Non-Functional Requirements Specification (NFR)

| Field | Value |
|--------|-------|
| Document | 03_Non_Functional_Requirements.md |
| Version | 1.0 |
| Status | Draft |
| Last Updated | July 13, 2026 |
| Prepared By | Computer Science OJT Team |
| Client | Philippine Statistics Authority (PSA) Region XII |
| Depends On | 00_Project_Overview.md, 01_Business_Requirements.md, 02_Functional_Requirements.md |

---

# 1. Purpose

This document defines the non-functional requirements for the Office Asset, Equipment Reservation, Borrowing, and Inventory Management System.

Non-functional requirements describe the quality attributes, performance expectations, security standards, reliability, and operational constraints that the system must satisfy.

---

# 2. Performance Requirements

The system shall:

- Display dashboard pages within 3 seconds under normal office usage.
- Load asset information within 2 seconds.
- Complete QR/Barcode scanning within 2 seconds.
- Process borrowing and return transactions in less than 5 seconds.
- Support searching across thousands of asset records efficiently.
- Generate reports within 10 seconds for normal datasets.
- Support simultaneous usage by multiple authorized users without noticeable performance degradation.

---

# 3. Availability

The system shall:

- Be available during official office working hours.
- Minimize system downtime during maintenance.
- Display appropriate maintenance notices during scheduled downtime.
- Automatically recover from unexpected application failures whenever possible.

---

# 4. Reliability

The system shall:

- Prevent data corruption during transactions.
- Ensure completed transactions are permanently stored.
- Prevent duplicate transaction records.
- Maintain consistent asset information.
- Recover gracefully after unexpected interruptions.

---

# 5. Scalability

The system shall be designed to support future expansion.

Future scalability includes:

- Additional PSA offices
- Additional departments
- Increased number of users
- Increased number of assets
- Increased transaction volume
- Mobile application integration
- Future RFID integration
- Future multi-region deployment

---

# 6. Security

The system shall:

- Require user authentication before access.
- Implement Role-Based Access Control (RBAC).
- Encrypt user passwords.
- Record all significant system activities.
- Restrict unauthorized access.
- Validate all user inputs.
- Protect against common web vulnerabilities.
- Automatically expire inactive sessions.
- Support secure HTTPS deployment.

---

# 7. Usability

The system shall:

- Provide an intuitive user interface.
- Require minimal user training.
- Display meaningful validation messages.
- Support keyboard and mouse interaction.
- Support responsive layouts for desktop, tablet, and mobile browsers.
- Maintain consistent navigation throughout the application.

---

# 8. Accessibility

The system should:

- Use readable fonts.
- Provide sufficient color contrast.
- Support keyboard navigation.
- Display responsive layouts.
- Provide descriptive labels for controls.

---

# 9. Compatibility

The system shall support:

## Desktop Browsers

- Google Chrome
- Microsoft Edge
- Mozilla Firefox

## Mobile Browsers

- Chrome for Android
- Safari (iOS)

## Mobile Application

- Android (Version 10 and above)

Future Support

- iOS

---

# 10. Maintainability

The system shall:

- Follow modular software architecture.
- Separate business logic from presentation.
- Use consistent coding standards.
- Maintain complete technical documentation.
- Support future feature enhancements.

---

# 11. Data Integrity

The system shall:

- Prevent duplicate Property Numbers.
- Prevent duplicate Asset IDs.
- Prevent duplicate QR Codes.
- Prevent duplicate Barcodes.
- Prevent duplicate Serial Numbers when applicable.
- Maintain referential integrity between related records.
- Record timestamps automatically.

---

# 12. Backup and Recovery

The system shall:

- Support manual database backup.
- Support database restoration by authorized administrators.
- Preserve transaction history during backup and restore.
- Prevent accidental deletion of critical records.

Future Enhancement

- Automatic scheduled backups
- Cloud backup

---

# 13. Logging and Auditability

The system shall log:

- Login
- Logout
- Failed login attempts
- Asset registration
- Asset updates
- Borrowing
- Returns
- Reservations
- Inventory transactions
- User management
- Permission changes
- System configuration changes

Each log shall include:

- User
- Date
- Time
- Action
- Module
- IP Address (if applicable)

---

# 14. Data Retention

The system shall:

- Preserve historical transaction records.
- Preserve borrowing history.
- Preserve audit logs.
- Archive inactive records instead of immediate deletion where appropriate.

---

# 15. Error Handling

The system shall:

- Display user-friendly error messages.
- Prevent application crashes caused by invalid input.
- Log unexpected system errors.
- Prevent exposure of sensitive system information.

---

# 16. Reporting Performance

The system shall:

- Export reports to PDF.
- Export reports to Excel.
- Export reports to CSV.
- Support printable reports.
- Generate reports without affecting ongoing user transactions.

---

# 17. Asset Identification Performance

The system shall support multiple asset identification methods.

Supported methods include:

- QR Code
- Barcode
- Property Number (ICS)
- Asset Tag
- Serial Number

Future support shall allow:

- RFID
- NFC
- OCR

All supported identification methods shall retrieve the same asset record.

---

# 18. Mobile Requirements

The mobile application shall:

- Authenticate users securely.
- Support QR and Barcode scanning.
- Display assigned and borrowed assets.
- Operate using the same backend API as the web application.
- Adapt to various Android screen sizes.

---

# 19. Compliance

The system should comply with:

- PSA asset management procedures
- Government property accountability practices
- Office security policies
- Applicable data privacy regulations

---

# 20. Future-Proofing

The architecture shall allow future integration with:

- RFID readers
- NFC devices
- ERP systems
- Accounting systems
- Google Workspace
- Microsoft 365
- SMS gateways
- Email services
- Cloud storage providers
- Additional PSA regional offices

---

# 21. Acceptance Criteria

The system shall be considered acceptable if:

- All functional requirements are satisfied.
- Users can complete borrowing and returning transactions successfully.
- Asset identification works using all supported methods.
- Reports generate correctly.
- Audit logs accurately record system activities.
- Security restrictions operate correctly.
- The application performs reliably during normal office operations.