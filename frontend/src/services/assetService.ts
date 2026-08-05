import { api, unwrapData } from '@/services/api'

import type { ApiResponse, Asset, AssetStatus, Borrowing, BorrowRequestResult, Paginated } from '@/types'




interface BackendAsset {

  id: number
  asset_number: string
  property_number?: string | null
  psa_qr_identifier?: string | null
  psa_qr_payload?: string | null
  name: string
  description?: string | null
  asset_category_id?: number
  manufacturer_id?: number | null
  office_id?: number
  location_id?: number | null
  model?: string | null
  status: AssetStatus
  condition_status?: string | null
  remarks?: string | null
  purchase_date?: string | null
  purchase_cost?: string | number | null
  warranty_until?: string | null
  issued_to?: string | null
  issued_to_user_id?: number | null
  issued_to_user?: Asset['issued_to_user']
  is_unlinked_holder?: boolean
  issued_by_user_id?: number | null
  date_issued?: string | null
  issued_by_name?: string | null
  created_by?: number | null
  updated_by?: number | null
  created_by_name?: string | null
  updated_by_name?: string | null
  created_at?: string | null
  updated_at?: string | null
  category?: { name?: string } | string | null
  location?: { name?: string } | string | null
  office?: { name?: string } | string | null
  identifiers?: Asset['identifiers']
  reservation_context?: Asset['reservation_context']
  inventory_item_id?: number | null
  is_borrowable?: boolean
}

export interface UpdateAssetPayload {
  /** Asset-operational fields — the only ones the backend now accepts. */
  status?: AssetStatus
  condition_status?: string | null
  remarks?: string | null
  purchase_date?: string | null
  purchase_cost?: number | null
  warranty_until?: string | null
}

function mapAsset(asset: BackendAsset): Asset {
  const category =
    typeof asset.category === 'object' ? asset.category?.name : asset.category
  const location =
    typeof asset.location === 'object' ? asset.location?.name : asset.location
  const office = typeof asset.office === 'object' ? asset.office?.name : asset.office

  return {
    id: asset.id,
    asset_number: asset.asset_number,
    property_number: asset.property_number,
    psa_qr_identifier: asset.psa_qr_identifier,
    psa_qr_payload: asset.psa_qr_payload,
    name: asset.name,
    description: asset.description,
    asset_category_id: asset.asset_category_id,
    manufacturer_id: asset.manufacturer_id,
    office_id: asset.office_id,
    location_id: asset.location_id,
    model: asset.model,
    status: asset.status,
    condition_status: asset.condition_status,
    category: category ?? undefined,
    location: location ?? null,
    office: office ?? null,
    remarks: asset.remarks,
    purchase_date: asset.purchase_date,
    purchase_cost: asset.purchase_cost,
    warranty_until: asset.warranty_until,
    issued_to: asset.issued_to,
    issued_to_user_id: asset.issued_to_user_id,
    issued_to_user: asset.issued_to_user,
    is_unlinked_holder: asset.is_unlinked_holder,
    issued_by_user_id: asset.issued_by_user_id,
    date_issued: asset.date_issued,
    issued_by_name: asset.issued_by_name,
    created_by: asset.created_by,
    updated_by: asset.updated_by,
    created_by_name: asset.created_by_name,
    updated_by_name: asset.updated_by_name,
    created_at: asset.created_at,
    updated_at: asset.updated_at,
    identifiers: asset.identifiers,
    reservation_context: asset.reservation_context ?? null,
    inventory_item_id: asset.inventory_item_id ?? null,
    is_borrowable: asset.is_borrowable ?? true,
  }
}



export const assetService = {
  async list(params: {
    page?: number
    per_page?: number
    search?: string
    status?: string
  } = {}): Promise<Paginated<Asset>> {
    const { data } = await api.get<
      ApiResponse<{
        items: BackendAsset[]
        meta: Paginated<Asset>['meta']
      }>
    >('/assets', { params })

    const payload = unwrapData(data)

    return {
      items: Array.isArray(payload.items) ? payload.items.map(mapAsset) : [],
      meta: payload.meta,
    }
  },

  async show(assetId: number): Promise<Asset> {
    const { data } = await api.get<ApiResponse<BackendAsset>>(`/assets/${assetId}`)
    return mapAsset(unwrapData(data))
  },

  async scan(value: string): Promise<Asset> {
    const { data } = await api.get<ApiResponse<BackendAsset>>('/assets/scan', {
      params: { value },
    })

    return mapAsset(unwrapData(data))
  },

  async scanTransaction(value: string): Promise<Borrowing> {
    const { data } = await api.post<ApiResponse<Borrowing>>('/assets/scan', { value })
    return unwrapData(data)
  },

  async update(assetId: number, payload: UpdateAssetPayload): Promise<Asset> {
    const { data } = await api.put<ApiResponse<BackendAsset>>(`/assets/${assetId}`, payload)
    return mapAsset(unwrapData(data))
  },

  async remove(assetId: number): Promise<void> {
    await api.delete(`/assets/${assetId}`)
  },

  async borrow(assetId: number, dueDate?: number, notes?: string): Promise<Borrowing> {
    const { data } = await api.post<ApiResponse<Borrowing>>(`/assets/${assetId}/borrow`, {
      due_date: dueDate,
      notes,
    })
    return unwrapData(data)
  },

  async returnAsset(assetId: number, notes?: string): Promise<void> {
    await api.post(`/assets/${assetId}/return`, {
      notes,
    })
  },

  async requestBorrow(value: string): Promise<BorrowRequestResult> {
    const { data } = await api.post<ApiResponse<BorrowRequestResult>>('/assets/request-borrow', { value })
    return unwrapData(data)
  },

  async reissue(
    assetId: number,
    payload: { new_employee_id: number; transfer_date: string; reason: string; remarks?: string }
  ): Promise<{ history_id: number; asset: Asset }> {
    const { data } = await api.post<ApiResponse<{ history_id: number; asset: BackendAsset }>>(`/assets/${assetId}/reissue`, payload)
    const result = unwrapData(data)
    return {
      history_id: result.history_id,
      asset: mapAsset(result.asset)
    }
  },

  async getIssuanceHistory(assetId: number): Promise<any[]> {
    const { data } = await api.get<ApiResponse<any[]>>(`/assets/${assetId}/issuance-history`)
    return unwrapData(data)
  },

  async setBorrowable(assetId: number, isBorrowable: boolean): Promise<{ is_borrowable: boolean; inventory_item_id: number | null }> {
    const { data } = await api.patch<ApiResponse<{ is_borrowable: boolean; inventory_item_id: number | null }>>(
      `/assets/${assetId}/borrowable`,
      { is_borrowable: isBorrowable },
    )
    return unwrapData(data)
  },
}

