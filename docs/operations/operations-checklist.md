# Operations checklist (implementation-backed)

Use this checklist when performing administrative or maintenance operations. The items reflect actual repository behavior and responsibilities that are implemented versus those that are infrastructure-level responsibilities.

## Before administrative changes

- [ ] Confirm you have an account with an administrative role (see backend/app/Enums/UserRole.php)
- [ ] Review affected records and policies in the repository (controllers, policies)
- [ ] Ensure you have a recent database backup (infrastructure responsibility)
- [ ] Confirm whether the operation triggers scheduled tasks or notifications

## Before imports or mass updates

- [ ] Validate source data in a staging environment
- [ ] Run import on staging and verify audit logs and domain history
- [ ] Confirm role/permission mappings for imported users

## Before maintenance windows or deployments

- [ ] Notify stakeholders and affected users
- [ ] Ensure scheduled tasks and queue workers are paused or drained if required by deployment
- [ ] Ensure monitoring and logging configuration will capture deployment-related errors

## After major changes

- [ ] Verify critical workflows (login, borrow/return, asset issuance)
- [ ] Check audit_logs and domain history for expected events
- [ ] Inspect backend/storage/logs for errors
- [ ] Confirm notification delivery for queued messages (sample tests)

Source-of-truth references

- backend/app/Enums/UserRole.php
- backend/database/migrations/
- backend/routes/console.php
- backend/storage/logs/

This checklist is intentionally conservative: many recovery tasks and backups are not implemented in this repository and are the responsibility of infrastructure/operations teams.
