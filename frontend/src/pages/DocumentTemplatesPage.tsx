import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Dropdown,
  EmptyState,
  Input,
  Modal,
  SearchBar,
  Spinner,
  Table,
  type Column,
} from '@/components/ui'
import {
  templateService,
  type DocumentTemplate,
  type DocumentTypeOption,
  type TemplateFilters,
  type TemplateUploadPayload,
} from '@/services/templateService'
import { useAuth } from '@/hooks/useAuth'
import { isAdmin } from '@/utils/roleHelpers'
import { PageHeader } from '@/components/PageHeader'

const STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
]

const emptyForm: TemplateUploadPayload = {
  name: '',
  document_type: '',
  description: '',
  version: '1.0',
  status: 'active',
  is_default: false,
  file: null as unknown as File,
}

export function DocumentTemplatesPage() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeOption[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<TemplateFilters>({})
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null)
  const [form, setForm] = useState<TemplateUploadPayload>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    message: string
    action: () => void
  }>({ open: false, title: '', message: '', action: () => {} })

  const admin = isAdmin(user)

  const filteredTypes = useMemo(() => {
    const allTypes = documentTypes
    if (!filters.document_type) return allTypes
    return allTypes.filter((t) => t.value === filters.document_type)
  }, [documentTypes, filters.document_type])

  async function loadTemplates() {
    setLoading(true)
    try {
      const result = await templateService.list({
        ...filters,
        search: search || undefined,
        per_page: 100,
      })
      setTemplates(result.items)
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Unable to load templates.',
      })
    } finally {
      setLoading(false)
    }
  }

  async function loadDocumentTypes() {
    try {
      const types = await templateService.getDocumentTypes()
      setDocumentTypes(types)
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Unable to load document types.',
      })
    }
  }

  useEffect(() => {
    void loadTemplates()
  }, [filters, search])

  useEffect(() => {
    void loadDocumentTypes()
  }, [])

  const groupedTemplates = useMemo(() => {
    const groups: Record<string, DocumentTemplate[]> = {}
    templates.forEach((t) => {
      const cat = t.category || 'Other'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(t)
    })
    return groups
  }, [templates])

  function openCreate() {
    setEditingTemplate(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(template: DocumentTemplate) {
    setEditingTemplate(template)
    setForm({
      name: template.name,
      document_type: template.document_type,
      description: template.description ?? '',
      version: template.version,
      status: template.status,
      is_default: template.is_default,
      file: null as unknown as File,
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim() || !form.document_type) {
      setMessage({ type: 'error', text: 'Template name and document type are required.' })
      return
    }
    if (!form.file && !editingTemplate) {
      setMessage({ type: 'error', text: 'Please select a file to upload.' })
      return
    }

    setSaving(true)
    setMessage(null)
    try {
      if (editingTemplate) {
        await templateService.update(editingTemplate.id, form)
        setMessage({ type: 'success', text: 'Template updated successfully.' })
      } else {
        await templateService.upload(form)
        setMessage({ type: 'success', text: 'Template uploaded successfully.' })
      }
      setModalOpen(false)
      await loadTemplates()
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Unable to save template.',
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(template: DocumentTemplate) {
    setConfirmDialog({
      open: true,
      title: 'Delete Template',
      message: `Are you sure you want to delete "${template.name}"? This action cannot be undone.`,
      action: async () => {
        try {
          await templateService.delete(template.id)
          setMessage({ type: 'success', text: 'Template deleted successfully.' })
          await loadTemplates()
        } catch (error: unknown) {
          setMessage({
            type: 'error',
            text: error instanceof Error ? error.message : 'Unable to delete template.',
          })
        }
      },
    })
  }

  async function handleSetDefault(template: DocumentTemplate) {
    try {
      await templateService.setDefault(template.id)
      setMessage({ type: 'success', text: `Default template set for "${template.name}".` })
      await loadTemplates()
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Unable to set default template.',
      })
    }
  }

  async function handleToggleStatus(template: DocumentTemplate) {
    try {
      await templateService.toggleStatus(template.id)
      await loadTemplates()
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Unable to toggle status.',
      })
    }
  }

  async function handleDuplicate(template: DocumentTemplate) {
    try {
      await templateService.duplicate(template.id)
      setMessage({ type: 'success', text: `Template "${template.name}" duplicated.` })
      await loadTemplates()
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Unable to duplicate template.',
      })
    }
  }

  async function handleDownload(template: DocumentTemplate) {
    try {
      const blob = await templateService.download(template.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = template.file_name
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Unable to download template.',
      })
    }
  }

  async function handlePreview(template: DocumentTemplate) {
    try {
      const blob = await templateService.preview(template.id)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      URL.revokeObjectURL(url)
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Unable to preview template.',
      })
    }
  }

  function getExtensionIcon(ext: string | null): string {
    if (!ext) return '📄'
    const e = ext.toLowerCase()
    if (e === 'xlsx' || e === 'xls') return '📊'
    if (e === 'csv') return '📋'
    if (e === 'docx') return '📝'
    if (e === 'pdf') return '📄'
    return '📄'
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (!admin) {
    return (
      <div style={{ padding: 20 }}>
        <PageHeader title="Document Templates" subtitle="Access denied." />
        <Alert tone="error">Only administrators can manage document templates.</Alert>
      </div>
    )
  }

  const columns: Column<DocumentTemplate>[] = [
    {
      key: 'name',
      header: 'Template Name',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>{getExtensionIcon(row.extension)}</span>
          <div>
            <div style={{ fontWeight: 600, color: '#1e293b' }}>{row.name}</div>
            {row.is_default && <Badge tone="blue">Default</Badge>}
          </div>
        </div>
      ),
    },
    {
      key: 'document_type',
      header: 'Document Type',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 500 }}>{row.document_type_label || row.document_type}</div>
          <Badge tone="gray">{row.category}</Badge>
        </div>
      ),
    },
    {
      key: 'version',
      header: 'Version',
      render: (row) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{row.version}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge tone={row.status === 'active' ? 'green' : 'yellow'}>
          {row.status_label || row.status}
        </Badge>
      ),
    },
    {
      key: 'file_info',
      header: 'File',
      render: (row) => (
        <div style={{ fontSize: 12, color: '#64748b' }}>
          <div>{row.file_name}</div>
          <div>{formatFileSize(row.file_size)}</div>
        </div>
      ),
    },
    {
      key: 'upload_date',
      header: 'Upload Date',
      render: (row) => (
        <span style={{ fontSize: 12, color: '#64748b' }}>
          {row.upload_date ? new Date(row.upload_date).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <Button size="sm" variant="ghost" onClick={() => void handlePreview(row)}>Preview</Button>
          <Button size="sm" variant="ghost" onClick={() => void handleDownload(row)}>Download</Button>
          <Button size="sm" variant="ghost" onClick={() => void handleDuplicate(row)}>Duplicate</Button>
          {!row.is_default && row.status === 'active' && (
            <Button size="sm" variant="ghost" onClick={() => void handleSetDefault(row)}>Set Default</Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => void handleToggleStatus(row)}>
            {row.status === 'active' ? 'Disable' : 'Enable'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>Replace</Button>
          <Button size="sm" variant="danger" onClick={() => void handleDelete(row)}>Delete</Button>
        </div>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Document Templates"
        subtitle="Manage configurable templates for reports, receipts, exports, and documents."
      />

      {message && (
        <Alert tone={message.type} onClose={() => setMessage(null)}>{message.text}</Alert>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <SearchBar
          placeholder="Search templates..."
          onSearch={setSearch}
          style={{ maxWidth: 300 }}
        />
        <Dropdown
          label="Document Type"
          placeholder="All types"
          options={[{ label: 'All Types', value: '' }, ...filteredTypes]}
          value={filters.document_type || ''}
          onChange={(e) => setFilters({ ...filters, document_type: e.target.value || undefined })}
        />
        <Dropdown
          label="Status"
          placeholder="All statuses"
          options={STATUS_OPTIONS}
          value={filters.status || ''}
          onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
        />
        {admin && (
          <Button onClick={openCreate}>Upload Template</Button>
        )}
      </div>

      {/* Templates grouped by category */}
      {loading ? (
        <div className="flex items-center justify-center py-14"><Spinner label="Loading templates..." /></div>
      ) : templates.length === 0 ? (
        <div className="py-14">
          <EmptyState
            title="No templates found"
            description="Upload your first template to make it available for document generation."
          />
        </div>
      ) : (
        Object.entries(groupedTemplates).map(([category, catTemplates]) => (
          <Card
            key={category}
            title={category}
            subtitle={`${catTemplates.length} template${catTemplates.length !== 1 ? 's' : ''}`}
          >
            <Table
              columns={columns}
              rows={catTemplates}
              rowKey={(row) => row.id}
              empty={<EmptyState title="No templates in this category" />}
            />
          </Card>
        ))
      )}

      {/* Upload / Edit Modal */}
      <Modal
        open={modalOpen}
        title={editingTemplate ? 'Replace Template' : 'Upload Template'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving ? 'Saving…' : (editingTemplate ? 'Replace' : 'Upload')}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Input
            label="Template Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Inventory Export v2"
          />
          <Dropdown
            label="Document Type"
            placeholder="Select document type"
            options={documentTypes.map((t) => ({ label: t.label, value: t.value }))}
            value={form.document_type}
            onChange={(e) => setForm({ ...form, document_type: e.target.value })}
          />
          <Input
            label="Version"
            value={form.version ?? '1.0'}
            onChange={(e) => setForm({ ...form, version: e.target.value })}
            placeholder="e.g. 1.0"
          />
          <Input
            label="Description"
            value={form.description ?? ''}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Optional description"
          />
          <Dropdown
            label="Status"
            placeholder="Select status"
            options={STATUS_OPTIONS.filter((o) => o.value)}
            value={form.status ?? 'active'}
            onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.is_default ?? false}
              onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
              style={{ width: 16, height: 16, accentColor: '#0B3D91', cursor: 'pointer' }}
            />
            <span style={{ fontSize: 14, color: '#334155' }}>Set as default for this document type</span>
          </label>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#334155' }}>
              Template File
            </label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv,.docx,.pdf"
              onChange={(e) => setForm({ ...form, file: e.target.files?.[0] ?? null as unknown as File })}
              style={{ fontSize: 13 }}
            />
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
              Supported: .xlsx, .xls, .csv, .docx, .pdf (max 10MB)
            </div>
          </div>
        </div>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={() => {
          confirmDialog.action()
          setConfirmDialog({ open: false, title: '', message: '', action: () => {} })
        }}
        onCancel={() => setConfirmDialog({ open: false, title: '', message: '', action: () => {} })}
      />
    </div>
  )
}
