import { api, unwrapData } from '@/services/api'
import type { ApiResponse } from '@/types'

export interface AssetReportItem {
  id: number
  asset_number: string
  property_number?: string | null
  name: string
  category: string
  manufacturer: string
  office: string
  location: string
  status: string
  accountability?: string | null
  condition: string
  purchase_date: string
  purchase_cost: number
}

export interface BorrowingReportItem {
  id: number
  asset_name: string
  borrower: string
  borrow_date: string
  due_date: string
  status: string
  remarks: string
}

export interface ReservationReportItem {
  id: number
  user: string
  status: string
  start_date: string
  end_date: string
  asset_count: number
  remarks: string
}

export interface InventoryReportItem {
  id: number
  name: string
  sku: string
  quantity: number
  unit: string
  reorder_level: number
  remarks: string
}

export interface OverdueReportItem {
  id: number
  asset_name: string
  borrower: string
  due_date: string
  days_overdue: number
}

export interface LowStockReportItem {
  id: number
  name: string
  sku: string
  quantity: number
  reorder_level: number
  unit: string
}

export interface UserActivityReportItem {
  id: number
  user: string
  asset_name: string
  action: string
  date: string
}

export interface ReissuanceReportItem {
  id: number
  asset_number: string
  asset_name: string
  previous_employee: string
  new_employee: string
  transferred_by: string
  transfer_date: string
  reason: string
  remarks: string
}

export interface AssetHistoryReportItem {
  event_id?: string
  source?: string
  source_id?: number
  asset_id?: number
  asset_number?: string | null
  property_number?: string | null
  asset_name?: string | null
  event_type?: string | null
  previous_status?: string | null
  new_status?: string | null
  current_status?: string | null
  previous_custodian?: string | null
  new_custodian?: string | null
  previous_location?: string | null
  new_location?: string | null
  event_at?: string | null
  performed_by?: string | null
  reason?: string | null
  remarks?: string | null
  reference?: string | null
}

export interface AssetHistoryReportResponse {
  items: AssetHistoryReportItem[]
  summary: Record<string, unknown>
  meta: {
    current_page: number
    per_page: number
    total: number
    last_page: number
  }
}

export const reportService = {
  async getAssets(params?: Record<string, unknown>): Promise<AssetReportItem[]> {
    const { data } = await api.get<ApiResponse<AssetReportItem[]>>('/reports/assets', { params })
    return unwrapData(data)
  },

  async getBorrowings(params?: Record<string, unknown>): Promise<BorrowingReportItem[]> {
    const { data } = await api.get<ApiResponse<BorrowingReportItem[]>>('/reports/borrowings', { params })
    return unwrapData(data)
  },

  async getReservations(params?: Record<string, unknown>): Promise<ReservationReportItem[]> {
    const { data } = await api.get<ApiResponse<ReservationReportItem[]>>('/reports/reservations', { params })
    return unwrapData(data)
  },

  async getInventory(params?: Record<string, unknown>): Promise<InventoryReportItem[]> {
    const { data } = await api.get<ApiResponse<InventoryReportItem[]>>('/reports/inventory', { params })
    return unwrapData(data)
  },

  async getOverdue(): Promise<OverdueReportItem[]> {
    const { data } = await api.get<ApiResponse<OverdueReportItem[]>>('/reports/overdue')
    return unwrapData(data)
  },

  async getLowStock(): Promise<LowStockReportItem[]> {
    const { data } = await api.get<ApiResponse<LowStockReportItem[]>>('/reports/low-stock')
    return unwrapData(data)
  },

  async getUserActivity(params?: Record<string, unknown>): Promise<UserActivityReportItem[]> {
    const { data } = await api.get<ApiResponse<UserActivityReportItem[]>>('/reports/user-activity', { params })
    return unwrapData(data)
  },

  async getReissuances(params?: Record<string, unknown>): Promise<ReissuanceReportItem[]> {
    const { data } = await api.get<ApiResponse<ReissuanceReportItem[]>>('/reports/reissuances', { params })
    return unwrapData(data)
  },

  async getAssetHistory(params?: Record<string, unknown>): Promise<AssetHistoryReportResponse> {
    const { data } = await api.get<ApiResponse<AssetHistoryReportResponse>>('/reports/asset-history', { params })
    return unwrapData(data)
  },

  /**
   * Export a report to Excel (.xlsx) or CSV.
   *
   * Routing:
   *  - "reissuances" → GET /reports/reissuances/export   (AssetReissuanceController)
   *  - everything else → GET /reports/export              (ReportController / DocumentExportService)
   *
   * The reissuances endpoint reads `format` directly ('excel'|'csv').
   * The shared endpoint reads `type` + `format` as query params.
   */
  async exportReport(type: string, format: 'excel' | 'csv', params?: Record<string, unknown>): Promise<Blob> {
    const urlPath = type === 'reissuances' ? '/reports/reissuances/export' : '/reports/export'
    const response = await api.get(urlPath, {
      params: { ...params, type, format },
      responseType: 'blob',
    })

    // Guard: if the server returned a JSON error instead of a binary file, surface the message.
    const contentType = String((response.headers as Record<string, unknown>)['content-type'] ?? '')
    if (contentType.includes('application/json')) {
      const text = await (response.data as Blob).text()
      let msg = 'Export failed. The server returned an error.'
      try {
        msg = (JSON.parse(text) as { message?: string }).message ?? msg
      } catch {
        // leave default message
      }
      throw new Error(msg)
    }

    return response.data as Blob
  },
}
