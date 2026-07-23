import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Card, EmptyState, Spinner, Table, type Column } from '@/components/ui'
import { ReceiptModal, type ReceiptRecord } from '@/components/ReceiptModal'
import { borrowingService } from '@/services/borrowingService'
import type { Borrowing } from '@/types'
import { borrowingStatusTone } from '@/utils/statusTone'
import { borrowingStatusLabel } from '@/utils/displayLabels'
import { affectsScope, notifyDataChanged, onDataChanged } from '@/utils/dataRefresh'

export function BorrowingPage() {
  const [rows, setRows] = useState<Borrowing[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [receipt, setReceipt] = useState<ReceiptRecord | null>(null)

  const loadBorrowings = async () => {
    setLoading(true)
    try {
      const result = await borrowingService.list()
      setRows(result.items)
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to load borrowed items.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadBorrowings()
  }, [])

  useEffect(() => onDataChanged((scope) => {
    if (affectsScope(scope, 'borrowings')) {
      void loadBorrowings()
    }
  }), [])

  const handleReturn = async (borrowingId: number) => {
    if (!confirm('Are you sure you want to return this item?')) return

    try {
      await borrowingService.returnAsset(borrowingId)
      setMessage({ type: 'success', text: 'Item returned successfully.' })
      notifyDataChanged('all')
      await loadBorrowings()
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to return item.' })
    }
  }

  const columns: Column<Borrowing>[] = [
    { key: 'asset_name', header: 'Asset', render: (row) => row.asset_name },
    { key: 'employee_name', header: 'Borrower', render: (row) => row.employee_name },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={borrowingStatusTone(row.status)}>{borrowingStatusLabel(row.status)}</Badge>,
    },
    { key: 'borrowed_at', header: 'Borrowed', render: (row) => row.borrowed_at },
    { key: 'due_at', header: 'Due', render: (row) => row.due_at },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              setReceipt({
                type: 'Borrowing',
                code: row.receipt_code ?? `PSA-BOR-${row.id}`,
                payload: row.receipt_payload ?? `PSA-BOR-${row.id}|${row.asset_number ?? row.asset_id}|${row.user_id}`,
                employee: row.employee_name,
                employeeId: row.employee_id,
                assetName: row.asset_name,
                assetNumber: row.asset_number,
                assetCode: row.asset_code,
                quantity: row.quantity,
                timestamp: row.created_at,
                borrowedAt: row.borrowed_at,
                returnedAt: row.returned_at,
                startDate: row.borrow_date,
                endDate: row.due_date,
                status: row.status,
                authorizedBy: row.authorized_by_name,
                authorizedAt: row.authorized_at,
                remarks: row.remarks,
              })
            }
          >
            Receipt
          </Button>
          {row.status === 'BORROWED' || row.status === 'ACTIVE' || row.status === 'OVERDUE' ? (
            <Button size="sm" variant="secondary" onClick={() => handleReturn(row.id)}>
              Return Item
            </Button>
          ) : (
            <span className="text-sm text-gray-400">No actions</span>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Borrowed Items</h1>
        <p className="text-sm text-gray-500">View borrowed assets and process returns.</p>
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
            empty={<EmptyState title="No borrowed items found" description="Borrowed assets will appear here after a request is approved or an item is borrowed." />}
          />
        )}
      </Card>
      <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />
    </div>
  )
}
