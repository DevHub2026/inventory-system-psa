import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Modal,
  Spinner,
} from '@/components/ui'
import {
  templateService,
  type DocumentTemplate,
  type DocumentTemplateVersion,
  type DocumentTypeOption,
  type PlaceholderDefinition,
  type TemplateValidationResult,
} from '@/services/templateService'
import { useAuth } from '@/hooks/useAuth'
import { isAdmin } from '@/utils/roleHelpers'
import { PageHeader } from '@/components/PageHeader'
import {
  CheckCircle2,
  Copy,
  Download,
  FileText,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react'

function formatBytes(size?: number | null): string {
  if (!size) return '—'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function ValidationPanel({ validation }: { validation: TemplateValidationResult | null | undefined }) {
  if (!validation) {
    return <p className="text-sm text-slate-500">Upload a DOCX file to validate placeholders.</p>
  }

  return (
    <div className="space-y-3 text-sm">
      <div>
        <p className="mb-1 font-semibold text-emerald-700">Valid</p>
        {validation.valid.length === 0 ? (
          <p className="text-slate-500">None detected.</p>
        ) : (
          <ul className="space-y-1">
            {validation.valid.map((key) => (
              <li key={key} className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 size={14} /> <code>{`{{${key}}}`}</code>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="mb-1 font-semibold text-red-700">Unknown</p>
        {validation.unknown.length === 0 ? (
          <p className="text-slate-500">None.</p>
        ) : (
          <ul className="space-y-1">
            {validation.unknown.map((key) => (
              <li key={key} className="flex items-center gap-2 text-red-700">
                <XCircle size={14} /> <code>{`{{${key}}}`}</code>
              </li>
            ))}
          </ul>
        )}
        {validation.unknown.length > 0 && (
          <p className="mt-2 text-xs text-amber-700">
            Unknown placeholders block activation and will not be populated.
          </p>
        )}
      </div>

      <div>
        <p className="mb-1 font-semibold text-slate-700">Duplicates</p>
        {Object.keys(validation.duplicates || {}).length === 0 ? (
          <p className="text-slate-500">None. (Duplicates are allowed.)</p>
        ) : (
          <ul className="space-y-1 text-slate-700">
            {Object.entries(validation.duplicates).map(([key, count]) => (
              <li key={key}>
                ⚠ <code>{`{{${key}}}`}</code> appears {count} times
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export function DocumentTemplatesPage() {
  const { user } = useAuth()
  const admin = isAdmin(user)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [types, setTypes] = useState<DocumentTypeOption[]>([])
  const [placeholders, setPlaceholders] = useState<PlaceholderDefinition[]>([])
  const [versions, setVersions] = useState<DocumentTemplateVersion[]>([])
  const [selected, setSelected] = useState<DocumentTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', document_type: 'issuance', description: '' })
  const [uploadNotes, setUploadNotes] = useState('')
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    message: string
    action: () => void
  }>({ open: false, title: '', message: '', action: () => {} })

  const officialTypes = useMemo(
    () =>
      types.filter((t) =>
        ['borrow_receipt', 'return_receipt', 'issuance', 'property_transfer', 'clearance', 'reissuance'].includes(
          t.value,
        ),
      ),
    [types],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return templates
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.document_type.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q),
    )
  }, [templates, search])

  async function loadTemplates() {
    setLoading(true)
    try {
      const [list, typeList, placeholderList] = await Promise.all([
        templateService.list({ per_page: 100 }),
        templateService.getDocumentTypes(),
        templateService.getPlaceholders(),
      ])
      setTemplates(list.items)
      setTypes(typeList)
      setPlaceholders(placeholderList)
      if (selected) {
        const refreshed = list.items.find((t) => t.id === selected.id) || null
        setSelected(refreshed)
      }
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Unable to load document templates.',
      })
    } finally {
      setLoading(false)
    }
  }

  async function loadVersions(id: number) {
    try {
      setVersions(await templateService.versions(id))
    } catch {
      setVersions([])
    }
  }

  useEffect(() => {
    void loadTemplates()
  }, [])

  useEffect(() => {
    if (selected?.id) void loadVersions(selected.id)
  }, [selected?.id])

  async function handleCreate() {
    if (!createForm.name.trim()) {
      setMessage({ type: 'error', text: 'Template name is required.' })
      return
    }
    setSaving(true)
    try {
      const created = await templateService.create({
        name: createForm.name.trim(),
        document_type: createForm.document_type,
        description: createForm.description.trim() || undefined,
      })
      setCreateOpen(false)
      setCreateForm({ name: '', document_type: 'issuance', description: '' })
      setMessage({ type: 'success', text: `Template "${created.name}" created. Upload a DOCX file to continue.` })
      await loadTemplates()
      setSelected(created)
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to create template.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleUpload(file: File) {
    if (!selected) return
    setSaving(true)
    try {
      const updated = await templateService.upload(selected.id, file, uploadNotes || undefined)
      setSelected(updated)
      setMessage({
        type: 'success',
        text: updated.has_unknown_placeholders
          ? 'DOCX uploaded, but unknown placeholders were found. Fix them before activating.'
          : 'DOCX uploaded and validated successfully.',
      })
      setUploadNotes('')
      await loadTemplates()
      await loadVersions(updated.id)
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Upload failed.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleValidate() {
    if (!selected) return
    setSaving(true)
    try {
      const result = await templateService.validate(selected.id)
      setSelected(result.template)
      setMessage({
        type: result.validation.is_valid ? 'success' : 'error',
        text: result.validation.is_valid
          ? 'Template validation passed.'
          : 'Validation found unknown placeholders.',
      })
      await loadTemplates()
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Validation failed.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleActivate() {
    if (!selected) return
    setSaving(true)
    try {
      const updated = await templateService.activate(selected.id)
      setSelected(updated)
      setMessage({ type: 'success', text: `Template "${updated.name}" activated.` })
      await loadTemplates()
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Activation failed.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate() {
    if (!selected) return
    setSaving(true)
    try {
      const updated = await templateService.deactivate(selected.id)
      setSelected(updated)
      setMessage({ type: 'success', text: `Template "${updated.name}" deactivated.` })
      await loadTemplates()
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Deactivation failed.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!selected) return
    setConfirmDialog({
      open: true,
      title: 'Delete Template?',
      message: `Delete "${selected.name}"? Previous version files are retained in storage history.`,
      action: async () => {
        setSaving(true)
        try {
          await templateService.delete(selected.id)
          setSelected(null)
          setMessage({ type: 'success', text: 'Template deleted.' })
          await loadTemplates()
        } catch (error: unknown) {
          setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Delete failed.' })
        } finally {
          setSaving(false)
        }
      },
    })
  }

  async function copyToken(token: string) {
    try {
      await navigator.clipboard.writeText(token)
      setMessage({ type: 'success', text: `Copied ${token}` })
    } catch {
      setMessage({ type: 'error', text: 'Unable to copy placeholder.' })
    }
  }

  if (!admin) {
    return (
      <div className="p-6">
        <PageHeader title="Document Templates" subtitle="Access restricted." />
        <Alert tone="error">Only system administrators can access Document Template Management.</Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          title="Document Templates"
          subtitle="Upload official PSA Word (DOCX) templates with supported placeholders."
        />
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={16} className="mr-1.5" /> New Template
        </Button>
      </div>

      {message && (
        <Alert tone={message.type} onClose={() => setMessage(null)}>{message.text}</Alert>
      )}

      <Card className="p-4">
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-700">How to create a document template</h3>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600">
          <li>Create or edit the official PSA document in Microsoft Word.</li>
          <li>Insert supported placeholders such as <code>{'{{employee_name}}'}</code>.</li>
          <li>Save the file as DOCX and upload it here.</li>
          <li>Review validation results, fix unknown placeholders, then activate.</li>
        </ol>
      </Card>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-5">
          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
              <Spinner label="Loading document templates..." />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState title="No templates found" description="Create a template and upload a DOCX file." />
          ) : (
            <div className="space-y-3">
              {filtered.map((tpl) => (
                <div
                  key={tpl.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelected(tpl)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setSelected(tpl)
                  }}
                  className={`cursor-pointer rounded-2xl ${selected?.id === tpl.id ? 'ring-2 ring-[#0D47A1]/40' : ''}`}
                >
                  <Card>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <FileText size={18} className="text-[#0D47A1]" />
                          <h4 className="font-semibold text-slate-900">{tpl.name}</h4>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Type: {tpl.document_type_label} · Version: {tpl.version}
                        </p>
                        <p className="text-xs text-slate-500">
                          Updated: {tpl.updated_at ? new Date(tpl.updated_at).toLocaleDateString() : '—'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge tone={tpl.status === 'active' ? 'green' : 'yellow'}>{tpl.status_label}</Badge>
                        {tpl.is_default && <Badge tone="blue">Default</Badge>}
                        {tpl.has_unknown_placeholders && <Badge tone="red">Invalid</Badge>}
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4 lg:col-span-7">
          {!selected ? (
            <Card className="p-8 text-center text-sm text-slate-500">Select a template to manage.</Card>
          ) : (
            <>
              <Card className="space-y-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{selected.name}</h3>
                    <p className="text-sm text-slate-600">{selected.description || 'No description.'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" disabled={saving || !selected.has_file} onClick={() => void handleValidate()}>
                      <RefreshCw size={14} className="mr-1" /> Validate
                    </Button>
                    {selected.status === 'active' ? (
                      <Button size="sm" variant="secondary" disabled={saving} onClick={() => void handleDeactivate()}>
                        Deactivate
                      </Button>
                    ) : (
                      <Button size="sm" disabled={saving} onClick={() => void handleActivate()}>
                        Activate
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!selected.has_file}
                      onClick={() => void templateService.download(selected.id, selected.file_name || undefined)}
                    >
                      <Download size={14} className="mr-1" /> Download
                    </Button>
                    <Button size="sm" variant="secondary" disabled={saving} onClick={() => void handleDelete()}>
                      <Trash2 size={14} className="mr-1" /> Delete
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div><span className="text-slate-500">Type:</span> {selected.document_type_label}</div>
                  <div><span className="text-slate-500">Version:</span> {selected.version}</div>
                  <div><span className="text-slate-500">File:</span> {selected.file_name || 'No file uploaded'}</div>
                  <div><span className="text-slate-500">Size:</span> {formatBytes(selected.file_size)}</div>
                  <div><span className="text-slate-500">Uploaded:</span> {selected.upload_date || '—'}</div>
                  <div><span className="text-slate-500">Uploaded by:</span> {selected.uploaded_by_name || '—'}</div>
                  <div><span className="text-slate-500">Validation:</span> {selected.validation_status || 'Not validated'}</div>
                  <div><span className="text-slate-500">Ready:</span> {selected.is_docx_ready ? 'Yes' : 'No'}</div>
                </div>

                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
                  <p className="mb-2 text-sm font-semibold text-slate-700">Upload / Replace DOCX</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="mb-2 block w-full text-sm"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      if (selected.has_file) {
                        setConfirmDialog({
                          open: true,
                          title: 'Replace DOCX Template?',
                          message: 'The previous version will be archived. Continue?',
                          action: () => void handleUpload(file),
                        })
                      } else {
                        void handleUpload(file)
                      }
                      e.target.value = ''
                    }}
                  />
                  <input
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                    placeholder="Change notes (optional)"
                    className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                  <Button size="sm" variant="secondary" disabled={saving} onClick={() => fileInputRef.current?.click()}>
                    <Upload size={14} className="mr-1" /> Choose DOCX File
                  </Button>
                </div>
              </Card>

              <Card className="p-5">
                <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-700">Template Validation</h4>
                <ValidationPanel validation={selected.validation_result} />
              </Card>

              <Card className="p-5">
                <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-700">Version History</h4>
                {versions.length === 0 ? (
                  <p className="text-sm text-slate-500">No versions yet.</p>
                ) : (
                  <div className="space-y-2">
                    {versions.map((v) => (
                      <div key={v.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                        <div>
                          <div className="font-medium">v{v.version} · {v.file_name}</div>
                          <div className="text-xs text-slate-500">
                            {v.created_at ? new Date(v.created_at).toLocaleString() : '—'} · {v.uploaded_by_name || '—'} · {v.validation_status || 'n/a'}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => void templateService.downloadVersion(selected.id, v.id, v.file_name)}
                          >
                            Download
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={saving}
                            onClick={() => {
                              setConfirmDialog({
                                open: true,
                                title: 'Restore Version?',
                                message: `Restore version ${v.version}? The current file will be archived.`,
                                action: async () => {
                                  setSaving(true)
                                  try {
                                    const restored = await templateService.restoreVersion(selected.id, v.id)
                                    setSelected(restored)
                                    setMessage({ type: 'success', text: 'Version restored.' })
                                    await loadTemplates()
                                    await loadVersions(selected.id)
                                  } catch (error: unknown) {
                                    setMessage({
                                      type: 'error',
                                      text: error instanceof Error ? error.message : 'Restore failed.',
                                    })
                                  } finally {
                                    setSaving(false)
                                  }
                                },
                              })
                            }}
                          >
                            Restore
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}

          <Card className="p-5">
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-700">Available Placeholders</h4>
            <div className="max-h-96 space-y-4 overflow-y-auto">
              {Array.from(new Set(placeholders.map((p) => p.category))).map((category) => (
                <div key={category}>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">{category}</p>
                  <div className="space-y-2">
                    {placeholders
                      .filter((p) => p.category === category)
                      .map((p) => (
                        <div key={p.key} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 p-3">
                          <div>
                            <div className="font-medium text-slate-900">{p.label}</div>
                            <code className="text-xs text-[#0D47A1]">{p.token}</code>
                            <p className="mt-1 text-xs text-slate-500">{p.description}</p>
                          </div>
                          <Button size="sm" variant="secondary" onClick={() => void copyToken(p.token)}>
                            <Copy size={14} className="mr-1" /> Copy
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New Document Template"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button disabled={saving} onClick={() => void handleCreate()}>Create</Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={createForm.name}
              onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Document Type</label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={createForm.document_type}
              onChange={(e) => setCreateForm((f) => ({ ...f, document_type: e.target.value }))}
            >
              {(officialTypes.length ? officialTypes : types).map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              rows={3}
              value={createForm.description}
              onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={() => { confirmDialog.action(); setConfirmDialog({ open:false,title:'',message:'',action:()=>{} }) }}
        onCancel={() => setConfirmDialog({ open:false,title:'',message:'',action:()=>{} })}
      />
    </div>
  )
}
