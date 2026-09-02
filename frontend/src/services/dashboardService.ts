import { api, unwrapData } from '@/services/api'
import type { ActivityItem, ApiResponse, DashboardAnalytics, DashboardStats } from '@/types'

export interface LowStockItem {
  id: number
  name: string
  sku: string | null
  quantity: number
  reorder_level: number | null
  unit: string | null
  office: string | null
  location: string | null
  manufacturer: string | null
}

export interface OverdueAsset {
  id: number
  asset_name: string
  asset_number: string
  borrower: string
  due_date: string
  days_overdue: number
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const { data } = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats')
    return unwrapData(data)
  },

  async getAnalytics(): Promise<DashboardAnalytics> {
    const { data } = await api.get<ApiResponse<DashboardAnalytics>>('/dashboard/analytics')
    return unwrapData(data)
  },

  async getRecentActivity(): Promise<ActivityItem[]> {
    const { data } = await api.get<ApiResponse<ActivityItem[]>>('/dashboard/recent-activity')
    return unwrapData(data)
  },

  async getLowStockItems(): Promise<LowStockItem[]> {
    const { data } = await api.get<ApiResponse<LowStockItem[]>>('/dashboard/low-stock')
    return unwrapData(data)
  },

  async getOverdueAssets(): Promise<OverdueAsset[]> {
    const { data } = await api.get<ApiResponse<OverdueAsset[]>>('/dashboard/overdue-assets')
    return unwrapData(data)
  },
}
