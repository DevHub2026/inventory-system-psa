import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Card, EmptyState, Spinner, Table, type Column } from '@/components/ui'
import { maintenanceService } from '@/services/maintenanceService'
import type { MaintenanceRequest } from '@/types'
import { maintenanceStatusTone } from '@/utils/statusTone'

export function MaintenancePage() {
  const [rows, setRows] = useState<MaintenanceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    void maintenanceService
      .list()
      .then((result) => setRows(result.items))
      .finally(() => setLoading(false))
  }, [])

  const columns: Column<MaintenanceRequest>[] = [
    { key: 'asset_name', header: 'Asset', render: (row) => row.asset_name },
    { key: 'description', header: 'Description', render: (row) => row.description },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={maintenanceStatusTone(row.status)}>{row.status}</Badge>,
    },
    { key: 'scheduled_at', header: 'Scheduled', render: (row) => row.scheduled_at },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          <Button size="sm" variant="secondary" onClick={() => setMessage(`Schedule #${row.id}`)}>
            Schedule
          </Button>
          <Button size="sm" variant="success" onClick={() => setMessage(`Complete #${row.id}`)}>
            Complete
          </Button>
          <Button size="sm" variant="danger" onClick={() => setMessage(`Cancel #${row.id}`)}>
            Cancel
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Maintenance</h1>
        <p className="text-sm text-gray-500">Mock data until Maintenance API is ready.</p>
      </div>
      {message && (
        <Alert tone="info" onClose={() => setMessage(null)}>
          {message}
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
            empty={<EmptyState title="No maintenance requests" />}
          />
        )}
      </Card>
    </div>
  )
}
