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
  | 'ACTIVE'
  | 'PARTIALLY_RETURNED'
  | 'RETURNED'
  | 'OVERDUE'

export type MaintenanceStatus =
  | 'PENDING'
  | 'ONGOING'
  | 'COMPLETED'
  | 'CANCELLED'

/** Matches Auth UserResource (+ optional display helpers). */
export interface User {
  id: number
  employee_number?: string | null
  first_name?: string
  middle_name?: string | null
  last_name?: string
  full_name?: string
  name?: string
  email: string
  department_id?: number | null
  status?: string
}

export interface Asset {
  id: number
  asset_number: string
  name: string
  category?: string
  status: AssetStatus
  location?: string | null
  office?: string | null
}

export interface Reservation {
  id: number
  purpose: string
  employee_name: string
  status: ReservationStatus
  reserved_from: string
  reserved_until: string
}

export interface Borrowing {
  id: number
  asset_name: string
  employee_name: string
  status: BorrowingStatus
  borrowed_at: string
  due_at: string
}

export interface InventoryItem {
  id: number
  name: string
  quantity: number
  status: string
  unit: string
}

export interface MaintenanceRequest {
  id: number
  asset_name: string
  description: string
  status: MaintenanceStatus
  scheduled_at: string
}

export interface DashboardStats {
  total_assets: number
  available: number
  borrowed: number
  reserved: number
  maintenance: number
}

export interface ActivityItem {
  id: number
  action: string
  user: string
  module: string
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
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export function displayName(user: User | null | undefined): string {
  if (!user) return 'User'
  return user.full_name || user.name || [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email
}
