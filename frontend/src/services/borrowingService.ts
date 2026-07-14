import { withMockFallback } from '@/services/api'
import type { Borrowing, Paginated } from '@/types'

const mockBorrowings: Borrowing[] = [
  {
    id: 1,
    asset_name: 'Dell Laptop',
    employee_name: 'Juan Dela Cruz',
    status: 'ACTIVE',
    borrowed_at: '2026-07-10',
    due_at: '2026-07-17',
  },
  {
    id: 2,
    asset_name: 'Wireless Speaker',
    employee_name: 'Maria Santos',
    status: 'OVERDUE',
    borrowed_at: '2026-07-01',
    due_at: '2026-07-08',
  },
  {
    id: 3,
    asset_name: 'Epson Projector',
    employee_name: 'Pedro Lopez',
    status: 'RETURNED',
    borrowed_at: '2026-06-20',
    due_at: '2026-06-25',
  },
]

export const borrowingService = {
  async list(): Promise<Paginated<Borrowing>> {
    return withMockFallback(
      async () => {
        throw new Error('Borrowings API not available')
      },
      async () => ({
        items: mockBorrowings,
        meta: { current_page: 1, per_page: 10, total: mockBorrowings.length, last_page: 1 },
      }),
    )
  },
}
