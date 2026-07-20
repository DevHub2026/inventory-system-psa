import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Alert, Badge, Button, Card, Dropdown, EmptyState, Input, Modal, Spinner, Table, type Column } from '@/components/ui'
import { setupService, type SetupPayload, type SetupRecord, type SetupResource } from '@/services/setupService'
import { useAuth } from '@/hooks/useAuth'
import { isAdmin } from '@/utils/roleHelpers'

interface SetupSection {
  resource: SetupResource
  title: string
  description: string
  codeLabel?: string
  needsOffice?: boolean
}

const sections: SetupSection[] = [
  {
    resource: 'asset-categories',
    title: 'Asset Categories',
    description: 'Group assets for easier searching, reporting, and inventory classification.',
    codeLabel: 'Category Code',
  },
  {
    resource: 'offices',
    title: 'Offices',
    description: 'Maintain PSA offices or accountable organizational units.',
    codeLabel: 'Office Code',
  },
  {
    resource: 'locations',
    title: 'Locations',
    description: 'Maintain rooms, storage areas, or deployment locations under offices.',
    codeLabel: 'Location Code',
    needsOffice: true,
  },
  {
    resource: 'manufacturers',
    title: 'Manufacturers',
    description: 'Maintain brands, suppliers, and manufacturers used by asset records.',
  },
]

const emptyForm: SetupPayload = {
  name: '',
  code: '',
  description: '',
  office_id: null,
  is_active: true,
}

export function SystemSetupPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeResource, setActiveResource] = useState<SetupResource>('asset-categories')
  const [records, setRecords] = useState<Record<SetupResource, SetupRecord[]>>({
    'asset-categories': [],
    offices: [],
    locations: [],
    manufacturers: [],
  })
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<SetupRecord | null>(null)
  const [form, setForm] = useState<SetupPayload>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const activeSection = sections.find((section) => section.resource === activeResource) ?? sections[0]
  const activeRecords = records[activeResource]
  const officeOptions = records.offices.map((office) => ({ label: office.name, value: String(office.id) }))

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

  useEffect(() => {
    void loadSetupData()
  }, [])

  const columns: Column<SetupRecord>[] = useMemo(
    () => [
      { key: 'name', header: 'Name', render: (row) => row.name },
      { key: 'code', header: 'Code', render: (row) => row.code || '—' },
      {
        key: 'office',
        header: 'Office',
        render: (row) => records.offices.find((office) => office.id === row.office_id)?.name ?? '—',
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => <Badge tone={row.is_active === false ? 'yellow' : 'green'}>{row.is_active === false ? 'Inactive' : 'Active'}</Badge>,
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (row) => (
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>
              Edit
            </Button>
            <Button size="sm" variant="danger" onClick={() => void handleDelete(row)}>
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [records.offices, activeResource],
  )

  if (!isAdmin(user)) {
    return <Navigate to="/dashboard" replace />
  }

  function openCreate() {
    setEditingRecord(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(record: SetupRecord) {
    setEditingRecord(record)
    setForm({
      name: record.name,
      code: record.code ?? '',
      description: record.description ?? '',
      office_id: record.office_id ?? null,
      is_active: record.is_active !== false,
    })
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
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to save setup record.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(record: SetupRecord) {
    if (!confirm(`Delete "${record.name}" from ${activeSection.title}?`)) return

    try {
      await setupService.remove(activeResource, record.id)
      setMessage({ type: 'success', text: `${activeSection.title} record deleted.` })
      await loadSetupData()
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to delete setup record.' })
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">System Setup</h1>
        <p className="text-sm text-gray-500">Admin tools for maintaining setup data without touching code.</p>
      </div>

      {message && (
        <Alert tone={message.type} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <div className="grid gap-3 md:grid-cols-4">
        <Card className="md:col-span-3">
          <div className="mb-4 grid gap-2 md:grid-cols-4">
            {sections.map((section) => (
              <Button
                key={section.resource}
                variant={section.resource === activeResource ? 'primary' : 'secondary'}
                onClick={() => setActiveResource(section.resource)}
              >
                {section.title}
              </Button>
            ))}
          </div>

          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-md font-semibold text-gray-900">{activeSection.title}</h2>
              <p className="text-sm text-gray-500">{activeSection.description}</p>
            </div>
            <Button onClick={openCreate}>Add {activeSection.title.slice(0, -1)}</Button>
          </div>

          {loading ? (
            <Spinner />
          ) : (
            <Table
              columns={columns.filter((column) => activeSection.needsOffice || column.key !== 'office')}
              rows={activeRecords}
              rowKey={(row) => row.id}
              empty={<EmptyState title={`No ${activeSection.title.toLowerCase()} yet`} description="Add the first record to make this option available in forms." />}
            />
          )}
        </Card>

        <Card title="Admin Shortcuts" subtitle="Common setup tasks">
          <div className="space-y-2">
            <Button className="w-full" variant="secondary" onClick={() => navigate('/users')}>
              Manage Users
            </Button>
            <Button className="w-full" variant="secondary" onClick={() => navigate('/roles')}>
              Manage Roles
            </Button>
            <Button className="w-full" variant="secondary" onClick={() => navigate('/permissions')}>
              Manage Permissions
            </Button>
            <Button className="w-full" variant="secondary" onClick={() => navigate('/assets')}>
              Print Asset QR Labels
            </Button>
          </div>
          <div className="mt-4 rounded-md bg-blue-50 p-3 text-xs text-blue-900">
            Suggested next setting: make QR prefixes, receipt prefixes, default employee password, and reorder defaults database-backed.
          </div>
        </Card>
      </div>

      <Modal
        open={modalOpen}
        title={editingRecord ? `Edit ${activeSection.title}` : `Add ${activeSection.title}`}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving || !form.name.trim()}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          {activeSection.resource !== 'manufacturers' && (
            <Input
              label={activeSection.codeLabel ?? 'Code'}
              value={form.code ?? ''}
              onChange={(event) => setForm({ ...form, code: event.target.value })}
            />
          )}
          {activeSection.needsOffice && (
            <Dropdown
              label="Office"
              placeholder="No office selected"
              options={officeOptions}
              value={form.office_id ? String(form.office_id) : ''}
              onChange={(event) => setForm({ ...form, office_id: event.target.value ? Number(event.target.value) : null })}
            />
          )}
          <Input
            label="Description"
            value={form.description ?? ''}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.is_active !== false}
              onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
            />
            Active
          </label>
        </div>
      </Modal>
    </div>
  )
}
