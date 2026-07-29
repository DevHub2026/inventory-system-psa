import { api, unwrapData, unwrapPaginated } from '@/services/api'

import type { ApiResponse, Borrowing, Paginated } from '@/types'



export interface CreateBorrowingPayload {
  asset_id: number
  borrow_date: string
  due_date: string
  remarks?: string
}

interface BackendBorrowing {
  id: number
  user_id: number
  employee_id?: string | null
  asset_id: number
  asset_code?: string | null
  quantity?: number
  status: Borrowing['status']
  borrow_date: string
  borrowed_at?: string | null
  due_date: string
  returned_at?: string | null
  remarks: string | null
  created_at?: string
  authorized_by?: number | null
  authorized_by_name?: string | null
  authorized_at?: string | null
  asset_name?: string | null
  asset_number?: string | null
  employee_name?: string | null
  receipt_code?: string
  receipt_payload?: string
  has_pending_extension?: boolean
}

function mapBorrowing(borrowing: BackendBorrowing): Borrowing {
  return {
    id: borrowing.id,
    user_id: borrowing.user_id,
    employee_id: borrowing.employee_id,
    asset_id: borrowing.asset_id,
    asset_code: borrowing.asset_code,
    quantity: borrowing.quantity,
    status: borrowing.status,
    borrow_date: borrowing.borrow_date,
    due_date: borrowing.due_date,
    borrowed_at: borrowing.borrowed_at ?? undefined,
    due_at: borrowing.due_date,
    returned_at: borrowing.returned_at,
    remarks: borrowing.remarks,
    created_at: borrowing.created_at,
    authorized_by: borrowing.authorized_by,
    authorized_by_name: borrowing.authorized_by_name,
    authorized_at: borrowing.authorized_at,
    asset_name: borrowing.asset_name || `Asset #${borrowing.asset_id}`,
    asset_number: borrowing.asset_number ?? undefined,
    employee_name: borrowing.employee_name || `User #${borrowing.user_id}`,
    receipt_code: borrowing.receipt_code,
    receipt_payload: borrowing.receipt_payload,
    has_pending_extension: borrowing.has_pending_extension,
  }
}

export interface ListBorrowingsParams {
  per_page?: number
  page?: number
  status?: string
}

export const borrowingService = {
  async list(params?: ListBorrowingsParams): Promise<Paginated<Borrowing>> {
    const { data } = await api.get<ApiResponse<BackendBorrowing[] | Paginated<BackendBorrowing>>>('/borrowings', { params })
    const result = unwrapPaginated(data)

    return {
      ...result,
      items: result.items.map(mapBorrowing),
    }
  },

  async getById(id: number): Promise<Borrowing | null> {
    const result = await this.list({ per_page: 100 })
    return result.items.find((b) => b.id === id) ?? null
  },

  async create(payload: CreateBorrowingPayload): Promise<Borrowing> {
    const { data } = await api.post<ApiResponse<BackendBorrowing>>('/borrowings', payload)
    return mapBorrowing(unwrapData(data))
  },

  async returnAsset(borrowingId: number, notes?: string): Promise<Borrowing> {
    const { data } = await api.post<ApiResponse<BackendBorrowing>>(`/borrowings/${borrowingId}/return`, { remarks: notes })
    return mapBorrowing(unwrapData(data))
  },

  /**
   * Release an approved reservation — creates the Borrowing record.
   * Calls POST /assets/scan with the reservation receipt identifier.
   */
  async releaseFromReservation(reservationId: number): Promise<Borrowing> {
    const { data } = await api.post<ApiResponse<BackendBorrowing>>('/assets/scan', {
      value: `PSA-RES-${reservationId}`,
    })
    return mapBorrowing(unwrapData(data))
  },
}
