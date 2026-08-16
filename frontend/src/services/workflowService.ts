import { api, unwrapData, unwrapPaginated } from '@/services/api'
import type {
  ApiResponse,
  Paginated,
  Workflow,
  WorkflowApprovalHistory,
  WorkflowAuditLog,
  WorkflowVersion,
} from '@/types'

export interface ModuleOption {
  value: string
  label: string
}

export interface WorkflowMetadata {
  modules: ModuleOption[]
  approval_types: ModuleOption[]
  default_options: Record<string, boolean>
}

export const workflowService = {
  async list(params?: Record<string, unknown>): Promise<Paginated<Workflow>> {
    const { data } = await api.get<ApiResponse<Paginated<Workflow>>>('/workflows', { params })
    return unwrapPaginated(data)
  },

  async getModules(): Promise<WorkflowMetadata> {
    const { data } = await api.get<ApiResponse<WorkflowMetadata>>('/workflows/modules')
    return unwrapData(data)
  },

  async getById(id: number): Promise<Workflow> {
    const { data } = await api.get<ApiResponse<Workflow>>(`/workflows/${id}`)
    return unwrapData(data)
  },

  async create(payload: Partial<Workflow> & { approval_levels: unknown[] }): Promise<Workflow> {
    const { data } = await api.post<ApiResponse<Workflow>>('/workflows', payload)
    return unwrapData(data)
  },

  async update(id: number, payload: Partial<Workflow> & { change_summary?: string; approval_levels?: unknown[] }): Promise<Workflow> {
    const { data } = await api.put<ApiResponse<Workflow>>(`/workflows/${id}`, payload)
    return unwrapData(data)
  },

  async duplicate(id: number): Promise<Workflow> {
    const { data } = await api.post<ApiResponse<Workflow>>(`/workflows/${id}/duplicate`)
    return unwrapData(data)
  },

  async archive(id: number): Promise<Workflow> {
    const { data } = await api.post<ApiResponse<Workflow>>(`/workflows/${id}/archive`)
    return unwrapData(data)
  },

  async restore(id: number): Promise<Workflow> {
    const { data } = await api.post<ApiResponse<Workflow>>(`/workflows/${id}/restore`)
    return unwrapData(data)
  },

  async toggleStatus(id: number): Promise<Workflow> {
    const { data } = await api.post<ApiResponse<Workflow>>(`/workflows/${id}/toggle-status`)
    return unwrapData(data)
  },

  async getVersions(id: number): Promise<WorkflowVersion[]> {
    const { data } = await api.get<ApiResponse<WorkflowVersion[]>>(`/workflows/${id}/versions`)
    return unwrapData(data)
  },

  async getAuditLogs(id: number): Promise<WorkflowAuditLog[]> {
    const { data } = await api.get<ApiResponse<WorkflowAuditLog[]>>(`/workflows/${id}/audit-logs`)
    return unwrapData(data)
  },

  async getRequestHistory(requestType: string, requestId: number): Promise<WorkflowApprovalHistory[]> {
    const { data } = await api.get<ApiResponse<WorkflowApprovalHistory[]>>('/workflows/request-history', {
      params: { request_type: requestType, request_id: requestId },
    })
    return unwrapData(data)
  },
}
