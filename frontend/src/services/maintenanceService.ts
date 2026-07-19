import { api, unwrapData } from '@/services/api'

import type { ApiResponse, MaintenanceRequest, Paginated } from '@/types'



export interface CreateMaintenancePayload {
  asset_id: number
  user_id?: number
  type: 'corrective' | 'preventive'
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  scheduled_date: string
  description?: string
  notes?: string
  cost?: number
}

export interface UpdateMaintenancePayload {
  asset_id?: number
  user_id?: number
  type?: 'corrective' | 'preventive'
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  scheduled_date?: string
  completed_date?: string
  description?: string
  notes?: string
  cost?: number
}

interface BackendMaintenanceRequest extends MaintenanceRequest {
  scheduled_date: string
}

function mapMaintenanceRequest(request: BackendMaintenanceRequest): MaintenanceRequest {
  return {
    ...request,
    scheduled_at: request.scheduled_date,
  }
}

export const maintenanceService = {
  async list(): Promise<Paginated<MaintenanceRequest>> {
    const { data } = await api.get<ApiResponse<BackendMaintenanceRequest[]>>('/maintenances')
    const items = unwrapData(data)

    return {
      items: Array.isArray(items) ? items.map(mapMaintenanceRequest) : [],
      meta: {
        current_page: 1,
        per_page: Array.isArray(items) ? items.length : 0,
        total: Array.isArray(items) ? items.length : 0,
        last_page: 1,
      },
    }
  },

  async create(payload: CreateMaintenancePayload): Promise<MaintenanceRequest> {
    const { data } = await api.post<ApiResponse<BackendMaintenanceRequest>>('/maintenances', payload)
    return mapMaintenanceRequest(unwrapData(data))
  },

  async update(requestId: number, payload: UpdateMaintenancePayload): Promise<MaintenanceRequest> {
    const { data } = await api.put<ApiResponse<BackendMaintenanceRequest>>(`/maintenances/${requestId}`, payload)
    return mapMaintenanceRequest(unwrapData(data))
  },

  async delete(requestId: number): Promise<void> {
    await api.delete(`/maintenances/${requestId}`)
  },

  async complete(requestId: number): Promise<MaintenanceRequest> {
    const { data } = await api.post<ApiResponse<BackendMaintenanceRequest>>(`/maintenances/${requestId}/complete`)
    return mapMaintenanceRequest(unwrapData(data))
  },
}
