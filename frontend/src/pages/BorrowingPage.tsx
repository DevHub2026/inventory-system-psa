import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Card, EmptyState, Spinner, Table, type Column } from '@/components/ui'
import { borrowingService } from '@/services/borrowingService'
import type { Borrowing } from '@/types'
import { borrowingStatusTone } from '@/utils/statusTone'

export function BorrowingPage() {
  const [rows, setRows] = useState<Borrowing[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    void borrowingService
      .list()
      .then((result) => setRows(result.items))
      .finally(() => setLoading(false))
  }, [])

  const columns: Column<Borrowing>[] = [
    { key: 'asset_name', header: 'Asset', render: (row) => row.asset_name },
    { key: 'employee_name', header: 'Borrower', render: (row) => row.employee_name },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={borrowingStatusTone(row.status)}>{row.status}</Badge>,
    },
    { key: 'borrowed_at', header: 'Borrowed', render: (row) => row.borrowed_at },
    { key: 'due_at', header: 'Due', render: (row) => row.due_at },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          <Button size="sm" variant="primary" onClick={() => setMessage('Borrow (placeholder)')}>
            Borrow
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setMessage(`Return #${row.id} (placeholder)`)}>
            Return
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setMessage('History (placeholder)')}>
            History
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Borrowings</h1>
        <p className="text-sm text-gray-500">Mock data until Borrowing API is ready.</p>
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
            empty={<EmptyState title="No borrowings" />}
          />
        )}
      </Card>
    </div>
  )
}
