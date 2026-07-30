# PSA Inventory System - Web Application Complete Analysis

## Executive Summary

The web application is a comprehensive inventory management system built with:
- **Frontend**: React 19 + TypeScript + Tailwind CSS + Vite
- **Backend**: Laravel (existing API endpoints)
- **Authentication**: Sanctum bearer tokens
- **State**: Context API + localStorage
- **Icons**: Lucide React
- **QR**: @zxing/browser

---

## 1. Application Structure

### Tech Stack
```
React 19.2.7
TypeScript 6.0.2
React Router DOM 7.18.1
Axios 1.18.1
Tailwind CSS 4.3.2
Lucide React 1.24.0
@zxing/browser 0.2.1
```

### Directory Structure
```
frontend/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # Base UI primitives (Button, Modal, etc.)
│   │   ├── AdminDashboard.tsx
│   │   ├── StaffDashboard.tsx
│   │   ├── EmployeeDashboard.tsx
│   │   ├── AssetQrScanner.tsx
│   │   ├── NotificationBell.tsx
│   │   └── ...
│   ├── layouts/          # Layout components
│   │   ├── AppLayout.tsx    # Main shell with sidebar
│   │   ├── Sidebar.tsx      # Navigation sidebar
│   │   └── TopNav.tsx       # Top navigation bar
│   ├── pages/            # Route pages (25+ pages)
│   ├── services/         # API services (20+ services)
│   ├── hooks/            # Custom hooks
│   ├── utils/            # Helper functions
│   ├── types/            # TypeScript types
│   └── routes/           # Route protection
```

---

## 2. Routing & Navigation

### Route Structure
```typescript
/login                    → LoginPage (public)
/dashboard                → DashboardPage (protected)
/qr                       → QRScannerPage (employee QR standalone)
/qr/:identifier           → EmployeeAssetPage
/assets                   → AssetPage
/reservations             → ReservationPage
/borrowings               → BorrowingPage
/borrowings/:id           → BorrowingDetailsPage
/extension-requests       → ExtensionRequestsPage
/issued-assets            → IssuedAssetsPage
/inventory                → InventoryPage
/maintenance              → MaintenancePage
/reports                  → ReportPage
/users                    → UsersPage
/users/:id                → UserProfilePage
/roles                    → RolesPage
/permissions              → PermissionsPage
/system-setup             → SystemSetupPage
/workflows                → WorkflowsPage
/qr-scan-history          → QRScanHistoryPage
/document-templates       → DocumentTemplatesPage
/settings                 → SettingsPage
/sessions                 → SessionsPage
/privacy                  → PrivacyNoticePage
/developers               → DevelopersPage
```

### Navigation Groups (Sidebar)
```
Self Service:
- QR Scanner

Main Menu:
- Dashboard
- Assets
- Borrow Requests (Reservations)
- Borrowed Items (Borrowings)

Operations:
- Extension Requests (Admin, Staff)
- Inventory (Admin, Staff)
- Maintenance (Admin, Staff)
- Reports (Admin, Staff)

Admin:
- Users (Admin only)
- Roles & Permissions (Admin only)
- System Setup (Admin only)
- Approval Workflows (Admin only)
- QR Scan Audit History (Admin, Staff)
- Document Templates (Admin only)

Account:
- Settings
- Development Team
```

---

## 3. User Roles & Permissions

### Role Hierarchy
```
Admin (Highest privileges)
├── Full system access
├── User management
├── Role management
├── System setup
├── Workflow configuration
├── All reports
└── All operations

Staff (Medium privileges)
├── Asset management
├── Borrow approval
├── Inventory management
├── Maintenance management
├── Extension approval
└── Limited reports

Employee (Basic privileges)
├── View assets
├── Request borrow
├── View own borrowings
├── QR scanning
└── Profile settings
```

### Role-Based Features
```typescript
// Role check utilities
isAdmin(user)     → Full access
isStaff(user)     → Operations access
isEmployee(user)  → Self-service access
```

---

## 4. Dashboard by Role

### Admin Dashboard
**Components**: AdminDashboard.tsx

**Statistics Cards** (Displayed in grid):
1. Total Assets (Blue)
   - Number + trend
   - Icon: Boxes
   
2. Available Assets (Green)
   - Number + percentage
   - Icon: CheckCircle
   
3. Borrowed Assets (Purple)
   - Active loans
   - Icon: HandCoins
   
4. Reserved Assets (Amber)
   - Pending approvals
   - Icon: ClipboardList
   
5. Maintenance (Orange)
   - Items in maintenance
   - Icon: Wrench
   
6. Total Users (Blue)
   - Active users count
   - Icon: Users

**Sections**:
- Asset Summary Panel
- Inventory Overview
- Recent Activity Log
- Quick Actions (shortcuts)
- Pending Approvals
- System Health Metrics

### Staff Dashboard
**Components**: StaffDashboard.tsx

**Focus Areas**:
- Pending borrow requests
- Active borrowings
- Due returns
- Maintenance schedules
- Inventory alerts
- Quick approval actions

### Employee Dashboard
**Components**: EmployeeDashboard.tsx

**My Activity**:
- My borrow requests (pending)
- My borrowed items (active)
- Due soon items
- Overdue items
- QR scan history
- Quick actions (scan QR, view assets)

---

## 5. Core Features by Module

### 5.1 Assets Module

**Page**: AssetPage.tsx
**Service**: assetService.ts

**Features**:
- ✅ Asset list with pagination
- ✅ Search by name, number, QR ID
- ✅ Filter by status (Available, Borrowed, Reserved, Maintenance, Disposed)
- ✅ Create new asset
- ✅ Edit asset details
- ✅ Delete asset
- ✅ View asset details modal
- ✅ Asset QR code display/print
- ✅ Asset image upload
- ✅ Asset status management
- ✅ Asset history/audit trail
- ✅ Borrow asset (direct)
- ✅ Return asset
- ✅ Reserve asset
- ✅ Asset issuance/reissuance
- ✅ Bulk import via CSV/Excel
- ✅ Export asset list

**Data Model**:
```typescript
Asset {
  id, asset_number, psa_qr_identifier, name,
  description, status, condition_status,
  category, location, office,
  purchase_date, purchase_cost, warranty_until,
  issued_to, date_issued,
  identifiers[], reservation_context
}
```

**Statuses**:
- AVAILABLE
- RESERVED
- BORROWED
- MAINTENANCE
- UNAVAILABLE
- RETIRED
- DISPOSED

### 5.2 Borrowing Module

**Pages**: 
- BorrowingPage.tsx (list)
- BorrowingDetailsPage.tsx (detail view)

**Service**: borrowingService.ts

**Features**:
- ✅ Active borrowings list
- ✅ Borrowing history
- ✅ Filter by status (Active, Returned, Overdue)
- ✅ View borrowing details
- ✅ Return process
- ✅ Extension requests
- ✅ Overdue tracking
- ✅ Receipt generation/print
- ✅ QR code for receipt
- ✅ Borrowing approval workflow
- ✅ Bulk return
- ✅ Search by employee, asset

**Data Model**:
```typescript
Borrowing {
  id, user_id, asset_id,
  asset_name, asset_number,
  employee_name, status,
  borrow_date, due_date,
  returned_at, remarks,
  authorized_by_name, authorized_at,
  receipt_code, receipt_payload,
  has_pending_extension
}
```

**Statuses**:
- BORROWED / ACTIVE
- PARTIALLY_RETURNED
- RETURNED
- OVERDUE

### 5.3 Reservations (Borrow Requests)

**Page**: ReservationPage.tsx
**Service**: reservationService.ts

**Features**:
- ✅ Create borrow request
- ✅ Pending requests list
- ✅ Approved requests list
- ✅ Rejected requests list
- ✅ Cancel request
- ✅ Approve request (Staff/Admin)
- ✅ Reject request (Staff/Admin)
- ✅ Release asset (convert to borrowing)
- ✅ View request details
- ✅ Receipt with QR code
- ✅ Multi-asset reservation
- ✅ Date range selection
- ✅ Purpose/remarks field

**Data Model**:
```typescript
Reservation {
  id, user_id, purpose,
  employee_name, status,
  start_date, end_date,
  remarks, authorized_by_name,
  authorized_at, asset_ids[],
  asset_names[], receipt_code
}
```

**Statuses**:
- PENDING
- APPROVED
- REJECTED
- CANCELLED
- EXPIRED

**Workflow**:
1. Employee requests borrow
2. Staff/Admin approves
3. Staff releases asset (creates borrowing)
4. Employee receives asset
5. Employee returns asset

### 5.4 Extension Requests

**Page**: ExtensionRequestsPage.tsx
**Service**: borrowExtensionService.ts

**Features**:
- ✅ Request extension for active borrowing
- ✅ Pending extensions list
- ✅ Approved/Rejected extensions
- ✅ Approve extension (Staff/Admin)
- ✅ Reject extension (Staff/Admin)
- ✅ View current vs requested due date
- ✅ Extension reason display
- ✅ Reviewer remarks

**Data Model**:
```typescript
BorrowExtensionRequest {
  id, borrowing_id,
  current_due_date, requested_due_date,
  reason, status, remarks,
  reviewed_by_name, reviewed_at
}
```

### 5.5 Inventory Module

**Page**: InventoryPage.tsx
**Service**: inventoryService.ts

**Features**:
- ✅ Inventory item list
- ✅ Expendable vs Non-Expendable tabs
- ✅ Stock level tracking
- ✅ Low stock alerts
- ✅ Out of stock alerts
- ✅ Stock adjustment
- ✅ Stock movements history
- ✅ Reorder level management
- ✅ Create/Edit/Delete inventory items
- ✅ Search and filter
- ✅ Import via CSV/Excel

**Data Model**:
```typescript
InventoryItem {
  id, name, sku, quantity,
  unit, reorder_level,
  type (expendable/non_expendable),
  status, description, remarks,
  category, office, location
}
```

### 5.6 Maintenance Module

**Page**: MaintenancePage.tsx
**Service**: maintenanceService.ts

**Features**:
- ✅ Maintenance schedules
- ✅ Maintenance logs
- ✅ Create maintenance request
- ✅ Schedule maintenance
- ✅ Complete maintenance
- ✅ Cancel maintenance
- ✅ Filter by status (Scheduled, In Progress, Completed)
- ✅ Asset maintenance history
- ✅ Maintenance cost tracking
- ✅ Technician assignment

**Data Model**:
```typescript
MaintenanceRequest {
  id, asset_id, asset_name,
  description, status,
  scheduled_date, scheduled_at,
  completed_at, cost,
  technician_id, remarks
}
```

**Statuses**:
- scheduled
- in_progress
- completed
- cancelled

### 5.7 Reports Module

**Page**: ReportPage.tsx
**Service**: reportService.ts

**Features**:
- ✅ Asset utilization report
- ✅ Borrowing statistics
- ✅ Inventory stock report
- ✅ Maintenance summary
- ✅ User activity report
- ✅ Overdue items report
- ✅ Asset depreciation
- ✅ Custom date range
- ✅ Export to PDF/Excel
- ✅ Charts and visualizations
- ✅ Filterable by office, category, status

### 5.8 Users Module

**Page**: UsersPage.tsx, UserProfilePage.tsx
**Service**: userService.ts

**Features**:
- ✅ User list with pagination
- ✅ Search users
- ✅ Filter by role, status, department
- ✅ Create new user
- ✅ Edit user details
- ✅ Deactivate/Activate user
- ✅ View user profile
- ✅ User borrowing history
- ✅ Assigned assets
- ✅ User statistics
- ✅ Role assignment
- ✅ Department assignment
- ✅ Office assignment

**Data Model**:
```typescript
User {
  id, employee_number, username,
  first_name, middle_name, last_name,
  full_name, email,
  department_id, department,
  office_id, office,
  status, roles[]
}
```

### 5.9 Roles & Permissions

**Pages**: RolesPage.tsx, PermissionsPage.tsx
**Services**: roleService.ts, permissionService.ts

**Features**:
- ✅ Role management (CRUD)
- ✅ Permission assignment
- ✅ Permission matrix
- ✅ Role-based access control
- ✅ Custom role creation
- ✅ Permission groups
- ✅ Role hierarchy

### 5.10 System Setup

**Page**: SystemSetupPage.tsx
**Service**: setupService.ts

**Features**:
- ✅ Asset Categories
- ✅ Manufacturers
- ✅ Offices
- ✅ Locations
- ✅ Departments
- ✅ Units of Measurement
- ✅ System configurations
- ✅ CRUD operations for all setup entities

### 5.11 Workflows

**Page**: WorkflowsPage.tsx
**Service**: workflowService.ts

**Features**:
- ✅ Approval workflow configuration
- ✅ Multi-level approvals
- ✅ Sequential/Parallel approvals
- ✅ Role-based approvers
- ✅ Conditional routing
- ✅ Escalation rules
- ✅ Workflow versioning
- ✅ Audit trail

**Supported Workflows**:
- Borrow Request Approval
- Extension Request Approval
- Asset Issuance Approval
- Asset Reissuance Approval
- Maintenance Request Approval
- Lost Asset Report Approval
- Clearance Processing

### 5.12 QR Scanner

**Pages**: QRScannerPage.tsx, EmployeeAssetPage.tsx
**Component**: AssetQrScanner.tsx
**Service**: qrService.ts

**Features**:
- ✅ Camera-based QR scanning
- ✅ Manual code entry fallback
- ✅ Scan asset QR codes
- ✅ Scan transaction receipts
- ✅ Role-based actions:
  - Employee: View asset, Request borrow, Report issues
  - Staff: All employee actions + Approve, Release, Return
  - Admin: All actions
- ✅ Asset details display
- ✅ Transaction status display
- ✅ QR code generation
- ✅ Print QR labels
- ✅ Scan history tracking

### 5.13 Notifications

**Component**: NotificationBell.tsx
**Service**: notificationService.ts

**Features**:
- ✅ Real-time notifications
- ✅ Notification badge count
- ✅ Mark as read
- ✅ Mark all as read
- ✅ Notification types:
  - Borrow request submitted
  - Borrow approved/rejected
  - Extension requested
  - Extension approved/rejected
  - Due date reminder
  - Overdue alert
  - Maintenance scheduled
  - Asset status changed
- ✅ Notification preferences

### 5.14 Document Templates

**Page**: DocumentTemplatesPage.tsx
**Service**: templateService.ts

**Features**:
- ✅ Template management
- ✅ Receipt templates
- ✅ Report templates
- ✅ Email templates
- ✅ Template variables
- ✅ Preview and test
- ✅ Version control

### 5.15 QR Scan History

**Page**: QRScanHistoryPage.tsx

**Features**:
- ✅ Audit log of all QR scans
- ✅ Filter by date, user, asset
- ✅ Export scan history
- ✅ Device and browser info
- ✅ IP address tracking
- ✅ Action performed logging

### 5.16 Settings & Profile

**Page**: SettingsPage.tsx

**Features**:
- ✅ Profile information
- ✅ Change password
- ✅ Email preferences
- ✅ Notification settings
- ✅ Theme preferences
- ✅ Language selection
- ✅ Active sessions management

---

## 6. UI Component Library

### Base Components (components/ui/)
```
- Badge
- Button (Primary, Secondary, Danger, Ghost)
- Card
- Checkbox
- Dialog/Modal
- Dropdown
- Input (Text, Number, Date, Search)
- Label
- Pagination
- Radio
- Select/Combobox
- Spinner/Loading
- Table
- Tabs
- Textarea
- Toast/Alert
```

### Specialized Components
```
- DashboardStatCard        → Stat display with icon
- AssetQrScanner           → Camera QR scanner
- NotificationBell         → Notification dropdown
- ReceiptModal             → Print receipt with QR
- PageHeader               → Consistent page headers
- RoleBadges               → Display user roles
- QrCode                   → Generate QR codes
- ErrorBoundary            → Error handling
```

---

## 7. Design System

### Colors (PSA Brand)
```css
Primary Blue:   #0B3D91 (PSA brand)
Primary Hover:  #1565C0
Yellow Accent:  #FFD400 (PSA yellow)
Red Alert:      #E31C23 (PSA red)

Success:  #2E7D32 (green)
Warning:  #F9A825 (amber)
Danger:   #D32F2F (red)
Info:     #0288D1 (blue)
Purple:   #7C3AED
Teal:     #0F766E

Background:     #F5F7FA
Surface:        #F8FAFC
Card:           #FFFFFF
Border:         #E5E7EB
Text Primary:   #1F2937
Text Secondary: #6B7280
Text Muted:     #9CA3AF
```

### Typography
```
Font Family: Inter
Page Title:    32px, weight 700
Section Title: 22px, weight 600
Card Title:    14px, weight 600
Body:          14px, weight 400
Secondary:     13px, weight 500
Small:         12px, weight 500
```

### Spacing (4px base)
```
space-1:  4px
space-2:  8px
space-3:  12px
space-4:  16px
space-5:  20px
space-6:  24px
space-8:  32px
```

### Border Radius
```
xs:  4px
sm:  6px
md:  10px (default)
lg:  12px
xl:  16px
2xl: 20px
```

### Shadows
```
xs:  0 1px 2px rgba(0,0,0,.05)
sm:  0 2px 6px rgba(0,0,0,.06)
md:  0 4px 12px rgba(0,0,0,.08)
lg:  0 8px 24px rgba(0,0,0,.10)
xl:  0 16px 40px rgba(0,0,0,.12)
```

---

## 8. API Integration Patterns

### Base Configuration
```typescript
baseURL: /api/v1
Headers:
  - Accept: application/json
  - Content-Type: application/json
  - Authorization: Bearer {token}
```

### Request Interceptor
- Adds bearer token from localStorage
- Attaches to all requests

### Response Interceptor
- Unwraps `data` envelope
- Handles 401 (redirect to login)
- Handles 403 (permission denied)
- Handles 404 (not found)
- Handles 422 (validation errors)
- Handles 500+ (server errors)

### Response Format
```typescript
{
  success: boolean
  message: string
  data: T | T[] | Paginated<T>
}
```

### Pagination Response
```typescript
{
  success: true,
  message: "...",
  data: {
    items: T[],
    meta: {
      current_page: number,
      per_page: number,
      total: number,
      last_page: number
    },
    links: {
      first, last, prev, next
    }
  }
}
```

---

## 9. State Management

### Authentication State
- Stored in localStorage
- Keys: `prototype_token`, `prototype_user`
- useAuth() hook provides:
  - user (current user)
  - loading (auth check in progress)
  - login(email, password)
  - logout()

### Local State
- useState for component state
- useEffect for data fetching
- Pull-to-refresh pattern

### Data Refresh
- Manual refresh buttons
- Automatic refresh after mutations
- notifyDataChanged() utility

---

## 10. Common UI Patterns

### List Pages
1. Page header with title + actions
2. Search bar
3. Filter chips/dropdowns
4. Data table or card grid
5. Pagination controls
6. Empty state
7. Loading spinner
8. Error state

### Detail Modals
1. Modal header with title + close
2. Tabbed sections (Info, History, etc.)
3. Read-only fields
4. Action buttons (Edit, Delete, etc.)
5. Related data sections

### Forms
1. Form fields grouped logically
2. Inline validation
3. Required field indicators
4. Submit + Cancel buttons
5. Loading state during submit
6. Success/Error messages

### Tables
1. Column headers with sort icons
2. Row actions (View, Edit, Delete)
3. Status badges
4. Pagination
5. Empty state
6. Loading skeleton

### Status Badges
- Pill-shaped
- Color-coded by status
- Uppercase text
- Small font (11px)
- Semantic colors

---

## 11. Key Workflows

### Borrow Workflow
```
1. Employee: Request borrow (Reservation)
   → Creates PENDING reservation
   → Receipt with QR code generated

2. Staff/Admin: Approve request
   → Reservation status → APPROVED
   → Notification sent to employee

3. Staff: Release asset (scan QR or manual)
   → Creates BORROWED transaction
   → Asset status → BORROWED
   → Receipt with QR code generated

4. Employee: Return asset (scan QR or manual)
   → Borrowing status → RETURNED
   → Asset status → AVAILABLE
   → Notification sent
```

### Extension Workflow
```
1. Employee: Request extension
   → Creates extension request
   → Links to active borrowing

2. Staff/Admin: Approve/Reject
   → If approved: Updates due_date
   → Notification sent
```

### Asset Issuance Workflow
```
1. Admin: Issue asset to employee
   → Assigns asset permanently
   → Creates issuance record
   → Asset status → ISSUED

2. Admin: Reissue to new employee
   → Transfers ownership
   → Creates reissuance record
   → Updates history
```

---

## 12. Mobile Considerations

### Responsive Breakpoints
```
Mobile:  < 640px
Tablet:  640px - 1024px
Desktop: > 1024px
```

### Mobile Adaptations Needed
```
Sidebar → Bottom Navigation or Drawer
Tables → Card List
Multi-column Grids → Single/Double Column
Large Forms → Multi-step Wizard
Desktop Modals → Bottom Sheets or Full Page
Hover States → Tap/Active States
```

### Touch-Friendly
- Minimum tap target: 44x44px
- Spacing between interactive elements
- Swipe gestures (optional)
- Pull-to-refresh
- Bottom sheet modals

---

## 13. Key Business Rules

### Asset Management
- Asset must have unique asset_number
- PSA QR identifier is optional but recommended
- Asset status determines availability
- RESERVED assets require approved reservation
- BORROWED assets have active borrowing record

### Borrowing
- Only AVAILABLE assets can be borrowed
- Due date required
- Maximum borrow duration configurable
- Overdue tracking automatic
- Can request extension before due date
- Cannot borrow asset already reserved by others

### Reservations
- Can reserve multiple assets
- Approval required before release
- Expires if not released within timeframe
- Can be cancelled before approval
- Rejected requests cannot be reactivated

### Inventory
- Quantity must be >= 0
- Low stock alert at reorder level
- Stock movements tracked
- Expendable items consumed
- Non-expendable items tracked like assets

### Maintenance
- Asset unavailable during maintenance
- Scheduled maintenance can be rescheduled
- Completed maintenance returns asset to previous status
- Cost tracking optional

---

## 14. Security & Permissions

### Route Protection
- All routes except /login require authentication
- Role-based page access
- Protected by ProtectedRoute component

### Permission Checks
- isAdmin(), isStaff(), isEmployee() utilities
- Feature flags in UI based on role
- API enforces permissions server-side

### Session Management
- Bearer token in localStorage
- Token sent with all requests
- 401 response clears session and redirects to login
- Optional: Session timeout

---

## 15. Print Features

### Printable Documents
- Asset QR labels
- Borrowing receipts
- Reservation receipts
- Asset lists
- Reports

### Print Styling
- Dedicated print CSS
- Hide navigation
- Optimize layout for paper
- Black and white friendly
- QR codes prominent

---

## 16. Accessibility

### Current Implementation
- Semantic HTML
- ARIA labels on icons
- Keyboard navigation support
- Focus visible states
- Alt text on images
- Role attributes
- Screen reader friendly messages

### Recommendations
- High contrast mode
- Screen reader announcements for dynamic content
- Focus management in modals
- Skip navigation links

---

## 17. Performance Considerations

### Current Optimizations
- Code splitting by route
- Lazy loading of pages
- Memoized expensive computations
- Debounced search inputs
- Pagination for large lists

### Mobile-Specific
- Optimize images
- Reduce bundle size
- Minimize re-renders
- Efficient list rendering (virtualization for long lists)
- Caching strategies

---

## Summary for Mobile Implementation

### Must Match 1:1
1. ✅ All pages and routes
2. ✅ All CRUD operations
3. ✅ All user roles and permissions
4. ✅ All API endpoints (reuse existing)
5. ✅ All business rules
6. ✅ UI colors, fonts, spacing
7. ✅ Status badges and icons
8. ✅ QR scanning functionality
9. ✅ Receipt generation
10. ✅ Notification system

### Adapt for Mobile
1. Navigation: Sidebar → Bottom Nav + Drawer
2. Tables → Card Lists
3. Modals → Bottom Sheets
4. Grid Layouts → Responsive Columns
5. Touch Targets → Minimum 44px
6. Pull-to-Refresh
7. Mobile-optimized forms

### Priority Order
1. Authentication & User Management
2. Dashboard (Role-based)
3. Assets Module
4. QR Scanner
5. Borrowing Module
6. Reservations Module
7. Inventory Module
8. Maintenance Module
9. Reports Module
10. Settings & Profile
11. Admin Features (Users, Roles, Setup, Workflows)
12. Notifications
13. Advanced Features

---

**Next Step**: Compare with current mobile app to identify gaps and create implementation plan.
