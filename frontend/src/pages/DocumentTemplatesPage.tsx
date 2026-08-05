import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert, Badge, Button, Card, ConfirmDialog, EmptyState, Input, Modal, Spinner,
} from '@/components/ui'
import {
  templateService,
  type DocumentTemplate, type DocumentTemplateVersion, type DocumentTypeOption,
  type PlaceholderDefinition, type TemplateUsageContextOption, type TemplateValidationResult,
} from '@/services/templateService'
import { useAuth } from '@/hooks/useAuth'
import { isAdmin } from '@/utils/roleHelpers'
import { TemplatePreviewTab } from '@/components/documents/TemplatePreviewTab'
import {
  CheckCircle2, Copy, Download, Eye, FileText, Plus, RefreshCw, Search, Trash2, Upload, XCircle,
  Info, Layers, Shield, History, Tag, AlertTriangle, CheckCheck, Clock,
} from 'lucide-react'

function formatBytes(size?: number | null): string {
  if (!size) return '—'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

// ── Status helpers ────────────────────────────────────────────────────────────

type StatusChip = { label: string; bg: string; border: string; text: string; icon?: React.ReactNode }

function fileValidationChip(s: DocumentTemplate['file_validation_status']): StatusChip {
  switch (s) {
    case 'valid':         return { label: 'Valid File',        bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D', icon: <CheckCircle2 size={11} /> }
    case 'invalid':       return { label: 'Invalid File',      bg: '#FEF2F2', border: '#FECACA', text: '#B91C1C', icon: <XCircle size={11} /> }
    case 'not_validated': return { label: 'Not Validated',     bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', icon: <Clock size={11} /> }
    case 'no_file':       return { label: 'No File Uploaded',  bg: '#F8FAFC', border: '#E2E8F0', text: '#64748B', icon: <FileText size={11} /> }
  }
}

function placeholderStatusChip(s: DocumentTemplate['placeholder_status']): StatusChip {
  switch (s) {
    case 'placeholders_valid':   return { label: 'Placeholders Verified',         bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D', icon: <CheckCheck size={11} /> }
    case 'no_placeholders':      return { label: 'No Placeholders (Static)',       bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8', icon: <Info size={11} /> }
    case 'invalid_placeholders': return { label: 'Invalid Placeholders',           bg: '#FEF2F2', border: '#FECACA', text: '#B91C1C', icon: <AlertTriangle size={11} /> }
    case 'not_validated':        return { label: 'Not Yet Validated',              bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', icon: <Clock size={11} /> }
    case 'no_file':              return { label: 'No File',                        bg: '#F8FAFC', border: '#E2E8F0', text: '#64748B', icon: <FileText size={11} /> }
    case 'not_applicable':       return { label: 'N/A (Non-DOCX)',                 bg: '#F8FAFC', border: '#E2E8F0', text: '#94A3B8', icon: <Info size={11} /> }
  }
}

function readinessChip(s: DocumentTemplate['generation_readiness']): StatusChip {
  switch (s) {
    case 'ready':                return { label: 'Ready for Use',              bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D', icon: <CheckCheck size={11} /> }
    case 'inactive':             return { label: 'Inactive',                   bg: '#F8FAFC', border: '#E2E8F0', text: '#64748B', icon: <Clock size={11} /> }
    case 'no_file':              return { label: 'Needs File Upload',          bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', icon: <Upload size={11} /> }
    case 'not_validated':        return { label: 'Needs Validation',           bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', icon: <Clock size={11} /> }
    case 'invalid_placeholders': return { label: 'Needs Placeholder Fix',      bg: '#FEF2F2', border: '#FECACA', text: '#B91C1C', icon: <AlertTriangle size={11} /> }
    case 'not_docx':             return { label: 'Not DOCX',                   bg: '#F8FAFC', border: '#E2E8F0', text: '#94A3B8', icon: <FileText size={11} /> }
  }
}

function StatusPill({ chip }: { chip: StatusChip }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 5,
      background: chip.bg, border: `1px solid ${chip.border}`, color: chip.text,
    }}>
      {chip.icon}
      {chip.label}
    </span>
  )
}

function ValidationPanel({ validation }: { validation: TemplateValidationResult | null | undefined }) {
  if (!validation) return <p className="text-xs text-slate-400 py-4 text-center">Upload a DOCX file to validate placeholders.</p>
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-2">Valid ({validation.valid.length})</p>
        {validation.valid.length === 0 ? <p className="text-xs text-slate-400">None detected.</p> : (
          <div className="flex flex-wrap gap-1.5">
            {validation.valid.map((key) => (
              <span key={key} className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md">
                <CheckCircle2 size={11} /> <code>{`{{${key}}}`}</code>
              </span>
            ))}
          </div>
        )}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-red-600 mb-2">Unknown ({validation.unknown.length})</p>
        {validation.unknown.length === 0 ? <p className="text-xs text-slate-400">None.</p> : (
          <div className="flex flex-wrap gap-1.5">
            {validation.unknown.map((key) => (
              <span key={key} className="inline-flex items-center gap-1 text-[11px] text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded-md">
                <XCircle size={11} /> <code>{`{{${key}}}`}</code>
              </span>
            ))}
          </div>
        )}
        {validation.unknown.length > 0 && <p className="mt-2 text-[10px] text-amber-600">Unknown placeholders block activation.</p>}
      </div>
    </div>
  )
}

type DetailTab = 'details' | 'validation' | 'versions' | 'placeholders' | 'preview'

export function DocumentTemplatesPage() {
  const { user } = useAuth()
  const admin = isAdmin(user)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [types, setTypes] = useState<DocumentTypeOption[]>([])
  const [usageContexts, setUsageContexts] = useState<TemplateUsageContextOption[]>([])
  const [placeholders, setPlaceholders] = useState<PlaceholderDefinition[]>([])
  const [versions, setVersions] = useState<DocumentTemplateVersion[]>([])
  const [selected, setSelected] = useState<DocumentTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', document_type: 'issuance', usage_context: '', description: '' })
  // Inline edit state for the System Area field in the detail panel
  const [editingContext, setEditingContext] = useState(false)
  const [editContextValue, setEditContextValue] = useState('')
  const [uploadNotes, setUploadNotes] = useState('')
  const [detailTab, setDetailTab] = useState<DetailTab>('details')
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; message: string; action: () => void }>({ open: false, title: '', message: '', action: () => {} })

  const officialTypes = useMemo(() => types.filter((t) => ['borrow_receipt', 'return_receipt', 'issuance', 'property_transfer', 'clearance', 'reissuance'].includes(t.value)), [types])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return templates
    return templates.filter((t) => t.name.toLowerCase().includes(q) || t.document_type.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q))
  }, [templates, search])

  async function loadTemplates() {
    setLoading(true)
    try {
      const [list, typeList, placeholderList, contextList] = await Promise.all([
        templateService.list({ per_page: 100 }),
        templateService.getDocumentTypes(),
        templateService.getPlaceholders(),
        templateService.getUsageContexts(),
      ])
      setTemplates(list.items)
      setTypes(typeList)
      setPlaceholders(placeholderList)
      setUsageContexts(contextList)
      if (selected) { const found = list.items.find((t) => t.id === selected.id); if (found) setSelected(found) }
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to load templates.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadTemplates() }, [])
  useEffect(() => {
    if (selected?.id) {
      void loadVersions(selected.id)
      setEditingContext(false) // reset edit mode when switching templates
    }
  }, [selected?.id])

  async function loadVersions(templateId: number) {
    try {
      const data = await templateService.versions(templateId)
      setVersions(data)
    } catch {
      setVersions([])
    }
  }

  async function handleCreate() {
    if (!createForm.name.trim()) { setMessage({ type: 'error', text: 'Name required.' }); return }
    setSaving(true)
    try {
      const created = await templateService.create({
        name: createForm.name.trim(),
        document_type: createForm.document_type,
        usage_context: createForm.usage_context ? (createForm.usage_context as import('@/services/templateService').TemplateUsageContextKey) : null,
        description: createForm.description.trim() || undefined,
      })
      setCreateOpen(false)
      setCreateForm({ name: '', document_type: 'issuance', usage_context: '', description: '' })
      setMessage({ type: 'success', text: `Template "${created.name}" created.` })
      await loadTemplates(); setSelected(created)
    } catch (error: unknown) { setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed.' }) }
    finally { setSaving(false) }
  }

  async function handleUpload(file: File) {
    if (!selected) return; setSaving(true)
    try {
      const updated = await templateService.upload(selected.id, file, uploadNotes || undefined)
      setSelected(updated)
      setMessage({ type: 'success', text: updated.has_unknown_placeholders ? 'Uploaded with unknown placeholders.' : 'Uploaded and validated.' })
      setUploadNotes(''); await loadTemplates(); await loadVersions(updated.id)
    } catch (error: unknown) { setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Upload failed.' }) }
    finally { setSaving(false) }
  }

  async function handleValidate() {
    if (!selected) return; setSaving(true)
    try {
      const result = await templateService.validate(selected.id); setSelected(result.template)
      setMessage({ type: result.validation.is_valid ? 'success' : 'error', text: result.validation.is_valid ? 'Valid.' : 'Unknown placeholders found.' })
      await loadTemplates()
    } catch (error: unknown) { setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed.' }) }
    finally { setSaving(false) }
  }

  async function handleActivate() {
    if (!selected) return; setSaving(true)
    try { const updated = await templateService.activate(selected.id); setSelected(updated); setMessage({ type: 'success', text: 'Activated.' }); await loadTemplates() }
    catch (error: unknown) { setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed.' }) }
    finally { setSaving(false) }
  }

  async function handleDeactivate() {
    if (!selected) return; setSaving(true)
    try { const updated = await templateService.deactivate(selected.id); setSelected(updated); setMessage({ type: 'success', text: 'Deactivated.' }); await loadTemplates() }
    catch (error: unknown) { setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed.' }) }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!selected) return
    setConfirmDialog({
      open: true, title: 'Delete?', message: `Delete "${selected.name}"?`,
      action: async () => { setSaving(true); try { await templateService.delete(selected.id); setSelected(null); setMessage({ type: 'success', text: 'Deleted.' }); await loadTemplates() } catch (error: unknown) { setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed.' }) } finally { setSaving(false) } },
    })
  }

  async function copyToken(token: string) {
    try { await navigator.clipboard.writeText(token); setMessage({ type: 'success', text: `Copied ${token}` }) } catch { setMessage({ type: 'error', text: 'Copy failed.' }) }
  }

  async function handleSaveContext() {
    if (!selected) return
    setSaving(true)
    try {
      const updated = await templateService.updateMetadata(selected.id, {
        usage_context: editContextValue
          ? (editContextValue as import('@/services/templateService').TemplateUsageContextKey)
          : null,
      })
      setSelected(updated)
      setEditingContext(false)
      setMessage({ type: 'success', text: 'System Area updated.' })
      await loadTemplates()
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to update System Area.' })
    } finally {
      setSaving(false)
    }
  }

  if (!admin) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-slate-900">Document Templates</h1>
        <Alert tone="error">Only administrators can access this page.</Alert>
      </div>
    )
  }

  const detailTabs: { id: DetailTab; label: string; icon: React.ElementType }[] = [
    { id: 'details', label: 'Details', icon: FileText },
    { id: 'validation', label: 'Validation', icon: Shield },
    { id: 'versions', label: 'Versions', icon: History },
    { id: 'placeholders', label: 'Placeholders', icon: Layers },
    { id: 'preview', label: 'Preview', icon: Eye },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 32 }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
            Document Templates
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: '#64748B', lineHeight: 1.4 }}>
            Manage official PSA Word (DOCX) templates with placeholders.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus size={16} /> New Template</Button>
      </div>

      {message && <Alert tone={message.type} onClose={() => setMessage(null)}>{message.text}</Alert>}

      {/* Info banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px', borderRadius: 10,
        background: '#F8FAFC', border: '1px solid #E2E8F0',
      }}>
        <Info size={16} style={{ color: '#64748B', flexShrink: 0 }} />
        <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
          Create DOCX with placeholders like <code style={{ color: '#003DA5', background: '#EFF6FF', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>{'{{employee_name}}'}</code> → Upload → Validate → Activate → Preview
        </p>
      </div>

      {/* ── Official Template File Format Policy (Phase 2) ─────────────────── */}
      <div style={{ borderRadius: 10, border: '1px solid #E2E8F0', background: '#F8FAFC', padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <FileText size={15} style={{ color: '#003DA5' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Official Document Template Format Policy</span>
        </div>
        <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.7 }}>
          <p style={{ margin: '0 0 6px' }}>
            Official document templates use <strong>DOCX</strong> format. Create or edit the form in Microsoft Word,
            add supported placeholders, then upload the DOCX file. The system validates placeholders and uses the
            template during official document generation.
          </p>
          <p style={{ margin: '0 0 6px' }}>
            <strong>XLSX</strong> and <strong>CSV</strong> are used for spreadsheet and data exports and are not part
            of the official document-template workflow. They are not routed through the DOCX placeholder system.
          </p>
          <p style={{ margin: 0 }}>
            <strong>PDF</strong> may be available as a generated output but is not currently an editable template format.
          </p>
        </div>
      </div>

      {/* Main layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 20 }}>
        {/* Left: Template list */}
        <div style={{ gridColumn: 'span 4' }}>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Search size={14} style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: '#94A3B8', pointerEvents: 'none',
            }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              style={{
                width: '100%', height: 38, paddingLeft: 34, paddingRight: 14,
                borderRadius: 10, border: '1.5px solid #E2E8F0',
                fontSize: 13.5, color: '#1E293B', outline: 'none',
                boxSizing: 'border-box', fontFamily: 'inherit',
                background: '#F8FAFC',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#93C5FD'; e.currentTarget.style.background = '#fff' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC' }}
            />
          </div>

          <Card noPadding>
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><Spinner label="Loading..." /></div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: '60px 20px' }}><EmptyState title="No templates" description="Create one to start." /></div>
              ) : (
                <div style={{ maxHeight: 600, overflowY: 'auto' }}>
                  {filtered.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => { setSelected(tpl); setDetailTab('details') }}
                      style={{
                        width: '100%', padding: '14px 16px',
                        border: 'none', borderBottom: '1px solid #F1F5F9',
                        background: selected?.id === tpl.id ? '#EFF6FF' : '#fff',
                        cursor: 'pointer', textAlign: 'left',
                        transition: 'background 0.15s',
                        fontFamily: 'inherit',
                      }}
                      onMouseEnter={(e) => { if (selected?.id !== tpl.id) (e.currentTarget as HTMLButtonElement).style.background = '#F8FAFC' }}
                      onMouseLeave={(e) => { if (selected?.id !== tpl.id) (e.currentTarget as HTMLButtonElement).style.background = '#fff' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 8,
                          background: selected?.id === tpl.id ? '#003DA5' : '#F1F5F9',
                          color: selected?.id === tpl.id ? '#fff' : '#64748B',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <FileText size={16} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {tpl.name}
                            </span>
                            <span style={{ fontSize: 10, color: '#94A3B8', fontFamily: 'monospace' }}>v{tpl.version}</span>
                          </div>
                          <div style={{ fontSize: 11, color: '#64748B' }}>{tpl.document_type_label}</div>
                          {tpl.usage_context_label && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 3, fontSize: 10, color: '#003DA5', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 4, padding: '1px 6px' }}>
                              <Tag size={9} />
                              {tpl.usage_context_label}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                          <Badge tone={tpl.status === 'active' ? 'green' : 'yellow'}>{tpl.status_label}</Badge>
                          {(() => {
                            const chip = readinessChip(tpl.generation_readiness)
                            return (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 3,
                                fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 4,
                                background: chip.bg, border: `1px solid ${chip.border}`, color: chip.text,
                                whiteSpace: 'nowrap',
                              }}>
                                {chip.icon}
                                {chip.label}
                              </span>
                            )
                          })()}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right: Detail panel with tabs */}
        <div style={{ gridColumn: 'span 8' }}>
          {!selected ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              minHeight: 400, borderRadius: 12,
              border: '1px dashed #E2E8F0', background: '#F8FAFC',
            }}>
              <FileText size={40} style={{ color: '#CBD5E1', marginBottom: 12 }} />
              <p style={{ fontSize: 14, color: '#94A3B8' }}>Select a template to view details</p>
            </div>
          ) : (
            <Card noPadding>
              {/* Header with title + actions */}
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid #F1F5F9',
                background: '#fff',
              }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A', lineHeight: 1.3 }}>{selected.name}</h3>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748B' }}>{selected.description || 'No description.'}</p>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, flexShrink: 0 }}>
                    <Button size="sm" variant="secondary" disabled={saving || !selected.has_file} onClick={() => void handleValidate()}>
                      <RefreshCw size={13} className="mr-1.5" /> Validate
                    </Button>
                    {selected.status === 'active' ? (
                      <Button size="sm" variant="secondary" disabled={saving} onClick={() => void handleDeactivate()}>Deactivate</Button>
                    ) : (
                      <Button size="sm" disabled={saving} onClick={() => void handleActivate()}>Activate</Button>
                    )}
                    <Button size="sm" variant="secondary" disabled={!selected.has_file} onClick={() => void templateService.download(selected.id, selected.file_name || undefined)}>
                      <Download size={13} className="mr-1.5" /> Download
                    </Button>
                    <Button size="sm" variant="secondary" disabled={saving} onClick={() => void handleDelete()}>
                      <Trash2 size={13} className="mr-1.5" /> Delete
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div style={{
                display: 'flex', gap: 0,
                borderBottom: '1px solid #F1F5F9',
                background: '#FAFBFC',
                padding: '0 16px',
              }}>
                {detailTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setDetailTab(tab.id)}
                    style={{
                      position: 'relative',
                      padding: '14px 16px',
                      fontSize: 13,
                      fontWeight: detailTab === tab.id ? 600 : 500,
                      color: detailTab === tab.id ? '#003DA5' : '#64748B',
                      background: 'none',
                      border: 'none',
                      borderBottom: detailTab === tab.id ? '2px solid #003DA5' : '2px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      fontFamily: 'inherit',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                    onMouseEnter={(e) => { if (detailTab !== tab.id) (e.currentTarget as HTMLButtonElement).style.color = '#334155' }}
                    onMouseLeave={(e) => { if (detailTab !== tab.id) (e.currentTarget as HTMLButtonElement).style.color = '#64748B' }}
                  >
                    <tab.icon size={14} />
                    {tab.label}
                    {tab.id === 'versions' && versions.length > 0 && (
                      <span style={{
                        fontSize: 10, fontWeight: 600, color: '#64748B',
                        background: '#F1F5F9', padding: '2px 6px', borderRadius: 10,
                      }}>{versions.length}</span>
                    )}
                    {tab.id === 'placeholders' && placeholders.length > 0 && (
                      <span style={{
                        fontSize: 10, fontWeight: 600, color: '#64748B',
                        background: '#F1F5F9', padding: '2px 6px', borderRadius: 10,
                      }}>{placeholders.length}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div style={{ padding: '24px' }}>
                {/* Details tab */}
                {detailTab === 'details' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* ── Status Panel ─────────────────────────────────────── */}
                    <div style={{ borderRadius: 10, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                      {/* help text */}
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 14px', background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                        <Info size={12} style={{ color: '#64748B', flexShrink: 0, marginTop: 1 }} />
                        <p style={{ margin: 0, fontSize: 11, color: '#64748B', lineHeight: 1.5 }}>
                          File validation confirms the uploaded template can be processed. It does not by itself confirm the template is assigned to a workflow or ready for document generation.
                        </p>
                      </div>
                      {/* Row 1: File Validation */}
                      {(() => {
                        const chip = fileValidationChip(selected.file_validation_status)
                        return (
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '11px 14px', borderBottom: '1px solid #F1F5F9' }}>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#334155' }}>File Validation</p>
                              {selected.file_validation_status === 'no_file' && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94A3B8' }}>No file uploaded yet.</p>}
                              {selected.file_validation_status === 'not_validated' && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#92400E' }}>File uploaded but not validated. Click Validate.</p>}
                              {selected.file_validation_status === 'invalid' && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#B91C1C' }}>Contains unsupported placeholders. Fix and re-upload.</p>}
                              {selected.file_validation_status === 'valid' && selected.placeholder_status === 'no_placeholders' && (
                                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#1D4ED8' }}>Valid DOCX — No dynamic placeholders detected. This template may be used as a static document.</p>
                              )}
                              {selected.file_validation_status === 'valid' && selected.placeholder_status === 'placeholders_valid' && (
                                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#15803D' }}>All detected placeholders are supported.</p>
                              )}
                            </div>
                            <StatusPill chip={chip} />
                          </div>
                        )
                      })()}
                      {/* Row 2: Placeholder Status */}
                      {(() => {
                        const chip = placeholderStatusChip(selected.placeholder_status)
                        const valid = selected.validation_result?.valid ?? []
                        const unknown = selected.validation_result?.unknown ?? []
                        return (
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '11px 14px', borderBottom: '1px solid #F1F5F9' }}>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#334155' }}>Placeholder Status</p>
                              {valid.length > 0 && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#15803D' }}>{valid.length} verified placeholder{valid.length !== 1 ? 's' : ''}</p>}
                              {unknown.length > 0 && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#B91C1C' }}>{unknown.length} unsupported: {unknown.map((k) => `{{${k}}}`).join(', ')}</p>}
                            </div>
                            <StatusPill chip={chip} />
                          </div>
                        )
                      })()}
                      {/* Row 3: System Area & Resolution Mode */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '11px 14px', borderBottom: '1px solid #F1F5F9' }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#334155' }}>System Area</p>
                          {selected.resolution_mode === 'explicit_context' ? (
                            <>
                              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#003DA5', fontWeight: 600 }}>{selected.usage_context_label}</p>
                              {selected.usage_context_description && <p style={{ margin: '1px 0 0', fontSize: 11, color: '#64748B' }}>{selected.usage_context_description}</p>}
                              <span style={{ fontSize: 10, color: '#94A3B8', fontFamily: 'monospace' }}>{selected.usage_context}</span>
                              {selected.usage_context_operational_status === 'BACKEND_SUPPORTED' && (
                                <div style={{ marginTop: 5, display: 'flex', gap: 5, alignItems: 'flex-start', padding: '5px 8px', borderRadius: 6, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                                  <AlertTriangle size={10} style={{ color: '#92400E', flexShrink: 0, marginTop: 1 }} />
                                  <span style={{ fontSize: 10, color: '#92400E', lineHeight: 1.4 }}>{selected.usage_context_operational_note}</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94A3B8', fontStyle: 'italic' }}>No System Area assigned.</p>
                              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748B' }}>This template uses the legacy Document Type fallback and remains fully compatible.</p>
                            </>
                          )}
                        </div>
                        <span style={{
                          flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 5,
                          ...(selected.resolution_mode === 'explicit_context'
                            ? { background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8' }
                            : { background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#64748B' }),
                        }}>
                          {selected.resolution_mode === 'explicit_context' ? 'Explicit System Area' : 'Doc Type Fallback'}
                        </span>
                      </div>
                      {/* Row 4: Generation Readiness */}
                      {(() => {
                        const chip = readinessChip(selected.generation_readiness)
                        return (
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '11px 14px' }}>
                            <div>
                              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#334155' }}>Generation Readiness</p>
                              {selected.generation_readiness === 'ready' && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#15803D' }}>This template can be selected for document generation.</p>}
                              {selected.generation_readiness === 'inactive' && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748B' }}>Activate this template to enable document generation.</p>}
                              {selected.generation_readiness === 'no_file' && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#92400E' }}>Upload and validate a DOCX file first.</p>}
                              {selected.generation_readiness === 'not_validated' && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#92400E' }}>Run validation before activating.</p>}
                              {selected.generation_readiness === 'invalid_placeholders' && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#B91C1C' }}>Fix unsupported placeholders, re-upload, and validate.</p>}
                              {selected.generation_readiness === 'not_docx' && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94A3B8' }}>Only DOCX files are used for official document generation.</p>}
                            </div>
                            <StatusPill chip={chip} />
                          </div>
                        )
                      })()}
                    </div>

                    {/* ── Technical details grid ───────────────────────────── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px 24px' }}>
                      {[
                        ['Document Type', selected.document_type_label],
                        ['Version', `v${selected.version}`],
                        ['File', selected.file_name || 'No file'],
                        ['Size', formatBytes(selected.file_size)],
                        ['Uploaded', selected.upload_date || '—'],
                        ['Uploaded by', selected.uploaded_by_name || '—'],
                      ].map(([label, value]) => (
                        <div key={label} style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                          <span style={{ color: '#94A3B8', width: 90, flexShrink: 0, fontSize: 11 }}>{label}</span>
                          <span style={{ color: '#1E293B', fontWeight: 500 }}>{value}</span>
                        </div>
                      ))}
                    </div>

                    {/* ── Inline System Area edit ──────────────────────────── */}
                    <div style={{ borderRadius: 10, border: '1px solid #E2E8F0', padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: editingContext ? 8 : 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>Edit System Area</span>
                        {!editingContext && (
                          <button type="button" onClick={() => { setEditContextValue(selected.usage_context ?? ''); setEditingContext(true) }}
                            style={{ fontSize: 11, color: '#003DA5', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 4, fontFamily: 'inherit' }}>
                            Edit
                          </button>
                        )}
                      </div>
                      {editingContext ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <select value={editContextValue} onChange={(e) => setEditContextValue(e.target.value)}
                            style={{ width: '100%', height: 36, paddingInline: '12px 32px', borderRadius: 8, border: '1.5px solid #93C5FD', fontSize: 13, color: '#1F2937', background: '#fff', appearance: 'none', cursor: 'pointer', fontFamily: 'inherit', outline: 'none' }}>
                            <option value="">— No specific area (Document Type fallback) —</option>
                            {usageContexts.map((ctx) => (
                              <option key={ctx.value} value={ctx.value}>
                                {ctx.label}{ctx.operational_status === 'BACKEND_SUPPORTED' ? ' ⚠ Backend only' : ''}
                              </option>
                            ))}
                          </select>
                          {editContextValue && usageContexts.find((c) => c.value === editContextValue)?.operational_status === 'BACKEND_SUPPORTED' && (
                            <div style={{ display: 'flex', gap: 5, alignItems: 'flex-start', padding: '6px 8px', borderRadius: 6, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                              <AlertTriangle size={10} style={{ color: '#92400E', flexShrink: 0, marginTop: 1 }} />
                              <span style={{ fontSize: 10, color: '#92400E', lineHeight: 1.4 }}>{usageContexts.find((c) => c.value === editContextValue)?.operational_note}</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', padding: '7px 10px', borderRadius: 7, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                            <Info size={11} style={{ color: '#64748B', flexShrink: 0, marginTop: 1 }} />
                            <span style={{ fontSize: 11, color: '#64748B', lineHeight: 1.4 }}>System Area determines where this template is used. If no custom template is configured for a workflow, the system default template continues to be used.</span>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <Button size="sm" disabled={saving} onClick={() => void handleSaveContext()}>Save</Button>
                            <Button size="sm" variant="secondary" disabled={saving} onClick={() => setEditingContext(false)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <p style={{ margin: 0, fontSize: 11, color: '#94A3B8' }}>
                          {selected.usage_context_label ? `Currently: ${selected.usage_context_label} (${selected.usage_context})` : 'Not assigned — using Document Type fallback.'}
                        </p>
                      )}
                    </div>

                    {/* ── Upload zone ─────────────────────────────────────── */}
                    <div style={{ borderRadius: 10, border: '1px dashed #E2E8F0', background: '#F8FAFC', padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#334155' }}>Upload / Replace DOCX</p>
                        <Button size="sm" variant="secondary" disabled={saving} onClick={() => fileInputRef.current?.click()}>
                          <Upload size={13} className="mr-1.5" /> Choose File
                        </Button>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0]; if (!file) return
                          if (selected.has_file) {
                            setConfirmDialog({ open: true, title: 'Replace?', message: 'Previous version will be archived.', action: () => void handleUpload(file) })
                          } else {
                            void handleUpload(file)
                          }
                          e.target.value = ''
                        }}
                      />
                      <Input
                        value={uploadNotes}
                        onChange={(e) => setUploadNotes(e.target.value)}
                        placeholder="Change notes (optional)"
                        style={{ height: 36, fontSize: 13 }}
                      />
                    </div>
                  </div>
                )}

                {/* Preview tab (read-only document preview) */}
                {detailTab === 'preview' && (
                  <TemplatePreviewTab template={selected} />
                )}

                {/* Validation tab */}
                {detailTab === 'validation' && (
                  <ValidationPanel validation={selected.validation_result} />
                )}

                {/* Versions tab */}
                {detailTab === 'versions' && (
                  <div>
                    {versions.length === 0 ? (
                      <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '40px 0' }}>No versions yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {versions.map((v) => (
                          <div key={v.id} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                            borderRadius: 10, border: '1px solid #E2E8F0',
                            padding: '12px 16px', fontSize: 13,
                          }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span style={{ fontWeight: 600, color: '#0F172A' }}>v{v.version}</span>
                                <span style={{ color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.file_name}</span>
                              </div>
                              <div style={{ fontSize: 11, color: '#94A3B8' }}>
                                {v.created_at ? new Date(v.created_at).toLocaleDateString() : '—'} · {v.uploaded_by_name || '—'} · {v.validation_status || 'n/a'}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                              <Button size="sm" variant="secondary" onClick={() => void templateService.downloadVersion(selected.id, v.id, v.file_name)}>Download</Button>
                              <Button size="sm" variant="secondary" disabled={saving} onClick={() => {
                                setConfirmDialog({ open: true, title: 'Restore?', message: `Restore v${v.version}?`, action: async () => {
                                  setSaving(true)
                                  try { const restored = await templateService.restoreVersion(selected.id, v.id); setSelected(restored); setMessage({ type: 'success', text: 'Restored.' }); await loadTemplates(); await loadVersions(selected.id) }
                                  catch (error: unknown) { setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed.' }) }
                                  finally { setSaving(false) }
                                } })
                              }}>Restore</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Placeholders tab */}
                {detailTab === 'placeholders' && (
                  <div style={{ maxHeight: 450, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {Array.from(new Set(placeholders.map((p) => p.category))).map((category) => (
                      <div key={category}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{category}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {placeholders.filter((p) => p.category === category).map((p) => (
                            <div key={p.key} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                              borderRadius: 8, border: '1px solid #F1F5F9',
                              padding: '10px 14px',
                            }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                  <span style={{ fontSize: 13, fontWeight: 500, color: '#1E293B' }}>{p.label}</span>
                                  <code style={{ fontSize: 11, color: '#003DA5', fontFamily: 'monospace' }}>{p.token}</code>
                                </div>
                                <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>{p.description}</p>
                              </div>
                              <button
                                onClick={() => void copyToken(p.token)}
                                style={{
                                  background: 'none', border: 'none', cursor: 'pointer',
                                  color: '#CBD5E1', padding: 4, borderRadius: 6,
                                  display: 'flex', alignItems: 'center', transition: 'color 0.15s',
                                }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#003DA5' }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#CBD5E1' }}
                                title="Copy"
                              >
                                <Copy size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Document Template"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button disabled={saving} onClick={() => void handleCreate()}>Create</Button>
          </>
        }
      >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#1F2937' }}>Name</label>
            <Input value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} style={{ height: 40, fontSize: 14 }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#1F2937' }}>Document Type</label>
            <select
              value={createForm.document_type}
              onChange={(e) => setCreateForm((f) => ({ ...f, document_type: e.target.value }))}
              style={{
                width: '100%', height: 40, paddingInline: '12px 32px', borderRadius: 10,
                border: '1px solid #E5E7EB', fontSize: 14, color: '#1F2937',
                background: '#fff', appearance: 'none', cursor: 'pointer', fontFamily: 'inherit',
                outline: 'none',
              }}
            >
              {(officialTypes.length ? officialTypes : types).map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600, color: '#1F2937' }}>
              System Area <span style={{ fontWeight: 400, color: '#94A3B8', fontSize: 12 }}>(optional)</span>
            </label>
            <select
              value={createForm.usage_context}
              onChange={(e) => setCreateForm((f) => ({ ...f, usage_context: e.target.value }))}
              style={{
                width: '100%', height: 40, paddingInline: '12px 32px', borderRadius: 10,
                border: '1px solid #E5E7EB', fontSize: 14, color: createForm.usage_context ? '#1F2937' : '#9CA3AF',
                background: '#fff', appearance: 'none', cursor: 'pointer', fontFamily: 'inherit',
                outline: 'none',
              }}
            >
              <option value="">— No specific area (matched by document type) —</option>
              {usageContexts.map((ctx) => (
                <option key={ctx.value} value={ctx.value}>{ctx.label}</option>
              ))}
            </select>
            {createForm.usage_context && (
              <p style={{ marginTop: 5, fontSize: 12, color: '#64748B' }}>
                {usageContexts.find((c) => c.value === createForm.usage_context)?.description}
              </p>
            )}
            <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px', borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <Info size={13} style={{ color: '#64748B', flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                System Area determines where this template is used. If no custom template is configured for a workflow, the system default template will continue to be used.
              </p>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#1F2937' }}>Description</label>
            <textarea
              value={createForm.description}
              onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
              style={{
                width: '100%', borderRadius: 10,
                border: '1px solid #E5E7EB', background: '#fff',
                padding: '10px 14px', fontSize: 14, color: '#1F2937',
                outline: 'none', fontFamily: 'inherit',
                resize: 'vertical', minHeight: 80,
              }}
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={confirmDialog.open} title={confirmDialog.title} message={confirmDialog.message}
        onConfirm={() => { confirmDialog.action(); setConfirmDialog({ open: false, title: '', message: '', action: () => {} }) }}
        onCancel={() => setConfirmDialog({ open: false, title: '', message: '', action: () => {} })} />
    </div>
  )
}