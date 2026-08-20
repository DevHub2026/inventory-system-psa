# System Architecture

| Field | Value |
|--------|-------|
| Document | 14_System_Architecture.md |
| Version | 1.0 |
| Status | Draft |
| Last Updated | July 13, 2026 |
| Prepared By | Computer Science OJT Team |
| Client | Philippine Statistics Authority (PSA) Region XII |
| Depends On | 11_Database_Architecture.md, 12_Entity_Relationship_Design.md, 13_API_Architecture.md |

---

# 1. Purpose

This document defines the overall software architecture of the Office Asset, Equipment Reservation, Borrowing, and Inventory Management System.

It serves as the blueprint for development and ensures consistency across the Web Application, Mobile Application, Backend API, Database, and future integrations.

---

# 2. Architectural Goals

The architecture shall:

- Be modular
- Be scalable
- Be maintainable
- Support future PSA offices
- Support mobile devices
- Support future integrations
- Minimize coupling
- Maximize code reuse

---

# 3. High-Level Architecture

                    Users
                       │
      ┌────────────────┼────────────────┐
      │                │                │
      ▼                ▼                ▼
Web Application   Mobile Application   Future Integrations
      │                │                │
      └────────────────┼────────────────┘
                       │
                 REST API (Laravel)
                       │
      ┌────────────────┼────────────────┐
      │                │                │
 Business Logic   Authentication   Notifications
      │                │                │
      └────────────────┼────────────────┘
                       │
                 PostgreSQL Database

---

# 4. Architecture Style

The system follows:

- Layered Architecture
- Modular Architecture
- REST API Architecture
- Domain-Oriented Design
- Role-Based Security
- Stateless API

---

# 5. Application Layers

## Presentation Layer

Responsible for:

- Web UI
- Mobile UI
- User interaction
- Input validation
- Navigation

Components

- Blade / Livewire (or chosen frontend)
- Flutter Mobile
- Responsive Layout

---

## API Layer

Responsible for:

- REST Endpoints
- Authentication
- Authorization
- Request Validation
- Response Formatting

Components

- Controllers
- API Resources
- Form Requests
- Policies

---

## Application Layer

Responsible for:

- Business use cases
- Services
- Workflow coordination

Components

- Services
- Action Classes
- Jobs
- Events

---

## Domain Layer

Responsible for:

- Business rules
- Domain logic
- Domain services

Examples

- Reservation Rules
- Borrowing Rules
- Inventory Rules
- Asset Lifecycle

---

## Infrastructure Layer

Responsible for:

- Database
- Storage
- Email
- File Uploads
- Notifications

---

# 6. Major Modules

Identity & Access

Asset Management

Property Accountability

Reservation

Borrowing & Returns

Inventory

Maintenance

Reporting

Notification

Audit Logging

Administration

---

# 7. Web Application

Purpose

Administrative operations.

Responsibilities

- Asset Management
- Reports
- Inventory
- Maintenance
- Administration
- Dashboards

Target

Desktop

Laptop

Tablet

Responsive Browser

---

# 8. Mobile Application

Purpose

Operational tasks.

Responsibilities

- QR/Barcode Scanner
- Borrow
- Return
- View Assets
- Notifications
- My Reservations
- My Borrowings

Target

Android

Future

iOS

---

# 9. Backend API

Purpose

Central communication layer.

Responsibilities

- Authentication
- Authorization
- Business Logic
- Data Validation
- Database Communication
- API Responses

---

# 10. Database

Engine

PostgreSQL

Characteristics

- Relational
- ACID Compliance
- Foreign Keys
- Transactions
- Indexing

---

# 11. Storage

Used for

- Asset Images
- Damage Photos
- Documents
- Generated Reports

Future

Cloud Storage

---

# 12. Authentication

Framework

Laravel Sanctum

Authorization

RBAC

Session

Personal Access Tokens

---

# 13. Security

- HTTPS
- Password Hashing
- Role-Based Access
- Input Validation
- CSRF Protection
- XSS Protection
- SQL Injection Protection
- Audit Logs

---

# 14. Notifications

Current

- In-App

Future

- Email
- SMS
- Push Notifications

---

# 15. Logging

System Logs

Application Logs

Audit Logs

Authentication Logs

---

# 16. Scalability

Designed to support:

- Additional departments
- Additional PSA offices
- Increased users
- Increased assets
- Increased transactions

---

# 17. Future Integrations

RFID

NFC

Government Systems

Accounting Systems

ERP

Google Workspace

Microsoft 365

---

# 18. Development Principles

The development team shall follow:

- SOLID Principles
- DRY
- KISS
- YAGNI
- Clean Code
- Separation of Concerns

---

# 19. Coding Standards

- PSR Standards
- Laravel Best Practices
- Consistent Naming
- Service Layer
- Form Requests
- Policies
- Resource Classes

---

# 20. Deployment Architecture

Client

↓

Web Server

↓

Laravel API

↓

PostgreSQL

↓

Storage

---

# 21. Future Architecture

The architecture should support:

- Microservices (if required)
- Message Queues
- Background Jobs
- Cloud Deployment
- Multi-Tenant Support