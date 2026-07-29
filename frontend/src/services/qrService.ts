import { api, unwrapData, unwrapPaginated } from '@/services/api'
import type { ApiResponse, AssetContext, Paginated, QrScanHistory } from '@/types'

export const qrService = {
  async resolveAsset(identifier: string, scanSource = 'sidebar_scanner'): Promise<AssetContext> {
    const encoded = encodeURIComponent(identifier)
    const { data } = await api.get<ApiResponse<AssetContext>>(`/qr/asset/${encoded}`, {
      params: { scan_source: scanSource },
    })
    return unwrapData(data)
  },

  async recordAction(assetId: number, actionPerformed: string, scanSource = 'sidebar_scanner'): Promise<void> {
    await api.post('/qr/scan-action', {
      asset_id: assetId,
      action_performed: actionPerformed,
      scan_source: scanSource,
    })
  },

  async getHistory(params?: Record<string, unknown>): Promise<Paginated<QrScanHistory>> {
    const { data } = await api.get<ApiResponse<Paginated<QrScanHistory>>>('/qr/history', { params })
    return unwrapPaginated(data)
  },

  async getMyHistory(params?: Record<string, unknown>): Promise<Paginated<QrScanHistory>> {
    const { data } = await api.get<ApiResponse<Paginated<QrScanHistory>>>('/qr/my-history', { params })
    return unwrapPaginated(data)
  },
}
