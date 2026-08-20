# Risk Assessment

| Field | Value |
|--------|-------|
| Document | 23_Risk_Assessment.md |
| Version | 1.0 |
| Status | Draft |
| Last Updated | July 13, 2026 |
| Prepared By | Computer Science OJT Team |
| Client | Philippine Statistics Authority (PSA) Region XII |
| Depends On | 20_Development_Roadmap.md, 21_Testing_Quality_Assurance.md, 22_Deployment_Operations.md |

---

# 1. Purpose

This document identifies potential risks that may affect the successful development, deployment, operation, and maintenance of the Office Asset, Equipment Reservation, Borrowing, and Inventory Management System.

The objective is to proactively identify risks, evaluate their impact, and define mitigation and contingency strategies.

---

# 2. Risk Assessment Objectives

The project shall:

- Identify potential project risks.
- Reduce the likelihood of failures.
- Minimize operational disruptions.
- Protect project resources.
- Ensure project continuity.
- Support informed decision-making.

---

# 3. Risk Assessment Method

Each identified risk shall be evaluated using:

- Probability (Likelihood)
- Impact (Severity)
- Overall Risk Level

Risk Matrix

| Probability | Description |
|-------------|-------------|
| Low | Unlikely to occur |
| Medium | Possible |
| High | Likely |

| Impact | Description |
|---------|-------------|
| Low | Minor inconvenience |
| Medium | Affects project progress |
| High | Major disruption or project failure |

Risk Level

- Low
- Medium
- High
- Critical

---

# 4. Technical Risks

## TR-001

Risk

Database corruption or data inconsistency.

Probability

Medium

Impact

High

Mitigation

- Database transactions
- Foreign key constraints
- Regular backups
- Thorough testing

Contingency

Restore from verified backup.

---

## TR-002

Risk

QR or Barcode scanning failures.

Probability

Medium

Impact

Medium

Mitigation

- Support manual search
- Test multiple devices
- Validate generated codes

Contingency

Use Property Number (ICS), Asset Tag, or Serial Number.

---

## TR-003

Risk

API integration failures between Web and Mobile.

Probability

Medium

Impact

High

Mitigation

- Standardized API
- API versioning
- Integration testing

Contingency

Fix affected endpoints before release.

---

# 5. Security Risks

## SR-001

Risk

Unauthorized system access.

Probability

Medium

Impact

High

Mitigation

- RBAC
- Secure authentication
- Password hashing
- Session expiration

---

## SR-002

Risk

Sensitive data exposure.

Probability

Low

Impact

Critical

Mitigation

- HTTPS
- Input validation
- Secure API responses
- Least privilege access

---

## SR-003

Risk

SQL Injection or XSS attacks.

Probability

Low

Impact

High

Mitigation

- Laravel ORM
- Prepared statements
- Form Request validation
- Output escaping

---

# 6. Operational Risks

## OR-001

Risk

Employees continue using manual logs instead of the system.

Probability

Medium

Impact

Medium

Mitigation

- User training
- Simple interface
- Management support

---

## OR-002

Risk

Incorrect asset information entered into the system.

Probability

Medium

Impact

Medium

Mitigation

- Required validation
- QR verification
- Administrative review

---

## OR-003

Risk

Loss of internet or local network connectivity.

Probability

Medium

Impact

Medium

Mitigation

- Reliable local network
- Backup network connection

Future

Offline mode for mobile.

---

# 7. Project Risks

## PR-001

Risk

Scope creep.

Probability

High

Impact

High

Mitigation

- Follow Version 1.0 scope
- Document change requests
- Prioritize MVP

---

## PR-002

Risk

Project schedule delays.

Probability

Medium

Impact

High

Mitigation

- Weekly progress review
- Task assignment
- Milestone tracking

---

## PR-003

Risk

Knowledge dependency on one developer.

Probability

Medium

Impact

High

Mitigation

- Documentation
- Code reviews
- Shared ownership

---

# 8. Infrastructure Risks

## IR-001

Risk

Server failure.

Probability

Low

Impact

Critical

Mitigation

- Regular backups
- UPS
- Hardware monitoring

---

## IR-002

Risk

Storage failure.

Probability

Low

Impact

High

Mitigation

- Backup strategy
- RAID (Future)
- Cloud backup (Future)

---

# 9. Data Risks

## DR-001

Risk

Accidental data deletion.

Probability

Medium

Impact

High

Mitigation

- Soft deletes
- Database backups
- User permissions

---

## DR-002

Risk

Duplicate asset records.

Probability

Medium

Impact

Medium

Mitigation

- Unique constraints
- Duplicate validation
- QR verification

---

# 10. External Risks

Examples

- Power outage
- Internet outage
- Hardware failure
- Natural disasters
- Third-party dependency issues

Mitigation

- UPS
- Backup internet
- Backup procedures
- Disaster recovery plan

---

# 11. Risk Matrix

| Risk ID | Category | Probability | Impact | Level |
|----------|----------|------------|--------|-------|
| TR-001 | Technical | Medium | High | High |
| TR-002 | Technical | Medium | Medium | Medium |
| TR-003 | Technical | Medium | High | High |
| SR-001 | Security | Medium | High | High |
| SR-002 | Security | Low | Critical | High |
| OR-001 | Operational | Medium | Medium | Medium |
| PR-001 | Project | High | High | Critical |
| IR-001 | Infrastructure | Low | Critical | High |
| DR-001 | Data | Medium | High | High |

---

# 12. Risk Ownership

| Risk Category | Responsible Role |
|---------------|------------------|
| Technical | Backend Lead |
| Security | System Administrator |
| Infrastructure | IT Administrator |
| Project | Project Manager |
| Data | Database Administrator |
| Operations | Office Management |

---

# 13. Risk Monitoring

Project risks shall be reviewed:

- Weekly during development.
- Before each major release.
- Before production deployment.
- After major incidents.

---

# 14. Risk Response Strategy

Possible responses include:

- Avoid
- Reduce
- Transfer
- Accept

The appropriate response shall be selected based on the risk's probability, impact, and available resources.

---

# 15. Acceptance Criteria

The project shall be considered adequately prepared when:

- Major risks have documented mitigation plans.
- Critical risks have contingency plans.
- Risk owners are identified.
- Risks are reviewed regularly.
- Lessons learned are incorporated into future releases.