# Deployment & Operations

| Field | Value |
|--------|-------|
| Document | 22_Deployment_Operations.md |
| Version | 1.0 |
| Status | Draft |
| Last Updated | July 13, 2026 |
| Prepared By | Computer Science OJT Team |
| Client | Philippine Statistics Authority (PSA) Region XII |
| Depends On | 14_System_Architecture.md, 15_Security_Architecture.md, 20_Development_Roadmap.md |

---

# 1. Purpose

This document defines the deployment strategy, production environment, operational procedures, maintenance guidelines, backup strategy, and disaster recovery plan for the Office Asset, Equipment Reservation, Borrowing, and Inventory Management System.

---

# 2. Deployment Objectives

The deployment shall:

- Ensure reliable system availability.
- Minimize downtime.
- Protect production data.
- Support future scalability.
- Provide secure deployment procedures.
- Enable efficient maintenance.

---

# 3. Deployment Architecture

                    Users
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
Web Browser                   Mobile Application
        │                             │
        └──────────────┬──────────────┘
                       │
                    HTTPS
                       │
                Reverse Proxy (Nginx)
                       │
                  Laravel Application
                       │
                  PostgreSQL Database
                       │
               File Storage / Backups

---

# 4. Target Environment

Backend

- Laravel
- PHP 8.4+

Database

- PostgreSQL

Web Server

- Nginx

Operating System

- Ubuntu Server LTS

Containerization (Recommended)

- Docker
- Docker Compose

Future

- Kubernetes

---

# 5. Production Components

Application Server

Database Server

File Storage

Backup Storage

Monitoring

Logging

SSL Certificates

---

# 6. Environment Configuration

Separate environments shall be maintained.

Development

Used by developers.

---

Testing

Used for QA and User Acceptance Testing.

---

Production

Used by end users.

Production data shall never be used in development without proper anonymization.

---

# 7. Environment Variables

Sensitive configuration shall be stored using environment variables.

Examples include:

- Database Credentials
- Application Key
- Mail Configuration
- API Keys
- Notification Settings
- File Storage Settings

Environment files shall never be committed to version control.

---

# 8. Deployment Procedure

1. Backup production database.
2. Backup uploaded files.
3. Pull latest application release.
4. Install/update dependencies.
5. Apply database migrations.
6. Clear application caches.
7. Restart required services.
8. Perform smoke testing.
9. Confirm successful deployment.

---

# 9. Database Deployment

Database changes shall:

- Be version-controlled.
- Use Laravel migrations.
- Be tested before production deployment.
- Include rollback procedures.

---

# 10. Backup Strategy

The following shall be backed up:

- Database
- Uploaded Files
- Configuration Files

Recommended Schedule

- Daily Incremental Backup
- Weekly Full Backup
- Monthly Archive Backup

Future

- Automated Cloud Backups

---

# 11. Disaster Recovery

Recovery procedures shall include:

- Database restoration.
- File restoration.
- Application restoration.
- Configuration restoration.

Recovery objectives:

- Restore critical services quickly.
- Minimize data loss.
- Verify restored system functionality.

---

# 12. Monitoring

Monitor:

- Server Health
- Application Errors
- Database Performance
- Storage Capacity
- API Availability
- Authentication Failures

Future

- Grafana
- Prometheus

---

# 13. Logging

Maintain logs for:

- Application
- Server
- Database
- API Requests
- Security Events
- Audit Logs

Log retention shall follow organizational policies.

---

# 14. Security Operations

The production environment shall:

- Use HTTPS.
- Restrict server access.
- Restrict database access.
- Use secure SSH authentication.
- Rotate credentials when necessary.
- Keep software updated.

---

# 15. Release Management

Releases shall follow versioning.

Example:

Version 1.0.0

Major Release

Version 1.1.0

Feature Release

Version 1.1.1

Bug Fix

Every release shall include release notes.

---

# 16. Rollback Strategy

If deployment fails:

- Stop deployment.
- Restore database backup.
- Restore application files.
- Verify system integrity.
- Notify administrators.

---

# 17. Maintenance

Scheduled maintenance may include:

- Security Updates
- Dependency Updates
- Database Optimization
- Backup Verification
- Performance Tuning

Users should be informed before planned maintenance.

---

# 18. Deployment Checklist

Before Deployment

- Code reviewed
- Tests passed
- Documentation updated
- Database migrations verified
- Backups completed
- Production `.env` created from `backend/.env.example`; never copy local secrets or commit real credentials.
- `APP_ENV=production`, `APP_DEBUG=false`, `APP_KEY` generated on the server, and `APP_URL` set to the public HTTPS origin.
- Database credentials point to the production database with least-privilege application access.
- Frontend production build uses `VITE_API_BASE_URL=/api/v1` for same-origin deployments, or a full HTTPS API URL when the API is separate.
- CORS and Sanctum stateful domains allow only the approved production frontend origins.
- HTTPS is terminated at the web server or load balancer; session cookies are secure in production.
- `php artisan storage:link` has been run and uploaded files are backed up.
- Cache, config, route, and view optimization commands have been run after final environment values are set.
- Queue tables and failed job tables exist; a queue worker is supervised and configured to restart on deploy.
- Scheduler is installed as a one-minute cron/systemd timer and runs `php artisan schedule:run`.
- Mail settings point to a real SMTP provider; test notifications are verified after the queue worker is running.
- Web server points to `backend/public`, protects dotfiles, forwards HTTPS headers, and serves the built frontend assets.
- Process supervision covers PHP-FPM/web service, queue workers, scheduler runner, database, and reverse proxy.

After Deployment

- Login verified
- API verified
- Reports verified
- Scanner verified
- Notifications verified
- Audit logs verified
- Queue processing verified with a queued notification/job.
- Scheduler verified by checking scheduled command logs.
- Failed jobs dashboard/process reviewed; `php artisan queue:failed` returns no unexpected failures.
- CORS verified from the deployed frontend origin.
- Backup and restore procedure tested against a non-production target.

---

# 19. Production Runtime Requirements

Environment:

- Set `APP_ENV=production` and `APP_DEBUG=false`.
- Generate `APP_KEY` on the target server with `php artisan key:generate`; do not reuse development keys.
- Set `APP_URL` to the final HTTPS URL.
- Keep real database, SMTP, cloud, and API credentials outside source control.

Database:

- Use the approved production database engine and credentials.
- Run migrations during deployment: `php artisan migrate --force`.
- Back up the database before each release and before destructive maintenance.

Frontend/API URL:

- Same-origin deployment: build with `VITE_API_BASE_URL=/api/v1`.
- Split-origin deployment: build with `VITE_API_BASE_URL=https://<api-host>/api/v1` and configure CORS/Sanctum for the frontend host.

CORS and HTTPS:

- Allow only trusted HTTPS frontend origins.
- Enable secure cookies in production.
- Confirm reverse proxy headers preserve scheme/host so generated URLs use HTTPS.

Storage:

- Run `php artisan storage:link`.
- Ensure `storage/` and `bootstrap/cache/` are writable by the application user.
- Include uploaded files and generated documents in backup policy.

Cache:

- Use database or Redis cache in production.
- After env changes, run `php artisan config:cache`, `php artisan route:cache`, and `php artisan view:cache`.

Queue and failed jobs:

- Use `QUEUE_CONNECTION=database` or Redis in production.
- Run queue migrations and failed job migrations.
- Supervise `php artisan queue:work --tries=3 --backoff=60` with Supervisor/systemd.
- Monitor `php artisan queue:failed`; retry or resolve failures as part of operations.

Mail:

- Configure a real SMTP provider and sender identity.
- Verify outbound mail with the queue worker running.
- Do not use `log` mailer for production.

Scheduler:

- Install one scheduler entry per application server, for example:
  `* * * * * cd /path/to/backend && php artisan schedule:run >> /dev/null 2>&1`
- Monitor scheduled tasks for overdue reminders, low-stock checks, maintenance notifications, and report jobs.

Web server and process supervision:

- Serve Laravel from `backend/public`.
- Serve the built frontend from `frontend/dist` or deploy it behind the same HTTPS origin.
- Protect `.env`, source files, and storage-private paths from direct web access.
- Supervise PHP-FPM/web server, queue workers, scheduler, and database services with restart policies.

---

# 19. Operational Documentation

The project shall maintain:

- Deployment Guide
- Administrator Guide
- User Manual
- Backup Procedures
- Recovery Procedures
- Release Notes

---

# 20. Future Deployment Enhancements

The deployment architecture should support:

- High Availability
- Load Balancing
- Horizontal Scaling
- Container Orchestration
- Cloud Hosting
- Continuous Integration
- Continuous Deployment (CI/CD)
- Automated Monitoring
