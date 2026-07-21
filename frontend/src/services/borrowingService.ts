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
  asset_id: number
  status: Borrowing['status']
  borrow_date: string
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
}

function mapBorrowing(borrowing: BackendBorrowing): Borrowing {
  return {
    id: borrowing.id,
    user_id: borrowing.user_id,
    asset_id: borrowing.asset_id,
    status: borrowing.status,
    borrow_date: borrowing.borrow_date,
    due_date: borrowing.due_date,
    borrowed_at: borrowing.borrow_date,
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
  }
}

export const borrowingService = {
  async list(): Promise<Paginated<Borrowing>> {
    const { data } = await api.get<ApiResponse<BackendBorrowing[] | Paginated<BackendBorrowing>>>('/borrowings')
    const result = unwrapPaginated(data)

    return {
      ...result,
      items: result.items.map(mapBorrowing),
    }
  },

  async create(payload: CreateBorrowingPayload): Promise<Borrowing> {
    const { data } = await api.post<ApiResponse<BackendBorrowing>>('/borrowings', payload)
    return mapBorrowing(unwrapData(data))
  },

  async returnAsset(borrowingId: number, notes?: string): Promise<Borrowing> {
    const { data } = await api.post<ApiResponse<BackendBorrowing>>(`/borrowings/${borrowingId}/return`, { remarks: notes })
    return mapBorrowing(unwrapData(data))
  },
}
