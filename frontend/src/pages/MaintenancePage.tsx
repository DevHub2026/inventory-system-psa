import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Card, EmptyState, Input, Modal, Spinner, Table, type Column } from '@/components/ui'
import { maintenanceService, type CreateMaintenancePayload, type UpdateMaintenancePayload } from '@/services/maintenanceService'
import type { MaintenanceRequest } from '@/types'
import { maintenanceStatusTone } from '@/utils/statusTone'
import { maintenanceStatusLabel } from '@/utils/displayLabels'
import { PageHeader } from '@/components/PageHeader'

const LABEL_CLS = 'mb-1.5 block text-[13px] font-medium text-[#1F2937]'
const SELECT_CLS =
  'w-full h-11 rounded-[10px] border border-[#E5E7EB] bg-white px-3.5 text-[14px] text-[#1F2937] ' +
  'shadow-[0_1px_2px_rgba(0,0,0,.05)] transition-colors duration-200 ' +
  'focus:border-[#0D47A1] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]/15'

type MaintenanceFormStatus = CreateMaintenancePayload['status']

export function MaintenancePage() {
  const [rows,           setRows]           = useState<MaintenanceRequest[]>([])
  const [loading,        setLoading]        = useState(true)
  const [modalOpen,      setModalOpen]      = useState(false)
  const [editingRequest, setEditingRequest] = useState<MaintenanceRequest | null>(null)
  const [saving,         setSaving]         = useState(false)
  const [message,        setMessage]        = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [formData, setFormData] = useState<CreateMaintenancePayload>({
    asset_id: 0, type: 'preventive', status: 'scheduled', scheduled_date: '', description: '',
  })

  const loadMaintenance = async () => {
    setLoading(true)
    try {
      const result = await maintenanceService.list()
      setRows(result.items)
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unable to load maintenance records.' })
    } finally { setLoading(false) }
  }

  useEffect(() => { void loadMaintenance() }, [])

  const handleCreate = () => {
    setEditingRequest(null)
    setFormData({ asset_id: 0, type: 'preventive', status: 'scheduled', scheduled_date: '', description: '' })
    setModalOpen(true)
  }

  const handleEdit = (r: MaintenanceRequest) => {
    setEditingRequest(r)
    setFormData({ asset_id: 0, type: 'preventive', status: 'scheduled', scheduled_date: r.scheduled_at ?? r.scheduled_date ?? '', description: r.description })
    setModalOpen(true)
  }

  const handleDelete = async (r: MaintenanceRequest) => {
    if (!confirm(`Delete maintenance record for ${r.asset_name}?`)) return
    try {
      await maintenanceService.delete(r.id)
      setMessage({ type: 'success', text: 'Maintenance request deleted.' })
      await loadMaintenance()
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to delete.' })
    }
  }

  const handleSubmit = async () => {
    setSaving(true); setMessage(null)
    try {
      if (editingRequest) { await maintenanceService.update(editingRequest.id, formData as UpdateMaintenancePayload); setMessage({ type: 'success', text: 'Maintenance request updated.' }) }
      else                { await maintenanceService.create(formData);                                                 setMessage({ type: 'success', text: 'Maintenance request created.' }) }
      setModalOpen(false); await loadMaintenance()
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unable to save maintenance details.' })
    } finally { setSaving(false) }
  }

  const handleComplete = async (id: number) => {
    if (!confirm('Mark this maintenance as complete?')) return
    try {
      await maintenanceService.complete(id)
      setMessage({ type: 'success', text: 'Maintenance completed.' })
      await loadMaintenance()
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to complete maintenance.' })
    }
  }

  const handleCancel = async (r: MaintenanceRequest) => {
    if (!confirm(`Cancel maintenance for ${r.asset_name}?`)) return
    try {
      await maintenanceService.update(r.id, { status: 'cancelled' } as UpdateMaintenancePayload)
      setMessage({ type: 'success', text: 'Maintenance cancelled.' })
      await loadMaintenance()
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to cancel maintenance.' })
    }
  }

  const columns: Column<MaintenanceRequest>[] = [
    { key: 'asset_name',  header: 'Asset',       render: (r) => <span className="font-medium text-[#1F2937]">{r.asset_name}</span> },
    { key: 'description', header: 'Description', render: (r) => <span className="text-[#6B7280]">{r.description}</span> },
    { key: 'status',      header: 'Status',      render: (r) => <Badge tone={maintenanceStatusTone(r.status)}>{maintenanceStatusLabel(r.status)}</Badge> },
    { key: 'scheduled_at',header: 'Scheduled',   render: (r) => <span className="font-mono text-xs text-[#6B7280]">{r.scheduled_at}</span> },
    {
      key: 'actions', header: 'Actions',
      render: (r) => (
        <div className="flex flex-wrap items-center gap-1.5">
          {r.status === 'scheduled' && (
            <>
              <Button size="sm" variant="success" onClick={() => handleComplete(r.id)}>Complete</Button>
              <Button size="sm" variant="danger"  onClick={() => handleCancel(r)}>Cancel</Button>
            </>
          )}
          <Button size="sm" variant="secondary" onClick={() => handleEdit(r)}>Edit</Button>
          <Button size="sm" variant="danger"    onClick={() => handleDelete(r)}>Delete</Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Maintenance" subtitle="Track asset repairs, inspections, and maintenance history." actions={<Button onClick={handleCreate}>Report a Problem</Button>} />

      {message && <Alert tone={message.type} onClose={() => setMessage(null)}>{message.text}</Alert>}

      <Card noPadding>
        {loading ? (
          <div className="flex items-center justify-center py-16"><Spinner /></div>
        ) : (
          <Table
            columns={columns} rows={rows} rowKey={(r) => r.id}
            empty={<div className="py-16"><EmptyState title="No maintenance records found" description="Report a problem or schedule maintenance when an asset needs attention." /></div>}
          />
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingRequest ? 'Edit Maintenance' : 'Report a Problem'}>
        <div className="space-y-4">
          <Input label="Asset ID / Identifier" helperText="Enter the asset ID used to identify the item needing maintenance." type="number" value={formData.asset_id.toString()} onChange={(e) => setFormData({ ...formData, asset_id: parseInt(e.target.value) || 0 })} />
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className={LABEL_CLS}>Type</label>
              <select className={SELECT_CLS} value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as 'corrective' | 'preventive' })}>
                <option value="preventive">Preventive</option>
                <option value="corrective">Corrective</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Status</label>
              <select className={SELECT_CLS} value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as MaintenanceFormStatus })}>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <Input label="Scheduled Date" type="date" value={formData.scheduled_date} onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })} />
          <Input label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Saving…' : editingRequest ? 'Save Changes' : 'Create Request'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
