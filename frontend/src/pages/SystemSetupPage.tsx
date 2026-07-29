import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Alert, Badge, Button, Card, Dropdown, EmptyState, Input, Modal, Pagination, SearchBar, Spinner, Table, type Column } from '@/components/ui'
import { setupService, type SetupPayload, type SetupRecord, type SetupResource } from '@/services/setupService'
import { useAuth } from '@/hooks/useAuth'
import { isAdmin } from '@/utils/roleHelpers'
import { PageHeader } from '@/components/PageHeader'

interface SetupSection {
  resource: SetupResource
  title: string
  description: string
  codeLabel?: string
  needsOffice?: boolean
}

const sections: SetupSection[] = [
  { resource: 'asset-categories', title: 'Asset Categories', description: 'Group assets for easier searching, reporting, and inventory classification.', codeLabel: 'Category Code' },
  { resource: 'offices',          title: 'Offices',          description: 'Maintain PSA offices or accountable organizational units.',                  codeLabel: 'Office Code' },
  { resource: 'departments',      title: 'Departments',      description: 'Maintain organizational departments for employee alignment.',               codeLabel: 'Department Code' },
  { resource: 'locations',        title: 'Locations',        description: 'Maintain rooms, storage areas, or deployment locations under offices.',      codeLabel: 'Location Code', needsOffice: true },
  { resource: 'manufacturers',    title: 'Manufacturers',    description: 'Maintain brands, suppliers, and manufacturers used by asset records.' },
]

const emptyForm: SetupPayload = { name: '', code: '', description: '', office_id: null, is_active: true }

export function SystemSetupPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeResource, setActiveResource] = useState<SetupResource>('asset-categories')
  const [records, setRecords] = useState<Record<SetupResource, SetupRecord[]>>({
    'asset-categories': [], offices: [], departments: [], locations: [], manufacturers: [],
  })
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<SetupRecord | null>(null)
  const [form, setForm] = useState<SetupPayload>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Search & Pagination state
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const perPage = 10

  const activeSection = sections.find((s) => s.resource === activeResource) ?? sections[0]
  const activeRecords = records[activeResource]
  const officeOptions = records.offices.map((o) => ({ label: o.name, value: String(o.id) }))

  async function loadSetupData() {
    setLoading(true)
    try {
      const [assetCategories, offices, departments, locations, manufacturers] = await Promise.all([
        setupService.list('asset-categories'),
        setupService.list('offices'),
        setupService.list('departments'),
        setupService.list('locations'),
        setupService.list('manufacturers'),
      ])
      setRecords({ 'asset-categories': assetCategories, offices, departments, locations, manufacturers })
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to load setup records.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadSetupData() }, [])

  // Filtered & Paginated records
  const filteredRecords = useMemo(() => {
    if (!search.trim()) return activeRecords
    const term = search.toLowerCase().trim()
    return activeRecords.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        (r.code && r.code.toLowerCase().includes(term)) ||
        (r.description && r.description.toLowerCase().includes(term))
    )
  }, [activeRecords, search])

  const totalPages = Math.ceil(filteredRecords.length / perPage) || 1
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * perPage
    return filteredRecords.slice(start, start + perPage)
  }, [filteredRecords, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeResource, search])

  const columns: Column<SetupRecord>[] = useMemo(() => [
    { key: 'name',        header: 'Name',        render: (row) => <span className="font-medium text-slate-800">{row.name}</span> },
    { key: 'code',        header: 'Code',        render: (row) => <span className="font-mono text-xs text-slate-600">{row.code || '—'}</span> },
    { key: 'description', header: 'Description', render: (row) => <span className="text-xs text-slate-600 max-w-[200px] truncate block" title={row.description || ''}>{row.description || '—'}</span> },
    {
      key: 'office',
      header: 'Office',
      render: (row) => records.offices.find((o) => o.id === row.office_id)?.name ?? '—',
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge tone={row.is_active === false ? 'yellow' : 'green'}>
          {row.is_active === false ? 'Inactive' : 'Active'}
        </Badge>
      ),
    },
    { key: 'created_by', header: 'Created By', render: (row) => <span className="text-xs text-slate-600">{row.created_by_name || 'System'}</span> },
    { key: 'updated_by', header: 'Updated By', render: (row) => <span className="text-xs text-slate-600">{row.updated_by_name || '—'}</span> },
    { key: 'created_at', header: 'Created At', render: (row) => <span className="text-xs text-slate-500">{row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}</span> },
    { key: 'updated_at', header: 'Updated At', render: (row) => <span className="text-xs text-slate-500">{row.updated_at ? new Date(row.updated_at).toLocaleDateString() : '—'}</span> },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => void handleDelete(row)}>Delete</Button>
        </div>
      ),
    },
  ], [records.offices, activeResource])

  if (!isAdmin(user)) return <Navigate to="/dashboard" replace />

  function openCreate() {
    setEditingRecord(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(record: SetupRecord) {
    setEditingRecord(record)
    setForm({ name: record.name, code: record.code ?? '', description: record.description ?? '', office_id: record.office_id ?? null, is_active: record.is_active !== false })
    setModalOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    setMessage(null)
    try {
      const payload: SetupPayload = {
        name: form.name.trim(),
        code: activeSection.resource === 'manufacturers' ? undefined : form.code?.trim() || null,
        description: form.description?.trim() || null,
        office_id: activeSection.needsOffice ? form.office_id ?? null : undefined,
        is_active: form.is_active,
      }
      if (editingRecord) {
        await setupService.update(activeResource, editingRecord.id, payload)
        setMessage({ type: 'success', text: `${activeSection.title} record updated.` })
      } else {
        await setupService.create(activeResource, payload)
        setMessage({ type: 'success', text: `${activeSection.title} record created.` })
      }
      setModalOpen(false)
      await loadSetupData()
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to save record.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(record: SetupRecord) {
    if (!confirm(`Delete "${record.name}"?`)) return
    try {
      await setupService.remove(activeResource, record.id)
      setMessage({ type: 'success', text: `${activeSection.title} record deleted.` })
      await loadSetupData()
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to delete record.' })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="System Setup"
        subtitle="Admin tools for maintaining setup data without touching code."
      />

      {message && (
        <Alert tone={message.type} onClose={() => setMessage(null)}>{message.text}</Alert>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
        {/* ── Main panel ── */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

          {/* Tab bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', borderBottom: '1px solid #f1f5f9', padding: '0 4px' }}>
            {sections.map((section) => {
              const active = section.resource === activeResource
              return (
                <button
                  key={section.resource}
                  type="button"
                  onClick={() => setActiveResource(section.resource)}
                  style={{
                    position: 'relative',
                    padding: '14px 18px',
                    fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    color: active ? '#0B3D91' : '#64748b',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'color 0.15s',
                    whiteSpace: 'nowrap',
                    lineHeight: 1,
                    outline: 'none',
                  }}
                  onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = '#1e293b' }}
                  onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = '#64748b' }}
                >
                  {section.title}
                  {/* Active underline */}
                  {active && (
                    <span style={{
                      position: 'absolute',
                      bottom: 0, left: 8, right: 8,
                      height: 2,
                      borderRadius: '2px 2px 0 0',
                      background: '#0B3D91',
                      display: 'block',
                    }} />
                  )}
                </button>
              )
            })}
          </div>

          {/* Sub-header & Search */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid #f1f5f9', padding: '14px 20px' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', lineHeight: 1.3 }}>{activeSection.title}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3, lineHeight: 1.4 }}>{activeSection.description}</div>
            </div>
            <div className="flex items-center gap-3">
              <SearchBar
                placeholder={`Search ${activeSection.title.toLowerCase()}...`}
                onSearch={(s) => setSearch(s)}
              />
              <Button onClick={openCreate}>
                Add {activeSection.title}
              </Button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-14"><Spinner /></div>
          ) : (
            <>
              <Table
                columns={columns.filter((c) => activeSection.needsOffice || c.key !== 'office')}
                rows={paginatedRecords}
                rowKey={(row) => row.id}
                empty={
                  <div className="py-14">
                    <EmptyState
                      title={`No ${activeSection.title.toLowerCase()} found`}
                      description="Add a record or adjust your search filter."
                    />
                  </div>
                }
              />
              <div style={{ borderTop: '1px solid #f1f5f9', padding: '10px 20px' }}>
                <Pagination
                  page={currentPage}
                  lastPage={totalPages}
                  total={filteredRecords.length}
                  onPageChange={(p) => setCurrentPage(p)}
                />
              </div>
            </>
          )}
        </div>

        {/* Shortcuts sidebar */}
        <div className="space-y-4">
          <Card title="Admin Shortcuts" subtitle="Common setup tasks">
            <div className="space-y-2">
              {[
                { label: 'Manage Users',          path: '/users' },
                { label: 'Manage Roles',          path: '/roles' },
                { label: 'Manage Permissions',    path: '/permissions' },
                { label: 'Document Templates',    path: '/document-templates' },
                { label: 'Print Asset QR Labels', path: '/assets' },
              ].map((item) => (
                <Button
                  key={item.path}
                  className="w-full justify-start"
                  variant="secondary"
                  onClick={() => navigate(item.path)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
            <div className="mt-4 rounded-lg border border-[#C5D8FF] bg-[#EEF4FF] p-3 text-xs text-[#003DA5]">
              Suggested: configure QR prefixes, receipt prefixes, default employee password, and reorder defaults.
            </div>
          </Card>
        </div>
      </div>

      {/* Add / Edit modal */}
      <Modal
        open={modalOpen}
        title={editingRecord ? `Edit ${activeSection.title}` : `Add ${activeSection.title}`}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={() => void handleSave()} disabled={saving || !form.name.trim()}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          {activeSection.resource !== 'manufacturers' && (
            <Input
              label={activeSection.codeLabel ?? 'Code'}
              value={form.code ?? ''}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          )}
          {activeSection.needsOffice && (
            <Dropdown
              label="Office"
              placeholder="No office selected"
              options={officeOptions}
              value={form.office_id ? String(form.office_id) : ''}
              onChange={(e) => setForm({ ...form, office_id: e.target.value ? Number(e.target.value) : null })}
            />
          )}
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-[#1F2937]">Description</label>
            <textarea
              className="w-full rounded-[10px] border border-[#E5E7EB] bg-white p-3 text-[14px] text-[#1F2937] shadow-[0_1px_2px_rgba(0,0,0,.05)] focus:border-[#0D47A1] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]/15"
              rows={3}
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Enter description..."
            />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.is_active !== false}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              style={{ width: 16, height: 16, accentColor: '#0B3D91', cursor: 'pointer' }}
            />
            <span style={{ fontSize: 14, color: '#334155' }}>Active</span>
          </label>
        </div>
      </Modal>
    </div>
  )
}
