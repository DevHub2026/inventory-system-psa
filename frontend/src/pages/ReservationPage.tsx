import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Card, EmptyState, Spinner, Table, type Column } from '@/components/ui'
import { reservationService } from '@/services/reservationService'
import type { Reservation } from '@/types'
import { reservationStatusTone } from '@/utils/statusTone'

export function ReservationPage() {
  const [rows, setRows] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    void reservationService
      .list()
      .then((result) => setRows(result.items))
      .finally(() => setLoading(false))
  }, [])

  const columns: Column<Reservation>[] = [
    { key: 'id', header: 'ID', render: (row) => row.id },
    { key: 'employee_name', header: 'Employee', render: (row) => row.employee_name },
    { key: 'purpose', header: 'Purpose', render: (row) => row.purpose },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={reservationStatusTone(row.status)}>{row.status}</Badge>,
    },
    {
      key: 'dates',
      header: 'Schedule',
      render: (row) => `${row.reserved_from} → ${row.reserved_until}`,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          <Button size="sm" variant="secondary" onClick={() => setMessage(`View reservation #${row.id}`)}>
            View
          </Button>
          <Button size="sm" variant="success" onClick={() => setMessage(`Approve #${row.id} (placeholder)`)}>
            Approve
          </Button>
          <Button size="sm" variant="danger" onClick={() => setMessage(`Reject #${row.id} (placeholder)`)}>
            Reject
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setMessage(`Cancel #${row.id} (placeholder)`)}>
            Cancel
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Reservations</h1>
        <p className="text-sm text-gray-500">Mock data until Reservation API is ready.</p>
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
            empty={<EmptyState title="No reservations" />}
          />
        )}
      </Card>
    </div>
  )
}
