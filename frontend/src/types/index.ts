export type AssetStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'BORROWED'
  | 'MAINTENANCE'
  | 'UNAVAILABLE'
  | 'RETIRED'
  | 'DISPOSED'

export type ReservationStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED'

export type BorrowingStatus =
  | 'BORROWED'
  | 'ACTIVE'
  | 'PARTIALLY_RETURNED'
  | 'RETURNED'
  | 'OVERDUE'

export type MaintenanceStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export type ExtensionRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

/** Matches Auth UserResource (+ optional display helpers). */
export interface User {
  id: number
  employee_number?: string | null
  username?: string | null
  first_name?: string
  middle_name?: string | null
  last_name?: string
  full_name?: string
  name?: string
  email: string
  department_id?: number | null
  department?: {
    id: number
    name: string
  } | null
  office_id?: number | null
  office?: {
    id: number
    name: string
  } | null
  status?: string
  roles?: Array<{
    id: number
    name: string
  }>
  created_at?: string | null
}

export interface Asset {
  id: number
  asset_number: string
  property_number?: string | null
  psa_qr_identifier?: string | null
  psa_qr_payload?: string | null
  name: string
  description?: string | null
  asset_category_id?: number
  manufacturer_id?: number | null
  office_id?: number
  location_id?: number | null
  model?: string | null
  category?: string
  status: AssetStatus
  condition_status?: string | null
  location?: string | null
  office?: string | null
  remarks?: string | null
  purchase_date?: string | null
  purchase_cost?: string | number | null
  warranty_until?: string | null
  issued_to?: string | null
  issued_to_user_id?: number | null
  issued_to_user?: {
    id: number
    full_name?: string
    employee_number?: string | null
    email?: string | null
    department?: string | null
    office?: string | null
    roles?: string[]
  } | null
  is_unlinked_holder?: boolean
  issued_by_user_id?: number | null
  date_issued?: string | null
  issued_by_name?: string | null
  created_by?: number | null
  updated_by?: number | null
  created_by_name?: string | null
  updated_by_name?: string | null
  created_at?: string | null
  updated_at?: string | null
  identifiers?: Array<{
    id: number
    asset_id: number
    identifier_type: string
    identifier_value: string
    is_primary: boolean
  }>
  /**
   * Populated by the backend only when status === 'RESERVED'.
   * Contains the reservation (PENDING or APPROVED) that is holding this asset.
   * null when the asset is not reserved.
   */
  reservation_context?: {
    id: number
    status: 'PENDING' | 'APPROVED'
    workflow_status?: string | null
    requester_name?: string | null
    authorized_by_name?: string | null
    authorized_at?: string | null
  } | null
}

export interface Reservation {
  id: number
  user_id?: number
  purpose?: string
  employee_name?: string
  status: ReservationStatus
  start_date?: string
  end_date?: string
  reserved_from?: string
  reserved_until?: string
  remarks?: string | null
  created_at?: string
  authorized_by?: number | null
  authorized_by_name?: string | null
  authorized_at?: string | null
  asset_ids?: number[]
  asset_names?: string[]
  asset_numbers?: string[]
  receipt_code?: string
  receipt_payload?: string
}

export interface Borrowing {
  id: number
  user_id?: number
  employee_id?: string | null
  asset_id?: number
  asset_name?: string
  asset_number?: string
  asset_code?: string | null
  employee_name?: string
  quantity?: number
  status: BorrowingStatus
  borrow_date?: string
  due_date?: string
  borrowed_at?: string
  due_at?: string
  returned_at?: string | null
  remarks?: string | null
  created_at?: string
  authorized_by?: number | null
  authorized_by_name?: string | null
  authorized_at?: string | null
  receipt_code?: string
  receipt_payload?: string
  has_pending_extension?: boolean
}

export interface InventoryItem {
  id: number
  asset_id?: number | null
  asset_number?: string | null
  property_number?: string | null
  type?: 'non_expendable' | 'expendable' | string | null
  classification?: 'PPE' | 'SE' | 'SUPPLY' | string | null
  item_nature?: 'ACCOUNTABLE_PROPERTY' | 'CONSUMABLE_SUPPLY' | string | null
  classification_reason?: string | null
  name: string
  sku?: string
  quantity: number
  status: string
  unit: string
  reorder_level?: number
  remarks?: string | null
  description?: string | null
  asset_category_id?: number | null
  manufacturer_id?: number | null
  office_id?: number | null
  location_id?: number | null
  accountability?: string | null
  is_unlinked_holder?: boolean
  created_by?: number | null
  updated_by?: number | null
  created_by_name?: string | null
  updated_by_name?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface BorrowRequestResult {
  id: number
  status: string
  asset_id: number
  asset_name: string
  asset_number: string
  employee_name: string
  created_at: string
  message: string
}

export interface ImportResult {
  imported: number
  skipped: number
  failed: number
  errors: string[]
}

export interface StockMovement {
  id: number
  inventory_item_id: number
  item_name?: string | null
  type: 'stock_in' | 'stock_out' | 'adjustment' | string
  quantity: number
  quantity_before: number
  quantity_after: number
  reason?: string | null
  remarks?: string | null
  performed_by?: string | null
  created_at?: string | null
}

export interface MaintenanceRequest {
  id: number
  asset_id?: number
  asset_name: string
  description: string
  status: MaintenanceStatus
  scheduled_date?: string
  scheduled_at?: string
}

export interface BorrowExtensionRequest {
  id: number
  borrowing_id: number
  current_due_date: string
  requested_due_date: string
  reason: string
  status: ExtensionRequestStatus
  remarks?: string | null
  reviewed_by?: number | null
  reviewed_by_name?: string | null
  reviewed_at?: string | null
  created_at?: string
}

export interface DashboardStats {
  total_assets: number
  available: number
  borrowed: number
  reserved: number
  maintenance: number
  assets: {
    total: number
    available: number
    borrowed: number
    reserved: number
    maintenance: number
    reissued_this_month?: number
  }
  inventory: {
    total: number
    expendable: number
    non_expendable: number
    low_stock: number
    out_of_stock: number
  }
  borrowings: {
    active: number
    returned: number
    pending_requests: number
    approved_requests: number
  }
  reservations: {
    pending: number
    approved: number
    rejected: number
  }
  users: {
    total: number
    active: number
    employees: number
    staff: number
    administrators: number
  }
}

export interface ActivityItem {
  id: string | number
  action: string
  user: string
  module: string
  created_at: string
}

export interface AppNotification {
  id: number
  title: string
  message: string
  type: string
  is_read: boolean
  read_at?: string | null
  related_id?: number | null
  related_type?: string | null
  data?: Record<string, unknown> | null
  link?: string | null
  created_at: string
}

export interface Paginated<T> {
  items: T[]
  meta: {
    current_page: number
    per_page: number
    total: number
    last_page: number
  }
  links?: {
    first?: string | null
    last?: string | null
    prev?: string | null
    next?: string | null
  }
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export function displayName(user: User | null | undefined): string {
  if (!user) return 'User'
  // Prefer the most specific/complete name available, trimmed
  if (user.full_name?.trim()) return user.full_name.trim()
  if (user.name?.trim()) return user.name.trim()
  const parts = [user.first_name, user.last_name].map((p) => p?.trim()).filter(Boolean)
  if (parts.length > 0) return parts.join(' ')
  return user.email
}

/* ── Workflow Engine Types ── */

export type WorkflowModuleType =
  | 'borrow_request'
  | 'borrow_extension_request'
  | 'asset_issuance'
  | 'asset_reissuance'
  | 'clearance_processing'
  | 'maintenance_request'
  | 'lost_asset_report'

export type ApprovalType = 'single' | 'any' | 'all'

export interface WorkflowOptions {
  auto_approve_no_approver?: boolean
  skip_disabled_levels?: boolean
  allow_rejection_any_level?: boolean
  allow_request_cancellation?: boolean
  allow_requester_withdrawal?: boolean
  require_remarks_on_rejection?: boolean
  require_remarks_on_approval?: boolean
}

export interface WorkflowApprovalLevel {
  id?: number
  workflow_version_id?: number
  level_order: number
  name: string
  roles?: string[]
  user_ids?: number[]
  office_id?: number | null
  department_id?: number | null
  office?: { id: number; name: string; code?: string }
  department?: { id: number; name: string; code?: string }
  approval_type: ApprovalType
  is_enabled: boolean
  execution_type?: 'sequential' | 'parallel'
  parallel_group_id?: string | null
  conditions?: Record<string, unknown> | null
  escalation_hours?: number | null
  escalate_to_roles?: string[] | null
  escalate_to_user_ids?: number[] | null
  allow_delegation?: boolean
}

export interface WorkflowVersion {
  id: number
  workflow_id: number
  version_number: number
  options?: WorkflowOptions
  change_summary?: string
  created_by?: number
  creator?: { id: number; name?: string; full_name?: string; email: string }
  created_at: string
  approval_levels?: WorkflowApprovalLevel[]
}

export interface Workflow {
  id: number
  name: string
  module_type: WorkflowModuleType
  description?: string | null
  is_active: boolean
  is_archived: boolean
  current_version_id?: number | null
  current_version?: WorkflowVersion
  options?: WorkflowOptions
  created_by?: number | null
  updated_by?: number | null
  creator?: { id: number; name?: string; full_name?: string; email: string }
  created_at: string
  updated_at: string
}

export interface WorkflowApprovalHistory {
  id: number
  request_type: string
  request_id: number
  workflow_id?: number | null
  workflow_version_id?: number | null
  approval_level_id?: number | null
  level_order?: number | null
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'WITHDRAWN' | 'SKIPPED' | 'AUTO_APPROVED' | 'DELEGATED' | 'ESCALATED'
  user_id?: number | null
  user?: { id: number; name?: string; full_name?: string; email: string }
  role?: string | null
  office_id?: number | null
  office?: { id: number; name: string }
  department_id?: number | null
  department?: { id: number; name: string }
  remarks?: string | null
  metadata?: Record<string, unknown> | null
  created_at: string
}

export interface WorkflowAuditLog {
  id: number
  workflow_id?: number | null
  user_id?: number | null
  user?: { id: number; name?: string; full_name?: string; email: string }
  action: string
  previous_value?: Record<string, unknown> | null
  new_value?: Record<string, unknown> | null
  ip_address?: string | null
  user_agent?: string | null
  created_at: string
}

export interface QrScanHistory {
  id: number
  asset_id: number
  user_id?: number | null
  action_performed: string
  device?: string | null
  platform?: string | null
  browser?: string | null
  ip_address?: string | null
  scanned_at: string
  asset?: Asset
  user?: User
}

export interface LostAssetReport {
  id: number
  asset_id: number
  asset_name?: string
  asset_number?: string
  reporter_id: number
  reporter_name?: string
  description: string
  last_known_location?: string | null
  date_lost?: string | null
  remarks?: string | null
  status: string
  workflow_status?: string | null
  current_level_order?: number | null
  created_at: string
}

/* ── Phase 7 — QR Scan Role-Based Types ── */

export type QrType = 'ASSET' | 'BORROWING_RECEIPT' | 'RETURN_RECEIPT' | 'UNKNOWN'

export type AvailableAction =
  | 'VIEW_ASSET_DETAILS'
  | 'REQUEST_BORROW'
  | 'REPORT_DAMAGE'
  | 'REPORT_LOST'
  | 'APPROVE_RELEASE'
  | 'APPROVE_REQUEST'
  | 'RELEASE_ASSET'
  | 'RETURN_ASSET'
  | 'VIEW_BORROWING_STATUS'

export interface QrContext {
  qr_type: QrType
  error?: string | null
  message?: string | null
  asset?: Asset | null
  reservation?: {
    id: number
    requester_name?: string
    employee_number?: string | null
    department?: string | null
    office?: string | null
    asset_name?: string
    asset_number?: string
    requested_date?: string
    expected_return_date?: string | null
    status: string
    workflow_status?: string | null
    current_level_order?: number | null
    remarks?: string | null
    authorized_by_name?: string | null
    authorized_at?: string | null
  } | null
  borrowing?: {
    id: number
    borrower_name?: string
    employee_number?: string | null
    department?: string | null
    office?: string | null
    asset_name?: string
    asset_number?: string
    requested_date?: string
    borrowed_at?: string | null
    due_date?: string | null
    returned_at?: string | null
    status: string
    remarks?: string | null
    authorized_by_name?: string | null
    authorized_at?: string | null
  } | null
  my_active_borrowing?: {
    id: number
    due_date?: string
    status: string
  } | null
  my_pending_reservation?: {
    id: number
    status: string
  } | null
  active_maintenance?: {
    id: number
    type: string
    status: string
  } | null
  my_pending_lost_report?: {
    id: number
    status: string
  } | null
  asset_status?: string | null
  borrowing_status?: string | null
  workflow_status?: string | null
  is_owner?: boolean
  user_permissions?: {
    is_admin: boolean
    is_employee: boolean
  }
  available_actions: AvailableAction[]
}

export interface AssetContext {
  asset: {
    id: number
    asset_number: string
    name: string
    description?: string | null
    model?: string | null
    status: AssetStatus
    condition_status?: string | null
    psa_qr_identifier?: string | null
    category?: { id: number; name: string } | null
    manufacturer?: { id: number; name: string } | null
    office?: { id: number; name: string } | null
    location?: { id: number; name: string } | null
    issued_to?: string | null
    issued_to_user_id?: number | null
    issued_by_name?: string | null
    issued_to_name?: string | null
    date_issued?: string | null
    created_at?: string | null
    updated_at?: string | null
  }
  active_borrowing?: {
    id: number
    user_name?: string
    borrow_date?: string
    due_date?: string
    status: string
  } | null
  my_active_borrowing?: {
    id: number
    due_date?: string
    status: string
  } | null
  pending_reservation?: {
    id: number
    user_name?: string
    start_date?: string
    end_date?: string
    workflow_status?: string | null
    current_level_order?: number | null
  } | null
  my_pending_reservation?: {
    id: number
    status: string
    workflow_status?: string | null
  } | null
  my_pending_extension?: {
    id: number
    status: string
  } | null
  active_maintenance?: {
    id: number
    type: string
    status: string
  } | null
  my_pending_lost_report?: {
    id: number
    status: string
  } | null
  actions: {
    can_request_borrow: boolean
    can_request_extension: boolean
    can_request_reissuance: boolean
    can_report_damage: boolean
    can_report_lost: boolean
  }
  history: {
    borrow_history: Array<{
      id: number
      user_name?: string
      borrow_date?: string
      due_date?: string
      returned_at?: string | null
      status: string
    }>
    my_reservation_history: Array<{
      id: number
      status: string
      start_date?: string
      end_date?: string
      created_at?: string
      workflow_status?: string | null
    }>
    maintenance_history: Array<{
      id: number
      type: string
      status: string
      description?: string | null
      created_at?: string
    }>
    lost_report_history: Array<{
      id: number
      status: string
      description: string
      date_lost?: string | null
      created_at?: string
    }>
  }
}