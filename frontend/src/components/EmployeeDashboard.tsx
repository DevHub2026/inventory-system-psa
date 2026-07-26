import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CalendarDays, ClipboardList, HandCoins } from 'lucide-react'
import {
  Badge, Button, EmptyState, Spinner, Table, Alert, type Column,
} from '@/components/ui'
import { DashboardStatCard } from '@/components/DashboardStatCard'
import { PageHeader } from '@/components/PageHeader'
import { reservationService } from '@/services/reservationService'
import { borrowingService } from '@/services/borrowingService'
import type { Reservation, Borrowing } from '@/types'
import { reservationStatusTone, borrowingStatusTone } from '@/utils/statusTone'
import { borrowingStatusLabel, reservationStatusLabel } from '@/utils/displayLabels'
import { affectsScope, notifyDataChanged, onDataChanged } from '@/utils/dataRefresh'

/* ─────────────────────────────────────────────────────────
   Panel — white section card with consistent header.
   All text uses inline styles to beat the global cascade.
   ───────────────────────────────────────────────────────── */
function Panel({
  title, subtitle, onViewAll, loading, children,
}: {
  title: string
  subtitle: string
  onViewAll?: () => void
  loading: boolean
  children: React.ReactNode
}) {
  return (
    <section style={{
      display: 'flex', flexDirection: 'column',
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: 16,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      overflow: 'hidden',
      boxSizing: 'border-box',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16, padding: '14px 20px',
        borderBottom: '1px solid #f1f5f9',
        flexShrink: 0,
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', lineHeight: 1.3 }}>
            {title}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2, lineHeight: 1.4 }}>
            {subtitle}
          </div>
        </div>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            style={{
              flexShrink: 0, whiteSpace: 'nowrap',
              fontSize: 12, fontWeight: 500, color: '#1d4ed8',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}
          >
            View all
          </button>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowX: 'auto' }}>
        {loading
          ? <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '48px 0' }}><Spinner /></div>
          : children
        }
      </div>
    </section>
  )
}

export function EmployeeDashboard() {
  const navigate = useNavigate()
  const [myReservations,   setMyReservations]   = useState<Reservation[]>([])
  const [myBorrowings,     setMyBorrowings]     = useState<Borrowing[]>([])
  const [activeBorrowings, setActiveBorrowings] = useState<Borrowing[]>([])
  const [loading,          setLoading]          = useState(true)
  const [message,          setMessage]          = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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

  useEffect(() => { void loadData() }, [])
  useEffect(() => onDataChanged((scope) => {
    if (affectsScope(scope, 'borrowings') || affectsScope(scope, 'reservations')) void loadData()
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

  /* ── Column definitions — all text via inline style ── */
  const reservationColumns: Column<Reservation>[] = [
    { key: 'id',      header: '#',        render: (r) => <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#94a3b8' }}>#{r.id}</span> },
    { key: 'purpose', header: 'Purpose',  render: (r) => <span style={{ fontSize: 13, color: '#334155', display: 'block', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.purpose}</span> },
    { key: 'status',  header: 'Status',   render: (r) => <Badge tone={reservationStatusTone(r.status)}>{reservationStatusLabel(r.status)}</Badge> },
    { key: 'dates',   header: 'Schedule', render: (r) => <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>{r.reserved_from} → {r.reserved_until}</span> },
  ]

  const borrowingColumns: Column<Borrowing>[] = [
    { key: 'id',          header: '#',        render: (r) => <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#94a3b8' }}>#{r.id}</span> },
    { key: 'asset_name',  header: 'Asset',    render: (r) => <span style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>{r.asset_name}</span> },
    { key: 'status',      header: 'Status',   render: (r) => <Badge tone={borrowingStatusTone(r.status)}>{borrowingStatusLabel(r.status)}</Badge> },
    { key: 'borrowed_at', header: 'Borrowed', render: (r) => <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>{r.borrowed_at}</span> },
    { key: 'due_at',      header: 'Due',      render: (r) => <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>{r.due_at}</span> },
  ]

  const activeColumns: Column<Borrowing>[] = [
    { key: 'id',         header: '#',      render: (r) => <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#94a3b8' }}>#{r.id}</span> },
    { key: 'asset_name', header: 'Asset',  render: (r) => <span style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>{r.asset_name}</span> },
    { key: 'status',     header: 'Status', render: (r) => <Badge tone={borrowingStatusTone(r.status)}>{borrowingStatusLabel(r.status)}</Badge> },
    { key: 'due_at',     header: 'Due',    render: (r) => <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>{r.due_at}</span> },
    {
      key: 'actions', header: '',
      render: (r) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleReturnBorrowing(r.id)}
        >
          Return Item
        </Button>
      ),
    },
  ]

  const overdueCount = activeBorrowings.filter((b) => b.status === 'OVERDUE').length
  const dueSoonCount = activeBorrowings.filter((b) => b.status !== 'OVERDUE').length

  const statCards = [
    { label: 'My Borrow Requests', value: myReservations.length,   description: 'Requests you submitted',  icon: ClipboardList, tone: 'blue'  as const },
    { label: 'My Borrowed Items',  value: activeBorrowings.length, description: 'Items currently borrowed', icon: HandCoins,     tone: 'green' as const },
    { label: 'Due Soon',           value: dueSoonCount,            description: 'Active items to monitor',  icon: CalendarDays,  tone: 'amber' as const },
    { label: 'Overdue',            value: overdueCount,            description: 'Items needing return',     icon: AlertTriangle, tone: 'red'   as const },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <PageHeader title="Employee Dashboard" subtitle="Welcome back. Here is your asset activity overview." />

      {message && <Alert tone={message.type} onClose={() => setMessage(null)}>{message.text}</Alert>}

      {/* Stat cards */}
      <div className="stat-grid">
        {statCards.map((c) => <DashboardStatCard key={c.label} {...c} />)}
      </div>

      {/* Active borrowed items — only shown when there are active items */}
      {activeBorrowings.length > 0 && (
        <Panel
          title="Items Currently Borrowed"
          subtitle="Return items when you're done using them"
          onViewAll={() => navigate('/borrowings')}
          loading={loading}
        >
          <Table
            columns={activeColumns}
            rows={activeBorrowings}
            rowKey={(r) => r.id}
            empty={<EmptyState title="No borrowed items" />}
          />
        </Panel>
      )}

      {/* My requests + history — 2 col on lg */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, minmax(0,1fr))', gap: 20 }} className="lg:!grid-cols-2">
        <Panel
          title="My Borrow Requests"
          subtitle="Track requests you sent for asset borrowing"
          onViewAll={() => navigate('/reservations')}
          loading={loading}
        >
          {myReservations.length === 0
            ? <EmptyState title="No borrow requests yet" description="Send a borrow request when you need an available asset." />
            : <Table columns={reservationColumns} rows={myReservations} rowKey={(r) => r.id} empty={<EmptyState title="No borrow requests yet" />} />
          }
        </Panel>

        <Panel
          title="Borrowed Item History"
          subtitle="View your past and current borrowed items"
          onViewAll={() => navigate('/borrowings')}
          loading={loading}
        >
          {myBorrowings.length === 0
            ? <EmptyState title="No borrowed items yet" description="Items you borrow will appear here." />
            : <Table columns={borrowingColumns} rows={myBorrowings} rowKey={(r) => r.id} empty={<EmptyState title="No borrowed items yet" />} />
          }
        </Panel>
      </div>

      {/* Quick actions */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: '#94a3b8', marginBottom: 14 }}>
          Quick Actions
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, minmax(0,1fr))', gap: 10 }} className="sm:!grid-cols-2">
          <Button variant="secondary" onClick={() => navigate('/assets')}>Browse Available Assets</Button>
          <Button variant="secondary" onClick={() => navigate('/reservations')}>Send Borrow Request</Button>
          <Button variant="secondary" onClick={() => navigate('/borrowings')}>View My Borrowed Items</Button>
          <Button variant="secondary" onClick={() => navigate('/settings')}>My Profile Settings</Button>
        </div>
      </div>

    </div>
  )
}
