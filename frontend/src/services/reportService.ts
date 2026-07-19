import { api, unwrapData, withMockFallback } from '@/services/api'
import type { ApiResponse } from '@/types'

export interface AssetReportItem {
  id: number
  asset_number: string
  name: string
  category: string
  manufacturer: string
  office: string
  location: string
  status: string
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

export const reportService = {
  async getAssets(params?: Record<string, unknown>): Promise<AssetReportItem[]> {
    return withMockFallback(
      async () => {
        const { data } = await api.get<ApiResponse<AssetReportItem[]>>('/reports/assets', { params })
        return unwrapData(data)
      },
      async () => [],
    )
  },

  async getBorrowings(params?: Record<string, unknown>): Promise<BorrowingReportItem[]> {
    return withMockFallback(
      async () => {
        const { data } = await api.get<ApiResponse<BorrowingReportItem[]>>('/reports/borrowings', { params })
        return unwrapData(data)
      },
      async () => [],
    )
  },

  async getReservations(params?: Record<string, unknown>): Promise<ReservationReportItem[]> {
    return withMockFallback(
      async () => {
        const { data } = await api.get<ApiResponse<ReservationReportItem[]>>('/reports/reservations', { params })
        return unwrapData(data)
      },
      async () => [],
    )
  },

  async getInventory(params?: Record<string, unknown>): Promise<InventoryReportItem[]> {
    return withMockFallback(
      async () => {
        const { data } = await api.get<ApiResponse<InventoryReportItem[]>>('/reports/inventory', { params })
        return unwrapData(data)
      },
      async () => [],
    )
  },

  async getOverdue(): Promise<OverdueReportItem[]> {
    return withMockFallback(
      async () => {
        const { data } = await api.get<ApiResponse<OverdueReportItem[]>>('/reports/overdue')
        return unwrapData(data)
      },
      async () => [],
    )
  },

  async getLowStock(): Promise<LowStockReportItem[]> {
    return withMockFallback(
      async () => {
        const { data } = await api.get<ApiResponse<LowStockReportItem[]>>('/reports/low-stock')
        return unwrapData(data)
      },
      async () => [],
    )
  },

  async getUserActivity(params?: Record<string, unknown>): Promise<UserActivityReportItem[]> {
    return withMockFallback(
      async () => {
        const { data } = await api.get<ApiResponse<UserActivityReportItem[]>>('/reports/user-activity', { params })
        return unwrapData(data)
      },
      async () => [],
    )
  },
}
