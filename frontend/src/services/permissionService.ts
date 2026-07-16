import { api, unwrapData } from '@/services/api'
import type { ApiResponse, Paginated } from '@/types'

export interface Permission {
  id: number
  name: string
  module: string
  description?: string | null
  created_at?: string
  updated_at?: string
}

export interface PermissionFilters {
  search?: string
  module?: string
  per_page?: number
  page?: number
}

export interface CreatePermissionPayload {
  name: string
  module: string
  description?: string | null
}

export interface UpdatePermissionPayload {
  name?: string
  module?: string
  description?: string | null
}

export const permissionService = {
  /**
   * Get paginated list of permissions with optional filters
   * Uses Eman's Permission API: GET /api/v1/permissions
   */
  async getPermissions(filters?: PermissionFilters): Promise<Paginated<Permission>> {
    const params = new URLSearchParams()
    
    if (filters?.search) params.append('search', filters.search)
    if (filters?.module) params.append('module', filters.module)
    if (filters?.per_page) params.append('per_page', filters.per_page.toString())
    if (filters?.page) params.append('page', filters.page.toString())

    const queryString = params.toString()
    const url = queryString ? `/permissions?${queryString}` : '/permissions'

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
   * Get a single permission by ID
   * Uses Eman's Permission API: GET /api/v1/permissions/{id}
   */
  async getPermission(id: number): Promise<Permission> {
    const { data } = await api.get<ApiResponse<Permission>>(`/permissions/${id}`)
    return unwrapData(data)
  },

  /**
   * Create a new permission
   * Uses Eman's Permission API: POST /api/v1/permissions
   */
  async createPermission(payload: CreatePermissionPayload): Promise<Permission> {
    const { data } = await api.post<ApiResponse<Permission>>('/permissions', payload)
    return unwrapData(data)
  },

  /**
   * Update an existing permission
   * Uses Eman's Permission API: PUT /api/v1/permissions/{id}
   */
  async updatePermission(id: number, payload: UpdatePermissionPayload): Promise<Permission> {
    const { data } = await api.put<ApiResponse<Permission>>(`/permissions/${id}`, payload)
    return unwrapData(data)
  },

  /**
   * Delete a permission
   * Uses Eman's Permission API: DELETE /api/v1/permissions/{id}
   */
  async deletePermission(id: number): Promise<void> {
    await api.delete(`/permissions/${id}`)
  },
}
