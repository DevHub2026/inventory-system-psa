# Maintenance & Scheduled Tasks (implementation-backed)

Overview

The repository includes scheduled artisan commands and queued notifications. This document explains what is implemented and what administrators must run in production.

Implemented and verified

- Scheduled console commands (registered in backend/routes/console.php):
  - insurance:check-expiration (CheckInsuranceExpiration command)
  - borrowings:send-overdue-reminders (SendOverdueBorrowingReminders command)
  - inventory:send-low-stock-alerts (SendLowStockAlerts command)
  - maintenance:send-reminders (SendMaintenanceReminders command)

  These entries appear in backend/routes/console.php (Schedule::command(...)).

- Queueable notifications
  - Several Notification classes implement ShouldQueue (e.g., OverdueBorrowingReminder) and thus rely on queue workers to process jobs.
  - Queue configuration defaults to database driver per backend/config/queue.php (QUEUE_CONNECTION env var may override).

Operational requirements (must be provided by deployer)

- Scheduler runner
  - Ensure the Laravel scheduler runs (typical setup: cron entry that runs php artisan schedule:run every minute). The repository registers scheduled commands in routes/console.php; confirm scheduler is enabled in the environment.

- Queue workers
  - Run queue workers to process queued notifications and jobs: php artisan queue:work or use supervisor/systemd to run queue worker processes. Composer dev uses php artisan queue:listen; production should use queue:work with a process manager.

- Job failure handling
  - Configure failed job storage (config/queue.php) and ensure failed_jobs table is migrated if using the database driver.

Source-of-truth files

- backend/routes/console.php
- backend/app/Console/Commands/*
- backend/config/queue.php
- backend/app/Notifications/*

Operational cautions

- The repository does not include an explicit schedule runner installer or supervisor configuration; these are deployment responsibilities.
- Verify that notification email delivery is configured (MAIL_* environment variables) and that queue workers are running to avoid delayed notifications.
