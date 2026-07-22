import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Alert, Badge, Button, Card, Dropdown, EmptyState, Input, Modal, Spinner, Table, type Column } from '@/components/ui'
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
  { resource: 'locations',        title: 'Locations',        description: 'Maintain rooms, storage areas, or deployment locations under offices.',      codeLabel: 'Location Code', needsOffice: true },
  { resource: 'manufacturers',    title: 'Manufacturers',    description: 'Maintain brands, suppliers, and manufacturers used by asset records.' },
]

const emptyForm: SetupPayload = { name: '', code: '', description: '', office_id: null, is_active: true }

export function SystemSetupPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeResource, setActiveResource] = useState<SetupResource>('asset-categories')
  const [records, setRecords] = useState<Record<SetupResource, SetupRecord[]>>({
    'asset-categories': [], offices: [], locations: [], manufacturers: [],
  })
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<SetupRecord | null>(null)
  const [form, setForm] = useState<SetupPayload>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const activeSection = sections.find((s) => s.resource === activeResource) ?? sections[0]
  const activeRecords = records[activeResource]
  const officeOptions = records.offices.map((o) => ({ label: o.name, value: String(o.id) }))

  async function loadSetupData() {
    setLoading(true)
    try {
      const [assetCategories, offices, locations, manufacturers] = await Promise.all([
        setupService.list('asset-categories'),
        setupService.list('offices'),
        setupService.list('locations'),
        setupService.list('manufacturers'),
      ])
      setRecords({ 'asset-categories': assetCategories, offices, locations, manufacturers })
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to load setup records.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadSetupData() }, [])

  const columns: Column<SetupRecord>[] = useMemo(() => [
    { key: 'name',   header: 'Name',   render: (row) => <span className="font-medium text-slate-800">{row.name}</span> },
    { key: 'code',   header: 'Code',   render: (row) => <span className="font-mono text-xs text-slate-600">{row.code || '—'}</span> },
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
    <div className="space-y-5">
      <PageHeader
        title="System Setup"
        subtitle="Admin tools for maintaining setup data without touching code."
      />

      {message && (
        <Alert tone={message.type} onClose={() => setMessage(null)}>{message.text}</Alert>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
        {/* Main panel */}
        <Card noPadding>
          {/* Tab bar */}
          <div className="flex flex-wrap gap-0 border-b border-[#EEF2F8]">
            {sections.map((section) => {
              const active = section.resource === activeResource
              return (
                <button
                  key={section.resource}
                  type="button"
                  onClick={() => setActiveResource(section.resource)}
                  className={[
                    'relative px-5 py-3 text-sm font-semibold transition-colors',
                    active ? 'text-[#003DA5]' : 'text-slate-500 hover:text-slate-800',
                  ].join(' ')}
                >
                  {section.title}
                  {active && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-[#003DA5]" />}
                </button>
              )
            })}
          </div>

          {/* Sub-header */}
          <div className="flex items-center justify-between gap-3 border-b border-[#EEF2F8] px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">{activeSection.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">{activeSection.description}</p>
            </div>
            <Button onClick={openCreate}>
              Add {activeSection.title.replace(/s$/, '')}
            </Button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-14"><Spinner /></div>
          ) : (
            <Table
              columns={columns.filter((c) => activeSection.needsOffice || c.key !== 'office')}
              rows={activeRecords}
              rowKey={(row) => row.id}
              empty={
                <div className="py-14">
                  <EmptyState
                    title={`No ${activeSection.title.toLowerCase()} yet`}
                    description="Add the first record to make this option available in forms."
                  />
                </div>
              }
            />
          )}
        </Card>

        {/* Shortcuts sidebar */}
        <div className="space-y-4">
          <Card title="Admin Shortcuts" subtitle="Common setup tasks">
            <div className="space-y-2">
              {[
                { label: 'Manage Users',       path: '/users' },
                { label: 'Manage Roles',       path: '/roles' },
                { label: 'Manage Permissions', path: '/permissions' },
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
        <div className="space-y-4">
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
          <Input
            label="Description"
            value={form.description ?? ''}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.is_active !== false}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="h-4 w-4 rounded accent-[#003DA5]"
            />
            Active
          </label>
        </div>
      </Modal>
    </div>
  )
}
