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
}

export interface Asset {
  id: number
  asset_number: string
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
  issued_by_user_id?: number | null
  date_issued?: string | null
  issued_by_name?: string | null
  identifiers?: Array<{
    id: number
    asset_id: number
    identifier_type: string
    identifier_value: string
    is_primary: boolean
  }>
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
  type?: 'non_expendable' | 'expendable' | string | null
  name: string
  sku?: string
  quantity: number
  status: string
  unit: string
  reorder_level?: number
  remarks?: string | null
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
