import { api, unwrapData } from '@/services/api'
import type { ApiResponse, AppNotification, Paginated } from '@/types'

interface NotificationListResponse {
  items: AppNotification[]
  meta: Paginated<AppNotification>['meta'] & { unread_count: number }
}

export const notificationService = {
  async list(perPage = 20): Promise<NotificationListResponse> {
    const { data } = await api.get<ApiResponse<NotificationListResponse>>('/notifications', {
      params: { per_page: perPage },
    })
    return unwrapData(data)
  },

  async unreadCount(): Promise<number> {
    const { data } = await api.get<ApiResponse<{ unread_count: number }>>('/notifications/unread-count')
    return unwrapData(data).unread_count
  },

  async markAsRead(id: number): Promise<AppNotification> {
    const { data } = await api.post<ApiResponse<AppNotification>>(`/notifications/${id}/read`)
    return unwrapData(data)
  },

  async markAllAsRead(): Promise<void> {
    await api.post('/notifications/mark-all-read')
  },
}
