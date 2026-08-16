import { api, unwrapData } from '@/services/api'
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

/**
 * Stable backend keys for document-generation workflow areas.
 * Maps 1-to-1 with TemplateUsageContext PHP enum values.
 */
export type TemplateUsageContextKey =
  | 'BORROWING_RECEIPT'
  | 'BORROWING_RETURN'
  | 'PERMANENT_ISSUANCE'
  | 'ASSET_TRANSFER'
  | 'ASSET_REISSUANCE'
  | 'CLEARANCE'

export interface TemplateUsageContextOption {
  value: TemplateUsageContextKey
  label: string
  description: string
  document_type: string
  operational_status: 'FULLY_CONNECTED' | 'BACKEND_SUPPORTED'
  operational_note: string
}

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
  /** Stable backend key — e.g. BORROWING_RECEIPT. Null for legacy templates. */
  usage_context: TemplateUsageContextKey | null
  usage_context_label: string | null
  usage_context_description: string | null
  /** FULLY_CONNECTED | BACKEND_SUPPORTED | null (when no context assigned) */
  usage_context_operational_status: 'FULLY_CONNECTED' | 'BACKEND_SUPPORTED' | null
  usage_context_operational_note: string | null
  description: string | null
  version: string
  status: string
  status_label: string
  is_default: boolean
  // ── Separated status fields from backend ─────────────────────────────
  /** no_file | valid | invalid | not_validated */
  file_validation_status: 'no_file' | 'valid' | 'invalid' | 'not_validated'
  /** no_file | not_validated | no_placeholders | placeholders_valid | invalid_placeholders | not_applicable */
  placeholder_status: 'no_file' | 'not_validated' | 'no_placeholders' | 'placeholders_valid' | 'invalid_placeholders' | 'not_applicable'
  /** explicit_context | document_type_fallback */
  resolution_mode: 'explicit_context' | 'document_type_fallback'
  /** ready | inactive | no_file | not_validated | invalid_placeholders | not_docx */
  generation_readiness: 'ready' | 'inactive' | 'no_file' | 'not_validated' | 'invalid_placeholders' | 'not_docx'
  // ─────────────────────────────────────────────────────────────────────
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
  usage_context?: TemplateUsageContextKey | string
  status?: string
  is_default?: boolean
}

// ── Read-only Document Template Preview ───────────────────────────────────────

export interface PreviewTemplateInfo {
  exists: boolean
  ready?: boolean
  template_id?: number
  template_name?: string
  template_version?: string
  file_validation_status?: string
  placeholder_status?: string
  generation_readiness?: string
  is_default?: boolean
  resolution_source?: 'active_context_template' | 'document_type_fallback'
}

export interface TemplatePreviewInfo {
  template_id: number
  template_name: string
  template_version: string
  document_type: string
  usage_context: string | null
  usage_context_label: string | null
  effective_context: string | null
  effective_context_label: string | null
  resolution_mode: 'explicit_context' | 'document_type_fallback'
  selected: PreviewTemplateInfo
  active: PreviewTemplateInfo
  default: PreviewTemplateInfo
  real_record_supported: boolean
}

export interface PreviewRecord {
  target_type: string
  target_id: number
  label: string
  status: string
}

export interface PreviewRecordsResult {
  context: string
  records: PreviewRecord[]
}

export interface PreviewGenerationResult {
  filename: string
  template_id: number
  template_name: string
  template_version: string
  resolution: string
  resolution_source: string
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
    const { data } = await api.get<ApiResponse<Paginated<DocumentTemplate>>>('/document-templates', { params })
    return unwrapData(data) as unknown as Paginated<DocumentTemplate>
  },

  async getDocumentTypes(): Promise<DocumentTypeOption[]> {
    const { data } = await api.get<ApiResponse<DocumentTypeOption[]>>('/document-templates/types')
    return unwrapData(data)
  },

  async getUsageContexts(): Promise<TemplateUsageContextOption[]> {
    const { data } = await api.get<ApiResponse<TemplateUsageContextOption[]>>('/document-templates/usage-contexts')
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
    usage_context?: TemplateUsageContextKey | null
    description?: string
    change_notes?: string
    file?: File | null
  }): Promise<DocumentTemplate> {
    const formData = new FormData()
    formData.append('name', payload.name)
    formData.append('document_type', payload.document_type)
    if (payload.usage_context) formData.append('usage_context', payload.usage_context)
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
    payload: {
      name?: string
      usage_context?: TemplateUsageContextKey | null
      description?: string | null
      change_notes?: string | null
    },
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

  async getPreviewInfo(templateId: number): Promise<TemplatePreviewInfo> {
    const { data } = await api.get<ApiResponse<TemplatePreviewInfo>>(`/document-templates/${templateId}/preview-info`)
    return unwrapData(data)
  },

  async getPreviewRecords(templateId: number, perPage = 20): Promise<PreviewRecordsResult> {
    const { data } = await api.get<ApiResponse<PreviewRecordsResult>>(
      `/document-templates/${templateId}/preview-records`,
      { params: { per_page: perPage } },
    )
    return unwrapData(data)
  },

  /**
   * Generate a read-only DOCX preview.
   *
   * mode: 'selected' | 'active' | 'default'
   * sample_data: true uses safe sample values; false requires a real target_id.
   *
   * PREVIEW IS ALWAYS READ-ONLY — no workflow, asset, reservation, borrowing,
   * issuance, transfer, clearance or audit record is created or changed.
   */
  async generatePreview(
    templateId: number,
    options: {
      mode: 'selected' | 'active' | 'default'
      sample_data?: boolean
      target_id?: number | null
    },
  ): Promise<PreviewGenerationResult> {
    const response = await api.post(
      `/document-templates/${templateId}/preview`,
      {
        mode: options.mode,
        sample_data: options.sample_data === false ? 'false' : 'true',
        target_id: options.target_id ?? undefined,
      },
      { responseType: 'blob' },
    )

    // Parse resolution metadata from response headers.
    const h = response.headers as Record<string, string | undefined>
    const decode = (v?: string) => {
      if (!v) return ''
      try {
        return decodeURIComponent(v)
      } catch {
        return v
      }
    }

    let filename = `preview-${options.mode}.docx`
    const disposition = h['content-disposition']
    if (disposition) {
      const match = /filename="?([^"]+)"?/i.exec(disposition)
      if (match?.[1]) filename = match[1]
    }

    if (response.data instanceof Blob && response.data.type.includes('application/json')) {
      const text = await response.data.text()
      try {
        const parsed = JSON.parse(text) as { message?: string }
        throw new Error(parsed.message || 'Preview generation failed.')
      } catch (parseError: unknown) {
        if (parseError instanceof Error && parseError.message) {
          throw parseError
        }
        throw new Error('Preview generation failed.', { cause: parseError })
      }
    }

    triggerBlobDownload(response.data, filename)

    return {
      filename,
      template_id: Number(h['x-preview-template-id'] ?? 0),
      template_name: decode(h['x-preview-template-name']),
      template_version: h['x-preview-template-version'] ?? '',
      resolution: decode(h['x-preview-resolution']),
      resolution_source: h['x-preview-resolution-source'] ?? '',
    }
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
        throw new Error(parsed.message || 'Document generation failed.', { cause: new Error('Backend returned a non-document response.') })
      }

      triggerBlobDownload(response.data, resolvedName)
    } catch (error: unknown) {
      if (error instanceof Error && !(error as { response?: unknown }).response) {
        throw error
      }
      const axiosError = error as { response?: { data?: Blob; status?: number }; message?: string }
      if (axiosError.response?.data instanceof Blob) {
        let message = 'No active DOCX template is configured for this document type. Please contact a system administrator.'
        try {
          const text = await axiosError.response.data.text()
          const parsed = JSON.parse(text) as { message?: string }
          if (parsed.message) message = parsed.message
        } catch (_) {
          // Non-JSON error body — keep the default message.
        }
        throw new Error(message, { cause: error })
      }
      throw error instanceof Error
        ? error
        : new Error('Document generation failed.')
    }
  },
}
