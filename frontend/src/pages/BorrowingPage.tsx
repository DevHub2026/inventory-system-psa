import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Card, EmptyState, Spinner, Table, type Column } from '@/components/ui'
import { ReceiptModal, type ReceiptRecord } from '@/components/ReceiptModal'
import { borrowingService } from '@/services/borrowingService'
import type { Borrowing } from '@/types'
import { borrowingStatusTone } from '@/utils/statusTone'
import { borrowingStatusLabel } from '@/utils/displayLabels'
import { PageHeader } from '@/components/PageHeader'

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

  const handleReturn = async (borrowingId: number) => {
    if (!confirm('Are you sure you want to return this item?')) return

    try {
      await borrowingService.returnAsset(borrowingId)
      setMessage({ type: 'success', text: 'Item returned successfully.' })
      await loadBorrowings()
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to return item.' })
    }
  }

  const columns: Column<Borrowing>[] = [
    { key: 'asset_name', header: 'Asset', render: (row) => <span className="font-medium text-slate-800">{row.asset_name}</span> },
    { key: 'employee_name', header: 'Borrower', render: (row) => row.employee_name },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={borrowingStatusTone(row.status)}>{borrowingStatusLabel(row.status)}</Badge>,
    },
    { key: 'borrowed_at', header: 'Borrowed', render: (row) => <span className="font-mono text-xs text-slate-600">{row.borrowed_at}</span> },
    { key: 'due_at', header: 'Due', render: (row) => <span className="font-mono text-xs text-slate-600">{row.due_at}</span> },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              setReceipt({
                type: 'Borrowing',
                code: row.receipt_code ?? `PSA-BOR-${row.id}`,
                payload: row.receipt_payload ?? `PSA-BOR-${row.id}|${row.asset_number ?? row.asset_id}|${row.user_id}`,
                employee: row.employee_name,
                assetName: row.asset_name,
                assetNumber: row.asset_number,
                timestamp: row.created_at,
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
            <Button size="sm" variant="success" onClick={() => handleReturn(row.id)}>
              Return
            </Button>
          ) : (
            <span className="text-xs text-slate-400">—</span>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Borrowed Items"
        subtitle="View borrowed assets and process returns."
      />
      {message && (
        <Alert tone={message.type} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}
      <Card noPadding>
        {loading ? (
          <div className="flex items-center justify-center py-14">
            <Spinner />
          </div>
        ) : (
          <Table
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            empty={
              <div className="py-14">
                <EmptyState title="No borrowed items found" description="Borrowed assets will appear here after a request is approved or an item is borrowed." />
              </div>
            }
          />
        )}
      </Card>
      <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />
    </div>
  )
}
