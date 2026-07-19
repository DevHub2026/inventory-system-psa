import { api, unwrapData } from '@/services/api'

import type { ApiResponse, Asset, AssetStatus, Borrowing, Paginated } from '@/types'




interface BackendAsset {

  id: number
  asset_number: string
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
  category?: { name?: string } | string | null
  location?: { name?: string } | string | null
  office?: { name?: string } | string | null
  identifiers?: Asset['identifiers']
}

export interface UpdateAssetPayload {
  asset_number?: string
  name?: string
  description?: string | null
  model?: string | null
  status?: AssetStatus
  condition_status?: string | null
  remarks?: string | null
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
    identifiers: asset.identifiers,
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
}

