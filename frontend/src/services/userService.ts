import { api, unwrapData } from '@/services/api'
import type { ApiResponse, Paginated, User } from '@/types'

export interface UserFilters {
  search?: string
  status?: string
  department_id?: number
  per_page?: number
  page?: number
}

export interface CreateUserPayload {
  employee_number: string
  first_name: string
  middle_name?: string | null
  last_name: string
  email: string
  password: string
  department_id?: number | null
  status?: string
  roles?: number[]
}

export interface UpdateUserPayload {
  employee_number?: string
  first_name?: string
  middle_name?: string | null
  last_name?: string
  email?: string
  password?: string
  department_id?: number | null
  status?: string
  roles?: number[]
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

    const { data } = await api.get<any>(url)
    
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
   * Delete a user
   * Uses Eman's User API: DELETE /api/v1/users/{id}
   */
  async deleteUser(id: number): Promise<void> {
    await api.delete(`/users/${id}`)
  },
}
