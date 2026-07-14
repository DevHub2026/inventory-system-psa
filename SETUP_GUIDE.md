# SETUP_GUIDE.md

# Office Asset, Equipment Reservation, Borrowing & Inventory Management System

Version: 1.0

Last Updated: July 2026

---

# Purpose

This guide provides everything required to set up the development environment for this project.

It covers:

- Software installation
- Project setup
- Database configuration
- Environment variables
- Running the application
- Progressive Web App (PWA) testing
- Troubleshooting
- Development workflow

Every developer must complete this guide before contributing to the project.

---

# 1. System Requirements

## Recommended Operating System

- Windows 11
- Windows 10

Supported

- Ubuntu 24.04+
- macOS (Latest)

---

## Minimum Hardware

CPU

- Intel Core i5 (10th Gen or newer)
- AMD Ryzen 5 (3000 Series or newer)

Memory

- 16 GB RAM

Storage

- 50 GB Free SSD Space

Recommended

- SSD
- 1080p Monitor
- Stable Internet Connection

---

# 2. Technology Stack

## Backend

- Laravel 12
- PHP 8.4+
- Composer

---

## Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Progressive Web App (PWA)

---

## Database

- PostgreSQL 17+

---

## Authentication

- Laravel Sanctum

---

## Version Control

- Git

---

# 3. Required Software

## Git

Purpose

Version Control

Verify

```bash
git --version
```

---

## Visual Studio Code

Purpose

Primary IDE

---

## PHP

Version

8.4+

Verify

```bash
php -v
```

---

## Composer

Verify

```bash
composer --version
```

---

## Node.js

Recommended

Latest LTS Version

Verify

```bash
node -v

npm -v
```

---

## PostgreSQL

Version

17+

Verify

```bash
psql --version
```

---

## DBeaver Community

Purpose

Database Management

Recommended

---

## Bruno

Purpose

API Testing

Alternatives

- Postman
- Insomnia

---

## Google Chrome

Purpose

Development

- Responsive Testing
- Camera Testing
- QR Scanner Testing
- PWA Installation

---

## Docker (Optional)

Purpose

Containerized Development

Verify

```bash
docker --version
```

---

# 4. Recommended VS Code Extensions

## Laravel

- Laravel Extension Pack
- PHP Intelephense

---

## React

- ESLint
- Prettier
- Tailwind CSS IntelliSense

---

## Git

- GitLens

---

## Utilities

- Error Lens
- DotENV
- Path Intellisense
- Markdown All in One
- Markdown Preview Enhanced

---

## Database

- PostgreSQL

---

## AI

- Kilo Code

---

# 5. Clone the Repository

```bash
git clone <repository-url>

cd <project-folder>
```

---

# 6. Repository Structure

```text
backend/

frontend/

docs/

PROJECT_RULES.md

PROMPT_INSTRUCTIONS.md

NAMING_CONVENTIONS.md

TEAM_RESPONSIBILITIES.md

SETUP_GUIDE.md

README.md
```

---

# 7. Backend Setup

Go to backend

```bash
cd backend
```

Install dependencies

```bash
composer install
```

Copy environment file

```bash
cp .env.example .env
```

Generate application key

```bash
php artisan key:generate
```

---

# 8. Database Setup

Create a PostgreSQL database.

Example

```text
Database Name

office_asset_management
```

Update the backend `.env`

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=office_asset_management
DB_USERNAME=postgres
DB_PASSWORD=
```

Run migrations

```bash
php artisan migrate
```

Run seeders (if available)

```bash
php artisan db:seed
```

---

# 9. Frontend Setup

Go to frontend

```bash
cd frontend
```

Install dependencies

```bash
npm install
```

Run development server

```bash
npm run dev
```

---

# 10. Environment Variables

## Backend

```env
APP_NAME=
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=
DB_USERNAME=
DB_PASSWORD=

SANCTUM_STATEFUL_DOMAINS=localhost:5173
```

---

## Frontend

```env
VITE_API_URL=http://localhost:8000/api/v1
```

---

# 11. Running the Project

## Start Backend

```bash
cd backend

php artisan serve
```

Backend URL

```text
http://localhost:8000
```

---

## Start Frontend

```bash
cd frontend

npm run dev
```

Frontend URL

```text
http://localhost:5173
```

---

# 12. Verify Setup

## Backend

Open

```text
http://localhost:8000
```

The Laravel welcome page should appear.

---

## Frontend

Open

```text
http://localhost:5173
```

The React application should load successfully.

---

## Database

Open DBeaver.

Verify:

- PostgreSQL is connected.
- Tables were created successfully.
- Migrations completed without errors.

---

# 13. Progressive Web App (PWA)

The application shall support:

- Desktop
- Laptop
- Tablet
- Mobile Browser

Verify

- Responsive Layout
- Camera Access
- QR Scanner
- Barcode Scanner
- Add to Home Screen

---

# 14. API Testing

Use Bruno.

Test

- Login
- Logout
- Assets
- Reservations
- Borrowings
- Inventory

Ensure all endpoints return the expected responses.

---

# 15. Troubleshooting

PHP

```bash
php -v
```

Composer

```bash
composer diagnose
```

Node.js

```bash
node -v

npm -v
```

PostgreSQL

```bash
psql --version
```

Git

```bash
git --version
```

Laravel

```bash
php artisan about
```

---

# 16. Before Writing Code

Every developer shall read:

- PROJECT_RULES.md
- PROMPT_INSTRUCTIONS.md
- NAMING_CONVENTIONS.md
- TEAM_RESPONSIBILITIES.md

Do not start development before understanding the project architecture.

---

# 17. AI Coding Setup

Any AI coding assistant may be used.

Examples

- Kilo Code
- ChatGPT
- Claude
- Ollama

Before generating code, AI shall read:

1. PROJECT_RULES.md
2. PROMPT_INSTRUCTIONS.md
3. Relevant files in the docs folder

All generated code must follow the project standards.

---

# 18. Daily Development Workflow

1. Pull the latest changes.

```bash
git pull origin develop
```

2. Create a feature branch.

```bash
git checkout -b feature/<feature-name>
```

3. Develop the assigned feature.

4. Test locally.

5. Commit changes.

```bash
git add .

git commit -m "feat: implement asset module"
```

6. Push the branch.

```bash
git push origin feature/<feature-name>
```

7. Open a Pull Request.

8. Wait for review before merging.

---

# 19. Setup Checklist

Development Environment

- Git Installed
- VS Code Installed
- PHP Installed
- Composer Installed
- Node.js Installed
- PostgreSQL Installed
- DBeaver Installed
- Bruno Installed
- Google Chrome Installed

Project Setup

- Repository Cloned
- Backend Dependencies Installed
- Frontend Dependencies Installed
- Environment Variables Configured
- Database Created
- Migrations Executed

Verification

- Backend Running
- Frontend Running
- PostgreSQL Connected
- API Accessible
- Responsive Layout Working
- PWA Installable
- Camera Permission Working

Documentation

- PROJECT_RULES.md Read
- PROMPT_INSTRUCTIONS.md Read
- NAMING_CONVENTIONS.md Read
- TEAM_RESPONSIBILITIES.md Read

---

# Project Ready

If every checklist item above has been completed successfully, the development environment is ready.

Developers may now begin implementing features following the project architecture and development standards.