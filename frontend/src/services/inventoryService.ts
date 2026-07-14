import { withMockFallback } from '@/services/api'
import type { InventoryItem, Paginated } from '@/types'

const mockItems: InventoryItem[] = [
  { id: 1, name: 'Bond Paper A4', quantity: 45, status: 'IN_STOCK', unit: 'Ream' },
  { id: 2, name: 'Ink Cartridge', quantity: 4, status: 'LOW_STOCK', unit: 'Piece' },
  { id: 3, name: 'Ballpen', quantity: 0, status: 'OUT_OF_STOCK', unit: 'Box' },
]

export const inventoryService = {
  async list(): Promise<Paginated<InventoryItem>> {
    return withMockFallback(
      async () => {
        throw new Error('Inventory API not available')
      },
      async () => ({
        items: mockItems,
        meta: { current_page: 1, per_page: 10, total: mockItems.length, last_page: 1 },
      }),
    )
  },
}
