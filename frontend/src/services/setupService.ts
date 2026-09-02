import { api, unwrapData } from '@/services/api'
import type { ApiResponse } from '@/types'

export type SetupResource =
  | 'asset-categories'
  | 'offices'
  | 'locations'
  | 'manufacturers'
  | 'departments'
  | 'units'
  | 'inventory-item-types'

export interface SetupRecord {
  id: number
  name: string
  code?: string | null
  description?: string | null
  office_id?: number | null
  is_active?: boolean
  created_by?: number | null
  updated_by?: number | null
  created_by_name?: string | null
  updated_by_name?: string | null
  created_at?: string | null
  updated_at?: string | null
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

const _cache = new Map<SetupResource, Promise<SetupRecord[]>>()

export const setupService = {
  async list(resource: SetupResource): Promise<SetupRecord[]> {
    // Return cached Promise if present to dedupe concurrent calls and reuse results within the session
    if (_cache.has(resource)) return _cache.get(resource)!

    const p = (async () => {
      const { data } = await api.get<ApiResponse<CollectionPayload | SetupRecord[]>>(`/${resource}`, {
        params: { per_page: 100 },
      })
      return collectionItems(unwrapData(data))
    })()

    // Store the in-flight promise immediately to dedupe concurrent callers
    _cache.set(resource, p)

    try {
      const res = await p
      // Replace with an already-resolved promise to keep return type consistent and avoid re-fetching
      _cache.set(resource, Promise.resolve(res))
      return res
    } catch (err) {
      // On error, remove the cache entry so retries can be attempted
      _cache.delete(resource)
      throw err
    }
  },

  async create(resource: SetupResource, payload: SetupPayload): Promise<SetupRecord> {
    const { data } = await api.post<ApiResponse<SetupRecord>>(`/${resource}`, payload)
    // Invalidate cache for this resource so callers get fresh data
    _cache.delete(resource)
    return unwrapData(data)
  },

  async update(resource: SetupResource, id: number, payload: SetupPayload): Promise<SetupRecord> {
    const { data } = await api.put<ApiResponse<SetupRecord>>(`/${resource}/${id}`, payload)
    _cache.delete(resource)
    return unwrapData(data)
  },

  async remove(resource: SetupResource, id: number | string): Promise<void> {
    // Coerce and encode the id to avoid accidental malformed URLs (defensive).
    await api.delete(`/${resource}/${encodeURIComponent(String(id))}`)
    _cache.delete(resource)
  },

  // Expose cache control for callers/tests
  _clear(resource: SetupResource) {
    _cache.delete(resource)
  },
}
