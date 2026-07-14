import { withMockFallback } from '@/services/api'
import type { MaintenanceRequest, Paginated } from '@/types'

const mockRequests: MaintenanceRequest[] = [
  {
    id: 1,
    asset_name: 'Canon Printer',
    description: 'Paper jam and ink leak',
    status: 'ONGOING',
    scheduled_at: '2026-07-14',
  },
  {
    id: 2,
    asset_name: 'UPS Unit',
    description: 'Battery replacement',
    status: 'PENDING',
    scheduled_at: '2026-07-18',
  },
  {
    id: 3,
    asset_name: 'Desktop PC',
    description: 'Preventive cleaning',
    status: 'COMPLETED',
    scheduled_at: '2026-07-05',
  },
]

export const maintenanceService = {
  async list(): Promise<Paginated<MaintenanceRequest>> {
    return withMockFallback(
      async () => {
        throw new Error('Maintenance API not available')
      },
      async () => ({
        items: mockRequests,
        meta: { current_page: 1, per_page: 10, total: mockRequests.length, last_page: 1 },
      }),
    )
  },
}
