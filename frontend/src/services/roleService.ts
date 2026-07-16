import { api, unwrapData } from '@/services/api'
import type { ApiResponse, Paginated } from '@/types'

export interface Role {
  id: number
  name: string
  description?: string | null
  created_at?: string
  updated_at?: string
}

export interface RoleFilters {
  search?: string
  per_page?: number
  page?: number
}

export interface CreateRolePayload {
  name: string
  description?: string | null
  permissions?: number[]
}

export interface UpdateRolePayload {
  name?: string
  description?: string | null
  permissions?: number[]
}

export const roleService = {
  /**
   * Get paginated list of roles with optional filters
   * Uses Eman's Role API: GET /api/v1/roles
   */
  async getRoles(filters?: RoleFilters): Promise<Paginated<Role>> {
    const params = new URLSearchParams()
    
    if (filters?.search) params.append('search', filters.search)
    if (filters?.per_page) params.append('per_page', filters.per_page.toString())
    if (filters?.page) params.append('page', filters.page.toString())

    const queryString = params.toString()
    const url = queryString ? `/roles?${queryString}` : '/roles'

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
   * Get a single role by ID
   * Uses Eman's Role API: GET /api/v1/roles/{id}
   */
  async getRole(id: number): Promise<Role> {
    const { data } = await api.get<ApiResponse<Role>>(`/roles/${id}`)
    return unwrapData(data)
  },

  /**
   * Create a new role
   * Uses Eman's Role API: POST /api/v1/roles
   */
  async createRole(payload: CreateRolePayload): Promise<Role> {
    const { data } = await api.post<ApiResponse<Role>>('/roles', payload)
    return unwrapData(data)
  },

  /**
   * Update an existing role
   * Uses Eman's Role API: PUT /api/v1/roles/{id}
   */
  async updateRole(id: number, payload: UpdateRolePayload): Promise<Role> {
    const { data } = await api.put<ApiResponse<Role>>(`/roles/${id}`, payload)
    return unwrapData(data)
  },

  /**
   * Delete a role
   * Uses Eman's Role API: DELETE /api/v1/roles/{id}
   */
  async deleteRole(id: number): Promise<void> {
    await api.delete(`/roles/${id}`)
  },
}
