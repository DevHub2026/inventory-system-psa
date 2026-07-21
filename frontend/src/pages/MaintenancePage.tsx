import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Card, EmptyState, Input, Modal, Spinner, Table, type Column } from '@/components/ui'
import { maintenanceService, type CreateMaintenancePayload, type UpdateMaintenancePayload } from '@/services/maintenanceService'
import type { MaintenanceRequest } from '@/types'
import { maintenanceStatusTone } from '@/utils/statusTone'
import { maintenanceStatusLabel } from '@/utils/displayLabels'

type MaintenanceFormStatus = CreateMaintenancePayload['status']

export function MaintenancePage() {
  const [rows, setRows] = useState<MaintenanceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRequest, setEditingRequest] = useState<MaintenanceRequest | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [formData, setFormData] = useState<CreateMaintenancePayload>({
    asset_id: 0,
    type: 'preventive',
    status: 'scheduled',
    scheduled_date: '',
    description: '',
  })

  const loadMaintenance = async () => {
    setLoading(true)
    try {
      const result = await maintenanceService.list()
      setRows(result.items)
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to load maintenance records.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadMaintenance()
  }, [])

  const handleCreate = () => {
    setEditingRequest(null)
    setFormData({
      asset_id: 0,
      type: 'preventive',
      status: 'scheduled',
      scheduled_date: '',
      description: '',
    })
    setModalOpen(true)
  }

  const handleEdit = (request: MaintenanceRequest) => {
    setEditingRequest(request)
    setFormData({
      asset_id: 0,
      type: 'preventive',
      status: 'scheduled',
      scheduled_date: request.scheduled_at ?? request.scheduled_date ?? '',
      description: request.description,
    })
    setModalOpen(true)
  }

  const handleDelete = async (request: MaintenanceRequest) => {
    if (!confirm(`Are you sure you want to delete the maintenance record for ${request.asset_name}?`)) return

    try {
      await maintenanceService.delete(request.id)
      setMessage({ type: 'success', text: 'Maintenance request deleted successfully.' })
      await loadMaintenance()
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to delete maintenance request.' })
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    setMessage(null)

    try {
      if (editingRequest) {
        await maintenanceService.update(editingRequest.id, formData as UpdateMaintenancePayload)
        setMessage({ type: 'success', text: 'Maintenance request updated successfully.' })
      } else {
        await maintenanceService.create(formData)
        setMessage({ type: 'success', text: 'Maintenance request created successfully.' })
      }
      setModalOpen(false)
      await loadMaintenance()
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to save maintenance details.' })
    } finally {
      setSaving(false)
    }
  }

  const handleComplete = async (requestId: number) => {
    if (!confirm('Are you sure you want to mark this maintenance as complete?')) return

    try {
      await maintenanceService.complete(requestId)
      setMessage({ type: 'success', text: 'Maintenance completed successfully.' })
      await loadMaintenance()
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to complete maintenance.' })
    }
  }

  const handleCancel = async (request: MaintenanceRequest) => {
    if (!confirm(`Are you sure you want to cancel maintenance for ${request.asset_name}?`)) return

    try {
      await maintenanceService.update(request.id, { status: 'cancelled' } as UpdateMaintenancePayload)
      setMessage({ type: 'success', text: 'Maintenance cancelled successfully.' })
      await loadMaintenance()
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to cancel maintenance.' })
    }
  }

  const columns: Column<MaintenanceRequest>[] = [
    { key: 'asset_name', header: 'Asset', render: (row) => row.asset_name },
    { key: 'description', header: 'Description', render: (row) => row.description },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={maintenanceStatusTone(row.status)}>{maintenanceStatusLabel(row.status)}</Badge>,
    },
    { key: 'scheduled_at', header: 'Scheduled', render: (row) => row.scheduled_at },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          {row.status === 'scheduled' && (
            <>
              <Button size="sm" variant="success" onClick={() => handleComplete(row.id)}>
                Complete
              </Button>
              <Button size="sm" variant="danger" onClick={() => handleCancel(row)}>
                Cancel
              </Button>
            </>
          )}
          <Button size="sm" variant="secondary" onClick={() => handleEdit(row)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(row)}>
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Maintenance</h1>
          <p className="text-sm text-gray-500">Track asset repairs, inspections, and maintenance history.</p>
        </div>
        <Button onClick={handleCreate}>Report a Problem</Button>
      </div>

      {message && (
        <Alert tone={message.type} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Card>
        {loading ? (
          <Spinner />
        ) : (
          <Table
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            empty={<EmptyState title="No maintenance records found" description="Report a problem or schedule maintenance when an asset needs attention." />}
          />
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRequest ? 'Edit Maintenance' : 'Report a Problem'}
      >
        <div className="space-y-4">
          <Input
            label="Asset ID / Identifier"
            helperText="Enter the asset ID used to identify the item needing maintenance."
            type="number"
            value={formData.asset_id.toString()}
            onChange={(e) => setFormData({ ...formData, asset_id: parseInt(e.target.value) || 0 })}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'corrective' | 'preventive' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="preventive">Preventive</option>
                <option value="corrective">Corrective</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as MaintenanceFormStatus })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <Input
            label="Scheduled Date"
            type="date"
            value={formData.scheduled_date}
            onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
          />
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving...' : editingRequest ? 'Save Changes' : 'Save Maintenance Record'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
