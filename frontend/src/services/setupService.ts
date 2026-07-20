import { api, unwrapData } from '@/services/api'
import type { ApiResponse } from '@/types'

export type SetupResource = 'asset-categories' | 'offices' | 'locations' | 'manufacturers'

export interface SetupRecord {
  id: number
  name: string
  code?: string | null
  description?: string | null
  office_id?: number | null
  is_active?: boolean
}

export interface SetupPayload {
  name: string
  code?: string | null
  description?: string | null
  office_id?: number | null
  is_active?: boolean
}

interface CollectionPayload {
  data?: SetupRecord[]
}

function collectionItems(payload: CollectionPayload | SetupRecord[] | null | undefined): SetupRecord[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

export const setupService = {
  async list(resource: SetupResource): Promise<SetupRecord[]> {
    const { data } = await api.get<ApiResponse<CollectionPayload | SetupRecord[]>>(`/${resource}`, {
      params: { per_page: 100 },
    })

    return collectionItems(unwrapData(data))
  },

  async create(resource: SetupResource, payload: SetupPayload): Promise<SetupRecord> {
    const { data } = await api.post<ApiResponse<SetupRecord>>(`/${resource}`, payload)
    return unwrapData(data)
  },

  async update(resource: SetupResource, id: number, payload: SetupPayload): Promise<SetupRecord> {
    const { data } = await api.put<ApiResponse<SetupRecord>>(`/${resource}/${id}`, payload)
    return unwrapData(data)
  },

  async remove(resource: SetupResource, id: number): Promise<void> {
    await api.delete(`/${resource}/${id}`)
  },
}
