# NAMING_CONVENTIONS.md

## Purpose

This document is the quick reference for official naming conventions used throughout the project.

If there is any conflict, PROJECT_RULES.md takes precedence.

---

# Modules

Auth

User

Role

Permission

Dashboard

Asset

AssetCategory

AssetIdentifier

Reservation

ReservationItem

Borrowing

BorrowingItem

InventoryCategory

InventoryItem

StockTransaction

MaintenanceRequest

MaintenanceLog

DamageReport

Notification

Report

AuditLog

Office

Location

Manufacturer

Supplier

SystemSetting

---

# Database Tables

users

roles

permissions

offices

locations

manufacturers

assets

asset_categories

asset_identifiers

reservations

reservation_items

borrowings

borrowing_items

inventory_categories

inventory_items

stock_transactions

suppliers

maintenance_requests

maintenance_logs

damage_reports

notifications

audit_logs

system_settings

units

---

# Controllers

AuthController

UserController

RoleController

PermissionController

DashboardController

AssetController

AssetCategoryController

AssetIdentifierController

ReservationController

BorrowingController

InventoryController

MaintenanceController

NotificationController

ReportController

AuditLogController

OfficeController

LocationController

ManufacturerController

SupplierController

SystemSettingController

---

# Services

AuthService

UserService

RoleService

PermissionService

DashboardService

AssetService

AssetCategoryService

AssetIdentifierService

ReservationService

BorrowingService

InventoryService

MaintenanceService

NotificationService

ReportService

AuditLogService

QRCodeService

BarcodeService

ReceiptService

SearchService

AssetAvailabilityService

---

# Requests

LoginRequest

StoreAssetRequest

UpdateAssetRequest

BorrowAssetRequest

ReturnBorrowedAssetRequest

StoreReservationRequest

ApproveReservationRequest

RejectReservationRequest

StoreInventoryItemRequest

UpdateInventoryItemRequest

StoreMaintenanceRequest

UpdateMaintenanceRequest

---

# Resources

AssetResource

ReservationResource

BorrowingResource

InventoryItemResource

UserResource

NotificationResource

DashboardResource

ReportResource

---

# Policies

UserPolicy

AssetPolicy

ReservationPolicy

BorrowingPolicy

InventoryPolicy

MaintenancePolicy

NotificationPolicy

AuditLogPolicy

---

# Variables

asset

assetId

reservation

reservationId

borrowing

borrowingId

inventoryItem

inventoryItemId

office

officeId

location

locationId

manufacturer

manufacturerId

category

categoryId

identifierType

identifierValue

borrowedAt

dueAt

returnedAt

---

# Route Parameters

{user}

{asset}

{reservation}

{borrowing}

{inventoryItem}

{office}

{location}

---

# Never Use

Equipment

Item

Product

Return

Department

assetCode

equipmentId

itemId

propNo

reserveId