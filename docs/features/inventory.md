# Inventory Management

## Overview

Inventory management in this codebase is implemented under the Inventory module. It supports listing items, simple lists for selectors, stock-in/out/adjust/transfer operations, count sessions (cycle counts), import/export, and item history.

## Purpose

Manage consumable and inventory items (stock keeping units) separate from the Asset module (assets are durable property). Inventory endpoints are implemented for inventory officers and authorized roles to perform count sessions, stock adjustments, and imports.

## Who Can Access It

Route registration: backend/app/Modules/Inventory/Routes/api.php registers the inventory routes behind auth:sanctum and role middleware. The following roles are allowed: Super Administrator, System Administrator, Property Custodian, Inventory Officer, Supply Officer, Department Head.

Read access (list/simple) is available to these roles per the route middleware. Backend policies/authorization are authoritative for create/update/delete.

## Where to Find It

- Frontend page: frontend/src/pages/InventoryPage.tsx
- Frontend service: frontend/src/services/inventoryService.ts (and supporting helpers)
- Backend routes: backend/app/Modules/Inventory/Routes/api.php
- Backend controller: backend/app/Modules/Inventory/Controllers/InventoryController.php

## Main Workflow

1. Listing: GET /inventory (InventoryController@index) supports search and filters (see controller for queryable fields and parameters).
2. Simple list: GET /inventory/simple returns compact payloads for select inputs.
3. View details: GET /inventory/{item} (InventoryController@show).
4. Stock operations: POST /inventory/{item}/stock-in, /stock-out, /adjust, /transfer — validated by request classes on backend.
5. Count sessions: create (POST /inventory/count-sessions), record counts, complete, and reconcile.
6. Import/Export: POST /inventory/import and GET /inventory/export endpoints and an import wizard (upload, validate mapping, validate data, execute).

## Available Actions

- CRUD on inventory items (subject to role middleware)
- Stock-in, stock-out, adjust quantities
- Transfer items between locations
- Create and manage count sessions
- Import data via the import wizard and export inventory data

## Role and Permission Behavior

Routes are protected by role middleware — only the listed roles above can access inventory routes. Backend controllers should be consulted for additional policy checks (per-item or per-action checks may exist).

Supply Officer behavior: per route middleware, Supply Officer is included, so UI components in frontend for Supply Officer map to these endpoints. Review frontend/src/services/inventoryService.ts to see which API calls are used and whether UI hides actions for non-authorized roles.

## Status or Lifecycle

Inventory items do not generally have a complex lifecycle like assets. They have quantity, units, reorder levels, and history recorded via history endpoints (GET /inventory/{item}/history).

## Validation and Restrictions

- SKU generation/validation endpoints exist: GET /inventory/validate-sku and GET /inventory/generate-sku.
- Import data is validated via dedicated import wizard endpoints.

## Related Features

- Reports (low-stock, inventory reports) feed from the inventory module.
- Asset module is separate; do not conflate inventory SKUs with asset identifiers.

## Technical Notes

- Source routes: [inventory routes](/C:/Users/salva/Downloads/PSA_DOCS/INVENTORY_SYSTEM/backend/app/Modules/Inventory/Routes/api.php)
- Controller: InventoryController in backend/app/Modules/Inventory/Controllers
- Frontend: [InventoryPage](/C:/Users/salva/Downloads/PSA_DOCS/INVENTORY_SYSTEM/frontend/src/pages/InventoryPage.tsx) and [inventoryService](/C:/Users/salva/Downloads/PSA_DOCS/INVENTORY_SYSTEM/frontend/src/services/inventoryService.ts)

## Source-of-Truth References
- [Inventory routes](/C:/Users/salva/Downloads/PSA_DOCS/INVENTORY_SYSTEM/backend/app/Modules/Inventory/Routes/api.php)
- [InventoryController](/C:/Users/salva/Downloads/PSA_DOCS/INVENTORY_SYSTEM/backend/app/Modules/Inventory/Controllers/InventoryController.php)
- [InventoryPage](/C:/Users/salva/Downloads/PSA_DOCS/INVENTORY_SYSTEM/frontend/src/pages/InventoryPage.tsx)
