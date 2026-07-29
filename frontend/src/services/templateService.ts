import { api, unwrapData, withMockFallback } from '@/services/api'
import type { ApiResponse, Paginated } from '@/types'

export type DocumentType =
  | 'inventory_report'
  | 'asset_report'
  | 'borrow_report'
  | 'reservation_report'
  | 'maintenance_report'
  | 'borrow_receipt'
  | 'return_receipt'
  | 'clearance'
  | 'issuance'
  | 'property_transfer'
  | 'excel_export'
  | 'csv_export'
  | 'pdf_template'

export interface DocumentTypeOption {
  value: string
  label: string
  category: string
}

export interface SignatureBlock {
  key: string
  label: string
  name: string
  position: string
  enabled: boolean
}

export interface DocumentTemplate {
  id: number
  name: string
  document_type: string
  document_type_label: string
  category: string
  description: string | null
  version: string
  status: string
  status_label: string
  is_default: boolean
  file_name?: string | null
  file_size?: number | null
  mime_type?: string | null
  extension?: string | null
  file_url?: string | null
  uploaded_by?: number | null
  upload_date?: string | null
  header_org_name?: string | null
  header_office_name?: string | null
  header_title?: string | null
  logo_url?: string | null
  body_template?: string | null
  footer_text?: string | null
  footer_notes?: string | null
  signature_blocks?: SignatureBlock[] | null
  paper_size?: 'A4' | 'Letter' | string
  orientation?: 'portrait' | 'landscape' | string
  margin_top?: number
  margin_bottom?: number
  margin_left?: number
  margin_right?: number
  font_family?: 'Arial' | 'Calibri' | 'Times New Roman' | string
  font_size?: number
  text_alignment?: 'left' | 'center' | 'right' | string
  created_by?: number | null
  updated_by?: number | null
  created_by_name?: string | null
  updated_by_name?: string | null
  created_at: string
  updated_at: string
}

export interface TemplateFilters {
  search?: string
  document_type?: string
  status?: string
  is_default?: boolean
}

export interface TemplateUploadPayload {
  name: string
  document_type: string
  description?: string
  version?: string
  status?: string
  is_default?: boolean
  file?: File | null
}

export const templateService = {
  async list(params?: TemplateFilters & { per_page?: number }): Promise<Paginated<DocumentTemplate>> {
    return withMockFallback(
      async () => {
        const { data } = await api.get<ApiResponse<Paginated<DocumentTemplate>>>('/document-templates', { params })
        return unwrapData(data) as unknown as Paginated<DocumentTemplate>
      },
      async () => ({
        items: [],
        meta: { current_page: 1, per_page: 20, total: 0, last_page: 1 },
      }),
    )
  },

  async getDocumentTypes(): Promise<DocumentTypeOption[]> {
    return withMockFallback(
      async () => {
        const { data } = await api.get<ApiResponse<DocumentTypeOption[]>>('/document-templates/types')
        return unwrapData(data)
      },
      async () => [],
    )
  },

  async getByDocumentType(type: string): Promise<DocumentTemplate[]> {
    return withMockFallback(
      async () => {
        const { data } = await api.get<ApiResponse<DocumentTemplate[]>>(`/document-templates/type/${type}`)
        return unwrapData(data)
      },
      async () => [],
    )
  },

  async get(id: number): Promise<DocumentTemplate> {
    const { data } = await api.get<ApiResponse<DocumentTemplate>>(`/document-templates/${id}`)
    return unwrapData(data)
  },

  async upload(payload: TemplateUploadPayload): Promise<DocumentTemplate> {
    const formData = new FormData()
    formData.append('name', payload.name)
    formData.append('document_type', payload.document_type)
    if (payload.description) formData.append('description', payload.description)
    if (payload.version) formData.append('version', payload.version)
    if (payload.status) formData.append('status', payload.status)
    if (payload.is_default) formData.append('is_default', '1')
    if (payload.file) formData.append('file', payload.file)

    const { data } = await api.post<ApiResponse<DocumentTemplate>>('/document-templates', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return unwrapData(data)
  },

  async update(id: number, payload: Partial<TemplateUploadPayload>): Promise<DocumentTemplate> {
    const formData = new FormData()
    if (payload.name) formData.append('name', payload.name)
    if (payload.description !== undefined) formData.append('description', payload.description ?? '')
    if (payload.version) formData.append('version', payload.version)
    if (payload.status) formData.append('status', payload.status)
    if (payload.is_default !== undefined) formData.append('is_default', payload.is_default ? '1' : '0')
    if (payload.file) formData.append('file', payload.file)

    const { data } = await api.put<ApiResponse<DocumentTemplate>>(`/document-templates/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return unwrapData(data)
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/document-templates/${id}`)
  },

  async download(id: number): Promise<Blob> {
    const response = await api.get(`/document-templates/${id}/download`, {
      responseType: 'blob',
    })
    return response.data
  },

  async preview(id: number): Promise<Blob> {
    const response = await api.get(`/document-templates/${id}/preview`, {
      responseType: 'blob',
    })
    return response.data
  },

  async duplicate(id: number): Promise<DocumentTemplate> {
    const { data } = await api.post<ApiResponse<DocumentTemplate>>(`/document-templates/${id}/duplicate`)
    return unwrapData(data)
  },

  async setDefault(id: number): Promise<DocumentTemplate> {
    const { data } = await api.post<ApiResponse<DocumentTemplate>>(`/document-templates/${id}/set-default`)
    return unwrapData(data)
  },

  async updateContent(id: number, payload: Partial<DocumentTemplate>): Promise<DocumentTemplate> {
    const { data } = await api.put<ApiResponse<DocumentTemplate>>(`/document-templates/${id}`, payload)
    return unwrapData(data)
  },

  async restoreDefault(id: number): Promise<DocumentTemplate> {
    const { data } = await api.post<ApiResponse<DocumentTemplate>>(`/document-templates/${id}/restore-default`)
    return unwrapData(data)
  },

  async toggleStatus(id: number): Promise<DocumentTemplate> {
    const { data } = await api.post<ApiResponse<DocumentTemplate>>(`/document-templates/${id}/toggle-status`)
    return unwrapData(data)
  },
}
