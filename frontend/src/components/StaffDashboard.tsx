import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CalendarClock, ClipboardCheck, HandCoins } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Spinner, Table, Alert, Input, type Column } from '@/components/ui'
import { DashboardStatCard } from '@/components/DashboardStatCard'
import { AssetQrScanner } from '@/components/AssetQrScanner'
import { reservationService } from '@/services/reservationService'
import { borrowingService } from '@/services/borrowingService'
import type { Reservation, Borrowing } from '@/types'
import { borrowingStatusTone } from '@/utils/statusTone'
import { borrowingStatusLabel } from '@/utils/displayLabels'

export function StaffDashboard() {
  const navigate = useNavigate()
  const [pendingReservations, setPendingReservations] = useState<Reservation[]>([])
  const [activeBorrowings, setActiveBorrowings] = useState<Borrowing[]>([])
  const [overdueBorrowings, setOverdueBorrowings] = useState<Borrowing[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [qrCode, setQrCode] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)

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
      setMessage({ type: 'success', text: 'Borrow request approved successfully.' })
      await loadData()
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to approve borrow request.' })
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
      setMessage({ type: 'success', text: `Borrow receipt ${receiptCode} scanned. Opening borrowed items...` })
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
          Approve Request
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
          Return Item
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
      render: (row) => <Badge tone={borrowingStatusTone(row.status)}>{borrowingStatusLabel(row.status)}</Badge>,
    },
    { key: 'due_at', header: 'Due', render: (row) => row.due_at },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button size="sm" variant="danger" onClick={() => handleReturnBorrowing(row.id)}>
          Return Item
        </Button>
      ),
    },
  ]

  const statCards = [
    { label: 'Borrow Requests', value: pendingReservations.length, description: 'Waiting for approval', icon: CalendarClock, tone: 'blue' as const },
    { label: 'Borrowed Items', value: activeBorrowings.length, description: 'Currently borrowed items', icon: HandCoins, tone: 'green' as const },
    { label: 'Overdue Items', value: overdueBorrowings.length, description: 'Need immediate follow-up', icon: AlertTriangle, tone: 'red' as const },
    { label: 'Ready to Process', value: pendingReservations.length + activeBorrowings.length, description: 'Operations requiring attention', icon: ClipboardCheck, tone: 'amber' as const },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1>Staff Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Manage operational requests and asset handovers.</p>
      </div>

      {message && (
        <Alert tone={message.type} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <DashboardStatCard key={card.label} {...card} />
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
          <Button variant="secondary" onClick={() => setScannerOpen(true)}>Open Camera</Button>
        </div>
      </Card>

      <AssetQrScanner open={scannerOpen} onClose={() => setScannerOpen(false)} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4">
            <h2 className="text-md font-semibold text-gray-900">Borrow Requests Waiting for Approval</h2>
            <p className="text-sm text-gray-500">Approve requests before releasing assets for pickup.</p>
          </div>
          {loading ? (
            <Spinner />
          ) : pendingReservations.length === 0 ? (
            <EmptyState title="No borrow requests waiting" description="All borrow requests have been processed." />
          ) : (
            <Table
              columns={reservationColumns}
              rows={pendingReservations}
              rowKey={(row) => row.id}
              empty={<EmptyState title="No borrow requests waiting" />}
            />
          )}
        </Card>

        <Card>
          <div className="mb-4">
            <h2 className="text-md font-semibold text-gray-900">Currently Borrowed Items</h2>
            <p className="text-sm text-gray-500">Process returns for currently borrowed items</p>
          </div>
          {loading ? (
            <Spinner />
          ) : activeBorrowings.length === 0 ? (
            <EmptyState title="No borrowed items" description="No items are currently borrowed." />
          ) : (
            <Table
              columns={borrowingColumns}
              rows={activeBorrowings}
              rowKey={(row) => row.id}
              empty={<EmptyState title="No borrowed items" />}
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
          <Button onClick={() => navigate('/reservations')}>All Borrow Requests</Button>
          <Button variant="secondary" onClick={() => navigate('/borrowings')}>
            All Borrowed Items
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
