import { api } from './api'
import type { User, Paginated } from '@/types'
import { unwrapPaginated } from '@/services/api'

import type { InventoryItem } from '@/types'

export interface SupplyRequestItem {
  id: number
  supply_request_id: number
  inventory_item_id: number
  quantity_requested: number
  quantity_issued: number | null
  remarks: string | null
  inventoryItem?: InventoryItem
}

export interface SupplyRequest {
  id: number
  user_id: number
  office_id: number | null
  status: 'PENDING' | 'APPROVED' | 'FULFILLED' | 'PARTIALLY_FULFILLED' | 'REJECTED' | 'CANCELLED'
  workflow_version_id: number | null
  current_level_order: number
  workflow_status: string
  remarks: string | null
  fulfilled_by: number | null
  fulfilled_at: string | null
  created_at: string
  user?: User
  office?: unknown
  fulfiller?: User
  items?: SupplyRequestItem[]
}

export interface CreateSupplyRequestPayload {
  remarks?: string
  items: {
    inventory_item_id: number
    quantity_requested: number
  }[]
}

export interface FulfillSupplyRequestPayload {
  items: {
    supply_request_item_id: number
    quantity_issued: number
  }[]
}

export const supplyRequestService = {
  list: async (params?: Record<string, string | number | boolean>): Promise<Paginated<SupplyRequest>> => {
    const response = await api.get('/supply-requests', { params })
    return unwrapPaginated(response.data)
  },

  get: async (id: number | string) => {
    const response = await api.get('/supply-requests/' + id)
    return response.data.data
  },

  create: async (payload: CreateSupplyRequestPayload) => {
    const response = await api.post('/supply-requests', payload)
    return response.data
  },

  approve: async (id: number | string, remarks?: string) => {
    const response = await api.post('/supply-requests/' + id + '/approve', { remarks })
    return response.data
  },

  reject: async (id: number | string, remarks: string) => {
    const response = await api.post('/supply-requests/' + id + '/reject', { remarks })
    return response.data
  },

  cancel: async (id: number | string, remarks?: string) => {
    const response = await api.post('/supply-requests/' + id + '/cancel', { remarks })
    return response.data
  },

  fulfill: async (id: number | string, payload: FulfillSupplyRequestPayload) => {
    const response = await api.post('/supply-requests/' + id + '/fulfill', payload)
    return response.data
  }
}






