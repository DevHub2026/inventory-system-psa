import { api, unwrapData } from '@/services/api'

import type { ActivityItem, ApiResponse, DashboardStats } from '@/types'



export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const { data } = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats')
    return unwrapData(data)
  },

  async getRecentActivity(): Promise<ActivityItem[]> {
    const { data } = await api.get<ApiResponse<ActivityItem[]>>('/dashboard/recent-activity')
    return unwrapData(data)
  },
}

