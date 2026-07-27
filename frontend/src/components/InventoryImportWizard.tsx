import { useEffect, useRef, useState } from 'react'
import { Upload, CheckCircle2, AlertCircle, Info, ArrowLeft, ArrowRight, Download } from 'lucide-react'
import { Badge, Button, Input, Modal, Spinner } from '@/components/ui'
import { importService, type ImportTypeOption } from '@/services/importService'
import type { ImportResult } from '@/types'

interface SystemField {
  key: string
  label: string
  required: boolean
  type: string
}

interface ColumnInfo {
  index: number
  header: string
  non_empty_count: number
  sample_values: string[]
  is_empty: boolean
}

interface SuggestedMapping {
  excel_column: string
  excel_index: number
  suggested_system_field: SystemField | null
  is_empty: boolean
  sample_values: string[]
}

interface UploadResult {
  import_id: number
  import_type?: string
  entity_label?: string
  filename: string
  total_rows: number
  headers: string[]
  preview_rows: string[][]
  columns: ColumnInfo[]
  duplicate_headers: string[]
  suggested_mappings: SuggestedMapping[]
  system_fields: SystemField[]
  custom_fields: Array<{ id: number; name: string; field_key: string; field_type: string }>
}

interface ColumnMapping {
  excel_column: string
  excel_index: number
  target_type: 'system' | 'custom' | 'ignore'
  target_key: string | null
}

interface DataValidationResult {
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

interface ImportHistoryItem {
  id: number
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

type WizardStep = 'upload' | 'preview' | 'mapping' | 'validate' | 'confirm' | 'complete' | 'history'

const STEPS: { key: WizardStep; label: string }[] = [
  { key: 'upload', label: 'Upload' },
  { key: 'preview', label: 'Preview' },
  { key: 'mapping', label: 'Map Columns' },
  { key: 'validate', label: 'Validate' },
  { key: 'confirm', label: 'Confirm' },
  { key: 'complete', label: 'Complete' },
]

interface ImportWizardProps {
  open: boolean
  onClose: () => void
  onCompleted?: () => void
  initialImportType?: string
  title?: string
}

export function ImportWizard({ open, onClose, onCompleted, initialImportType, title }: ImportWizardProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [step, setStep] = useState<WizardStep>('upload')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null)
  const [importTypes, setImportTypes] = useState<ImportTypeOption[]>([])
  const [selectedImportType, setSelectedImportType] = useState(initialImportType ?? 'inventory')

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)

  // Mapping state
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([])

  // Data validation state
  const [dataValidation, setDataValidation] = useState<DataValidationResult | null>(null)

  // Import result
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  // History
  const [history, setHistory] = useState<ImportHistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)

  // Custom field creation
  const [newCustomField, setNewCustomField] = useState<{ name: string; field_type: string; excel_column: string } | null>(null)
  const selectedTypeLabel = importTypes.find(type => type.key === selectedImportType)?.label ?? 'Inventory Items'
  const entityLabel = dataValidation?.entity_label ?? uploadResult?.entity_label ?? selectedTypeLabel.toLowerCase()

  useEffect(() => {
    if (!open) return

    let active = true

    async function loadImportTypes() {
      try {
        const types = await importService.types()
        if (active) setImportTypes(types)
      } catch {
        if (active) {
          setImportTypes([
            { key: 'inventory', label: 'Inventory Items', entity_label: 'inventory items', supports_custom_fields: true },
          ])
        }
      }
    }

    void loadImportTypes()

    return () => {
      active = false
    }
  }, [open])

  function reset() {
    setStep('upload')
    setUploadFile(null)
    setUploadResult(null)
    setColumnMappings([])
    setDataValidation(null)
    setImportResult(null)
    setMessage(null)
    setNewCustomField(null)
    setSelectedImportType(initialImportType ?? 'inventory')
  }

  async function handleUpload() {
    if (!uploadFile) { setMessage({ type: 'error', text: 'Please select a file to upload.' }); return }
    setLoading(true); setMessage(null)
    try {
      const result = await importService.upload(selectedImportType, uploadFile)
      setUploadResult(result)
      setStep('preview')
      // Auto-setup initial mappings
      const mappings: ColumnMapping[] = result.suggested_mappings.map((m: SuggestedMapping) => ({
        excel_column: m.excel_column,
        excel_index: m.excel_index,
        target_type: m.suggested_system_field ? 'system' : 'ignore',
        target_key: m.suggested_system_field ? m.suggested_system_field.key : null,
      }))
      setColumnMappings(mappings)
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Upload failed.' })
    } finally { setLoading(false) }
  }

  function updateMapping(index: number, targetType: ColumnMapping['target_type'], targetKey: string | null) {
    setColumnMappings(prev => prev.map((m, i) =>
      i === index ? { ...m, target_type: targetType, target_key: targetKey } : m
    ))
  }

  async function handleValidateMapping() {
    if (!uploadResult) return
    setLoading(true); setMessage(null)
    try {
      const result = await importService.validateMapping(uploadResult.import_type ?? selectedImportType, uploadResult.import_id, columnMappings)
      if (result.is_valid) {
        setStep('validate')
        await handleValidateData()
      } else {
        setMessage({ type: 'error', text: 'Please fix the mapping issues before continuing.' })
      }
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Validation failed.' })
    } finally { setLoading(false) }
  }

  async function handleValidateData() {
    if (!uploadResult) return
    setLoading(true)
    try {
      const result = await importService.validateData(uploadResult.import_type ?? selectedImportType, uploadResult.import_id, columnMappings)
      setDataValidation(result)
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Data validation failed.' })
    } finally { setLoading(false) }
  }

  async function handleExecuteImport() {
    if (!uploadResult) return
    setLoading(true); setMessage(null)
    try {
      const result = await importService.execute(uploadResult.import_type ?? selectedImportType, uploadResult.import_id, columnMappings)
      setImportResult(result)
      setStep('complete')
      onCompleted?.()
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Import failed.' })
    } finally { setLoading(false) }
  }

  async function loadHistory() {
    setLoading(true)
    try {
      const h = await importService.history(initialImportType ? selectedImportType : undefined)
      setHistory(h)
      setShowHistory(true)
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to load history.' })
    } finally { setLoading(false) }
  }

  const currentStepIndex = STEPS.findIndex(s => s.key === step)

  return (
    <Modal
      open={open}
      title={title ?? `Import ${selectedTypeLabel} Wizard`}
      onClose={() => { reset(); onClose() }}
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="flex gap-2">
            {step !== 'upload' && step !== 'complete' && (
              <Button variant="secondary" onClick={() => {
                const idx = STEPS.findIndex(s => s.key === step)
                if (idx > 0) setStep(STEPS[idx - 1].key)
              }}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            )}
            {step === 'complete' && (
              <Button variant="secondary" onClick={() => loadHistory()}>
                <Download className="h-4 w-4" /> View History
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => { reset(); onClose() }}>Cancel</Button>
            {step === 'upload' && (
              <Button onClick={() => void handleUpload()} disabled={!uploadFile || loading}>
                {loading ? 'Uploading…' : 'Upload & Preview'}
              </Button>
            )}
            {step === 'preview' && (
              <Button onClick={() => setStep('mapping')}>
                Configure Mapping <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            {step === 'mapping' && (
              <Button onClick={() => void handleValidateMapping()} disabled={loading}>
                {loading ? 'Validating…' : 'Validate Mapping'}
              </Button>
            )}
            {step === 'validate' && dataValidation && dataValidation.error_count === 0 && (
              <Button onClick={() => setStep('confirm')}>
                Review Import <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            {step === 'validate' && dataValidation && dataValidation.error_count > 0 && (
              <Button variant="secondary" onClick={() => setStep('mapping')}>
                Fix Mapping Issues
              </Button>
            )}
            {step === 'confirm' && (
              <Button onClick={() => void handleExecuteImport()} disabled={loading}>
                {loading ? 'Importing…' : 'Confirm Import'}
              </Button>
            )}
            {step === 'complete' && (
              <Button onClick={() => { reset(); onClose() }}>Done</Button>
            )}
            {showHistory && (
              <Button variant="secondary" onClick={() => setShowHistory(false)}>Back to Import</Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Progress indicator */}
        {!showHistory && (
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex items-center">
                <div className={`flex items-center gap-1.5 ${i <= currentStepIndex ? 'text-[#0D47A1]' : 'text-slate-400'}`}>
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    i < currentStepIndex ? 'bg-[#0D47A1] text-white' :
                    i === currentStepIndex ? 'border-2 border-[#0D47A1] text-[#0D47A1]' :
                    'border-2 border-slate-300 text-slate-400'
                  }`}>
                    {i < currentStepIndex ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  <span className="text-xs font-medium hidden sm:inline">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`mx-2 h-px w-8 ${i < currentStepIndex ? 'bg-[#0D47A1]' : 'bg-slate-300'}`} />}
              </div>
            ))}
          </div>
        )}

        {message && (
          <div className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm font-medium ${
            message.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
            message.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
            'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}>
            {message.type === 'error' ? <AlertCircle className="mt-px h-4 w-4 flex-none" /> :
             message.type === 'warning' ? <Info className="mt-px h-4 w-4 flex-none" /> :
             <CheckCircle2 className="mt-px h-4 w-4 flex-none" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Step: Upload */}
        {step === 'upload' && !showHistory && (
          <div className="space-y-4">
            {!initialImportType && (
              <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Import Type</label>
                <select
                  className="mt-2 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm"
                  value={selectedImportType}
                  onChange={(event) => setSelectedImportType(event.target.value)}
                  disabled={loading}
                >
                  {importTypes.map((type) => (
                    <option key={type.key} value={type.key}>{type.label}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFD] p-8 text-center">
              <Upload className="mx-auto h-10 w-10 text-slate-400" />
              <p className="mt-3 text-sm font-medium text-slate-600">Upload an Excel file (.xlsx, .xls, .csv)</p>
              <p className="mt-1 text-xs text-slate-400">Maximum file size: 10 MB</p>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} />
              <Button variant="secondary" className="mt-4" onClick={() => fileInputRef.current?.click()}>
                {uploadFile ? uploadFile.name : 'Choose File'}
              </Button>
            </div>
            <div className="flex justify-center">
              <Button variant="ghost" size="sm" onClick={() => loadHistory()}>
                <Download className="h-4 w-4" /> View Import History
              </Button>
            </div>
          </div>
        )}

        {/* Step: Preview */}
        {step === 'preview' && uploadResult && !showHistory && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-[#E5E7EB] bg-white p-3 text-center">
                <div className="text-xl font-bold text-[#0D47A1]">{uploadResult.total_rows}</div>
                <div className="text-xs text-slate-500">Total Rows</div>
              </div>
              <div className="rounded-lg border border-[#E5E7EB] bg-white p-3 text-center">
                <div className="text-xl font-bold text-slate-700">{uploadResult.headers.length}</div>
                <div className="text-xs text-slate-500">Columns</div>
              </div>
              <div className="rounded-lg border border-[#E5E7EB] bg-white p-3 text-center">
                <div className="text-xl font-bold text-slate-700">{uploadResult.filename}</div>
                <div className="text-xs text-slate-500">File</div>
              </div>
            </div>

            {uploadResult.duplicate_headers.length > 0 && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                <p className="text-xs font-bold text-yellow-700">Duplicate columns detected: {uploadResult.duplicate_headers.join(', ')}</p>
              </div>
            )}

            <div className="overflow-x-auto rounded-lg border border-[#E5E7EB]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50">
                    {uploadResult.headers.map((h, i) => (
                      <th key={i} className="px-3 py-2 text-left font-semibold text-slate-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {uploadResult.preview_rows.map((row, ri) => (
                    <tr key={ri} className="border-t border-[#E5E7EB]">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-3 py-2 text-slate-700">{cell || <span className="text-slate-300">—</span>}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-400">Showing first {uploadResult.preview_rows.length} of {uploadResult.total_rows} rows</p>
          </div>
        )}

        {/* Step: Mapping */}
        {step === 'mapping' && uploadResult && !showHistory && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Map each Excel column to a system field. Required fields are marked.</p>

            {columnMappings.map((mapping, idx) => {
              const suggested = uploadResult.suggested_mappings[idx]
              return (
                <div key={idx} className="rounded-lg border border-[#E5E7EB] bg-white p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{mapping.excel_column}</span>
                        {suggested?.sample_values && suggested.sample_values.length > 0 && (
                          <span className="text-xs text-slate-400">
                            e.g. {suggested.sample_values.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        className="rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-sm"
                        value={mapping.target_type}
                        onChange={(e) => {
                          const val = e.target.value as ColumnMapping['target_type']
                          if (val === 'system') {
                            const sug = uploadResult.suggested_mappings[idx]?.suggested_system_field
                            updateMapping(idx, val, sug?.key ?? null)
                          } else {
                            updateMapping(idx, val, null)
                          }
                        }}
                      >
                        <option value="system">Map to Field</option>
                        <option value="custom">Custom Field</option>
                        <option value="ignore">Ignore</option>
                      </select>

                      {mapping.target_type === 'system' && (
                        <select
                          className="rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-sm"
                          value={mapping.target_key ?? ''}
                          onChange={(e) => updateMapping(idx, 'system', e.target.value)}
                        >
                          <option value="">Select field…</option>
                          {uploadResult.system_fields.map((f) => (
                            <option key={f.key} value={f.key}>
                              {f.label} {f.required ? '(Required)' : ''}
                            </option>
                          ))}
                        </select>
                      )}

                      {mapping.target_type === 'custom' && (
                        <div className="flex gap-2">
                          <select
                            className="rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-sm"
                            value={mapping.target_key ?? ''}
                            onChange={(e) => updateMapping(idx, 'custom', e.target.value)}
                          >
                            <option value="">Select custom field…</option>
                            {uploadResult.custom_fields.map((cf) => (
                              <option key={cf.id} value={cf.id.toString()}>{cf.name}</option>
                            ))}
                          </select>
                          <Button size="sm" variant="ghost" onClick={() => setNewCustomField({
                            name: mapping.excel_column,
                            field_type: 'text',
                            excel_column: mapping.excel_column,
                          })}>
                            + New
                          </Button>
                        </div>
                      )}

                      {mapping.target_type === 'ignore' && (
                        <Badge tone="red">Ignored</Badge>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* New custom field dialog */}
            {newCustomField && (
              <div className="rounded-lg border border-[#0D47A1]/20 bg-blue-50 p-4">
                <p className="text-sm font-medium text-[#0D47A1]">Create New Custom Field</p>
                <div className="mt-3 flex gap-3">
                  <Input
                    value={newCustomField.name}
                    onChange={(e) => setNewCustomField({ ...newCustomField, name: e.target.value })}
                    placeholder="Field name"
                  />
                  <select
                    className="rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-sm"
                    value={newCustomField.field_type}
                    onChange={(e) => setNewCustomField({ ...newCustomField, field_type: e.target.value })}
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="boolean">Yes/No</option>
                  </select>
                  <Button size="sm" variant="primary" onClick={async () => {
                    if (!newCustomField.name.trim()) return
                    // Add to custom fields list and update mapping
                    const idx = columnMappings.findIndex(m => m.excel_column === newCustomField.excel_column)
                    if (idx >= 0) {
                      // We'll create the field during validateMapping step
                      updateMapping(idx, 'custom', '__new__')
                    }
                    setNewCustomField(null)
                  }}>
                    Add Field
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setNewCustomField(null)}>Cancel</Button>
                </div>
                <p className="mt-2 text-xs text-slate-500">This will add a new custom field when the selected import type supports custom fields.</p>
              </div>
            )}
          </div>
        )}

        {/* Step: Validate */}
        {step === 'validate' && dataValidation && !showHistory && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center">
                <div className="text-xl font-bold text-emerald-600">{dataValidation.valid_rows}</div>
                <div className="text-xs text-emerald-700">Valid Rows</div>
              </div>
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-center">
                <div className="text-xl font-bold text-yellow-600">{dataValidation.warning_count}</div>
                <div className="text-xs text-yellow-700">Warnings</div>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
                <div className="text-xl font-bold text-red-600">{dataValidation.error_count}</div>
                <div className="text-xs text-red-700">Errors</div>
              </div>
            </div>

            {dataValidation.row_errors.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-red-600">Row Errors</p>
                <ul className="mt-1 space-y-0.5">
                  {dataValidation.row_errors.map((err, i) => (
                    <li key={i} className="text-xs text-red-700">{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {dataValidation.row_warnings.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-yellow-600">Warnings</p>
                <ul className="mt-1 space-y-0.5">
                  {dataValidation.row_warnings.map((w, i) => (
                    <li key={i} className="text-xs text-yellow-700">{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {dataValidation.preview_data.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Preview (first {dataValidation.preview_data.length} rows)</p>
                <div className="overflow-x-auto rounded-lg border border-[#E5E7EB]">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50">
                        {Object.keys(dataValidation.preview_data[0]).map((key) => (
                          <th key={key} className="px-3 py-2 text-left font-semibold text-slate-600">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dataValidation.preview_data.map((row, ri) => (
                        <tr key={ri} className="border-t border-[#E5E7EB]">
                          {Object.values(row).map((val, ci) => (
                            <td key={ci} className="px-3 py-2 text-slate-700">{val || <span className="text-slate-300">—</span>}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step: Confirm */}
        {step === 'confirm' && dataValidation && !showHistory && (
          <div className="space-y-4">
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <Info className="h-5 w-5 text-yellow-600" />
              <p className="mt-1 text-sm font-medium text-yellow-800">
                You are about to import <strong>{dataValidation.valid_rows}</strong> {entityLabel}.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-[#E5E7EB] bg-white p-3 text-center">
                <div className="text-2xl font-bold text-emerald-600">{dataValidation.valid_rows}</div>
                <div className="text-xs text-slate-500">Valid Items</div>
              </div>
              <div className="rounded-lg border border-[#E5E7EB] bg-white p-3 text-center">
                <div className="text-2xl font-bold text-yellow-600">{dataValidation.warning_count}</div>
                <div className="text-xs text-slate-500">Warnings</div>
              </div>
              <div className="rounded-lg border border-[#E5E7EB] bg-white p-3 text-center">
                <div className="text-2xl font-bold text-red-600">{dataValidation.error_count}</div>
                <div className="text-xs text-slate-500">Errors</div>
              </div>
            </div>
            {dataValidation.error_count > 0 && (
              <p className="text-sm text-red-600">Rows with errors will be skipped during import.</p>
            )}
          </div>
        )}

        {/* Step: Complete */}
        {step === 'complete' && importResult && !showHistory && (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
              <p className="mt-2 text-lg font-bold text-emerald-800">Import Complete</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-[#E5E7EB] bg-white p-3 text-center">
                <div className="text-2xl font-bold text-emerald-600">{importResult.imported}</div>
                <div className="text-xs text-slate-500">Imported</div>
              </div>
              <div className="rounded-lg border border-[#E5E7EB] bg-white p-3 text-center">
                <div className="text-2xl font-bold text-yellow-600">{importResult.skipped}</div>
                <div className="text-xs text-slate-500">Skipped</div>
              </div>
              <div className="rounded-lg border border-[#E5E7EB] bg-white p-3 text-center">
                <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                <div className="text-xs text-slate-500">Failed</div>
              </div>
            </div>
            {importResult.errors && importResult.errors.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-red-600">Error Details</p>
                <ul className="mt-1 space-y-0.5">
                  {importResult.errors.map((err, i) => (
                    <li key={i} className="text-xs text-red-700">{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Import History */}
        {showHistory && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-slate-700">Import History</p>
            {history.length === 0 ? (
              <div className="rounded-lg border border-[#E5E7EB] bg-white p-6 text-center">
                <p className="text-sm text-slate-500">No import history found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((h) => (
                  <div key={h.id} className="rounded-lg border border-[#E5E7EB] bg-white p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-slate-800">{h.filename}</p>
                        <p className="text-xs text-slate-500">
                          Imported by {h.imported_by} on {h.imported_at}
                        </p>
                      </div>
                      <Badge tone={h.status === 'completed' ? 'green' : 'red'}>{h.status}</Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                      <div><span className="font-bold text-slate-700">{h.total_rows}</span> Total</div>
                      <div><span className="font-bold text-emerald-600">{h.imported_rows}</span> Imported</div>
                      <div><span className="font-bold text-yellow-600">{h.skipped_rows}</span> Skipped</div>
                      <div><span className="font-bold text-red-600">{h.failed_rows}</span> Failed</div>
                    </div>
                    {h.errors && h.errors.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-red-600">View {h.errors.length} error(s)</summary>
                        <ul className="mt-1 space-y-0.5">
                          {h.errors.map((err, i) => (
                            <li key={i} className="text-xs text-red-700">{err}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Spinner />
            <span className="ml-2 text-sm text-slate-500">Processing…</span>
          </div>
        )}
      </div>
    </Modal>
  )
}

interface InventoryImportWizardProps {
  open: boolean
  onClose: () => void
  onCompleted?: () => void
}

export function InventoryImportWizard(props: InventoryImportWizardProps) {
  return <ImportWizard {...props} initialImportType="inventory" title="Import Inventory Wizard" />
}
