/**
 * EmployeeDashboard
 *
 * Redesigned per approved Stage 2 / Stage 3 plan.
 *
 * Layout zones:
 *  1. Header — time-of-day greeting with real user name
 *  2. KPI row (4 compact DashboardStatCard, from stats.my_stats)
 *  3. My Currently Borrowed Items (shown only when > 0, with Return action)
 *  4. My Borrow Requests | My Borrowing History (2-col)
 *  5. Quick Actions
 *
 * RBAC: rendered only for getUserRoleCategory(user) === 'employee'.
 * Only calls getStats() + scoped reservationService / borrowingService.
 * Does NOT call getAnalytics(), getRecentActivity(), getLowStockItems(),
 * or getOverdueAssets() — those are blocked at the backend for employees.
 */
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CalendarDays, ClipboardList, HandCoins } from 'lucide-react'
import { Alert, Badge, Button, EmptyState, Table, type Column } from '@/components/ui'
import { DashboardStatCard } from '@/components/DashboardStatCard'
import { DashboardPanel } from '@/components/dashboard/DashboardPanel'
import { reservationService } from '@/services/reservationService'
import { borrowingService } from '@/services/borrowingService'
import { dashboardService } from '@/services/dashboardService'
import type { Borrowing, DashboardStats, Reservation } from '@/types'
import { reservationStatusTone, borrowingStatusTone } from '@/utils/statusTone'
import { borrowingStatusLabel, reservationStatusLabel } from '@/utils/displayLabels'
import { affectsScope, notifyDataChanged, onDataChanged } from '@/utils/dataRefresh'
import { useAuth } from '@/hooks/useAuth'

/* ── Time-of-day greeting ────────────────────────────────────────────────── */
function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function EmployeeDashboard() {
  const navigate = useNavigate()
  const { user }  = useAuth()

  const [stats,            setStats]            = useState<DashboardStats | null>(null)
  const [myReservations,   setMyReservations]   = useState<Reservation[]>([])
  const [myBorrowings,     setMyBorrowings]     = useState<Borrowing[]>([])
  const [activeBorrowings, setActiveBorrowings] = useState<Borrowing[]>([])
  const [loading,          setLoading]          = useState(true)
  const [message,          setMessage]          = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [reservationsRes, borrowingsRes, activeRes, statsRes] = await Promise.all([
        reservationService.list({ per_page: 10 }),
        borrowingService.list({ per_page: 10 }),
        borrowingService.list({ status: 'BORROWED', per_page: 10 }),
        dashboardService.getStats().catch(() => null),
      ])
      setMyReservations(reservationsRes.items)
      setMyBorrowings(borrowingsRes.items)
      setActiveBorrowings(activeRes.items)
      setStats(statsRes)
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to load your data.',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadData() }, [loadData])

  useEffect(
    () =>
      onDataChanged((scope) => {
        if (affectsScope(scope, 'borrowings') || affectsScope(scope, 'reservations')) {
          void loadData()
        }
      }),
    [loadData],
  )

  const handleReturnBorrowing = async (id: number) => {
    try {
      await borrowingService.returnAsset(id)
      setMessage({ type: 'success', text: 'Item returned successfully.' })
      notifyDataChanged('all')
      await loadData()
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to return item.',
      })
    }
  }

  /* ── Table columns ───────────────────────────────────────────────────── */
  const reservationColumns: Column<Reservation>[] = [
    {
      key: 'id',
      header: '#',
      render: (r) => (
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: '#94a3b8' }}>
          #{r.id}
        </span>
      ),
    },
    {
      key: 'purpose',
      header: 'Purpose',
      render: (r) => (
        <span
          style={{
            fontSize: 13,
            color: '#334155',
            display: 'block',
            maxWidth: 160,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {r.purpose}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <Badge tone={reservationStatusTone(r.status)}>
          {reservationStatusLabel(r.status)}
        </Badge>
      ),
    },
    {
      key: 'dates',
      header: 'Schedule',
      render: (r) => (
        <span
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 12,
            color: '#94a3b8',
            whiteSpace: 'nowrap',
          }}
        >
          {r.reserved_from} → {r.reserved_until}
        </span>
      ),
    },
  ]

  const borrowingColumns: Column<Borrowing>[] = [
    {
      key: 'id',
      header: '#',
      render: (r) => (
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: '#94a3b8' }}>
          #{r.id}
        </span>
      ),
    },
    {
      key: 'asset_name',
      header: 'Asset',
      render: (r) => (
        <span style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>{r.asset_name}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <Badge tone={borrowingStatusTone(r.status)}>
          {borrowingStatusLabel(r.status)}
        </Badge>
      ),
    },
    {
      key: 'borrowed_at',
      header: 'Borrowed',
      render: (r) => (
        <span
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 12,
            color: '#94a3b8',
            whiteSpace: 'nowrap',
          }}
        >
          {r.borrowed_at}
        </span>
      ),
    },
    {
      key: 'due_at',
      header: 'Due',
      render: (r) => (
        <span
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 12,
            color: '#94a3b8',
            whiteSpace: 'nowrap',
          }}
        >
          {r.due_at}
        </span>
      ),
    },
  ]

  const activeColumns: Column<Borrowing>[] = [
    {
      key: 'id',
      header: '#',
      render: (r) => (
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: '#94a3b8' }}>
          #{r.id}
        </span>
      ),
    },
    {
      key: 'asset_name',
      header: 'Asset',
      render: (r) => (
        <span style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>{r.asset_name}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <Badge tone={borrowingStatusTone(r.status)}>
          {borrowingStatusLabel(r.status)}
        </Badge>
      ),
    },
    {
      key: 'due_at',
      header: 'Due',
      render: (r) => (
        <span
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 12,
            color: '#94a3b8',
            whiteSpace: 'nowrap',
          }}
        >
          {r.due_at}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => void handleReturnBorrowing(r.id)}
        >
          Return Item
        </Button>
      ),
    },
  ]

  /* ── Derived values ──────────────────────────────────────────────────── */
  const overdueCount  = stats?.my_stats?.overdue
    ?? activeBorrowings.filter((b) => b.status === 'OVERDUE').length
  const activeCount   = stats?.my_stats?.active_borrowings ?? activeBorrowings.length
  const dueSoonCount  = activeCount - overdueCount
  const requestsCount = stats
    ? (stats.reservations.pending + stats.reservations.approved + stats.reservations.rejected)
    : myReservations.length

  const userName = user?.full_name?.trim() || user?.name?.trim() || user?.email || ''

  const statCards = [
    {
      label: 'My Active Borrowings',
      value: activeCount,
      description: 'Items currently borrowed',
      icon: HandCoins,
      tone: 'green' as const,
    },
    {
      label: 'Overdue',
      value: overdueCount,
      description: 'Items needing return',
      icon: AlertTriangle,
      tone: 'red' as const,
    },
    {
      label: 'My Borrow Requests',
      value: requestsCount,
      description: 'Requests you submitted',
      icon: ClipboardList,
      tone: 'blue' as const,
    },
    {
      label: 'Due Soon',
      value: dueSoonCount,
      description: 'Active items to monitor',
      icon: CalendarDays,
      tone: 'amber' as const,
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── 1. Header ── */}
      <div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: '#0f172a',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          {greeting()}{userName ? `, ${userName}` : ''}
        </h1>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 5, lineHeight: 1.5 }}>
          Welcome back. Here is your asset activity overview.
        </p>
      </div>

      {message && (
        <Alert tone={message.type} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* ── 2. KPI row ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))',
          gap: 12,
        }}
      >
        {statCards.map((c) => (
          <DashboardStatCard key={c.label} compact {...c} />
        ))}
      </div>

      {/* ── 3. Currently borrowed (shown only when > 0) ── */}
      {activeBorrowings.length > 0 && (
        <DashboardPanel
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
        </DashboardPanel>
      )}

      {/* ── 4. Two-panel row ── */}
      <div className="dashboard-employee-panels">
        <DashboardPanel
          title="My Borrow Requests"
          subtitle="Track requests you sent for asset borrowing"
          onViewAll={() => navigate('/reservations')}
          loading={loading}
        >
          {myReservations.length === 0 ? (
            <EmptyState
              title="No borrow requests yet"
              description="Send a borrow request when you need an available asset."
            />
          ) : (
            <Table
              columns={reservationColumns}
              rows={myReservations}
              rowKey={(r) => r.id}
              empty={<EmptyState title="No borrow requests yet" />}
            />
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Borrowed Item History"
          subtitle="View your past and current borrowed items"
          onViewAll={() => navigate('/borrowings')}
          loading={loading}
        >
          {myBorrowings.length === 0 ? (
            <EmptyState
              title="No borrowed items yet"
              description="Items you borrow will appear here."
            />
          ) : (
            <Table
              columns={borrowingColumns}
              rows={myBorrowings}
              rowKey={(r) => r.id}
              empty={<EmptyState title="No borrowed items yet" />}
            />
          )}
        </DashboardPanel>
      </div>

      {/* ── 5. Quick Actions ── */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: 20,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.10em',
            color: '#64748b',
            marginBottom: 14,
          }}
        >
          Quick Actions
        </div>
        <div className="dashboard-employee-panels">
          <Button variant="secondary" onClick={() => navigate('/assets')}>
            Browse Available Assets
          </Button>
          <Button variant="secondary" onClick={() => navigate('/make-request')}>
              Make Request
          </Button>
          <Button variant="secondary" onClick={() => navigate('/borrowings')}>
            View My Borrowed Items
          </Button>
          <Button variant="secondary" onClick={() => navigate('/settings')}>
            My Profile Settings
          </Button>
        </div>
      </div>

    </div>
  )
}

