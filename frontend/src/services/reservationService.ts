import { api, unwrapData, unwrapPaginated, withMockFallback } from '@/services/api'
import type { ApiResponse, Paginated, Reservation } from '@/types'

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

interface BackendReservation {
  id: number
  user_id: number
  status: Reservation['status']
  start_date: string
  end_date: string
  remarks: string | null
  created_at?: string
  authorized_by?: number | null
  authorized_by_name?: string | null
  authorized_at?: string | null
  asset_ids?: number[]
  asset_names?: string[]
  asset_numbers?: string[]
  employee_name?: string | null
  receipt_code?: string
  receipt_payload?: string
}

function mapReservation(reservation: BackendReservation): Reservation {
  return {
    id: reservation.id,
    user_id: reservation.user_id,
    status: reservation.status,
    start_date: reservation.start_date,
    end_date: reservation.end_date,
    reserved_from: reservation.start_date,
    reserved_until: reservation.end_date,
    remarks: reservation.remarks,
    created_at: reservation.created_at,
    authorized_by: reservation.authorized_by,
    authorized_by_name: reservation.authorized_by_name,
    authorized_at: reservation.authorized_at,
    purpose: reservation.remarks || 'Reservation request',
    employee_name: reservation.employee_name || `User #${reservation.user_id}`,
    asset_ids: reservation.asset_ids ?? [],
    asset_names: reservation.asset_names ?? [],
    asset_numbers: reservation.asset_numbers ?? [],
    receipt_code: reservation.receipt_code,
    receipt_payload: reservation.receipt_payload,
  }
}

export interface CreateReservationPayload {
  asset_ids: number[]
  start_date: string
  end_date: string
  remarks?: string
}

export const reservationService = {
  async list(): Promise<Paginated<Reservation>> {
    return withMockFallback(
      async () => {
        const { data } = await api.get<ApiResponse<BackendReservation[] | Paginated<BackendReservation>>>('/reservations')
        const result = unwrapPaginated(data)
        return {
          ...result,
          items: result.items.map(mapReservation),
        }
      },
      async () => ({
        items: mockReservations,
        meta: { current_page: 1, per_page: 10, total: mockReservations.length, last_page: 1 },
      }),
    )
  },

  async create(payload: CreateReservationPayload): Promise<Reservation> {
    return withMockFallback(
      async () => {
        const { data } = await api.post<ApiResponse<BackendReservation>>('/reservations', payload)
        return mapReservation(unwrapData(data))
      },
      async () => {
        const newReservation: Reservation = {
          id: mockReservations.length + 1,
          purpose: payload.remarks || 'New reservation',
          employee_name: 'Current User',
          status: 'PENDING',
          reserved_from: payload.start_date,
          reserved_until: payload.end_date,
        }
        mockReservations.push(newReservation)
        return newReservation
      },
    )
  },

  async approve(reservationId: number): Promise<Reservation> {
    return withMockFallback(
      async () => {
        const { data } = await api.post<ApiResponse<BackendReservation>>(`/reservations/${reservationId}/approve`)
        return mapReservation(unwrapData(data))
      },
      async () => {
        const reservation = mockReservations.find((r) => r.id === reservationId)
        if (reservation) {
          reservation.status = 'APPROVED'
        }
        return reservation || mockReservations[0]
      },
    )
  },
}
