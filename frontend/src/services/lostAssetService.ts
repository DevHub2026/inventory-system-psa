import { api, unwrapData } from '@/services/api'
import type { ApiResponse, LostAssetReport, Paginated } from '@/types'

export interface CreateLostAssetReportPayload {
  description: string
  last_known_location?: string
  date_lost?: string
  remarks?: string
}

export const lostAssetService = {
  async reportLost(assetId: number, payload: CreateLostAssetReportPayload): Promise<LostAssetReport> {
    const { data } = await api.post<ApiResponse<LostAssetReport>>(`/assets/${assetId}/report-lost`, payload)
    return unwrapData(data)
  },

  async list(params?: Record<string, unknown>): Promise<Paginated<LostAssetReport>> {
    const { data } = await api.get<ApiResponse<Paginated<LostAssetReport>>>('/lost-asset-reports', { params })
    return unwrapData(data)
  },

  async myReports(assetId?: number): Promise<LostAssetReport[]> {
    const { data } = await api.get<ApiResponse<LostAssetReport[]>>('/lost-asset-reports/mine', {
      params: assetId ? { asset_id: assetId } : undefined,
    })
    return unwrapData(data)
  },
}
