import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  Archive,
  BadgeCheck,
  Boxes,
  CalendarClock,
  CheckCircle2,
  Clock3,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Wrench,
} from 'lucide-react'
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Spinner,
  Table,
  type Column,
} from '@/components/ui'
import { DashboardStatCard } from '@/components/DashboardStatCard'
import { dashboardService } from '@/services/dashboardService'
import { reservationService } from '@/services/reservationService'
import { borrowingService } from '@/services/borrowingService'
import { maintenanceService } from '@/services/maintenanceService'
import type {
  ActivityItem,
  Borrowing,
  DashboardStats,
  MaintenanceRequest,
  Reservation,
} from '@/types'
import { maintenanceStatusTone } from '@/utils/statusTone'
import { maintenanceStatusLabel } from '@/utils/displayLabels'
import { affectsScope, onDataChanged } from '@/utils/dataRefresh'

/* ─────────────────────────────────────────
   Design tokens — single source of truth.
   All text colours use inline styles so the
   global CSS cascade can never override them.
   ───────────────────────────────────────── */
const T = {
  text:        '#1e293b',   // headings, strong content
  textMid:     '#475569',   // body text, table content
  textMuted:   '#64748b',   // labels, secondary text
  textFaint:   '#94a3b8',   // hints, descriptions, timestamps
  accent:      '#0B3D91',   // PSA blue — primary actions
  accentLight: '#1565C0',   // hover / lighter blue
  success:     '#2E7D32',   // healthy / approved
  warning:     '#D97706',   // pending / amber
  danger:      '#C62828',   // overdue / error
  teal:        '#0F766E',   // maintenance
  border:      '#e2e8f0',   // card borders
  borderLight: '#f1f5f9',   // dividers inside cards
  bg:          '#f8fafc',   // table header bg
  white:       '#ffffff',
}

/* ─────────────────────────────────────────
   Shared sub-components
   ───────────────────────────────────────── */

/** Section heading above a group of cards */
function SectionLabel({ children }: { children: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <span style={{
        fontSize: 11, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.10em',
        color: T.textFaint,
      }}>
        {children}
      </span>
    </div>
  )
}

/** Count pill shown inside panel headers */
function CountBadge({ n, tone }: { n: number; tone: 'amber' | 'red' | 'teal' }) {
  const bg    = tone === 'red' ? '#fee2e2' : tone === 'teal' ? '#ccfbf1' : '#fef3c7'
  const color = tone === 'red' ? T.danger   : tone === 'teal' ? T.teal    : T.warning
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 18, padding: '1px 6px', marginLeft: 8,
      borderRadius: 999, fontSize: 10, fontWeight: 700, lineHeight: 1,
      background: bg, color,
    }}>
      {n}
    </span>
  )
}

/** White panel card with header row + full-bleed body */
function Panel({
  title, subtitle, count, countTone, onViewAll, loading, children,
}: {
  title: string
  subtitle: string
  count?: number
  countTone?: 'amber' | 'red' | 'teal'
  onViewAll?: () => void
  loading: boolean
  children: React.ReactNode
}) {
  return (
    <section style={{
      display: 'flex', flexDirection: 'column',
      background: T.white,
      border: `1px solid ${T.border}`,
      borderRadius: 16,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      overflow: 'hidden',   /* clips table inside rounded corners */
      boxSizing: 'border-box',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16, padding: '16px 20px',
        borderBottom: `1px solid ${T.borderLight}`,
        flexShrink: 0,
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>
              {title}
            </span>
            {count !== undefined && count > 0 && countTone && (
              <CountBadge n={count} tone={countTone} />
            )}
          </div>
          <div style={{ fontSize: 12, color: T.textFaint, marginTop: 2 }}>
            {subtitle}
          </div>
        </div>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            style={{
              flexShrink: 0, whiteSpace: 'nowrap',
              fontSize: 12, fontWeight: 500,
              color: T.accentLight, background: 'none', border: 'none',
              cursor: 'pointer', padding: 0,
            }}
          >
            View all
          </button>
        )}
      </div>

      {/* Body — overflow-x scroll for tables on mobile */}
      <div style={{ flex: 1, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '48px 0' }}>
            <Spinner />
          </div>
        ) : children}
      </div>
    </section>
  )
}

/** Metric card used for utilization + health row */
function MetricCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: T.white,
      border: `1px solid ${T.border}`,
      borderRadius: 16,
      padding: 20,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      boxSizing: 'border-box',
    }}>
      {children}
    </div>
  )
}

/* ─────────────────────────────────────────
   Main component
   ───────────────────────────────────────── */
export function AdminDashboard() {
  const navigate = useNavigate()

  const [stats,               setStats]               = useState<DashboardStats | null>(null)
  const [recentActivity,      setRecentActivity]      = useState<ActivityItem[]>([])
  const [pendingReservations, setPendingReservations] = useState<Reservation[]>([])
  const [overdueBorrowings,   setOverdueBorrowings]   = useState<Borrowing[]>([])
  const [pendingMaintenance,  setPendingMaintenance]  = useState<MaintenanceRequest[]>([])
  const [loading,             setLoading]             = useState(true)
  const [message,             setMessage]             = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, activityRes, reservationsRes, borrowingsRes, maintenanceRes] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecentActivity(),
        reservationService.list(),
        borrowingService.list(),
        maintenanceService.list(),
      ])
      setStats(statsRes)
      setRecentActivity(activityRes)
      setPendingReservations(reservationsRes.items.filter((r) => r.status === 'PENDING'))
      setOverdueBorrowings(borrowingsRes.items.filter((b) => b.status === 'OVERDUE'))
      setPendingMaintenance(maintenanceRes.items.filter((m) => m.status === 'scheduled'))
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to load dashboard data.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadData() }, [])
  useEffect(() => onDataChanged((scope) => {
    if (affectsScope(scope, 'dashboard') || affectsScope(scope, 'borrowings') ||
        affectsScope(scope, 'reservations') || affectsScope(scope, 'assets')) {
      void loadData()
    }
  }), [])

  const handleApproveReservation = async (id: number) => {
    try {
      await reservationService.approve(id)
      setMessage({ type: 'success', text: 'Borrow request approved successfully.' })
      await loadData()
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Unable to approve borrow request.' })
    }
  }

  const utilizationRate = stats?.total_assets
    ? Math.round(((stats.borrowed || 0) / stats.total_assets) * 100) : 0
  const isHealthy = overdueBorrowings.length === 0 && pendingReservations.length < 5

  /* ── Column definitions ── */
  const activityColumns: Column<ActivityItem>[] = [
    { key: 'action',     header: 'Action',  render: (r) => <span style={{ fontSize: 13, fontWeight: 500, color: T.text,     display: 'block', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.action}</span> },
    { key: 'user',       header: 'User',    render: (r) => <span style={{ fontSize: 13, color: T.textMid }}>{r.user}</span> },
    { key: 'module',     header: 'Module',  render: (r) => <Badge tone="blue">{r.module}</Badge> },
    { key: 'created_at', header: 'Time',    render: (r) => <span style={{ fontSize: 12, fontFamily: 'monospace', color: T.textFaint, whiteSpace: 'nowrap' }}>{new Date(r.created_at).toLocaleString()}</span> },
  ]

  const reservationColumns: Column<Reservation>[] = [
    { key: 'id',            header: '#',        render: (r) => <span style={{ fontSize: 12, fontFamily: 'monospace', color: T.textFaint }}>#{r.id}</span> },
    { key: 'employee_name', header: 'Employee', render: (r) => <span style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{r.employee_name}</span> },
    { key: 'purpose',       header: 'Purpose',  render: (r) => <span style={{ fontSize: 13, color: T.textMid, display: 'block', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.purpose}</span> },
    { key: 'dates',         header: 'Schedule', render: (r) => <span style={{ fontSize: 12, fontFamily: 'monospace', color: T.textFaint, whiteSpace: 'nowrap' }}>{r.reserved_from} → {r.reserved_until}</span> },
    { key: 'actions',       header: '',         render: (r) => <Button size="sm" variant="success" onClick={() => handleApproveReservation(r.id)}>Approve</Button> },
  ]

  const borrowingColumns: Column<Borrowing>[] = [
    { key: 'id',            header: '#',       render: (r) => <span style={{ fontSize: 12, fontFamily: 'monospace', color: T.textFaint }}>#{r.id}</span> },
    { key: 'asset_name',    header: 'Asset',   render: (r) => <span style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{r.asset_name}</span> },
    { key: 'employee_name', header: 'Borrower',render: (r) => <span style={{ fontSize: 13, color: T.textMid }}>{r.employee_name}</span> },
    { key: 'due_at',        header: 'Due Date', render: (r) => <span style={{ fontSize: 12, fontFamily: 'monospace', color: T.danger, whiteSpace: 'nowrap' }}>{r.due_at}</span> },
  ]

  const maintenanceColumns: Column<MaintenanceRequest>[] = [
    { key: 'id',           header: '#',           render: (r) => <span style={{ fontSize: 12, fontFamily: 'monospace', color: T.textFaint }}>#{r.id}</span> },
    { key: 'asset_name',   header: 'Asset',       render: (r) => <span style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{r.asset_name}</span> },
    { key: 'description',  header: 'Description', render: (r) => <span style={{ fontSize: 13, color: T.textMid, display: 'block', maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</span> },
    { key: 'status',       header: 'Status',      render: (r) => <Badge tone={maintenanceStatusTone(r.status)}>{maintenanceStatusLabel(r.status)}</Badge> },
    { key: 'scheduled_at', header: 'Scheduled',   render: (r) => <span style={{ fontSize: 12, fontFamily: 'monospace', color: T.textFaint, whiteSpace: 'nowrap' }}>{r.scheduled_at}</span> },
  ]

  const primaryCards = [
    { label: 'Total Assets',  value: stats?.total_assets || 0, description: 'All registered assets', icon: Boxes,      tone: 'blue'   as const },
    { label: 'Available',     value: stats?.available    || 0, description: 'Ready for use',         icon: BadgeCheck, tone: 'green'  as const },
    { label: 'Borrowed',      value: stats?.borrowed     || 0, description: 'Currently in use',      icon: Archive,    tone: 'amber'  as const },
    { label: 'Reserved',      value: stats?.reserved     || 0, description: 'Pending collection',    icon: Clock3,     tone: 'violet' as const },
  ]
  const operationalCards = [
    { label: 'Under Maintenance',  value: stats?.maintenance         || 0, description: 'Requires attention', icon: Wrench,        tone: 'red'   as const },
    { label: 'Borrow Requests',    value: pendingReservations.length,      description: 'Awaiting approval',  icon: CalendarClock, tone: 'amber' as const },
    { label: 'Overdue Items',      value: overdueBorrowings.length,        description: 'Past return date',   icon: Activity,      tone: 'red'   as const },
    { label: 'Pending Maintenance',value: pendingMaintenance.length,       description: 'Scheduled repairs',  icon: Wrench,        tone: 'teal'  as const },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: T.textFaint, marginBottom: 4 }}>
            PSA Region XII · Asset Management
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em', color: T.text, margin: 0 }}>
            Admin Dashboard
          </h1>
          <div style={{ fontSize: 13, color: T.textMuted, marginTop: 6, lineHeight: 1.5 }}>
            Overview of assets, borrowings, reservations, maintenance, and system activity.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 2 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 12, fontWeight: 600, color: '#166534',
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: 8, padding: '6px 12px',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            System Live
          </span>
        </div>
      </div>

      {/* Alert */}
      {message && (
        <Alert tone={message.type} onClose={() => setMessage(null)}>{message.text}</Alert>
      )}

      {/* ── Asset Overview ── */}
      <div>
        <SectionLabel>Asset Overview</SectionLabel>
        <div className="stat-grid">
          {primaryCards.map((c) => <DashboardStatCard key={c.label} {...c} />)}
        </div>
      </div>

      {/* ── Operational Indicators ── */}
      <div>
        <SectionLabel>Operational Indicators</SectionLabel>
        <div className="stat-grid">
          {operationalCards.map((c) => <DashboardStatCard key={c.label} {...c} />)}
        </div>
      </div>

      {/* ── Utilization + Health (2 col) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, minmax(0,1fr))', gap: 16 }}
           className="sm:!grid-cols-2">
        {/* Asset Utilization Rate */}
        <MetricCard>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: T.textFaint }}>
                Asset Utilization Rate
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginTop: 12 }}>
                <span style={{ fontSize: 38, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em', color: T.text }}>
                  {utilizationRate}%
                </span>
                <span style={{ fontSize: 12, color: T.textFaint, marginBottom: 4 }}>
                  of assets borrowed
                </span>
              </div>
            </div>
            <span style={{ display: 'grid', width: 40, height: 40, flexShrink: 0, placeItems: 'center', borderRadius: 12, background: '#eff6ff' }}>
              <TrendingUp size={20} style={{ color: T.accentLight }} />
            </span>
          </div>
          <div style={{ marginTop: 20 }}>
            <div style={{ height: 8, borderRadius: 999, background: '#f1f5f9', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 999, background: T.accentLight, width: `${Math.min(utilizationRate, 100)}%`, transition: 'width 0.7s ease' }}
                   role="progressbar" aria-valuenow={utilizationRate} aria-valuemin={0} aria-valuemax={100} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: T.textFaint }}>
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
        </MetricCard>

        {/* System Health */}
        <MetricCard>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: T.textFaint }}>
                System Health
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                {isHealthy
                  ? <CheckCircle2 size={22} style={{ color: T.success, flexShrink: 0 }} />
                  : <ShieldAlert  size={22} style={{ color: T.warning, flexShrink: 0 }} />
                }
                <span style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, color: isHealthy ? T.success : T.warning }}>
                  {isHealthy ? 'Healthy' : 'Attention Needed'}
                </span>
              </div>
              <div style={{ fontSize: 12, color: T.textFaint, marginTop: 8, lineHeight: 1.5 }}>
                {isHealthy
                  ? 'All critical indicators are within normal levels.'
                  : `${overdueBorrowings.length} overdue · ${pendingReservations.length} pending requests require attention.`}
              </div>
            </div>
            <span style={{ display: 'grid', width: 40, height: 40, flexShrink: 0, placeItems: 'center', borderRadius: 12, background: isHealthy ? '#f0fdf4' : '#fffbeb' }}>
              {isHealthy
                ? <ShieldCheck size={20} style={{ color: T.success }} />
                : <ShieldCheck size={20} style={{ color: T.warning }} />
              }
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
            {[
              { label: 'Overdue',          value: overdueBorrowings.length,   ok: overdueBorrowings.length === 0 },
              { label: 'Pending Requests', value: pendingReservations.length, ok: pendingReservations.length < 5 },
            ].map((item) => (
              <div key={item.label} style={{ borderRadius: 12, padding: '12px 16px', background: item.ok ? '#f8fafc' : '#fffbeb' }}>
                <div style={{ fontSize: 11, color: T.textFaint }}>{item.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, marginTop: 4, color: item.ok ? T.text : T.warning }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </MetricCard>
      </div>

      {/* ── Recent Activity + Borrow Requests ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, minmax(0,1fr))', gap: 20 }} className="lg:!grid-cols-2">
        <Panel title="Recent Activity" subtitle="Latest actions across all modules"
               onViewAll={() => navigate('/reports')} loading={loading}>
          {recentActivity.length === 0
            ? <EmptyState title="No recent activity" description="System activity will appear here." />
            : <Table columns={activityColumns} rows={recentActivity} rowKey={(r) => r.id} empty={<EmptyState title="No recent activity" />} />}
        </Panel>

        <Panel title="Borrow Requests" subtitle="Waiting for approval before release"
               count={pendingReservations.length} countTone="amber"
               onViewAll={() => navigate('/reservations')} loading={loading}>
          {pendingReservations.length === 0
            ? <EmptyState title="No pending requests" description="All borrow requests have been processed." />
            : <Table columns={reservationColumns} rows={pendingReservations} rowKey={(r) => r.id} empty={<EmptyState title="No pending requests" />} />}
        </Panel>
      </div>

      {/* ── Overdue Items + Pending Maintenance ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, minmax(0,1fr))', gap: 20 }} className="lg:!grid-cols-2">
        <Panel title="Overdue Borrowed Items" subtitle="Items past their return date"
               count={overdueBorrowings.length} countTone="red"
               onViewAll={() => navigate('/borrowings')} loading={loading}>
          {overdueBorrowings.length === 0
            ? <EmptyState title="No overdue items" description="All borrowed assets have been returned on time." />
            : <Table columns={borrowingColumns} rows={overdueBorrowings} rowKey={(r) => r.id} empty={<EmptyState title="No overdue items" />} />}
        </Panel>

        <Panel title="Pending Maintenance" subtitle="Scheduled repairs awaiting completion"
               count={pendingMaintenance.length} countTone="teal"
               onViewAll={() => navigate('/maintenance')} loading={loading}>
          {pendingMaintenance.length === 0
            ? <EmptyState title="No pending maintenance" description="No maintenance requests are currently scheduled." />
            : <Table columns={maintenanceColumns} rows={pendingMaintenance} rowKey={(r) => r.id} empty={<EmptyState title="No pending maintenance" />} />}
        </Panel>
      </div>

      {/* ── Quick Actions ── */}
      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: T.textFaint, marginBottom: 14 }}>
          Quick Actions
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <Button variant="secondary" onClick={() => navigate('/assets')}>Manage Assets</Button>
          <Button variant="secondary" onClick={() => navigate('/reservations')}>Borrow Requests</Button>
          <Button variant="secondary" onClick={() => navigate('/maintenance')}>Maintenance</Button>
          <Button variant="secondary" onClick={() => navigate('/reports')}>Reports</Button>
          <Button variant="secondary" onClick={() => navigate('/users')}>Users</Button>
        </div>
      </div>

    </div>
  )
}
