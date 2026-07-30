import { api, unwrapData } from '@/services/api'
import type { ApiResponse, Paginated } from '@/types'
import type {
  IssuanceUserSearchFilters,
  IssuanceUserSummary,
  PermanentIssuanceAsset,
  PermanentIssuanceDirectoryFilters,
  PermanentIssuanceUserAssetsFilters,
} from '@/types/permanentIssuance'

interface PaginatedPayload<T> {
  items: T[]
  meta: Paginated<T>['meta']
}

export const permanentIssuanceService = {
  async searchUsers(filters: IssuanceUserSearchFilters = {}): Promise<Paginated<IssuanceUserSummary>> {
    const { data } = await api.get<ApiResponse<PaginatedPayload<IssuanceUserSummary>>>(
      '/permanent-issuances/users/search',
      { params: filters },
    )
    const payload = unwrapData(data)
    return { items: payload.items ?? [], meta: payload.meta }
  },

  async listUsers(filters: PermanentIssuanceDirectoryFilters = {}): Promise<Paginated<IssuanceUserSummary>> {
    const { data } = await api.get<ApiResponse<PaginatedPayload<IssuanceUserSummary>>>(
      '/permanent-issuances/users',
      { params: filters },
    )
    const payload = unwrapData(data)
    return { items: payload.items ?? [], meta: payload.meta }
  },

  async getUserAssets(
    userId: number,
    filters: PermanentIssuanceUserAssetsFilters = {},
  ): Promise<{ user: IssuanceUserSummary; items: PermanentIssuanceAsset[] }> {
    const { data } = await api.get<
      ApiResponse<{ user: IssuanceUserSummary; items: PermanentIssuanceAsset[] }>
    >(`/permanent-issuances/users/${userId}/assets`, { params: filters })
    return unwrapData(data)
  },

  async assignPermanentIssue(
    assetId: number,
    payload: { issued_to_user_id: number; date_issued: string },
  ): Promise<PermanentIssuanceAsset> {
    const { data } = await api.post<ApiResponse<PermanentIssuanceAsset>>(
      `/assets/${assetId}/permanent-issue`,
      payload,
    )
    return unwrapData(data)
  },
}
