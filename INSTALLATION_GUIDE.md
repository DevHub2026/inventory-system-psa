# INSTALLATION_GUIDE.md

# Office Asset, Equipment Reservation, Borrowing & Inventory Management System

Version: 1.0

---

# Purpose

This document provides the required software, tools, installation steps, and environment configuration for all developers working on this project.

Every team member shall complete this setup before development.

---

# Required Operating System

Recommended

- Windows 11
- Windows 10

Supported

- Ubuntu 24.04+
- macOS (Latest)

---

# Development Stack

## Backend

- Laravel 12
- PHP 8.4+
- Composer
- PostgreSQL

---

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

---

## Mobile

- Flutter Stable
- Dart SDK
- Android Studio

---

## Database

- PostgreSQL

Recommended Database Client

- DBeaver

Alternative

- pgAdmin 4

---

# Required Software

## 1. Git

Purpose

Version Control

Verify

git --version

---

## 2. VS Code

Purpose

Primary IDE

Recommended Extensions

- Laravel Extension Pack
- PHP Intelephense
- Flutter
- Dart
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- GitLens
- Error Lens
- DotENV
- PostgreSQL
- Docker
- Path Intellisense

---

## 3. PHP

Version

8.4+

Verify

php -v

---

## 4. Composer

Verify

composer --version

---

## 5. Node.js

Recommended

LTS

Verify

node -v

npm -v

---

## 6. PostgreSQL

Recommended

Latest Stable Version

Verify

psql --version

---

## 7. Flutter

Install Flutter Stable

Verify

flutter doctor

All checks should pass before development.

---

## 8. Android Studio

Install

Android SDK

Android Emulator

Platform Tools

Verify

flutter doctor

---

## 9. Java

Install

JDK 21

Verify

java -version

---

## 10. DBeaver

Purpose

Database Management

Recommended over pgAdmin.

---

## 11. Postman

Purpose

API Testing

Alternative

Bruno

Insomnia

---

## 12. Docker (Optional)

Purpose

Containerized Development

Verify

docker --version

---

# Clone Repository

git clone <repository-url>

cd <project-folder>

---

# Repository Structure

backend/

frontend/

mobile/

docs/

PROJECT_RULES.md

PROMPT_INSTRUCTIONS.md

NAMING_CONVENTIONS.md

TEAM_RESPONSIBILITIES.md

INSTALLATION_GUIDE.md

README.md

---

# Backend Setup

cd backend

composer install

cp .env.example .env

php artisan key:generate

Configure PostgreSQL credentials.

Run

php artisan migrate

php artisan db:seed

Start Server

php artisan serve

---

# Frontend Setup

cd frontend

npm install

npm run dev

---

# Mobile Setup

cd mobile

flutter pub get

flutter run

---

# Environment Variables

Backend

APP_NAME

APP_ENV

APP_KEY

APP_URL

DB_CONNECTION

DB_HOST

DB_PORT

DB_DATABASE

DB_USERNAME

DB_PASSWORD

SANCTUM_STATEFUL_DOMAINS

Frontend

VITE_API_URL

Mobile

API_BASE_URL

---

# Verify Installation

Backend

php artisan serve

Frontend

npm run dev

Mobile

flutter doctor

flutter run

Database

Connect successfully to PostgreSQL.

---

# Coding Standards

Before writing code

Read

PROJECT_RULES.md

PROMPT_INSTRUCTIONS.md

NAMING_CONVENTIONS.md

TEAM_RESPONSIBILITIES.md

---

# Troubleshooting

PHP

php -v

Composer

composer diagnose

Node

node -v

Flutter

flutter doctor

PostgreSQL

psql --version

---

# Recommended VS Code Extensions

Laravel Extension Pack

PHP Intelephense

Flutter

Dart

GitLens

Error Lens

Prettier

ESLint

Tailwind CSS IntelliSense

Docker

PostgreSQL

DotENV

Path Intellisense

Markdown All in One

Markdown Preview Enhanced

---

# Recommended AI Tools

Any AI coding assistant may be used.

Examples

- Kilo Code
- ChatGPT
- Claude
- Ollama

All AI-generated code must follow

PROJECT_RULES.md

PROMPT_INSTRUCTIONS.md

NAMING_CONVENTIONS.md

---

# Installation Checklist

✓ Git Installed

✓ VS Code Installed

✓ PHP Installed

✓ Composer Installed

✓ Node.js Installed

✓ PostgreSQL Installed

✓ DBeaver Installed

✓ Flutter Installed

✓ Android Studio Installed

✓ Java Installed

✓ Backend Running

✓ Frontend Running

✓ Mobile Running

✓ Database Connected

✓ Environment Variables Configured

✓ Documentation Read

System is ready for development.