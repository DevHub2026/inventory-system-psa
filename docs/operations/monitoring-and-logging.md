# Monitoring & Logging (implementation-backed)

Overview

This document describes the logging and monitoring capabilities implemented in the repository and notes what is not implemented.

Implemented and verified

- Application logs
  - Laravel writes logs to storage (backend/storage/logs/laravel.log and rotated files). See backend/config/logging.php for channels and configuration.
  - Operators should inspect backend/storage/logs/ for runtime errors and stack traces.

- Exception handling
  - Standard Laravel exception handling applies. There is no Sentry/third-party error integration found in the repository.

- CI and accessibility workflow
  - GitHub Actions workflows are present for accessibility testing and other CI tasks; CI failures surface build/test/a11y problems (see .github/workflows/).

Not implemented in repository (infrastructure responsibilities)

- External monitoring platforms (Sentry, Datadog, Prometheus, Grafana) — no integrations were found in the repository.
- Alerting and uptime monitoring — not implemented inside the app.

Operational guidance

- Log access
  - Logs are under backend/storage/logs/. Ensure your deployment copies logs to a central log aggregation/retention store if required.

- Log levels and channels
  - Check backend/config/logging.php to adjust channels, stack configuration, and log levels for different environments.

- When investigating incidents
  - Check the most recent entries in backend/storage/logs/laravel.log first.
  - Correlate with web server logs and queue worker logs if available.

Source-of-truth files

- backend/config/logging.php
- backend/storage/logs/
- .github/workflows/
