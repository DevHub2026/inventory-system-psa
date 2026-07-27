# AI Decisions - Inventory Import, Export & Employee QR Borrow Request

## Architecture Analysis

### Current QR Scan Flow (BorrowingService::scan)
- When scanning an asset QR (not a receipt), the current flow:
  1. Checks for active borrowing → returns it
  2. Checks for pending reservation → borrows it
  3. Otherwise calls `create()` which requires admin/staff role and creates BORROWED status directly

### Problem
- Employees cannot scan an available asset to create a borrow request
- The current scan flow requires admin/staff roles to create borrowings
- No separate "borrow request" concept exists for employee-initiated scans

### Solution
- The existing `Reservation` model already serves as a "borrow request" (PENDING → APPROVED → BORROWED)
- Employee QR scan on available asset → Create Reservation with PENDING status
- This preserves the existing approval workflow

## Files to Change

### Backend
1. **backend/app/Modules/Borrowing/Services/BorrowingService.php** - Add `requestBorrow()` method for employee scan flow
2. **backend/app/Modules/Borrowing/Controllers/BorrowingController.php** - Add `requestBorrow()` endpoint
3. **backend/app/Modules/Borrowing/Routes/api.php** - Add new route
4. **backend/app/Modules/Inventory/Controllers/InventoryController.php** - Add import/export methods
5. **backend/app/Modules/Inventory/Services/InventoryService.php** - Add import/export logic
6. **backend/app/Modules/Inventory/Routes/api.php** - Add import/export routes
7. **backend/composer.json** - Add PhpSpreadsheet dependency

### Frontend
8. **frontend/src/components/AssetQrScanner.tsx** - Add 'request' mode for employee scanning
9. **frontend/src/services/assetService.ts** - Add `requestBorrow()` method
10. **frontend/src/services/inventoryService.ts** - Add import/export methods
11. **frontend/src/pages/InventoryPage.tsx** - Add Import/Export buttons and UI
12. **frontend/src/types/index.ts** - Add import result types

## Database Changes
- No new migrations required. The existing `reservations` table serves as borrow requests.
- The existing `assets`, `asset_categories`, `locations`, `offices`, `manufacturers` tables are used for import validation.

## New Routes/API Endpoints
- `POST /api/v1/inventory/import` - Import inventory items from Excel
- `GET /api/v1/inventory/export` - Export inventory to Excel
- `POST /api/v1/assets/request-borrow` - Employee QR scan to create borrow request

## Import Excel Format
Columns: name, asset_number, category_name, description, serial_number, model, office_name, location_name, condition_status, purchase_date, purchase_cost, remarks