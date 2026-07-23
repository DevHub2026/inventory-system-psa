import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CalendarClock, ClipboardCheck, HandCoins } from 'lucide-react'
import {
  Badge, Button, Card, EmptyState, Spinner, Table, Alert, Input, type Column,
} from '@/components/ui'
import { DashboardStatCard } from '@/components/DashboardStatCard'
import { PageHeader } from '@/components/PageHeader'
import { AssetQrScanner } from '@/components/AssetQrScanner'
import { assetService } from '@/services/assetService'
import { reservationService } from '@/services/reservationService'
import { borrowingService } from '@/services/borrowingService'
import type { Reservation, Borrowing } from '@/types'
import { borrowingStatusTone } from '@/utils/statusTone'
import { borrowingStatusLabel } from '@/utils/displayLabels'
import { affectsScope, notifyDataChanged, onDataChanged } from '@/utils/dataRefresh'

const SECTION_TITLE = 'text-[16px] font-semibold text-[#1F2937]'
const SECTION_SUB   = 'mt-0.5 text-[13px] text-[#6B7280]'

export function StaffDashboard() {
  const navigate = useNavigate()
  const [pendingReservations, setPendingReservations] = useState<Reservation[]>([])
  const [activeBorrowings,    setActiveBorrowings]    = useState<Borrowing[]>([])
  const [overdueBorrowings,   setOverdueBorrowings]   = useState<Borrowing[]>([])
  const [loading,             setLoading]             = useState(true)
  const [message,             setMessage]             = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [qrCode,              setQrCode]              = useState('')
  const [scannerOpen,         setScannerOpen]         = useState(false)
  const [scannerMode,         setScannerMode]         = useState<'transaction' | 'authorize'>('transaction')

  const loadData = async () => {
    setLoading(true)
    try {
      const [reservationsRes, borrowingsRes] = await Promise.all([
        reservationService.list(),
        borrowingService.list(),
      ])
      setPendingReservations(reservationsRes.items.filter((r) => r.status === 'PENDING'))
      setActiveBorrowings(borrowingsRes.items.filter((b) => b.status === 'BORROWED' || b.status === 'ACTIVE'))
      setOverdueBorrowings(borrowingsRes.items.filter((b) => b.status === 'OVERDUE'))
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to load dashboard data.' })
    } finally {
      setLoading(false)
    }
  }

  /* Initial load */
  useEffect(() => { void loadData() }, [])

  /* Cross-component data refresh subscription */
  useEffect(() => onDataChanged((scope) => {
    if (affectsScope(scope, 'dashboard') || affectsScope(scope, 'borrowings') || affectsScope(scope, 'reservations')) {
      void loadData()
    }
  }), [])

  const handleApproveReservation = async (id: number) => {
    try {
      await reservationService.approve(id)
      setMessage({ type: 'success', text: 'Borrow request approved successfully.' })
      notifyDataChanged('all')
      await loadData()
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Unable to approve borrow request.' })
    }
  }

  const handleReturnBorrowing = async (id: number) => {
    try {
      await borrowingService.returnAsset(id)
      setMessage({ type: 'success', text: 'Item returned successfully.' })
      notifyDataChanged('all')
      await loadData()
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to return item.' })
    }
  }

  const handleScanQR = async () => {
    const val = qrCode.trim()
    if (!val) { setMessage({ type: 'error', text: 'Please enter a QR code or asset ID.' }); return }
    try {
      const borrowing = await assetService.scanTransaction(val)
      setMessage({
        type: 'success',
        text: borrowing.status === 'RETURNED'
          ? `Returned ${borrowing.asset_name ?? 'asset'} successfully.`
          : `Borrowing authorized for ${borrowing.asset_name ?? 'asset'} and marked as borrowed.`,
      })
      setQrCode('')
      notifyDataChanged('all')
      await loadData()
    } catch (transactionError: unknown) {
      try {
        const asset = await assetService.scan(val)
        setMessage({ type: 'success', text: `${asset.name} found. Status: ${asset.status}.` })
        setQrCode('')
        setTimeout(() => navigate(`/assets?search=${encodeURIComponent(asset.psa_qr_identifier ?? asset.asset_number)}`), 500)
      } catch {
        setMessage({
          type: 'error',
          text: transactionError instanceof Error ? transactionError.message : 'No asset or transaction matched that QR code.',
        })
      }
    }
  }

  /* ── Column definitions ── */
  const reservationColumns: Column<Reservation>[] = [
    { key: 'id',            header: '#',         render: (r) => <span className="font-mono text-xs text-[#9CA3AF]">#{r.id}</span> },
    { key: 'employee_name', header: 'Employee',  render: (r) => <span className="font-medium text-[#1F2937]">{r.employee_name}</span> },
    { key: 'purpose',       header: 'Purpose',   render: (r) => r.purpose },
    { key: 'dates',         header: 'Schedule',  render: (r) => <span className="font-mono text-xs text-[#6B7280]">{r.reserved_from} → {r.reserved_until}</span> },
    {
      key: 'actions', header: 'Actions',
      render: (r) => (
        <Button size="sm" variant="success" onClick={() => handleApproveReservation(r.id)}>Approve</Button>
      ),
    },
  ]

  const borrowingColumns: Column<Borrowing>[] = [
    { key: 'id',            header: '#',        render: (r) => <span className="font-mono text-xs text-[#9CA3AF]">#{r.id}</span> },
    { key: 'asset_name',    header: 'Asset',    render: (r) => <span className="font-medium text-[#1F2937]">{r.asset_name}</span> },
    { key: 'employee_name', header: 'Employee', render: (r) => r.employee_name },
    { key: 'due_at',        header: 'Due',      render: (r) => <span className="font-mono text-xs text-[#6B7280]">{r.due_at}</span> },
    {
      key: 'actions', header: 'Actions',
      render: (r) => (
        <Button size="sm" variant="primary" onClick={() => handleReturnBorrowing(r.id)}>Return</Button>
      ),
    },
  ]

  const overdueColumns: Column<Borrowing>[] = [
    { key: 'id',            header: '#',        render: (r) => <span className="font-mono text-xs text-[#9CA3AF]">#{r.id}</span> },
    { key: 'asset_name',    header: 'Asset',    render: (r) => <span className="font-medium text-[#1F2937]">{r.asset_name}</span> },
    { key: 'employee_name', header: 'Employee', render: (r) => r.employee_name },
    {
      key: 'status', header: 'Status',
      render: (r) => <Badge tone={borrowingStatusTone(r.status)}>{borrowingStatusLabel(r.status)}</Badge>,
    },
    { key: 'due_at', header: 'Due', render: (r) => <span className="font-mono text-xs text-[#6B7280]">{r.due_at}</span> },
    {
      key: 'actions', header: 'Actions',
      render: (r) => (
        <Button size="sm" variant="danger" onClick={() => handleReturnBorrowing(r.id)}>Return</Button>
      ),
    },
  ]

  const statCards = [
    { label: 'Borrow Requests',  value: pendingReservations.length,                           description: 'Waiting for approval',          icon: CalendarClock, tone: 'blue'  as const },
    { label: 'Borrowed Items',   value: activeBorrowings.length,                              description: 'Currently borrowed items',       icon: HandCoins,     tone: 'green' as const },
    { label: 'Overdue Items',    value: overdueBorrowings.length,                             description: 'Need immediate follow-up',       icon: AlertTriangle, tone: 'red'   as const },
    { label: 'Ready to Process', value: pendingReservations.length + activeBorrowings.length, description: 'Operations requiring attention', icon: ClipboardCheck,tone: 'amber' as const },
  ]

  return (
    <div className="space-y-6">

      <PageHeader title="Staff Dashboard" subtitle="Manage operational requests and asset handovers." />

      {message && (
        <Alert tone={message.type} onClose={() => setMessage(null)}>{message.text}</Alert>
      )}

      {/* Stats grid — 1 → 2 → 4 cols */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <DashboardStatCard key={card.label} {...card} />
        ))}
      </div>

      {/* QR Scanner */}
      <Card>
        <div className="mb-4">
          <p className={SECTION_TITLE}>Quick QR Scanner</p>
          <p className={SECTION_SUB}>Scan asset QR code to quickly access item details for processing</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Enter QR code or asset ID…"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleScanQR() }}
            />
          </div>
          <Button onClick={() => void handleScanQR()}>Scan</Button>
          <Button variant="secondary" onClick={() => { setScannerMode('authorize'); setScannerOpen(true) }}>
            Scan Receipt to Borrow
          </Button>
          <Button variant="secondary" onClick={() => { setScannerMode('transaction'); setScannerOpen(true) }}>
            Scan QR to Borrow/Return
          </Button>
        </div>
      </Card>

      <AssetQrScanner open={scannerOpen} mode={scannerMode} onClose={() => setScannerOpen(false)} onCompleted={loadData} />

      {/* Pending + Active */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="mb-4">
            <p className={SECTION_TITLE}>Borrow Requests Waiting for Approval</p>
            <p className={SECTION_SUB}>Approve requests before releasing assets for pickup.</p>
          </div>
          {loading ? <Spinner /> : pendingReservations.length === 0
            ? <EmptyState title="No pending requests" description="All borrow requests have been processed." />
            : <Table columns={reservationColumns} rows={pendingReservations} rowKey={(r) => r.id} empty={<EmptyState title="No pending requests" />} />
          }
        </Card>

        <Card>
          <div className="mb-4">
            <p className={SECTION_TITLE}>Currently Borrowed Items</p>
            <p className={SECTION_SUB}>Process returns for currently borrowed items</p>
          </div>
          {loading ? <Spinner /> : activeBorrowings.length === 0
            ? <EmptyState title="No borrowed items" description="No items are currently borrowed." />
            : <Table columns={borrowingColumns} rows={activeBorrowings} rowKey={(r) => r.id} empty={<EmptyState title="No borrowed items" />} />
          }
        </Card>
      </div>

      {/* Overdue — conditional */}
      {overdueBorrowings.length > 0 && (
        <Card>
          <div className="mb-4">
            <p className={SECTION_TITLE}>Overdue Items — Priority</p>
            <p className={SECTION_SUB}>Items past due date requiring immediate attention</p>
          </div>
          <Table columns={overdueColumns} rows={overdueBorrowings} rowKey={(r) => r.id} empty={<EmptyState title="No overdue items" />} />
        </Card>
      )}

      {/* Quick access */}
      <Card>
        <div className="mb-4">
          <p className={SECTION_TITLE}>Operations Quick Access</p>
          <p className={SECTION_SUB}>Access operational modules for daily tasks</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Button onClick={() => navigate('/reservations')}>All Borrow Requests</Button>
          <Button variant="secondary" onClick={() => navigate('/borrowings')}>All Borrowed Items</Button>
          <Button variant="secondary" onClick={() => navigate('/inventory')}>Inventory Management</Button>
          <Button variant="secondary" onClick={() => navigate('/assets')}>Asset Catalog</Button>
          <Button variant="secondary" onClick={() => navigate('/maintenance')}>Maintenance Requests</Button>
          <Button variant="secondary" onClick={() => navigate('/reports')}>Operation Reports</Button>
        </div>
      </Card>
    </div>
  )
}
