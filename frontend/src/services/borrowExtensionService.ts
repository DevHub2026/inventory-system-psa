import { api, unwrapData, unwrapPaginated } from '@/services/api'
import type { ApiResponse, BorrowExtensionRequest, Paginated } from '@/types'

export interface RequestExtensionPayload {
  requested_due_date: string
  reason: string
}

export interface RejectExtensionPayload {
  remarks?: string
}

interface BackendBorrowExtensionRequest {
  id: number
  borrowing_id: number
  current_due_date: string
  requested_due_date: string
  reason: string
  status: BorrowExtensionRequest['status']
  remarks?: string | null
  reviewed_by?: number | null
  reviewed_by_name?: string | null
  reviewed_at?: string | null
  created_at?: string
}

function mapBorrowExtensionRequest(request: BackendBorrowExtensionRequest): BorrowExtensionRequest {
  return {
    id: request.id,
    borrowing_id: request.borrowing_id,
    current_due_date: request.current_due_date,
    requested_due_date: request.requested_due_date,
    reason: request.reason,
    status: request.status,
    remarks: request.remarks,
    reviewed_by: request.reviewed_by,
    reviewed_by_name: request.reviewed_by_name,
    reviewed_at: request.reviewed_at,
    created_at: request.created_at,
  }
}

export const borrowExtensionService = {
  async requestExtension(borrowingId: number, data: RequestExtensionPayload): Promise<BorrowExtensionRequest> {
    const { data: response } = await api.post<ApiResponse<BackendBorrowExtensionRequest>>(
      `/borrowings/${borrowingId}/extension-requests`,
      data
    )
    return mapBorrowExtensionRequest(unwrapData(response))
  },

  async getExtensionHistory(borrowingId: number): Promise<Paginated<BorrowExtensionRequest>> {
    const { data } = await api.get<ApiResponse<BackendBorrowExtensionRequest[] | Paginated<BackendBorrowExtensionRequest>>>(
      `/borrowings/${borrowingId}/extension-requests`
    )
    const result = unwrapPaginated(data)

    return {
      ...result,
      items: result.items.map(mapBorrowExtensionRequest),
    }
  },

  async approveExtension(requestId: number): Promise<BorrowExtensionRequest> {
    const { data } = await api.patch<ApiResponse<BackendBorrowExtensionRequest>>(
      `/extension-requests/${requestId}/approve`
    )
    return mapBorrowExtensionRequest(unwrapData(data))
  },

  async rejectExtension(requestId: number, data?: RejectExtensionPayload): Promise<BorrowExtensionRequest> {
    const { data: response } = await api.patch<ApiResponse<BackendBorrowExtensionRequest>>(
      `/extension-requests/${requestId}/reject`,
      data || {}
    )
    return mapBorrowExtensionRequest(unwrapData(response))
  },

  async getPendingExtensionRequests(): Promise<{ count: number }> {
    const { data } = await api.get<ApiResponse<{ count: number }>>('/extension-requests/pending-count')
    return unwrapData(data)
  },
}
