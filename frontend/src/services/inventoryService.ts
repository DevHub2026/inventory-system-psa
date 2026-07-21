import { api, unwrapData, unwrapPaginated } from '@/services/api'

import type { ApiResponse, InventoryItem, Paginated, StockMovement } from '@/types'



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

export interface InventoryFilters {
  page?: number
  per_page?: number
  search?: string
  status?: string
  low_stock?: boolean
}

export interface StockMovementPayload {
  quantity: number
  reason?: string
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
  async list(filters: InventoryFilters = {}): Promise<Paginated<InventoryItem>> {
    const { data } = await api.get<ApiResponse<InventoryItem[] | Paginated<InventoryItem>>>('/inventory', { params: filters })
    const result = unwrapPaginated(data)

    return {
      ...result,
      items: result.items.map(mapInventoryItem),
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

  async stockIn(itemId: number, payload: StockMovementPayload): Promise<InventoryItem> {
    const { data } = await api.post<ApiResponse<InventoryItem>>(`/inventory/${itemId}/stock-in`, payload)
    return mapInventoryItem(unwrapData(data))
  },

  async stockOut(itemId: number, payload: StockMovementPayload): Promise<InventoryItem> {
    const { data } = await api.post<ApiResponse<InventoryItem>>(`/inventory/${itemId}/stock-out`, payload)
    return mapInventoryItem(unwrapData(data))
  },

  async adjust(itemId: number, payload: StockMovementPayload): Promise<InventoryItem> {
    const { data } = await api.post<ApiResponse<InventoryItem>>(`/inventory/${itemId}/adjust`, payload)
    return mapInventoryItem(unwrapData(data))
  },

  async history(itemId: number, page = 1): Promise<Paginated<StockMovement>> {
    const { data } = await api.get<ApiResponse<StockMovement[] | Paginated<StockMovement>>>(`/inventory/${itemId}/history`, {
      params: { page, per_page: 10 },
    })

    return unwrapPaginated(data)
  },
}
