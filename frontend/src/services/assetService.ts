import { api, withMockFallback, unwrapData } from '@/services/api'
import type { ApiResponse, Asset, AssetStatus, Paginated } from '@/types'

const mockAssets: Asset[] = [
  {
    id: 1,
    asset_number: 'PSA-0001',
    name: 'Epson Projector',
    category: 'Projector',
    status: 'AVAILABLE',
    location: 'Conference Room',
    office: 'PSA XII',
  },
  {
    id: 2,
    asset_number: 'PSA-0002',
    name: 'Dell Laptop',
    category: 'Laptop',
    status: 'BORROWED',
    location: 'ICT Office',
    office: 'PSA XII',
  },
  {
    id: 3,
    asset_number: 'PSA-0003',
    name: 'Canon Printer',
    category: 'Printer',
    status: 'MAINTENANCE',
    location: 'Storage Room',
    office: 'PSA XII',
  },
  {
    id: 4,
    asset_number: 'PSA-0004',
    name: 'Wireless Speaker',
    category: 'Audio',
    status: 'RESERVED',
    location: 'Training Hall',
    office: 'PSA XII',
  },
]

interface BackendAsset {
  id: number
  asset_number: string
  name: string
  status: AssetStatus
  category?: { name?: string } | string | null
  location?: { name?: string } | string | null
  office?: { name?: string } | string | null
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
    name: asset.name,
    status: asset.status,
    category: category ?? undefined,
    location: location ?? null,
    office: office ?? null,
  }
}

function paginate<T>(items: T[], page: number, perPage: number): Paginated<T> {
  const start = (page - 1) * perPage
  const slice = items.slice(start, start + perPage)
  return {
    items: slice,
    meta: {
      current_page: page,
      per_page: perPage,
      total: items.length,
      last_page: Math.max(1, Math.ceil(items.length / perPage)),
    },
  }
}

export const assetService = {
  async list(params: {
    page?: number
    search?: string
    status?: string
  } = {}): Promise<Paginated<Asset>> {
    const page = params.page ?? 1

    return withMockFallback(
      async () => {
        const { data } = await api.get<
          ApiResponse<{
            items: BackendAsset[]
            meta: Paginated<Asset>['meta']
          }>
        >('/assets', { params })
        const payload = unwrapData(data)
        return {
          items: payload.items.map(mapAsset),
          meta: payload.meta,
        }
      },
      async () => {
        let filtered = [...mockAssets]
        if (params.search) {
          const term = params.search.toLowerCase()
          filtered = filtered.filter(
            (asset) =>
              asset.asset_number.toLowerCase().includes(term) ||
              asset.name.toLowerCase().includes(term),
          )
        }
        if (params.status) {
          filtered = filtered.filter((asset) => asset.status === params.status)
        }
        return paginate(filtered, page, 10)
      },
    )
  },

  async remove(assetId: number): Promise<void> {
    return withMockFallback(
      async () => {
        await api.delete(`/assets/${assetId}`)
      },
      async () => undefined,
    )
  },
}
