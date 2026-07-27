import { api, unwrapData } from '@/services/api'
import type { ApiResponse, ImportResult } from '@/types'

export interface ImportTypeOption {
  key: string
  label: string
  entity_label: string
  supports_custom_fields: boolean
}

export interface ImportSystemField {
  key: string
  label: string
  required: boolean
  type: string
}

export interface ImportCustomField {
  id: number
  name: string
  field_key: string
  field_type: string
}

export interface ImportColumnMapping {
  excel_column: string
  excel_index: number
  target_type: 'system' | 'custom' | 'ignore'
  target_key: string | null
}

export interface ImportConfiguration {
  type: string
  label: string
  entity_label: string
  system_fields: ImportSystemField[]
  custom_fields: ImportCustomField[]
  supports_custom_fields: boolean
}

export interface ImportUploadResult extends ImportConfiguration {
  import_id: number
  import_type: string
  filename: string
  total_rows: number
  headers: string[]
  preview_rows: string[][]
  columns: Array<{
    index: number
    header: string
    non_empty_count: number
    sample_values: string[]
    is_empty: boolean
  }>
  duplicate_headers: string[]
  suggested_mappings: Array<{
    excel_column: string
    excel_index: number
    suggested_system_field: ImportSystemField | null
    is_empty: boolean
    sample_values: string[]
  }>
  supported_import_types: ImportTypeOption[]
}

export interface ImportValidationResult {
  import_id: number
  import_type?: string
  entity_label?: string
  total_rows: number
  valid_rows: number
  error_count: number
  warning_count: number
  row_errors: string[]
  row_warnings: string[]
  preview_data: Record<string, string | number | boolean | null>[]
}

export interface ImportMappingValidationResult {
  import_id: number
  import_type: string
  mapped_fields: Array<Record<string, unknown>>
  created_custom_fields: ImportCustomField[]
  warnings: string[]
  errors: string[]
  is_valid: boolean
}

export interface ImportHistoryItem {
  id: number
  import_type: string
  filename: string
  imported_by: string
  imported_at: string
  total_rows: number
  imported_rows: number
  failed_rows: number
  skipped_rows: number
  status: string
  errors: string[] | null
}

export const importService = {
  async types(): Promise<ImportTypeOption[]> {
    const { data } = await api.get<ApiResponse<ImportTypeOption[]>>('/imports/types')
    return unwrapData(data)
  },

  async configuration(importType: string): Promise<ImportConfiguration> {
    const { data } = await api.get<ApiResponse<ImportConfiguration>>(`/imports/${importType}/configuration`)
    return unwrapData(data)
  },

  async upload(importType: string, file: File): Promise<ImportUploadResult> {
    const formData = new FormData()
    formData.append('import_type', importType)
    formData.append('file', file)

    const { data } = await api.post<ApiResponse<ImportUploadResult>>('/imports/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    return unwrapData(data)
  },

  async validateMapping(
    importType: string,
    importId: number,
    columnMapping: ImportColumnMapping[],
    customFieldsToCreate: Array<Record<string, string>> = [],
  ): Promise<ImportMappingValidationResult> {
    const { data } = await api.post<ApiResponse<ImportMappingValidationResult>>('/imports/validate-mapping', {
      import_type: importType,
      import_id: importId,
      column_mapping: columnMapping,
      custom_fields_to_create: customFieldsToCreate,
    })

    return unwrapData(data)
  },

  async validateData(importType: string, importId: number, columnMapping: ImportColumnMapping[]): Promise<ImportValidationResult> {
    const { data } = await api.post<ApiResponse<ImportValidationResult>>('/imports/validate-data', {
      import_type: importType,
      import_id: importId,
      column_mapping: columnMapping,
    })

    return unwrapData(data)
  },

  async execute(importType: string, importId: number, columnMapping: ImportColumnMapping[]): Promise<ImportResult> {
    const { data } = await api.post<ApiResponse<ImportResult>>('/imports/execute', {
      import_type: importType,
      import_id: importId,
      column_mapping: columnMapping,
    })

    return unwrapData(data)
  },

  async history(importType?: string): Promise<ImportHistoryItem[]> {
    const { data } = await api.get<ApiResponse<ImportHistoryItem[]>>('/imports/history', {
      params: importType ? { import_type: importType } : undefined,
    })
    return unwrapData(data)
  },
}
