import { useEffect, useState } from 'react'
import { Alert, Button, Spinner } from '@/components/ui'
import {
  templateService,
  type DocumentTemplate,
  type PreviewRecord,
  type TemplatePreviewInfo,
} from '@/services/templateService'
import {
  CheckCircle2, Download, Eye, Info, Layers, Shield,
} from 'lucide-react'

interface TemplatePreviewTabProps {
  template: DocumentTemplate
}

type PreviewMode = 'selected' | 'active' | 'default'

interface PreviewSourceOption {
  mode: PreviewMode
  label: string
  description: string
  info: TemplatePreviewInfo['selected'] | TemplatePreviewInfo['active'] | TemplatePreviewInfo['default']
}

function StatusChip({ label, tone }: { label: string; tone: 'green' | 'red' | 'amber' | 'gray' | 'blue' }) {
  const tones: Record<string, { bg: string; border: string; text: string }> = {
    green: { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D' },
    red: { bg: '#FEF2F2', border: '#FECACA', text: '#B91C1C' },
    amber: { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E' },
    gray: { bg: '#F8FAFC', border: '#E2E8F0', text: '#64748B' },
    blue: { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8' },
  }
  const t = tones[tone]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 5,
      background: t.bg, border: `1px solid ${t.border}`, color: t.text,
    }}>
      {label}
    </span>
  )
}

function readinessChip(status?: string) {
  switch (status) {
    case 'ready': return <StatusChip label="Ready for Use" tone="green" />
    case 'inactive': return <StatusChip label="Inactive" tone="gray" />
    case 'no_file': return <StatusChip label="Needs File Upload" tone="amber" />
    case 'not_validated': return <StatusChip label="Needs Validation" tone="amber" />
    case 'invalid_placeholders': return <StatusChip label="Needs Placeholder Fix" tone="red" />
    case 'not_docx': return <StatusChip label="Not DOCX" tone="gray" />
    default: return <StatusChip label="Unknown" tone="gray" />
  }
}

export function TemplatePreviewTab({ template }: TemplatePreviewTabProps) {
  const [info, setInfo] = useState<TemplatePreviewInfo | null>(null)
  const [records, setRecords] = useState<PreviewRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [mode, setMode] = useState<PreviewMode>('selected')
  const [useSample, setUseSample] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState<PreviewRecord | null>(null)
  const [lastResult, setLastResult] = useState<{ template_name: string; template_version: string; resolution: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setSuccess(null)
    setLastResult(null)
    setSelectedRecord(null)
    setMode('selected')
    setUseSample(true)

    async function load() {
      try {
        const [previewInfo, previewRecords] = await Promise.all([
          templateService.getPreviewInfo(template.id),
          templateService.getPreviewRecords(template.id, 50).catch(() => ({ context: '', records: [] as PreviewRecord[] })),
        ])
        if (cancelled) return
        setInfo(previewInfo)
        setRecords(previewRecords.records)
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Unable to load preview information.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [template.id])

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}><Spinner label="Loading preview info…" /></div>
  }

  if (error && !info) {
    return <Alert tone="error">{error}</Alert>
  }

  if (!info) {
    return <Alert tone="error">Preview information is unavailable for this template.</Alert>
  }

  const sources: PreviewSourceOption[] = [
    {
      mode: 'selected',
      label: 'Preview Selected Template',
      description: 'The template currently opened in this page.',
      info: info.selected,
    },
    {
      mode: 'active',
      label: 'Preview Current Active Template',
      description: 'The template actually used today for this system area (context or fallback).',
      info: info.active,
    },
    {
      mode: 'default',
      label: 'Preview System Default Template',
      description: 'The verified system default template (is_default + active).',
      info: info.default,
    },
  ]

  const availableSources = sources.filter((s) => s.info.exists)

  async function handleGenerate() {
    if (!info) return
    setGenerating(true)
    setError(null)
    setSuccess(null)
    setLastResult(null)
    try {
      const result = await templateService.generatePreview(template.id, {
        mode,
        sample_data: useSample,
        target_id: useSample ? null : selectedRecord?.target_id ?? null,
      })
      setLastResult({
        template_name: result.template_name || info[`${mode}` as 'selected']?.template_name || template.name,
        template_version: result.template_version || template.version,
        resolution: result.resolution || `${info.effective_context ?? info.document_type} → resolved`,
      })
      setSuccess('Generated preview ready. The DOCX preview has been downloaded — open it in Microsoft Word or another compatible editor.')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Preview generation failed.')
    } finally {
      setGenerating(false)
    }
  }

  const selectedSource = sources.find((s) => s.mode === mode)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Template being previewed ─────────────────────────────────────── */}
      <div style={{ borderRadius: 10, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#334155' }}>Template Being Previewed</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px 20px', padding: '14px 16px' }}>
          {[
            ['Template Name', template.name],
            ['System Area', info.usage_context_label || info.effective_context_label || 'Document Type Fallback'],
            ['Document Type', template.document_type_label],
            ['Template Version', `v${template.version}`],
            ['File Type', template.extension ? template.extension.toUpperCase() : '—'],
            ['Validation', template.file_validation_status],
            ['Placeholders', template.placeholder_status],
            ['Generation Readiness', template.generation_readiness],
            ['Resolution Mode', info.resolution_mode === 'explicit_context' ? 'Explicit System Area' : 'Doc Type Fallback'],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94A3B8' }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#1E293B' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Preview source selection ─────────────────────────────────────── */}
      <div style={{ borderRadius: 10, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#334155' }}>Preview Source</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '14px 16px' }}>
          {availableSources.length === 0 && (
            <Alert tone="error">No preview source is available. Upload, validate and activate a DOCX template first.</Alert>
          )}

          {availableSources.map((source) => {
            const isSelected = mode === source.mode
            const ready = source.info.ready ?? false
            return (
              <button
                key={source.mode}
                type="button"
                onClick={() => { setMode(source.mode); setSelectedRecord(null) }}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12, textAlign: 'left',
                  padding: '12px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                  border: isSelected ? '1.5px solid #003DA5' : '1px solid #E2E8F0',
                  background: isSelected ? '#EFF6FF' : '#fff',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ flexShrink: 0, marginTop: 2 }}>
                  <input type="radio" checked={isSelected} readOnly style={{ accentColor: '#003DA5' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{source.label}</span>
                    {source.info.template_name && (
                      <span style={{ fontSize: 11, color: '#64748B' }}>
                        {source.info.template_name} — v{source.info.template_version}
                      </span>
                    )}
                    {source.info.is_default && <StatusChip label="Default" tone="blue" />}
                    {source.info.resolution_source === 'active_context_template' && <StatusChip label="Active Context Template" tone="green" />}
                    {source.info.resolution_source === 'document_type_fallback' && <StatusChip label="Doc Type Fallback" tone="amber" />}
                  </div>
                  <p style={{ margin: '3px 0 0', fontSize: 11, color: '#64748B' }}>{source.description}</p>
                  {!ready && source.info.exists && (
                    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {readinessChip(source.info.generation_readiness)}
                      {source.info.generation_readiness === 'no_file' && (
                        <span style={{ fontSize: 11, color: '#92400E' }}>No template file has been uploaded.</span>
                      )}
                      {source.info.generation_readiness === 'invalid_placeholders' && (
                        <span style={{ fontSize: 11, color: '#B91C1C' }}>This template contains unsupported placeholders and cannot be generated.</span>
                      )}
                      {source.info.generation_readiness === 'not_validated' && (
                        <span style={{ fontSize: 11, color: '#92400E' }}>Run validation before previewing.</span>
                      )}
                      {source.info.generation_readiness === 'inactive' && (
                        <span style={{ fontSize: 11, color: '#64748B' }}>Activate this template before previewing.</span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            )
          })}

          {info.default.exists === false && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px', borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <Info size={13} style={{ color: '#64748B', flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>
                No system default template is available for this document type.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Sample / Real record selection ──────────────────────────────── */}
      <div style={{ borderRadius: 10, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#334155' }}>Preview Data</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '14px 16px' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => { setUseSample(true); setSelectedRecord(null) }}
              style={{
                flex: 1, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                border: useSample ? '1.5px solid #003DA5' : '1px solid #E2E8F0',
                background: useSample ? '#EFF6FF' : '#fff',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Layers size={14} style={{ color: useSample ? '#003DA5' : '#64748B' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Sample Data Preview</span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 11, color: '#64748B', lineHeight: 1.4 }}>
                Uses clearly-identifiable sample values. Never touches production records.
              </p>
            </button>

            <button
              type="button"
              onClick={() => { setUseSample(false) }}
              disabled={!info.real_record_supported}
              style={{
                flex: 1, padding: '10px 12px', borderRadius: 8, cursor: info.real_record_supported ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit', textAlign: 'left', opacity: info.real_record_supported ? 1 : 0.5,
                border: !useSample ? '1.5px solid #003DA5' : '1px solid #E2E8F0',
                background: !useSample ? '#EFF6FF' : '#fff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Eye size={14} style={{ color: !useSample ? '#003DA5' : '#64748B' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Real Record Preview</span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 11, color: '#64748B', lineHeight: 1.4 }}>
                {info.real_record_supported
                  ? 'Select an existing workflow record. Read-only — no state changes.'
                  : 'No real workflow record is connected to this system area.'}
              </p>
            </button>
          </div>

          {!useSample && info.real_record_supported && (
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#334155' }}>
                Select Workflow Record
              </label>
              <select
                value={selectedRecord?.target_id ?? ''}
                onChange={(e) => {
                  const rec = records.find((r) => r.target_id === Number(e.target.value))
                  setSelectedRecord(rec ?? null)
                }}
                style={{
                  width: '100%', height: 38, paddingInline: '12px 32px', borderRadius: 8,
                  border: '1px solid #E2E8F0', fontSize: 13, color: '#1F2937',
                  background: '#fff', appearance: 'none', cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
                }}
              >
                <option value="">— Select a record —</option>
                {records.map((r) => (
                  <option key={`${r.target_type}-${r.target_id}`} value={r.target_id}>
                    {r.label} ({r.status})
                  </option>
                ))}
              </select>
              {records.length === 0 && (
                <p style={{ marginTop: 6, fontSize: 11, color: '#92400E' }}>
                  No valid workflow records are currently available for this system area.
                </p>
              )}
            </div>
          )}

          {!useSample && !info.real_record_supported && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px', borderRadius: 8, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <Info size={13} style={{ color: '#92400E', flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 12, color: '#92400E', lineHeight: 1.5 }}>
                This system area has no verified workflow record connected to document generation. Use Sample Data Preview instead.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Resolution summary ──────────────────────────────────────────── */}
      {selectedSource && selectedSource.info.exists && (
        <div style={{ borderRadius: 10, border: '1px solid #E2E8F0', padding: '12px 16px', background: '#F8FAFC' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Shield size={14} style={{ color: '#003DA5' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Resolution</span>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
            <strong>Preview source:</strong> {selectedSource.label}
            <br />
            <strong>Resolved template:</strong> {selectedSource.info.template_name} — Version {selectedSource.info.template_version}
            <br />
            <strong>Resolution:</strong> {info.effective_context ?? info.document_type} →{' '}
            {selectedSource.info.resolution_source === 'active_context_template'
              ? 'Active Context Template'
              : selectedSource.info.resolution_source === 'document_type_fallback'
                ? 'Document Type Fallback'
                : 'Selected Template'}
          </p>
          <p style={{ margin: '8px 0 0', fontSize: 11, color: '#64748B', lineHeight: 1.5 }}>
            Fallback: if no valid context template is available, the system uses the verified document-type fallback.
          </p>
        </div>
      )}

      {/* ── Generate button + result ────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Button
            disabled={generating || !selectedSource?.info.exists || !(selectedSource?.info.ready ?? false) || (!useSample && !selectedRecord)}
            onClick={() => void handleGenerate()}
          >
            <Download size={15} className="mr-1.5" />
            {generating ? 'Generating Preview…' : 'Generate DOCX Preview'}
          </Button>
          {!useSample && !selectedRecord && (
            <span style={{ fontSize: 11, color: '#92400E' }}>Select a workflow record to preview.</span>
          )}
        </div>

        {error && <Alert tone="error">{error}</Alert>}
        {success && <Alert tone="success">{success}</Alert>}

        {lastResult && (
          <div style={{ borderRadius: 10, border: '1px solid #BBF7D0', background: '#F0FDF4', padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <CheckCircle2 size={14} style={{ color: '#15803D' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#15803D' }}>Generated Preview Ready</span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: '#166534', lineHeight: 1.6 }}>
              <strong>Resolved template:</strong> {lastResult.template_name} — Version {lastResult.template_version}
              <br />
              <strong>Resolution:</strong> {lastResult.resolution}
            </p>
            <p style={{ margin: '8px 0 0', fontSize: 11, color: '#15803D', lineHeight: 1.5 }}>
              The generated DOCX preview was downloaded. Open it in Microsoft Word or another compatible editor to inspect the layout.
              Preview only — sample data is used. No workflow record, asset status, reservation, borrowing, issuance, or audit state was changed.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px', borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
          <Info size={13} style={{ color: '#64748B', flexShrink: 0, marginTop: 1 }} />
          <p style={{ margin: 0, fontSize: 11, color: '#64748B', lineHeight: 1.5 }}>
            Preview is read-only. It never creates a borrowing, return, issuance, transfer, clearance or reservation record,
            never changes asset or reservation status, never fulfils a reservation item, and never writes an audit or workflow record.
          </p>
        </div>
      </div>
    </div>
  )
}