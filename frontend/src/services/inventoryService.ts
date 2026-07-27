import { api, unwrapData, unwrapPaginated } from '@/services/api'

import type { ApiResponse, ImportResult, InventoryItem, Paginated, StockMovement } from '@/types'



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

  async importExcel(file: File): Promise<ImportResult> {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await api.post<ApiResponse<ImportResult>>('/inventory/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return unwrapData(data)
  },

  async exportExcel(filters: InventoryFilters = {}): Promise<{ path: string; url: string; filename: string }> {
    const { data } = await api.get<ApiResponse<{ path: string; url: string; filename: string }>>('/inventory/export', {
      params: filters,
    })
    return unwrapData(data)
  },

  getExportDownloadUrl(filters: InventoryFilters = {}): string {
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.status) params.set('status', filters.status)
    const qs = params.toString()
    return `/api/v1/inventory/export/download${qs ? '?' + qs : ''}`
  },

  async downloadExport(filters: InventoryFilters = {}): Promise<Blob> {
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.status) params.set('status', filters.status)
    const response = await api.get('/inventory/export/download', {
      params: filters,
      responseType: 'blob',
    })
    return response.data
  },

  // Import Wizard methods
  async importWizardUpload(file: File): Promise<any> {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await api.post<ApiResponse<any>>('/inventory/import-wizard/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return unwrapData(data)
  },

  async importWizardValidateMapping(importId: number, columnMapping: any[]): Promise<any> {
    const { data } = await api.post<ApiResponse<any>>('/inventory/import-wizard/validate-mapping', {
      import_id: importId,
      column_mapping: columnMapping,
    })
    return unwrapData(data)
  },

  async importWizardValidateData(importId: number, columnMapping: any[]): Promise<any> {
    const { data } = await api.post<ApiResponse<any>>('/inventory/import-wizard/validate-data', {
      import_id: importId,
      column_mapping: columnMapping,
    })
    return unwrapData(data)
  },

  async importWizardExecute(importId: number, columnMapping: any[]): Promise<ImportResult> {
    const { data } = await api.post<ApiResponse<ImportResult>>('/inventory/import-wizard/execute', {
      import_id: importId,
      column_mapping: columnMapping,
    })
    return unwrapData(data)
  },

  async importWizardHistory(): Promise<any[]> {
    const { data } = await api.get<ApiResponse<any[]>>('/inventory/import-wizard/history')
    return unwrapData(data)
  },
}
