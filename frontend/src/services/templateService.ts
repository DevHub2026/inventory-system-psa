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
  | 'reissuance'
  | 'excel_export'
  | 'csv_export'
  | 'pdf_template'

export interface DocumentTypeOption {
  value: string
  label: string
  category: string
}

export interface PlaceholderDefinition {
  key: string
  token: string
  label: string
  description: string
  category: string
  document_types: string[]
  source: string
  required: boolean
  aliases: string[]
  value_type: string
  missing_behavior: string
}

export interface SignatureBlock {
  key: string
  label: string
  name?: string | null
  position?: string | null
  enabled: boolean
}

export interface TemplateValidationResult {
  placeholders: string[]
  counts: Record<string, number>
  valid: string[]
  unknown: string[]
  duplicates: Record<string, number>
  is_valid: boolean
  validation_status: string
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
  has_file?: boolean
  is_docx_ready?: boolean
  validation_status?: string | null
  validation_result?: TemplateValidationResult | null
  has_unknown_placeholders?: boolean
  change_notes?: string | null
  uploaded_by?: number | null
  uploaded_by_name?: string | null
  upload_date?: string | null
  created_by?: number | null
  updated_by?: number | null
  created_by_name?: string | null
  updated_by_name?: string | null
  created_at: string
  updated_at: string
  // Template customization properties
  logo_url?: string | null
  header_org_name?: string | null
  header_office_name?: string | null
  header_title?: string | null
  body_template?: string | null
  footer_text?: string | null
  footer_notes?: string | null
  signature_blocks?: SignatureBlock[] | null
  font_family?: string | null
  font_size?: number | null
  text_alignment?: string | null
  orientation?: string | null
  paper_size?: string | null
  margin_top?: number | null
  margin_bottom?: number | null
  margin_left?: number | null
  margin_right?: number | null
}

export interface DocumentTemplateVersion {
  id: number
  document_template_id: number
  version: string
  file_name: string
  file_size: number
  mime_type?: string | null
  extension?: string | null
  validation_status?: string | null
  validation_result?: TemplateValidationResult | null
  has_unknown_placeholders?: boolean
  change_notes?: string | null
  uploaded_by?: number | null
  uploaded_by_name?: string | null
  created_at: string
}

export interface TemplateFilters {
  search?: string
  document_type?: string
  status?: string
  is_default?: boolean
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.URL.revokeObjectURL(url)
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
    const { data } = await api.get<ApiResponse<DocumentTypeOption[]>>('/document-templates/types')
    return unwrapData(data)
  },

  async getPlaceholders(documentType?: string): Promise<PlaceholderDefinition[]> {
    const { data } = await api.get<ApiResponse<PlaceholderDefinition[]>>('/document-templates/placeholders', {
      params: documentType ? { document_type: documentType } : undefined,
    })
    return unwrapData(data)
  },

  async get(id: number): Promise<DocumentTemplate> {
    const { data } = await api.get<ApiResponse<DocumentTemplate>>(`/document-templates/${id}`)
    return unwrapData(data)
  },

  async create(payload: {
    name: string
    document_type: string
    description?: string
    change_notes?: string
    file?: File | null
  }): Promise<DocumentTemplate> {
    const formData = new FormData()
    formData.append('name', payload.name)
    formData.append('document_type', payload.document_type)
    if (payload.description) formData.append('description', payload.description)
    if (payload.change_notes) formData.append('change_notes', payload.change_notes)
    if (payload.file) formData.append('file', payload.file)

    const { data } = await api.post<ApiResponse<DocumentTemplate>>('/document-templates', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return unwrapData(data)
  },

  async updateMetadata(
    id: number,
    payload: { name?: string; description?: string | null; change_notes?: string | null },
  ): Promise<DocumentTemplate> {
    const { data } = await api.put<ApiResponse<DocumentTemplate>>(`/document-templates/${id}`, payload)
    return unwrapData(data)
  },

  async upload(id: number, file: File, changeNotes?: string): Promise<DocumentTemplate> {
    const formData = new FormData()
    formData.append('file', file)
    if (changeNotes) formData.append('change_notes', changeNotes)

    const { data } = await api.post<ApiResponse<DocumentTemplate>>(`/document-templates/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return unwrapData(data)
  },

  async replace(id: number, file: File, changeNotes?: string): Promise<DocumentTemplate> {
    const formData = new FormData()
    formData.append('file', file)
    if (changeNotes) formData.append('change_notes', changeNotes)

    const { data } = await api.post<ApiResponse<DocumentTemplate>>(`/document-templates/${id}/replace`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return unwrapData(data)
  },

  async validate(id: number): Promise<{ template: DocumentTemplate; validation: TemplateValidationResult }> {
    const { data } = await api.post<ApiResponse<{ template: DocumentTemplate; validation: TemplateValidationResult }>>(
      `/document-templates/${id}/validate`,
    )
    return unwrapData(data)
  },

  async activate(id: number): Promise<DocumentTemplate> {
    const { data } = await api.post<ApiResponse<DocumentTemplate>>(`/document-templates/${id}/activate`)
    return unwrapData(data)
  },

  async deactivate(id: number): Promise<DocumentTemplate> {
    const { data } = await api.post<ApiResponse<DocumentTemplate>>(`/document-templates/${id}/deactivate`)
    return unwrapData(data)
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/document-templates/${id}`)
  },

  async download(id: number, filename?: string): Promise<void> {
    const response = await api.get(`/document-templates/${id}/download`, { responseType: 'blob' })
    triggerBlobDownload(response.data, filename || `template-${id}.docx`)
  },

  async versions(id: number): Promise<DocumentTemplateVersion[]> {
    const { data } = await api.get<ApiResponse<DocumentTemplateVersion[]>>(`/document-templates/${id}/versions`)
    return unwrapData(data)
  },

  async restoreVersion(id: number, versionId: number): Promise<DocumentTemplate> {
    const { data } = await api.post<ApiResponse<DocumentTemplate>>(
      `/document-templates/${id}/versions/${versionId}/restore`,
    )
    return unwrapData(data)
  },

  async downloadVersion(id: number, versionId: number, filename?: string): Promise<void> {
    const response = await api.get(`/document-templates/${id}/versions/${versionId}/download`, {
      responseType: 'blob',
    })
    triggerBlobDownload(response.data, filename || `template-v-${versionId}.docx`)
  },

  async generateDocument(type: string, targetId: number, filename?: string): Promise<void> {
    try {
      const response = await api.post(
        '/documents/generate',
        { type, target_id: targetId },
        { responseType: 'blob' },
      )

      const disposition = response.headers['content-disposition'] as string | undefined
      let resolvedName = filename || `${type}-${targetId}.docx`
      if (disposition) {
        const match = /filename="?([^"]+)"?/i.exec(disposition)
        if (match?.[1]) resolvedName = match[1]
      }

      if (response.data instanceof Blob && response.data.type.includes('application/json')) {
        const text = await response.data.text()
        const parsed = JSON.parse(text) as { message?: string }
        throw new Error(parsed.message || 'Document generation failed.')
      }

      triggerBlobDownload(response.data, resolvedName)
    } catch (error: unknown) {
      if (error instanceof Error && !(error as { response?: unknown }).response) {
        throw error
      }
      const axiosError = error as { response?: { data?: Blob; status?: number }; message?: string }
      if (axiosError.response?.data instanceof Blob) {
        try {
          const text = await axiosError.response.data.text()
          const parsed = JSON.parse(text) as { message?: string }
          throw new Error(
            parsed.message ||
              'No active DOCX template is configured for this document type. Please contact a system administrator.',
          )
        } catch (inner: unknown) {
          if (inner instanceof Error && inner.message && !inner.message.includes('JSON')) {
            throw inner
          }
        }
      }
      throw error instanceof Error
        ? error
        : new Error('Document generation failed.')
    }
  },
}
