import { useEffect, useRef, useState } from 'react'
import {
  Upload, CheckCircle2, AlertCircle, Info, ArrowLeft, ArrowRight,
  History, FileText, X as XIcon,
} from 'lucide-react'
import { Badge, Button, Input, Modal, Spinner } from '@/components/ui'
import { importService, type ImportTypeOption } from '@/services/importService'
import type { ImportResult } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

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
  { key: 'upload',   label: 'Upload'   },
  { key: 'preview',  label: 'Preview'  },
  { key: 'mapping',  label: 'Map'      },
  { key: 'validate', label: 'Validate' },
  { key: 'confirm',  label: 'Confirm'  },
  { key: 'complete', label: 'Done'     },
]

// ─── Step Progress Bar ─────────────────────────────────────────────────────────

interface StepBarProps { currentIndex: number }

function StepBar({ currentIndex }: StepBarProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      {STEPS.map((s, i) => {
        const done   = i < currentIndex
        const active = i === currentIndex

        const circleStyle: React.CSSProperties = {
          width: 28, height: 28,
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, flexShrink: 0,
          border: done ? 'none' : active ? '2px solid #0D47A1' : '2px solid #CBD5E1',
          background: done ? '#0D47A1' : active ? '#EFF6FF' : '#F8FAFD',
          color: done ? '#fff' : active ? '#0D47A1' : '#94A3B8',
          transition: 'all 0.2s',
        }

        const labelStyle: React.CSSProperties = {
          fontSize: 10, fontWeight: active ? 700 : 500,
          marginTop: 4, textAlign: 'center',
          color: done || active ? '#0D47A1' : '#94A3B8',
          whiteSpace: 'nowrap',
        }

        return (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? '1' : 'none' }}>
            {/* Step circle + label */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={circleStyle}>
                {done ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span style={labelStyle}>{s.label}</span>
            </div>

            {/* Connector line (not after last step) */}
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1, height: 2, marginBottom: 14,
                background: i < currentIndex ? '#0D47A1' : '#E2E8F0',
                transition: 'background 0.2s',
                minWidth: 12,
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Inline Alert ─────────────────────────────────────────────────────────────

interface InlineAlertProps {
  type: 'success' | 'error' | 'warning'
  text: string
  onClose?: () => void
}

function InlineAlert({ type, text, onClose }: InlineAlertProps) {
  const map = {
    success: { bg: '#F0FDF4', border: '#BBF7D0', color: '#15803D', Icon: CheckCircle2 },
    error:   { bg: '#FEF2F2', border: '#FECACA', color: '#B91C1C', Icon: AlertCircle  },
    warning: { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E', Icon: Info         },
  }
  const { bg, border, color, Icon } = map[type]
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '10px 14px', borderRadius: 10,
      background: bg, border: `1px solid ${border}`,
      fontSize: 13, color, fontWeight: 500,
    }}>
      <Icon size={16} style={{ marginTop: 1, flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{text}</span>
      {onClose && (
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color, padding: 0, lineHeight: 1 }}>
          <XIcon size={14} />
        </button>
      )}
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps { value: number | string; label: string; color?: string }

function StatCard({ value, label, color = '#1e293b' }: StatCardProps) {
  return (
    <div style={{
      flex: 1, textAlign: 'center', padding: '14px 8px',
      borderRadius: 10, border: '1px solid #E5E7EB',
      background: '#fff',
    }}>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{label}</div>
    </div>
  )
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

interface ImportWizardProps {
  open: boolean
  onClose: () => void
  onCompleted?: () => void
  initialImportType?: string
  title?: string
}

export function ImportWizard({ open, onClose, onCompleted, initialImportType, title }: ImportWizardProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [step, setStep]       = useState<WizardStep>('upload')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null)
  const [importTypes, setImportTypes] = useState<ImportTypeOption[]>([])
  const [selectedImportType, setSelectedImportType] = useState(initialImportType ?? 'inventory')

  // Drag-over state for drop zone
  const [dragOver, setDragOver] = useState(false)

  // Upload
  const [uploadFile, setUploadFile]     = useState<File | null>(null)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)

  // Mapping
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([])

  // Validation
  const [dataValidation, setDataValidation] = useState<DataValidationResult | null>(null)

  // Result
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  // History
  const [history, setHistory]       = useState<ImportHistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)

  // Custom field creation
  const [newCustomField, setNewCustomField] = useState<{ name: string; field_type: string; excel_column: string } | null>(null)

  const selectedTypeLabel = importTypes.find(t => t.key === selectedImportType)?.label ?? 'Inventory Items'
  const entityLabel       = dataValidation?.entity_label ?? uploadResult?.entity_label ?? selectedTypeLabel.toLowerCase()

  useEffect(() => {
    if (!open) return
    let active = true
    void (async () => {
      try {
        const types = await importService.types()
        if (active) setImportTypes(types)
      } catch {
        if (active) setImportTypes([
          { key: 'inventory', label: 'Inventory Items', entity_label: 'inventory items', supports_custom_fields: true },
        ])
      }
    })()
    return () => { active = false }
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
    setShowHistory(false)
    setSelectedImportType(initialImportType ?? 'inventory')
  }

  function acceptFile(file: File | undefined) {
    if (file) { setUploadFile(file); setMessage(null) }
  }

  async function handleUpload() {
    if (!uploadFile) { setMessage({ type: 'error', text: 'Please select a file to upload.' }); return }
    setLoading(true); setMessage(null)
    try {
      const result = await importService.upload(selectedImportType, uploadFile)
      setUploadResult(result)
      const mappings: ColumnMapping[] = result.suggested_mappings.map((m: SuggestedMapping) => ({
        excel_column: m.excel_column,
        excel_index:  m.excel_index,
        target_type:  m.suggested_system_field ? 'system' : 'ignore',
        target_key:   m.suggested_system_field ? m.suggested_system_field.key : null,
      }))
      setColumnMappings(mappings)
      setStep('preview')
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
      const result = await importService.validateMapping(
        uploadResult.import_type ?? selectedImportType,
        uploadResult.import_id,
        columnMappings,
      )
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
      const result = await importService.validateData(
        uploadResult.import_type ?? selectedImportType,
        uploadResult.import_id,
        columnMappings,
      )
      setDataValidation(result)
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Data validation failed.' })
    } finally { setLoading(false) }
  }

  async function handleExecuteImport() {
    if (!uploadResult) return
    setLoading(true); setMessage(null)
    try {
      const result = await importService.execute(
        uploadResult.import_type ?? selectedImportType,
        uploadResult.import_id,
        columnMappings,
      )
      setImportResult(result)
      setStep('complete')
      onCompleted?.()
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Import failed.' })
    } finally { setLoading(false) }
  }

  async function loadHistory() {
    setLoading(true); setMessage(null)
    try {
      const h = await importService.history(initialImportType ? selectedImportType : undefined)
      setHistory(h)
      setShowHistory(true)
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to load history.' })
    } finally { setLoading(false) }
  }

  // ── Navigation helpers ───────────────────────────────────────────────────────
  function goBack() {
    const idx = STEPS.findIndex(s => s.key === step)
    if (idx > 0) setStep(STEPS[idx - 1].key)
  }

  const currentStepIndex = STEPS.findIndex(s => s.key === step)

  // ── Footer ───────────────────────────────────────────────────────────────────
  const footer = (
    <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      {/* Left side */}
      <div style={{ display: 'flex', gap: 8 }}>
        {step !== 'upload' && step !== 'complete' && !showHistory && (
          <Button variant="secondary" onClick={goBack}>
            <ArrowLeft size={15} /> Back
          </Button>
        )}
        {showHistory && (
          <Button variant="secondary" onClick={() => setShowHistory(false)}>
            <ArrowLeft size={15} /> Back to Import
          </Button>
        )}
        {step === 'complete' && (
          <Button variant="secondary" onClick={() => void loadHistory()}>
            <History size={15} /> View History
          </Button>
        )}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="secondary" onClick={() => { reset(); onClose() }}>Cancel</Button>

        {step === 'upload' && !showHistory && (
          <Button onClick={() => void handleUpload()} disabled={!uploadFile || loading}>
            {loading ? <><Spinner />&nbsp;Uploading…</> : <>Upload &amp; Preview <ArrowRight size={15} /></>}
          </Button>
        )}
        {step === 'preview' && !showHistory && (
          <Button onClick={() => setStep('mapping')}>
            Map Columns <ArrowRight size={15} />
          </Button>
        )}
        {step === 'mapping' && !showHistory && (
          <Button onClick={() => void handleValidateMapping()} disabled={loading}>
            {loading ? <><Spinner />&nbsp;Validating…</> : <>Validate <ArrowRight size={15} /></>}
          </Button>
        )}
        {step === 'validate' && dataValidation && !showHistory && dataValidation.error_count === 0 && (
          <Button onClick={() => setStep('confirm')}>
            Review Import <ArrowRight size={15} />
          </Button>
        )}
        {step === 'validate' && dataValidation && !showHistory && dataValidation.error_count > 0 && (
          <Button variant="secondary" onClick={() => setStep('mapping')}>
            Fix Mapping
          </Button>
        )}
        {step === 'confirm' && !showHistory && (
          <Button onClick={() => void handleExecuteImport()} disabled={loading}>
            {loading ? <><Spinner />&nbsp;Importing…</> : 'Confirm Import'}
          </Button>
        )}
        {step === 'complete' && (
          <Button onClick={() => { reset(); onClose() }}>Done</Button>
        )}
      </div>
    </div>
  )

  return (
    <Modal
      open={open}
      title={title ?? `Import ${selectedTypeLabel}`}
      onClose={() => { reset(); onClose() }}
      footer={footer}
      maxWidth={680}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Step progress bar — hidden in history view */}
        {!showHistory && <StepBar currentIndex={currentStepIndex} />}

        {/* Alert */}
        {message && <InlineAlert type={message.type} text={message.text} onClose={() => setMessage(null)} />}

        {/* ── Step: Upload ── */}
        {step === 'upload' && !showHistory && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Import type selector (only shown when not pre-set) */}
            {!initialImportType && (
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#64748B', marginBottom: 6 }}>
                  Import Type
                </label>
                <select
                  style={{ width: '100%', borderRadius: 8, border: '1px solid #E5E7EB', padding: '8px 12px', fontSize: 13 }}
                  value={selectedImportType}
                  onChange={e => setSelectedImportType(e.target.value)}
                  disabled={loading}
                >
                  {importTypes.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </div>
            )}

            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); acceptFile(e.dataTransfer.files[0]) }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 10, padding: '36px 24px',
                borderRadius: 12,
                border: `2px dashed ${dragOver ? '#0D47A1' : uploadFile ? '#22C55E' : '#CBD5E1'}`,
                background: dragOver ? '#EFF6FF' : uploadFile ? '#F0FDF4' : '#F8FAFD',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {uploadFile
                ? <FileText size={36} color="#22C55E" />
                : <Upload size={36} color={dragOver ? '#0D47A1' : '#94A3B8'} />
              }

              {uploadFile ? (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#15803D', margin: 0 }}>{uploadFile.name}</p>
                  <p style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                    {(uploadFile.size / 1024).toFixed(1)} KB — click to change
                  </p>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: 0 }}>
                    Drag &amp; drop a file here, or click to browse
                  </p>
                  <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
                    Accepted: .xlsx, .xls, .csv, .json — max 10 MB
                  </p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.json"
              style={{ display: 'none' }}
              onChange={e => acceptFile(e.target.files?.[0])}
            />

            {/* View History link */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => void loadHistory()}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 12, color: '#64748B', fontWeight: 500,
                }}
              >
                <History size={13} /> View Import History
              </button>
            </div>
          </div>
        )}

        {/* ── Step: Preview ── */}
        {step === 'preview' && uploadResult && !showHistory && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <StatCard value={uploadResult.total_rows} label="Rows" color="#0D47A1" />
              <StatCard value={uploadResult.headers.length} label="Columns" />
              <StatCard value={uploadResult.filename} label="File" />
            </div>

            {uploadResult.duplicate_headers.length > 0 && (
              <InlineAlert type="warning" text={`Duplicate columns: ${uploadResult.duplicate_headers.join(', ')}`} />
            )}

            <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #E5E7EB' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#F8FAFD' }}>
                    {uploadResult.headers.map((h, i) => (
                      <th key={i} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {uploadResult.preview_rows.map((row, ri) => (
                    <tr key={ri} style={{ borderTop: '1px solid #F1F5F9' }}>
                      {row.map((cell, ci) => (
                        <td key={ci} style={{ padding: '7px 12px', color: '#374151' }}>
                          {cell || <span style={{ color: '#CBD5E1' }}>—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'right' }}>
              Showing {uploadResult.preview_rows.length} of {uploadResult.total_rows} rows
            </p>
          </div>
        )}

        {/* ── Step: Mapping ── */}
        {step === 'mapping' && uploadResult && !showHistory && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
              Map each spreadsheet column to a system field. Required fields are marked with *.
            </p>

            {columnMappings.map((mapping, idx) => {
              const suggested = uploadResult.suggested_mappings[idx]
              return (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  padding: '10px 14px', borderRadius: 10,
                  border: '1px solid #E5E7EB', background: '#fff',
                }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{mapping.excel_column}</div>
                    {suggested?.sample_values && suggested.sample_values.length > 0 && (
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                        e.g. {suggested.sample_values.slice(0, 3).join(', ')}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <select
                      style={{ borderRadius: 7, border: '1px solid #E5E7EB', padding: '6px 10px', fontSize: 12 }}
                      value={mapping.target_type}
                      onChange={e => {
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
                        style={{ borderRadius: 7, border: '1px solid #E5E7EB', padding: '6px 10px', fontSize: 12 }}
                        value={mapping.target_key ?? ''}
                        onChange={e => updateMapping(idx, 'system', e.target.value)}
                      >
                        <option value="">Select field…</option>
                        {uploadResult.system_fields.map(f => (
                          <option key={f.key} value={f.key}>{f.label}{f.required ? ' *' : ''}</option>
                        ))}
                      </select>
                    )}

                    {mapping.target_type === 'custom' && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <select
                          style={{ borderRadius: 7, border: '1px solid #E5E7EB', padding: '6px 10px', fontSize: 12 }}
                          value={mapping.target_key ?? ''}
                          onChange={e => updateMapping(idx, 'custom', e.target.value)}
                        >
                          <option value="">Select custom field…</option>
                          {uploadResult.custom_fields.map(cf => (
                            <option key={cf.id} value={cf.id.toString()}>{cf.name}</option>
                          ))}
                        </select>
                        <Button size="sm" variant="ghost" onClick={() => setNewCustomField({ name: mapping.excel_column, field_type: 'text', excel_column: mapping.excel_column })}>
                          + New
                        </Button>
                      </div>
                    )}

                    {mapping.target_type === 'ignore' && (
                      <Badge tone="red">Ignored</Badge>
                    )}
                  </div>
                </div>
              )
            })}

            {/* New custom field panel */}
            {newCustomField && (
              <div style={{ padding: 14, borderRadius: 10, border: '1px solid #BFDBFE', background: '#EFF6FF' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1D4ED8', marginBottom: 10 }}>Create New Custom Field</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Input
                    value={newCustomField.name}
                    onChange={e => setNewCustomField({ ...newCustomField, name: e.target.value })}
                    placeholder="Field name"
                  />
                  <select
                    style={{ borderRadius: 7, border: '1px solid #E5E7EB', padding: '6px 10px', fontSize: 12 }}
                    value={newCustomField.field_type}
                    onChange={e => setNewCustomField({ ...newCustomField, field_type: e.target.value })}
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="boolean">Yes/No</option>
                  </select>
                  <Button size="sm" onClick={() => {
                    const idx = columnMappings.findIndex(m => m.excel_column === newCustomField.excel_column)
                    if (idx >= 0) updateMapping(idx, 'custom', '__new__')
                    setNewCustomField(null)
                  }}>Add</Button>
                  <Button size="sm" variant="ghost" onClick={() => setNewCustomField(null)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Step: Validate ── */}
        {step === 'validate' && dataValidation && !showHistory && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <StatCard value={dataValidation.valid_rows}    label="Valid Rows"  color="#16A34A" />
              <StatCard value={dataValidation.warning_count} label="Warnings"    color="#D97706" />
              <StatCard value={dataValidation.error_count}   label="Errors"      color="#DC2626" />
            </div>

            {dataValidation.row_errors.length > 0 && (
              <div style={{ maxHeight: 140, overflowY: 'auto', borderRadius: 8, border: '1px solid #FECACA', background: '#FEF2F2', padding: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#DC2626', marginBottom: 4 }}>Row Errors</p>
                {dataValidation.row_errors.map((e, i) => <p key={i} style={{ fontSize: 12, color: '#B91C1C', margin: '2px 0' }}>{e}</p>)}
              </div>
            )}

            {dataValidation.row_warnings.length > 0 && (
              <div style={{ maxHeight: 120, overflowY: 'auto', borderRadius: 8, border: '1px solid #FDE68A', background: '#FFFBEB', padding: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#D97706', marginBottom: 4 }}>Warnings</p>
                {dataValidation.row_warnings.map((w, i) => <p key={i} style={{ fontSize: 12, color: '#92400E', margin: '2px 0' }}>{w}</p>)}
              </div>
            )}

            {dataValidation.preview_data.length > 0 && (
              <>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748B' }}>
                  Preview — first {dataValidation.preview_data.length} rows
                </p>
                <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #E5E7EB' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#F8FAFD' }}>
                        {Object.keys(dataValidation.preview_data[0]).map(k => (
                          <th key={k} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dataValidation.preview_data.map((row, ri) => (
                        <tr key={ri} style={{ borderTop: '1px solid #F1F5F9' }}>
                          {Object.values(row).map((val, ci) => (
                            <td key={ci} style={{ padding: '7px 12px', color: '#374151' }}>
                              {String(val || '') || <span style={{ color: '#CBD5E1' }}>—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Step: Confirm ── */}
        {step === 'confirm' && dataValidation && !showHistory && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 10, border: '1px solid #FDE68A', background: '#FFFBEB' }}>
              <Info size={18} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 13, color: '#92400E', fontWeight: 500, margin: 0 }}>
                You are about to import <strong>{dataValidation.valid_rows}</strong> {entityLabel} into the system. This action cannot be undone.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <StatCard value={dataValidation.valid_rows}    label="Will be imported" color="#16A34A" />
              <StatCard value={dataValidation.warning_count} label="Warnings"          color="#D97706" />
              <StatCard value={dataValidation.error_count}   label="Will be skipped"   color="#DC2626" />
            </div>
            {dataValidation.error_count > 0 && (
              <InlineAlert type="warning" text="Rows with errors will be skipped during import." />
            )}
          </div>
        )}

        {/* ── Step: Complete ── */}
        {step === 'complete' && importResult && !showHistory && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ textAlign: 'center', padding: '24px 16px', borderRadius: 12, border: '1px solid #BBF7D0', background: '#F0FDF4' }}>
              <CheckCircle2 size={44} color="#16A34A" style={{ margin: '0 auto' }} />
              <p style={{ fontSize: 17, fontWeight: 700, color: '#15803D', marginTop: 10 }}>Import Complete</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <StatCard value={importResult.imported} label="Imported" color="#16A34A" />
              <StatCard value={importResult.skipped}  label="Skipped"  color="#D97706" />
              <StatCard value={importResult.failed}   label="Failed"   color="#DC2626" />
            </div>
            {importResult.errors && importResult.errors.length > 0 && (
              <div style={{ maxHeight: 120, overflowY: 'auto', borderRadius: 8, border: '1px solid #FECACA', background: '#FEF2F2', padding: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#DC2626', marginBottom: 4 }}>Errors</p>
                {importResult.errors.map((e, i) => <p key={i} style={{ fontSize: 12, color: '#B91C1C', margin: '2px 0' }}>{e}</p>)}
              </div>
            )}
          </div>
        )}

        {/* ── History panel ── */}
        {showHistory && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <History size={16} color="#64748B" />
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>Import History</p>
            </div>

            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', borderRadius: 10, border: '1px solid #E5E7EB', background: '#F8FAFD' }}>
                <p style={{ fontSize: 13, color: '#9CA3AF' }}>No import history found.</p>
              </div>
            ) : (
              history.map(h => (
                <div key={h.id} style={{ borderRadius: 10, border: '1px solid #E5E7EB', background: '#fff', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '12px 14px' }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', margin: 0 }}>{h.filename}</p>
                      <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                        by {h.imported_by} · {h.imported_at}
                      </p>
                    </div>
                    <Badge tone={h.status === 'completed' ? 'green' : 'red'}>{h.status}</Badge>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '1px solid #F1F5F9', fontSize: 12, textAlign: 'center' }}>
                    {[
                      { v: h.total_rows,    l: 'Total',    c: '#1e293b' },
                      { v: h.imported_rows, l: 'Imported', c: '#16A34A' },
                      { v: h.skipped_rows,  l: 'Skipped',  c: '#D97706' },
                      { v: h.failed_rows,   l: 'Failed',   c: '#DC2626' },
                    ].map(({ v, l, c }) => (
                      <div key={l} style={{ padding: '8px 6px', borderRight: '1px solid #F1F5F9' }}>
                        <div style={{ fontWeight: 700, color: c }}>{v}</div>
                        <div style={{ color: '#9CA3AF', marginTop: 1 }}>{l}</div>
                      </div>
                    ))}
                  </div>

                  {h.errors && h.errors.length > 0 && (
                    <details style={{ padding: '8px 14px', borderTop: '1px solid #F1F5F9' }}>
                      <summary style={{ fontSize: 12, color: '#DC2626', cursor: 'pointer' }}>
                        View {h.errors.length} error(s)
                      </summary>
                      <ul style={{ marginTop: 6, paddingLeft: 16 }}>
                        {h.errors.map((e, i) => <li key={i} style={{ fontSize: 12, color: '#B91C1C', marginBottom: 2 }}>{e}</li>)}
                      </ul>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '16px 0' }}>
            <Spinner />
            <span style={{ fontSize: 13, color: '#64748B' }}>Processing…</span>
          </div>
        )}
      </div>
    </Modal>
  )
}

// ─── Inventory-specific wrapper ───────────────────────────────────────────────

interface InventoryImportWizardProps {
  open: boolean
  onClose: () => void
  onCompleted?: () => void
}

export function InventoryImportWizard(props: InventoryImportWizardProps) {
  return <ImportWizard {...props} initialImportType="inventory" title="Import Inventory Wizard" />
}
