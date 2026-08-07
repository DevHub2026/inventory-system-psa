import { api, unwrapData } from './api'
import type { ApiResponse } from '@/types'

export async function listAuditLogs(params: Record<string, unknown> = {}) {
  const res = await api.get<ApiResponse<unknown[]>>('audit-logs', { params })
  return unwrapData(res.data)
}
