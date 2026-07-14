import { withMockFallback } from '@/services/api'
import type { Paginated, Reservation } from '@/types'

const mockReservations: Reservation[] = [
  {
    id: 1,
    purpose: 'Regional meeting',
    employee_name: 'Ana Reyes',
    status: 'PENDING',
    reserved_from: '2026-07-15',
    reserved_until: '2026-07-15',
  },
  {
    id: 2,
    purpose: 'Training session',
    employee_name: 'Carlo Mendoza',
    status: 'APPROVED',
    reserved_from: '2026-07-16',
    reserved_until: '2026-07-17',
  },
  {
    id: 3,
    purpose: 'Field briefing',
    employee_name: 'Liza Cruz',
    status: 'REJECTED',
    reserved_from: '2026-07-12',
    reserved_until: '2026-07-12',
  },
]

export const reservationService = {
  async list(): Promise<Paginated<Reservation>> {
    return withMockFallback(
      async () => {
        // Placeholder — connect to GET /api/v1/reservations
        throw new Error('Reservations API not available')
      },
      async () => ({
        items: mockReservations,
        meta: { current_page: 1, per_page: 10, total: mockReservations.length, last_page: 1 },
      }),
    )
  },
}
