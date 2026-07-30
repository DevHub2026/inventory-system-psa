import { api, unwrapData } from '@/services/api'
import type { ApiResponse } from '@/types'

interface UserSession {
  id: number
  device_name: string | null
  browser: string | null
  platform: string | null
  ip_address: string | null
  login_at: string | null
  last_activity: string | null
  is_active: boolean
  is_current: boolean
}

interface SessionListResponse {
  items: UserSession[]
}

export const sessionService = {
  async list(): Promise<SessionListResponse> {
    const { data } = await api.get<ApiResponse<SessionListResponse>>('/sessions')
    return unwrapData(data)
  },

  async revoke(id: number): Promise<void> {
    await api.post(`/sessions/${id}/revoke`)
  },

  async revokeAll(): Promise<void> {
    await api.post('/sessions/revoke-all')
  },
}
