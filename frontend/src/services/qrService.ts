import { api, unwrapData, unwrapPaginated } from '@/services/api'
import type { ApiResponse, AssetContext, Paginated, QrContext, QrScanHistory } from '@/types'

export const qrService = {
  /**
   * Centralized QR resolution endpoint.
   * Detects QR type (ASSET, BORROWING_RECEIPT, RETURN_RECEIPT, UNKNOWN)
   * and returns normalized role-aware context with available actions.
   */
  async resolveQr(identifier: string, scanSource = 'sidebar_scanner'): Promise<QrContext> {
    const encoded = encodeURIComponent(identifier)
    const { data } = await api.get<ApiResponse<QrContext>>(`/qr/resolve/${encoded}`, {
      params: { scan_source: scanSource },
    })
    return unwrapData(data)
  },

  /**
   * Legacy: Resolve asset by QR identifier (returns full AssetContext).
   */
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