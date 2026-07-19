import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, Card, EmptyState, Spinner, Table, Alert, Input, type Column } from '@/components/ui'
import { reservationService } from '@/services/reservationService'
import { borrowingService } from '@/services/borrowingService'
import type { Reservation, Borrowing } from '@/types'
import { borrowingStatusTone } from '@/utils/statusTone'

export function StaffDashboard() {
  const navigate = useNavigate()
  const [pendingReservations, setPendingReservations] = useState<Reservation[]>([])
  const [activeBorrowings, setActiveBorrowings] = useState<Borrowing[]>([])
  const [overdueBorrowings, setOverdueBorrowings] = useState<Borrowing[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [qrCode, setQrCode] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const [reservationsResult, borrowingsResult] = await Promise.all([
        reservationService.list(),
        borrowingService.list(),
      ])
      setPendingReservations(reservationsResult.items.filter((r) => r.status === 'PENDING'))
      setActiveBorrowings(borrowingsResult.items.filter((b) => b.status === 'BORROWED' || b.status === 'ACTIVE'))
      setOverdueBorrowings(borrowingsResult.items.filter((b) => b.status === 'OVERDUE'))
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to load dashboard data.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const handleApproveReservation = async (reservationId: number) => {
    try {
      await reservationService.approve(reservationId)
      setMessage({ type: 'success', text: 'Reservation approved successfully.' })
      await loadData()
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to approve reservation.' })
    }
  }

  const handleReturnBorrowing = async (borrowingId: number) => {
    try {
      await borrowingService.returnAsset(borrowingId)
      setMessage({ type: 'success', text: 'Item returned successfully.' })
      await loadData()
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to return item.' })
    }
  }

  const handleScanQR = async () => {
    const scannedValue = qrCode.trim()

    if (!scannedValue) {
      setMessage({ type: 'error', text: 'Please enter a QR code or asset ID.' })
      return
    }

    const receiptCode = scannedValue.split('|')[0]

    if (receiptCode.startsWith('PSA-RES-')) {
      const reservationId = Number(receiptCode.replace('PSA-RES-', ''))

      if (!Number.isNaN(reservationId)) {
        await handleApproveReservation(reservationId)
        setQrCode('')
        return
      }
    }

    if (receiptCode.startsWith('PSA-BOR-')) {
      setMessage({ type: 'success', text: `Borrowing receipt ${receiptCode} scanned. Opening borrowings...` })
      setQrCode('')
      setTimeout(() => navigate('/borrowings'), 500)
      return
    }

    setMessage({ type: 'success', text: `Scanned asset: ${scannedValue} - Opening asset details...` })
    setQrCode('')
    setTimeout(() => navigate(`/assets?search=${encodeURIComponent(scannedValue)}`), 500)
  }

  const reservationColumns: Column<Reservation>[] = [
    { key: 'id', header: 'ID', render: (row) => row.id },
    { key: 'employee_name', header: 'Employee', render: (row) => row.employee_name },
    { key: 'purpose', header: 'Purpose', render: (row) => row.purpose },
    { key: 'dates', header: 'Schedule', render: (row) => `${row.reserved_from} → ${row.reserved_until}` },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button size="sm" variant="success" onClick={() => handleApproveReservation(row.id)}>
          Approve
        </Button>
      ),
    },
  ]

  const borrowingColumns: Column<Borrowing>[] = [
    { key: 'id', header: 'ID', render: (row) => row.id },
    { key: 'asset_name', header: 'Asset', render: (row) => row.asset_name },
    { key: 'employee_name', header: 'Employee', render: (row) => row.employee_name },
    { key: 'due_at', header: 'Due', render: (row) => row.due_at },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button size="sm" variant="primary" onClick={() => handleReturnBorrowing(row.id)}>
          Return
        </Button>
      ),
    },
  ]

  const overdueColumns: Column<Borrowing>[] = [
    { key: 'id', header: 'ID', render: (row) => row.id },
    { key: 'asset_name', header: 'Asset', render: (row) => row.asset_name },
    { key: 'employee_name', header: 'Employee', render: (row) => row.employee_name },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={borrowingStatusTone(row.status)}>{row.status}</Badge>,
    },
    { key: 'due_at', header: 'Due', render: (row) => row.due_at },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button size="sm" variant="danger" onClick={() => handleReturnBorrowing(row.id)}>
          Return Now
        </Button>
      ),
    },
  ]

  const statCards = [
    { label: 'Pending Approvals', value: pendingReservations.length, accent: 'yellow', subtitle: 'Awaiting action' },
    { label: 'Active Borrowings', value: activeBorrowings.length, accent: 'blue', subtitle: 'Currently borrowed' },
    { label: 'Overdue Items', value: overdueBorrowings.length, accent: 'red', subtitle: 'Past due date' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Staff Dashboard</h1>
        <p className="text-sm text-gray-500">Operations management - reservations, borrowings, and inventory</p>
      </div>

      {message && (
        <Alert tone={message.type} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((card) => (
          <Card key={card.label} className="p-4">
            <div className="text-sm text-gray-500">{card.label}</div>
            <div className="text-2xl font-semibold text-gray-900">{card.value}</div>
            <div className="text-xs text-gray-400">{card.subtitle}</div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="mb-4">
          <h2 className="text-md font-semibold text-gray-900">Quick QR Scanner</h2>
          <p className="text-sm text-gray-500">Scan asset QR code to quickly access item details for processing</p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Enter QR code or asset ID..."
            value={qrCode}
            onChange={(e) => setQrCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleScanQR()
            }}
          />
          <Button onClick={() => void handleScanQR()}>Scan</Button>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4">
            <h2 className="text-md font-semibold text-gray-900">Pending Reservations</h2>
            <p className="text-sm text-gray-500">Approve reservation requests for asset collection</p>
          </div>
          {loading ? (
            <Spinner />
          ) : pendingReservations.length === 0 ? (
            <EmptyState title="No pending reservations" description="All reservations have been processed." />
          ) : (
            <Table
              columns={reservationColumns}
              rows={pendingReservations}
              rowKey={(row) => row.id}
              empty={<EmptyState title="No pending reservations" />}
            />
          )}
        </Card>

        <Card>
          <div className="mb-4">
            <h2 className="text-md font-semibold text-gray-900">Active Borrowings</h2>
            <p className="text-sm text-gray-500">Process returns for currently borrowed items</p>
          </div>
          {loading ? (
            <Spinner />
          ) : activeBorrowings.length === 0 ? (
            <EmptyState title="No active borrowings" description="No items are currently borrowed." />
          ) : (
            <Table
              columns={borrowingColumns}
              rows={activeBorrowings}
              rowKey={(row) => row.id}
              empty={<EmptyState title="No active borrowings" />}
            />
          )}
        </Card>
      </div>

      {overdueBorrowings.length > 0 && (
        <Card>
          <div className="mb-4">
            <h2 className="text-md font-semibold text-gray-900">Overdue Items - Priority</h2>
            <p className="text-sm text-gray-500">Items past due date requiring immediate attention</p>
          </div>
          <Table
            columns={overdueColumns}
            rows={overdueBorrowings}
            rowKey={(row) => row.id}
            empty={<EmptyState title="No overdue items" />}
          />
        </Card>
      )}

      <Card>
        <div className="mb-4">
          <h2 className="text-md font-semibold text-gray-900">Operations Quick Access</h2>
          <p className="text-sm text-gray-500">Access operational modules for daily tasks</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <Button onClick={() => navigate('/reservations')}>All Reservations</Button>
          <Button variant="secondary" onClick={() => navigate('/borrowings')}>
            All Borrowings
          </Button>
          <Button variant="secondary" onClick={() => navigate('/inventory')}>
            Inventory Management
          </Button>
          <Button variant="secondary" onClick={() => navigate('/assets')}>
            Asset Catalog
          </Button>
          <Button variant="secondary" onClick={() => navigate('/maintenance')}>
            Maintenance Requests
          </Button>
          <Button variant="secondary" onClick={() => navigate('/reports')}>
            Operation Reports
          </Button>
        </div>
      </Card>
    </div>
  )
}
