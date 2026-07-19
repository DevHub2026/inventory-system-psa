import { api, unwrapData } from '@/services/api'

import type { ApiResponse, InventoryItem, Paginated } from '@/types'



export interface CreateInventoryItemPayload {
  name: string
  sku?: string
  quantity: number
  unit: string
  reorder_level?: number
  remarks?: string
  track_as_asset?: boolean
}

export interface UpdateInventoryItemPayload {
  name?: string
  sku?: string
  quantity?: number
  unit?: string
  reorder_level?: number
  remarks?: string
  track_as_asset?: boolean
}



function mapInventoryItem(item: InventoryItem): InventoryItem {
  const status =
    item.quantity <= 0
      ? 'OUT_OF_STOCK'
      : item.reorder_level !== undefined && item.reorder_level > 0 && item.quantity <= item.reorder_level
        ? 'LOW_STOCK'
        : 'IN_STOCK'

  return {
    ...item,
    status: item.status || status,
  }
}

export const inventoryService = {
  async list(): Promise<Paginated<InventoryItem>> {
    const { data } = await api.get<ApiResponse<InventoryItem[]>>('/inventory')
    const items = unwrapData(data)

    return {
      items: Array.isArray(items) ? items.map(mapInventoryItem) : [],
      meta: {
        current_page: 1,
        per_page: Array.isArray(items) ? items.length : 0,
        total: Array.isArray(items) ? items.length : 0,
        last_page: 1,
      },
    }
  },

  async create(payload: CreateInventoryItemPayload): Promise<InventoryItem> {
    const { data } = await api.post<ApiResponse<InventoryItem>>('/inventory', payload)
    return mapInventoryItem(unwrapData(data))
  },

  async update(itemId: number, payload: UpdateInventoryItemPayload): Promise<InventoryItem> {
    const { data } = await api.put<ApiResponse<InventoryItem>>(`/inventory/${itemId}`, payload)
    return mapInventoryItem(unwrapData(data))
  },

  async delete(itemId: number): Promise<void> {
    await api.delete(`/inventory/${itemId}`)
  },

  async stockIn(itemId: number, quantity: number): Promise<InventoryItem> {
    const { data } = await api.post<ApiResponse<InventoryItem>>(`/inventory/${itemId}/stock-in`, { quantity })
    return mapInventoryItem(unwrapData(data))
  },

  async stockOut(itemId: number, quantity: number): Promise<InventoryItem> {
    const { data } = await api.post<ApiResponse<InventoryItem>>(`/inventory/${itemId}/stock-out`, { quantity })
    return mapInventoryItem(unwrapData(data))
  },
}
