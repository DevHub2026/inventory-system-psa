import { api, unwrapData } from '@/services/api'
import type { ApiResponse, AssetContext, Paginated, QrScanHistory } from '@/types'

export const qrService = {
  async resolveAsset(identifier: string): Promise<AssetContext> {
    const encoded = encodeURIComponent(identifier)
    const { data } = await api.get<ApiResponse<AssetContext>>(`/qr/asset/${encoded}`)
    return unwrapData(data)
  },

  async recordAction(assetId: number, actionPerformed: string): Promise<void> {
    await api.post('/qr/scan-action', {
      asset_id: assetId,
      action_performed: actionPerformed,
    })
  },

  async getHistory(params?: Record<string, unknown>): Promise<Paginated<QrScanHistory>> {
    const { data } = await api.get<ApiResponse<Paginated<QrScanHistory>>>('/qr/history', { params })
    return unwrapData(data)
  },

  async getMyHistory(params?: Record<string, unknown>): Promise<Paginated<QrScanHistory>> {
    const { data } = await api.get<ApiResponse<Paginated<QrScanHistory>>>('/qr/my-history', { params })
    return unwrapData(data)
  },
}
