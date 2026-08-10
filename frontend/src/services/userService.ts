import { api, unwrapData } from '@/services/api'
import type { ApiResponse, Paginated, User } from '@/types'

interface PaginatedApiResponse<T> {
  data?: T[]
  meta?: Paginated<T>['meta']
}

export interface UserFilters {
  search?: string
  status?: string
  department_id?: number
  per_page?: number
  page?: number
}

export interface CreateUserPayload {
  employee_number: string
  username: string
  first_name: string
  middle_name?: string | null
  last_name: string
  email: string
  password: string
  department_id?: number | null
  office_id?: number | null
  status?: string
  roles?: number[]
  email_notifications_enabled?: boolean
}

export interface UpdateUserPayload {
  employee_number?: string
  username?: string
  first_name?: string
  middle_name?: string | null
  last_name?: string
  email?: string
  password?: string
  department_id?: number | null
  office_id?: number | null
  status?: string
  roles?: number[]
  email_notifications_enabled?: boolean
}

export interface ChangePasswordPayload {
  password: string
  password_confirmation: string
}

export interface ImportUserResultRow {
  row: number
  status: 'imported' | 'skipped' | 'failed'
  username?: string | null
  email?: string | null
  reason: string
}

export interface ImportUsersResult {
  total_rows: number
  imported: number
  skipped: number
  failed: number
  initial_password: string
  username_rule: string
  rows: ImportUserResultRow[]
}

// ─────────────────────────────────────────────────────────────────────────────
// User Profile Types
// ─────────────────────────────────────────────────────────────────────────────

export interface UserProfileStats {
  currently_borrowed: number
  total_borrowed: number
  returned: number
  overdue: number
  pending_requests: number
}

export interface UserProfile {
  user: User
  stats: UserProfileStats
}

export interface IssuedAsset {
  id: number
  asset_id: number
  asset_name: string
  asset_number: string
  property_number?: string | null
  asset_code: string | null
  category: string | null
  serial_number: string | null
  status: string
  borrowed_at: string
  borrow_date: string
  due_date: string | null
  location: string | null
  issued_by: string | null
  remarks: string | null
}

export interface BorrowingHistoryItem {
  id: number
  asset_id: number
  asset_name: string
  asset_number: string
  property_number?: string | null
  asset_code: string | null
  category: string | null
  status: string
  borrowed_at: string
  borrow_date: string
  due_date: string | null
  returned_at: string | null
  issued_by: string | null
  remarks: string | null
}

export interface BorrowingHistoryFilters {
  search?: string
  status?: string
  date_from?: string
  date_to?: string
  per_page?: number
  page?: number
}

// ─────────────────────────────────────────────────────────────────────────────
// User Service
// ─────────────────────────────────────────────────────────────────────────────

export const userService = {
  /**
   * Get paginated list of users with optional filters
   * Uses Eman's User API: GET /api/v1/users
   */
  async getUsers(filters?: UserFilters): Promise<Paginated<User>> {
    const params = new URLSearchParams()
    
    if (filters?.search) params.append('search', filters.search)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.department_id) params.append('department_id', filters.department_id.toString())
    if (filters?.per_page) params.append('per_page', filters.per_page.toString())
    if (filters?.page) params.append('page', filters.page.toString())

    const queryString = params.toString()
    const url = queryString ? `/users?${queryString}` : '/users'

    const { data } = await api.get<PaginatedApiResponse<User>>(url)
    
    return {
      items: data.data || [],
      meta: data.meta || {
        current_page: 1,
        per_page: 15,
        total: 0,
        last_page: 1,
      },
    }
  },

  /**
   * Get a single user by ID
   * Uses Eman's User API: GET /api/v1/users/{id}
   */
  async getUser(id: number): Promise<User> {
    const { data } = await api.get<ApiResponse<User>>(`/users/${id}`)
    return unwrapData(data)
  },

  /**
   * Create a new user
   * Uses Eman's User API: POST /api/v1/users
   */
  async createUser(payload: CreateUserPayload): Promise<User> {
    const { data } = await api.post<ApiResponse<User>>('/users', payload)
    return unwrapData(data)
  },

  /**
   * Import employee accounts from CSV, JSON, or XLSX.
   * Uses Eman's User API: POST /api/v1/users/import
   */
  async importEmployees(file: File): Promise<ImportUsersResult> {
    const formData = new FormData()
    formData.append('file', file)

    const { data } = await api.post<ApiResponse<ImportUsersResult>>('/users/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    return unwrapData(data)
  },

  /**
   * Update an existing user
   * Uses Eman's User API: PUT /api/v1/users/{id}
   */
  async updateUser(id: number, payload: UpdateUserPayload): Promise<User> {
    const { data } = await api.put<ApiResponse<User>>(`/users/${id}`, payload)
    return unwrapData(data)
  },

  /**
   * Change a user's password (admin)
   * Uses Eman's User API: PUT /api/v1/users/{user}/password
   */
  async updateUserPassword(userId: number, payload: ChangePasswordPayload): Promise<void> {
    await api.put(`/users/${userId}/password`, payload)
  },

  /**
   * Reset a user's password to default (admin)
   * Uses Eman's User API: POST /api/v1/users/{user}/reset-password
   */
  async resetUserPassword(userId: number): Promise<void> {
    await api.post(`/users/${userId}/reset-password`)
  },

  /**
   * Delete a user
   * Uses Eman's User API: DELETE /api/v1/users/{id}
   */
  async deleteUser(id: number): Promise<void> {
    await api.delete(`/users/${id}`)
  },

  // ──────────────────────────────────────────────────────────────────────────
  // Profile endpoints
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/users/{id}/profile
   * Returns full user info + borrow statistics.
   */
  async getUserProfile(id: number): Promise<UserProfile> {
    const { data } = await api.get<ApiResponse<UserProfile>>(`/users/${id}/profile`)
    return unwrapData(data)
  },

  /**
   * GET /api/v1/users/{id}/issued-assets
   * Returns assets currently issued to this user.
   */
  async getIssuedAssets(id: number): Promise<IssuedAsset[]> {
    const { data } = await api.get<ApiResponse<{ items: IssuedAsset[] }>>(`/users/${id}/issued-assets`)
    return unwrapData(data).items
  },

  /**
   * GET /api/v1/users/{id}/borrowing-history
   * Returns paginated borrowing history with optional filters.
   */
  async getBorrowingHistory(
    id: number,
    filters?: BorrowingHistoryFilters,
  ): Promise<Paginated<BorrowingHistoryItem>> {
    const params = new URLSearchParams()
    if (filters?.search)    params.append('search',    filters.search)
    if (filters?.status)    params.append('status',    filters.status)
    if (filters?.date_from) params.append('date_from', filters.date_from)
    if (filters?.date_to)   params.append('date_to',   filters.date_to)
    if (filters?.per_page)  params.append('per_page',  String(filters.per_page))
    if (filters?.page)      params.append('page',      String(filters.page))

    const qs  = params.toString()
    const url = qs ? `/users/${id}/borrowing-history?${qs}` : `/users/${id}/borrowing-history`
    const { data } = await api.get<ApiResponse<{ items: BorrowingHistoryItem[]; meta: Paginated<BorrowingHistoryItem>['meta'] }>>(url)
    const payload = unwrapData(data)
    return { items: payload.items, meta: payload.meta }
  },
}
