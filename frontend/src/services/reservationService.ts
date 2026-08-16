import { api, unwrapData, unwrapPaginated } from '@/services/api'
import type { ApiResponse, Paginated, Reservation } from '@/types'

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
  employee_id?: string | null
  receipt_code?: string
  receipt_payload?: string
  auto_released?: boolean
  borrowing_ids?: number[]
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
    employee_id: reservation.employee_id ?? null,
    asset_ids: reservation.asset_ids ?? [],
    asset_names: reservation.asset_names ?? [],
    asset_numbers: reservation.asset_numbers ?? [],
    receipt_code: reservation.receipt_code,
    receipt_payload: reservation.receipt_payload,
    auto_released: reservation.auto_released ?? false,
    borrowing_ids: reservation.borrowing_ids ?? [],
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
    const { data } = await api.get<ApiResponse<BackendReservation[] | Paginated<BackendReservation>>>('/reservations')
    const result = unwrapPaginated(data)
    return {
      ...result,
      items: result.items.map(mapReservation),
    }
  },

  async create(payload: CreateReservationPayload): Promise<Reservation> {
    const { data } = await api.post<ApiResponse<BackendReservation>>('/reservations', payload)
    return mapReservation(unwrapData(data))
  },

  async approve(reservationId: number): Promise<Reservation> {
    const { data } = await api.post<ApiResponse<BackendReservation>>(`/reservations/${reservationId}/approve`)
    return mapReservation(unwrapData(data))
  },

  async reject(reservationId: number, remarks?: string): Promise<Reservation> {
    const { data } = await api.post<ApiResponse<BackendReservation>>(`/reservations/${reservationId}/reject`, {
      remarks,
    })
    return mapReservation(unwrapData(data))
  },

  async cancel(reservationId: number): Promise<Reservation> {
    const { data } = await api.post<ApiResponse<BackendReservation>>(`/reservations/${reservationId}/cancel`)
    return mapReservation(unwrapData(data))
  },
 
  async release(reservationId: number, assetId: number): Promise<void> {
    await api.post(`/reservations/${reservationId}/release`, { asset_id: assetId })
  },
 
  async authorizeScan(value: string): Promise<Reservation> {
    const { data } = await api.post<ApiResponse<BackendReservation>>('/reservations/scan-authorize', { value })
    return mapReservation(unwrapData(data))
  },
}
