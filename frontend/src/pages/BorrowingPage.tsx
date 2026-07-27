import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Card, EmptyState, Spinner, Table, type Column } from '@/components/ui'
import { ReceiptModal, type ReceiptRecord } from '@/components/ReceiptModal'
import { borrowingService } from '@/services/borrowingService'
import type { Borrowing } from '@/types'
import { borrowingStatusTone } from '@/utils/statusTone'
import { borrowingStatusLabel } from '@/utils/displayLabels'
import { PageHeader } from '@/components/PageHeader'
import { affectsScope, notifyDataChanged, onDataChanged } from '@/utils/dataRefresh'
import { formatDate, formatTime } from '@/utils/dateFormat'

export function BorrowingPage() {
  const [rows,    setRows]    = useState<Borrowing[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [receipt, setReceipt] = useState<ReceiptRecord | null>(null)

  const loadBorrowings = async () => {
    setLoading(true)
    try {
      // Bug fix: request a large page size so all records are visible
      // A proper pagination UI can be added when needed
      const result = await borrowingService.list({ per_page: 100 })
      setRows(result.items)
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unable to load borrowed items.' })
    } finally { setLoading(false) }
  }

  useEffect(() => { void loadBorrowings() }, [])

  // Real-time polling - refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      void loadBorrowings()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [])

  useEffect(() => onDataChanged((scope) => {
    if (affectsScope(scope, 'borrowings')) {
      void loadBorrowings()
    }
  }), [])

  const handleReturn = async (id: number) => {
    if (!confirm('Are you sure you want to return this item?')) return
    try {
      await borrowingService.returnAsset(id)
      setMessage({ type: 'success', text: 'Item returned successfully.' })
      notifyDataChanged('all')
      await loadBorrowings()
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unable to return item.' })
    }
  }

  const columns: Column<Borrowing>[] = [
<<<<<<< HEAD
    { key: 'id', header: 'Borrowing ID', render: (row) => `#${row.id}` },
    { key: 'asset_name', header: 'Asset', render: (row) => row.asset_name },
    { key: 'asset_number', header: 'Asset Identifier', render: (row) => row.asset_number ?? 'N/A' },
    { key: 'employee_name', header: 'Borrower', render: (row) => row.employee_name },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={borrowingStatusTone(row.status)}>{borrowingStatusLabel(row.status)}</Badge>,
    },
    { key: 'borrowed_at', header: 'Borrowed Date', render: (row) => row.borrowed_at ? formatDate(row.borrowed_at) : 'N/A' },
    { key: 'borrowed_time', header: 'Borrowed Time', render: (row) => row.borrowed_at ? formatTime(row.borrowed_at) : 'N/A' },
    { key: 'due_date', header: 'Due Date', render: (row) => row.due_date ? formatDate(row.due_date) : 'N/A' },
    { key: 'returned_at', header: 'Returned Date', render: (row) => row.returned_at ? formatDate(row.returned_at) : 'Not returned' },
    { key: 'returned_time', header: 'Returned Time', render: (row) => row.returned_at ? formatTime(row.returned_at) : 'Not returned' },
    { key: 'authorized_by_name', header: 'Authorized By', render: (row) => row.authorized_by_name ?? 'N/A' },
    { key: 'authorized_at', header: 'Authorized At', render: (row) => row.authorized_at ? formatDate(row.authorized_at) : 'N/A' },
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
=======
    { key: 'asset_name',    header: 'Asset',    render: (r) => <span className="font-medium text-[#1F2937]">{r.asset_name}</span> },
    { key: 'employee_name', header: 'Borrower', render: (r) => r.employee_name },
    { key: 'status',        header: 'Status',   render: (r) => <Badge tone={borrowingStatusTone(r.status)}>{borrowingStatusLabel(r.status)}</Badge> },
    { key: 'borrowed_at',   header: 'Borrowed', render: (r) => <span className="font-mono text-xs text-[#6B7280]">{r.borrowed_at}</span> },
    { key: 'due_at',        header: 'Due',      render: (r) => <span className="font-mono text-xs text-[#6B7280]">{r.due_at}</span> },
    {
      key: 'actions', header: 'Actions',
      render: (r) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <Button size="sm" variant="ghost" onClick={() => setReceipt({
            type: 'Borrowing',
            code: r.receipt_code ?? `PSA-BOR-${r.id}`,
            payload: r.receipt_payload ?? `PSA-BOR-${r.id}|${r.asset_number ?? r.asset_id}|${r.user_id}`,
            employee: r.employee_name,
            employeeId: r.employee_id,
            assetName: r.asset_name,
            assetNumber: r.asset_number,
            assetCode: r.asset_code,
            quantity: r.quantity,
            timestamp: r.created_at,
            borrowedAt: r.borrowed_at,
            returnedAt: r.returned_at,
            startDate: r.borrow_date,
            endDate: r.due_date,
            status: r.status,
            authorizedBy: r.authorized_by_name,
            authorizedAt: r.authorized_at,
            remarks: r.remarks,
          })}>
>>>>>>> 51d547c43ed3764a6641672d91815b8a9eed0607
            Receipt
          </Button>
          {(r.status === 'BORROWED' || r.status === 'ACTIVE' || r.status === 'OVERDUE') ? (
            <Button size="sm" variant="success" onClick={() => handleReturn(r.id)}>Return</Button>
          ) : (
            <span className="text-[12px] text-[#9CA3AF]">—</span>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Borrowed Items" subtitle="View borrowed assets and process returns." />

      {message && <Alert tone={message.type} onClose={() => setMessage(null)}>{message.text}</Alert>}

      <Card noPadding>
        {loading ? (
          <div className="flex items-center justify-center py-16"><Spinner /></div>
        ) : (
          <Table
            columns={columns} rows={rows} rowKey={(r) => r.id}
            empty={<div className="py-16"><EmptyState title="No borrowed items found" description="Borrowed assets will appear here after a request is approved or an item is borrowed." /></div>}
          />
        )}
      </Card>

      <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />
    </div>
  )
}
