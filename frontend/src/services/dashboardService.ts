import { api, withMockFallback, unwrapData } from '@/services/api'
import type { ActivityItem, ApiResponse, DashboardStats } from '@/types'

const mockStats: DashboardStats = {
  total_assets: 128,
  available: 74,
  borrowed: 31,
  reserved: 12,
  maintenance: 11,
}

const mockActivity: ActivityItem[] = [
  {
    id: 1,
    action: 'Borrowed projector',
    user: 'Juan Dela Cruz',
    module: 'Borrowing',
    created_at: '2026-07-14 09:12',
  },
  {
    id: 2,
    action: 'Approved reservation',
    user: 'Maria Santos',
    module: 'Reservation',
    created_at: '2026-07-14 08:40',
  },
  {
    id: 3,
    action: 'Registered asset PSA-0042',
    user: 'Property Custodian',
    module: 'Asset',
    created_at: '2026-07-13 16:05',
  },
]

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    return withMockFallback(
      async () => {
        const { data } = await api.get<ApiResponse<DashboardStats>>('/reports/dashboard')
        return unwrapData(data)
      },
      async () => mockStats,
    )
  },

  async getRecentActivity(): Promise<ActivityItem[]> {
    return withMockFallback(
      async () => {
        const { data } = await api.get<ApiResponse<ActivityItem[]>>('/dashboard/recent')
        return unwrapData(data)
      },
      async () => mockActivity,
    )
  },
}
