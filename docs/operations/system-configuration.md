# System configuration (implementation-backed)

Overview

This document distinguishes application-level configuration (managed via UI/API where implemented) and deployment-level configuration (environment variables and config files).

Application-level configuration

- System Setup module
  - Document templates, placeholders, and similar system setup artifacts are managed through the SystemSetup module (backend/app/Modules/SystemSetup).
  - Policies restrict who can manage system setup (Super Administrator / System Administrator).

Deployment / operator configuration

- Environment variables and config files are the authoritative mechanism for runtime configuration.
  - backend/.env.example and backend/config/* (especially config/database.php, config/queue.php, config/logging.php) are the source of truth for deployment configuration.
  - Testing environment: backend/phpunit.xml configures tests to use sqlite in-memory.

- Mail, database, queue, and storage configuration are managed via config files and environment variables. Admins should not attempt to change these via the application UI unless explicit administrative endpoints are implemented.

Source-of-truth files

- backend/.env.example
- backend/config/database.php
- backend/config/queue.php
- backend/config/logging.php
- backend/phpunit.xml
- backend/app/Modules/SystemSetup/*
