import { api, unwrapData, unwrapPaginated } from '@/services/api'
import { importService, type ImportColumnMapping, type ImportHistoryItem, type ImportMappingValidationResult, type ImportUploadResult, type ImportValidationResult } from '@/services/importService'

import type { ApiResponse, ImportResult, InventoryItem, Paginated, StockMovement } from '@/types'



export interface CreateInventoryItemPayload {
  // ── Core identity ──────────────────────────────────────────────────────
  name: string
  sku?: string
  description?: string | null
  // ── Classification ─────────────────────────────────────────────────────
  type?: 'non_expendable' | 'expendable'
  classification?: 'PPE' | 'SE' | 'SUPPLY' | null
  item_nature?: 'ACCOUNTABLE_PROPERTY' | 'CONSUMABLE_SUPPLY'
  classification_reason?: string
  item_type_id?: number | null
  // ── Stock & cost ───────────────────────────────────────────────────────
  quantity: number
  unit_cost?: number | null
  purchase_date?: string | null
  warranty_until?: string | null
  supplier_id?: number | null
  reorder_level?: number
  // ── Unit of measure (FK preferred, legacy string fallback) ─────────────
  unit?: string
  unit_id?: number | null
  // ── Shared item details (inventory-owned) ─────────────────────────────
  manufacturer_id?: number | null
  model?: string | null
  asset_category_id?: number | null
  // ── Default assignment (initial values for newly created linked Asset) ─
  office_id?: number | null
  location_id?: number | null
  // ── Borrowing policy ──────────────────────────────────────────────────
  is_borrowable?: boolean
  // ── Notes ─────────────────────────────────────────────────────────────
  remarks?: string
  // ── Internal flags ────────────────────────────────────────────────────
  track_as_asset?: boolean
  // ── Identifier fields (synced to linked Asset on save) ────────────────
  // These are NOT stored on inventory_items; they are sent to the backend
  // which writes them to the linked Asset / AssetIdentifier records.
  // Only relevant when track_as_asset = true.
  property_number?: string | null
  serial_number?: string | null
}

export interface UpdateInventoryItemPayload {
  // ── Core identity ──────────────────────────────────────────────────────
  name?: string
  sku?: string
  description?: string | null
  // ── Classification ─────────────────────────────────────────────────────
  type?: 'non_expendable' | 'expendable'
  classification?: 'PPE' | 'SE' | 'SUPPLY' | null
  item_nature?: 'ACCOUNTABLE_PROPERTY' | 'CONSUMABLE_SUPPLY'
  classification_reason?: string
  item_type_id?: number | null
  // ── Stock & cost ───────────────────────────────────────────────────────
  unit_cost?: number | null
  // Procurement (inventory-owned)
  purchase_date?: string | null
  warranty_until?: string | null
  supplier_id?: number | null
  reorder_level?: number
  // ── Unit of measure ───────────────────────────────────────────────────
  unit?: string
  unit_id?: number | null
  // ── Shared item details (inventory-owned) ─────────────────────────────
  manufacturer_id?: number | null
  model?: string | null
  asset_category_id?: number | null
  // ── Default assignment (stored on inventory item, NOT pushed to asset) ─
  office_id?: number | null
  location_id?: number | null
  // ── Borrowing policy ──────────────────────────────────────────────────
  is_borrowable?: boolean
  // ── Notes ─────────────────────────────────────────────────────────────
  remarks?: string
  // ── Internal flags ────────────────────────────────────────────────────
  track_as_asset?: boolean
  // ── Identifier fields (synced to linked Asset on save) ────────────────
  // Sending these updates the linked Asset / AssetIdentifier records.
  // Changing property_number or serial_number does NOT affect SKU.
  // Only relevant when track_as_asset = true.
  property_number?: string | null
  serial_number?: string | null
}

export interface InventoryFilters {
  page?: number
  per_page?: number
  search?: string
  status?: string
  type?: 'non_expendable' | 'expendable'
  item_type_id?: number | null
  classification?: 'PPE' | 'SE' | 'SUPPLY' | null
  low_stock?: boolean
}

export interface StockMovementPayload {
  quantity: number
  reason?: string
}

export interface InventoryTransferPayload {
  quantity: number
  source_location_id: number
  destination_location_id: number
  reason?: string
}

export interface InventoryTransferResult {
  transfer_uuid: string
  source_item: InventoryItem
  destination_item: InventoryItem
}

export interface InventoryCountItem {
  id: number
  inventory_item_id: number
  item_name?: string | null
  sku?: string | null
  expected_quantity: number
  actual_quantity?: number | null
  variance: number
  remarks?: string | null
  counted_at?: string | null
  counted_by?: string | null
  reconciliation_transaction_id?: number | null
}

export interface InventoryCountSession {
  id: number
  location_id?: number | null
  location_name?: string | null
  status: 'draft' | 'completed' | 'reconciled' | string
  counted_at?: string | null
  completed_at?: string | null
  reconciled_at?: string | null
  started_by?: string | null
  completed_by?: string | null
  reconciled_by?: string | null
  notes?: string | null
  items: InventoryCountItem[]
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

  async transfer(itemId: number, payload: InventoryTransferPayload): Promise<InventoryTransferResult> {
    const { data } = await api.post<ApiResponse<InventoryTransferResult>>(`/inventory/${itemId}/transfer`, payload)
    const result = unwrapData(data)
    return {
      transfer_uuid: result.transfer_uuid,
      source_item: mapInventoryItem(result.source_item),
      destination_item: mapInventoryItem(result.destination_item),
    }
  },

  async countSessions(page = 1): Promise<Paginated<InventoryCountSession>> {
    const { data } = await api.get<ApiResponse<InventoryCountSession[] | Paginated<InventoryCountSession>>>(
      '/inventory/count-sessions',
      { params: { page, per_page: 20 } },
    )
    return unwrapPaginated(data)
  },

  async createCountSession(payload: { location_id?: number | null; counted_at?: string; notes?: string }): Promise<InventoryCountSession> {
    const { data } = await api.post<ApiResponse<InventoryCountSession>>('/inventory/count-sessions', payload)
    return unwrapData(data)
  },

  async getCountSession(sessionId: number): Promise<InventoryCountSession> {
    const { data } = await api.get<ApiResponse<InventoryCountSession>>(`/inventory/count-sessions/${sessionId}`)
    return unwrapData(data)
  },

  async recordCount(sessionId: number, itemId: number, payload: { actual_quantity: number; remarks?: string }): Promise<InventoryCountSession> {
    const { data } = await api.post<ApiResponse<InventoryCountSession>>(
      `/inventory/count-sessions/${sessionId}/items/${itemId}`,
      payload,
    )
    return unwrapData(data)
  },

  async completeCountSession(sessionId: number): Promise<InventoryCountSession> {
    const { data } = await api.post<ApiResponse<InventoryCountSession>>(`/inventory/count-sessions/${sessionId}/complete`)
    return unwrapData(data)
  },

  async reconcileCountSession(sessionId: number): Promise<InventoryCountSession> {
    const { data } = await api.post<ApiResponse<InventoryCountSession>>(`/inventory/count-sessions/${sessionId}/reconcile`)
    return unwrapData(data)
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
    const response = await api.get('/inventory/export/download', {
      params: filters,
      responseType: 'blob',
    })

    const contentType = String(response.headers['content-type'] ?? '')

    if (contentType.includes('application/json')) {
      const text = await response.data.text()
      const payload = JSON.parse(text) as { message?: string }
      throw new Error(payload.message || 'The inventory export failed. Please try again.')
    }

    return response.data
  },

  // Import Wizard methods
  async importWizardUpload(file: File): Promise<ImportUploadResult> {
    return importService.upload('inventory', file)
  },

  async importWizardValidateMapping(importId: number, columnMapping: ImportColumnMapping[]): Promise<ImportMappingValidationResult> {
    return importService.validateMapping('inventory', importId, columnMapping)
  },

  async importWizardValidateData(importId: number, columnMapping: ImportColumnMapping[]): Promise<ImportValidationResult> {
    return importService.validateData('inventory', importId, columnMapping)
  },

  async importWizardExecute(importId: number, columnMapping: ImportColumnMapping[]): Promise<ImportResult> {
    return importService.execute('inventory', importId, columnMapping)
  },

  async importWizardHistory(): Promise<ImportHistoryItem[]> {
    return importService.history('inventory')
  },

  /**
   * Ask the backend to generate a unique SKU suggestion.
   * The returned value is NOT reserved — the user can freely edit it.
   * Final uniqueness is enforced by the backend on save.
   */
  async generateSku(prefix?: string): Promise<string> {
    const params: Record<string, string> = {}
    if (prefix) params.prefix = prefix
    const { data } = await api.get<ApiResponse<{ sku: string; unique: boolean }>>('/inventory/generate-sku', { params })
    return unwrapData(data).sku
  },
}

