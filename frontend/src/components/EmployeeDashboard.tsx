import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CalendarDays, ClipboardList, HandCoins } from 'lucide-react'
import {
  Badge, Button, Card, EmptyState, Spinner, Table, Alert, type Column,
} from '@/components/ui'
import { DashboardStatCard } from '@/components/DashboardStatCard'
import { PageHeader } from '@/components/PageHeader'
import { reservationService } from '@/services/reservationService'
import { borrowingService } from '@/services/borrowingService'
import type { Reservation, Borrowing } from '@/types'
import { reservationStatusTone, borrowingStatusTone } from '@/utils/statusTone'
import { borrowingStatusLabel, reservationStatusLabel } from '@/utils/displayLabels'
import { affectsScope, notifyDataChanged, onDataChanged } from '@/utils/dataRefresh'

const SECTION_TITLE = 'text-[16px] font-semibold text-[#1F2937]'
const SECTION_SUB   = 'mt-0.5 text-[13px] text-[#6B7280]'

export function EmployeeDashboard() {
  const navigate = useNavigate()
  const [myReservations,  setMyReservations]  = useState<Reservation[]>([])
  const [myBorrowings,    setMyBorrowings]    = useState<Borrowing[]>([])
  const [activeBorrowings,setActiveBorrowings]= useState<Borrowing[]>([])
  const [loading,         setLoading]         = useState(true)
  const [message,         setMessage]         = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [reservationsRes, borrowingsRes] = await Promise.all([
        reservationService.list(),
        borrowingService.list(),
      ])
      setMyReservations(reservationsRes.items)
      setMyBorrowings(borrowingsRes.items)
      setActiveBorrowings(
        borrowingsRes.items.filter((b) => b.status === 'BORROWED' || b.status === 'ACTIVE' || b.status === 'OVERDUE'),
      )
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to load your data.' })
    } finally {
      setLoading(false)
    }
  }

  /* Initial load */
  useEffect(() => { void loadData() }, [])

  /* Cross-component data refresh subscription */
  useEffect(() => onDataChanged((scope) => {
    if (affectsScope(scope, 'borrowings') || affectsScope(scope, 'reservations')) {
      void loadData()
    }
  }), [])

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

  /* ── Column definitions ── */
  const reservationColumns: Column<Reservation>[] = [
    { key: 'id',      header: '#',       render: (r) => <span className="font-mono text-xs text-[#9CA3AF]">#{r.id}</span> },
    { key: 'purpose', header: 'Purpose', render: (r) => r.purpose },
    {
      key: 'status', header: 'Status',
      render: (r) => <Badge tone={reservationStatusTone(r.status)}>{reservationStatusLabel(r.status)}</Badge>,
    },
    { key: 'dates', header: 'Schedule', render: (r) => <span className="font-mono text-xs text-[#6B7280]">{r.reserved_from} → {r.reserved_until}</span> },
  ]

  const borrowingColumns: Column<Borrowing>[] = [
    { key: 'id',          header: '#',       render: (r) => <span className="font-mono text-xs text-[#9CA3AF]">#{r.id}</span> },
    { key: 'asset_name',  header: 'Asset',   render: (r) => <span className="font-medium text-[#1F2937]">{r.asset_name}</span> },
    {
      key: 'status', header: 'Status',
      render: (r) => <Badge tone={borrowingStatusTone(r.status)}>{borrowingStatusLabel(r.status)}</Badge>,
    },
    { key: 'borrowed_at', header: 'Borrowed', render: (r) => <span className="font-mono text-xs text-[#6B7280]">{r.borrowed_at}</span> },
    { key: 'due_at',      header: 'Due',      render: (r) => <span className="font-mono text-xs text-[#6B7280]">{r.due_at}</span> },
  ]

  const activeColumns: Column<Borrowing>[] = [
    { key: 'id',         header: '#',     render: (r) => <span className="font-mono text-xs text-[#9CA3AF]">#{r.id}</span> },
    { key: 'asset_name', header: 'Asset', render: (r) => <span className="font-medium text-[#1F2937]">{r.asset_name}</span> },
    {
      key: 'status', header: 'Status',
      render: (r) => <Badge tone={borrowingStatusTone(r.status)}>{borrowingStatusLabel(r.status)}</Badge>,
    },
    { key: 'due_at', header: 'Due', render: (r) => <span className="font-mono text-xs text-[#6B7280]">{r.due_at}</span> },
    {
      key: 'actions', header: 'Actions',
      render: (r) => (
        <Button size="sm" variant="primary" onClick={() => handleReturnBorrowing(r.id)}>
          Return Item
        </Button>
      ),
    },
  ]

  const overdueCount = activeBorrowings.filter((b) => b.status === 'OVERDUE').length
  const dueSoonCount = activeBorrowings.filter((b) => b.status !== 'OVERDUE').length

  const statCards = [
    { label: 'My Borrow Requests', value: myReservations.length,   description: 'Requests you submitted',   icon: ClipboardList, tone: 'blue'  as const },
    { label: 'My Borrowed Items',  value: activeBorrowings.length, description: 'Items currently borrowed',  icon: HandCoins,     tone: 'green' as const },
    { label: 'Due Soon',           value: dueSoonCount,            description: 'Active items to monitor',   icon: CalendarDays,  tone: 'amber' as const },
    { label: 'Overdue',            value: overdueCount,            description: 'Items needing return',      icon: AlertTriangle, tone: 'red'   as const },
  ]

  return (
    <div className="space-y-6">

      <PageHeader title="Employee Dashboard" subtitle="Welcome back. Here is your asset activity overview." />

      {message && (
        <Alert tone={message.type} onClose={() => setMessage(null)}>{message.text}</Alert>
      )}

      {/* Stats grid — 1 → 2 → 4 cols */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <DashboardStatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Active borrowed items */}
      {activeBorrowings.length > 0 && (
        <Card>
          <div className="mb-4">
            <p className={SECTION_TITLE}>Items Currently Borrowed</p>
            <p className={SECTION_SUB}>Return items when you're done using them</p>
          </div>
          {loading ? <Spinner /> : (
            <Table columns={activeColumns} rows={activeBorrowings} rowKey={(r) => r.id} empty={<EmptyState title="No borrowed items" />} />
          )}
        </Card>
      )}

      {/* My requests + history */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="mb-4">
            <p className={SECTION_TITLE}>My Borrow Requests</p>
            <p className={SECTION_SUB}>Track requests you sent for asset borrowing.</p>
          </div>
          {loading ? <Spinner /> : myReservations.length === 0
            ? <EmptyState title="No borrow requests yet" description="Send a borrow request when you need an available asset." />
            : <Table columns={reservationColumns} rows={myReservations} rowKey={(r) => r.id} empty={<EmptyState title="No borrow requests yet" />} />
          }
        </Card>

        <Card>
          <div className="mb-4">
            <p className={SECTION_TITLE}>Borrowed Item History</p>
            <p className={SECTION_SUB}>View your past and current borrowed items.</p>
          </div>
          {loading ? <Spinner /> : myBorrowings.length === 0
            ? <EmptyState title="No borrowed items yet" description="Items you borrow will appear here." />
            : <Table columns={borrowingColumns} rows={myBorrowings} rowKey={(r) => r.id} empty={<EmptyState title="No borrowed items yet" />} />
          }
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <div className="mb-4">
          <p className={SECTION_TITLE}>Quick Actions</p>
          <p className={SECTION_SUB}>Common tasks for asset management</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button onClick={() => navigate('/assets')}>Browse Available Assets</Button>
          <Button variant="secondary" onClick={() => navigate('/reservations')}>Send Borrow Request</Button>
          <Button variant="secondary" onClick={() => navigate('/borrowings')}>View My Borrowed Items</Button>
          <Button variant="secondary" onClick={() => navigate('/settings')}>My Profile Settings</Button>
        </div>
      </Card>
    </div>
  )
}
