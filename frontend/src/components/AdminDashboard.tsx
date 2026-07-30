import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Archive,
  BadgeCheck,
  Boxes,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Package,
  PackageMinus,
  PackageX,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Users,
  UserCheck,
  UserCog,
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
import { borrowExtensionService } from '@/services/borrowExtensionService'
import type {
  ActivityItem,
  DashboardStats,
  Reservation,
} from '@/types'
import { affectsScope, notifyDataChanged, onDataChanged } from '@/utils/dataRefresh'

const T = {
  text:        '#1e293b',
  textMid:     '#475569',
  textMuted:   '#64748b',
  textFaint:   '#94a3b8',
  accent:      '#0B3D91',
  accentLight: '#1565C0',
  success:     '#2E7D32',
  warning:     '#D97706',
  danger:      '#C62828',
  border:      '#e2e8f0',
  borderLight: '#f1f5f9',
  white:       '#ffffff',
}

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

function CountBadge({ n, tone }: { n: number; tone: 'amber' | 'red' | 'teal' }) {
  const bg    = tone === 'red' ? '#fee2e2' : tone === 'teal' ? '#ccfbf1' : '#fef3c7'
  const color = tone === 'red' ? T.danger   : tone === 'teal' ? '#0F766E' : T.warning
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
      overflow: 'hidden',
      boxSizing: 'border-box',
    }}>
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

export function AdminDashboard() {
  const navigate = useNavigate()

  const [stats,                  setStats]                  = useState<DashboardStats | null>(null)
  const [recentActivity,         setRecentActivity]         = useState<ActivityItem[]>([])
  const [pendingReservations,    setPendingReservations]    = useState<Reservation[]>([])
  const [pendingExtensionsCount, setPendingExtensionsCount] = useState<number>(0)
  const [loading,                setLoading]                = useState(true)
  const [message,                setMessage]                = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, activityRes, reservationsRes, extCountRes] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecentActivity(),
        reservationService.list(),
        borrowExtensionService.getPendingExtensionRequests().catch(() => ({ count: 0 })),
      ])
      setStats(statsRes)
      setRecentActivity(activityRes)
      setPendingReservations(reservationsRes.items.filter((r) => r.status === 'PENDING'))
      setPendingExtensionsCount(extCountRes.count ?? 0)
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to load dashboard data.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadData() }, [])
  useEffect(() => onDataChanged((scope) => {
    if (
      affectsScope(scope, 'dashboard') ||
      affectsScope(scope, 'borrowings') ||
      affectsScope(scope, 'reservations') ||
      affectsScope(scope, 'assets') ||
      affectsScope(scope, 'inventory') ||
      affectsScope(scope, 'maintenance')
    ) {
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

  const handleRejectReservation = async (id: number) => {
    try {
      await reservationService.reject(id)
      setMessage({ type: 'success', text: 'Borrow request rejected.' })
      notifyDataChanged('all')
      await loadData()
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Unable to reject borrow request.' })
    }
  }

  const assets = stats?.assets
  const inventory = stats?.inventory
  const borrowings = stats?.borrowings
  const reservations = stats?.reservations
  const users = stats?.users

  const totalAssets = assets?.total ?? stats?.total_assets ?? 0
  const borrowedAssets = assets?.borrowed ?? stats?.borrowed ?? 0
  const pendingCount = reservations?.pending ?? pendingReservations.length
  const utilizationRate = totalAssets
    ? Math.round((borrowedAssets / totalAssets) * 100) : 0
  const isHealthy = pendingCount < 5

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
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button size="sm" variant="success" onClick={() => handleApproveReservation(r.id)}>Approve</Button>
          <Button size="sm" variant="outline" onClick={() => handleRejectReservation(r.id)}>Reject</Button>
        </div>
      ),
    },
  ]

  const assetCards = [
    { label: 'Total Assets', value: totalAssets, description: 'All registered assets', icon: Boxes, tone: 'blue' as const },
    { label: 'Available', value: assets?.available ?? stats?.available ?? 0, description: 'Ready for use', icon: BadgeCheck, tone: 'green' as const },
    { label: 'Borrowed', value: borrowedAssets, description: 'Currently in use', icon: Archive, tone: 'amber' as const },
    { label: 'Reserved', value: assets?.reserved ?? stats?.reserved ?? 0, description: 'Held for requests', icon: Clock3, tone: 'violet' as const },
    { label: 'Under Maintenance', value: assets?.maintenance ?? stats?.maintenance ?? 0, description: 'Temporarily unavailable', icon: Wrench, tone: 'red' as const },
    { label: 'Re-Issued This Month', value: assets?.reissued_this_month ?? 0, description: 'Permanent transfers', icon: TrendingUp, tone: 'blue' as const },
  ]

  const inventoryCards = [
    { label: 'Total Inventory Items', value: inventory?.total ?? 0, description: 'Tracked stock items', icon: Package, tone: 'blue' as const },
    { label: 'Semi-Expendable (SE)', value: inventory?.expendable ?? 0, description: 'Consumable stock', icon: PackageMinus, tone: 'amber' as const },
    { label: 'Property, Plant & Equipment (PPE)', value: inventory?.non_expendable ?? 0, description: 'Reusable stock', icon: Boxes, tone: 'green' as const },
    { label: 'Low Stock', value: inventory?.low_stock ?? 0, description: 'At or below reorder', icon: PackageMinus, tone: 'amber' as const },
    { label: 'Out of Stock', value: inventory?.out_of_stock ?? 0, description: 'Zero quantity', icon: PackageX, tone: 'red' as const },
  ]

  const borrowingCards = [
    { label: 'Active Borrowings', value: borrowings?.active ?? 0, description: 'Currently borrowed', icon: Archive, tone: 'amber' as const },
    { label: 'Returned Items', value: borrowings?.returned ?? 0, description: 'Completed returns', icon: BadgeCheck, tone: 'green' as const },
    { label: 'Pending Borrow Requests', value: borrowings?.pending_requests ?? 0, description: 'Awaiting approval', icon: CalendarClock, tone: 'amber' as const },
    { label: 'Approved Borrow Requests', value: borrowings?.approved_requests ?? 0, description: 'Ready for release', icon: CheckCircle2, tone: 'green' as const },
    { label: 'Pending Extensions', value: pendingExtensionsCount, description: 'Awaiting due date extension approval', icon: CalendarClock, tone: 'amber' as const, onClick: () => navigate('/extension-requests') },
  ]

  const reservationCards = [
    { label: 'Pending Reservations', value: reservations?.pending ?? 0, description: 'Need review', icon: CalendarClock, tone: 'amber' as const },
    { label: 'Approved Reservations', value: reservations?.approved ?? 0, description: 'Authorized', icon: CheckCircle2, tone: 'green' as const },
    { label: 'Rejected Reservations', value: reservations?.rejected ?? 0, description: 'Declined requests', icon: ShieldAlert, tone: 'red' as const },
  ]

  const userCards = [
    { label: 'Total Users', value: users?.total ?? 0, description: 'Registered accounts', icon: Users, tone: 'blue' as const },
    { label: 'Active Users', value: users?.active ?? 0, description: 'Active accounts', icon: UserCheck, tone: 'green' as const },
    { label: 'Employees', value: users?.employees ?? 0, description: 'Employee role', icon: Users, tone: 'violet' as const },
    { label: 'Staff', value: users?.staff ?? 0, description: 'Operational roles', icon: UserCog, tone: 'amber' as const },
    { label: 'Administrators', value: users?.administrators ?? 0, description: 'System admins', icon: ShieldCheck, tone: 'red' as const },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: T.textFaint, marginBottom: 4 }}>
            PSA Region XII · Asset Management
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em', color: T.text, margin: 0 }}>
            Admin Dashboard
          </h1>
          <div style={{ fontSize: 13, color: T.textMuted, marginTop: 6, lineHeight: 1.5 }}>
            Live metrics for assets, inventory, borrowings, reservations, and users.
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

      {message && (
        <Alert tone={message.type} onClose={() => setMessage(null)}>{message.text}</Alert>
      )}

      <div>
        <SectionLabel>Assets</SectionLabel>
        <div className="stat-grid">
          {assetCards.map((c) => <DashboardStatCard key={c.label} {...c} />)}
        </div>
      </div>

      <div>
        <SectionLabel>Inventory</SectionLabel>
        <div className="stat-grid">
          {inventoryCards.map((c) => <DashboardStatCard key={c.label} {...c} />)}
        </div>
      </div>

      <div>
        <SectionLabel>Borrowing</SectionLabel>
        <div className="stat-grid">
          {borrowingCards.map((c) => <DashboardStatCard key={c.label} {...c} />)}
        </div>
      </div>

      <div>
        <SectionLabel>Reservations</SectionLabel>
        <div className="stat-grid">
          {reservationCards.map((c) => <DashboardStatCard key={c.label} {...c} />)}
        </div>
      </div>

      <div>
        <SectionLabel>Users</SectionLabel>
        <div className="stat-grid">
          {userCards.map((c) => <DashboardStatCard key={c.label} {...c} />)}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, minmax(0,1fr))', gap: 16 }}
           className="sm:!grid-cols-2">
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
                  ? 'Pending borrow requests are within normal levels.'
                  : `${pendingCount} pending borrow requests require attention.`}
              </div>
            </div>
            <span style={{ display: 'grid', width: 40, height: 40, flexShrink: 0, placeItems: 'center', borderRadius: 12, background: isHealthy ? '#f0fdf4' : '#fffbeb' }}>
              <ShieldCheck size={20} style={{ color: isHealthy ? T.success : T.warning }} />
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
            {[
              { label: 'Pending Requests', value: pendingCount, ok: pendingCount < 5 },
              { label: 'Low Stock Items', value: inventory?.low_stock ?? 0, ok: (inventory?.low_stock ?? 0) === 0 },
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, minmax(0,1fr))', gap: 20 }} className="lg:!grid-cols-2">
        <Panel title="Recent Activity" subtitle="Latest actions across all modules"
               onViewAll={() => navigate('/reports')} loading={loading}>
          {recentActivity.length === 0
            ? <EmptyState title="No recent activity" description="System activity will appear here." />
            : <Table columns={activityColumns} rows={recentActivity} rowKey={(r) => String(r.id)} empty={<EmptyState title="No recent activity" />} />}
        </Panel>

        <Panel title="Borrow Requests" subtitle="Waiting for approval before release"
               count={pendingReservations.length} countTone="amber"
               onViewAll={() => navigate('/reservations')} loading={loading}>
          {pendingReservations.length === 0
            ? <EmptyState title="No pending requests" description="All borrow requests have been processed." />
            : <Table columns={reservationColumns} rows={pendingReservations} rowKey={(r) => r.id} empty={<EmptyState title="No pending requests" />} />}
        </Panel>
      </div>

      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: T.textFaint, marginBottom: 14 }}>
          Quick Actions
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <Button variant="secondary" onClick={() => navigate('/assets')}>Manage Assets</Button>
          <Button variant="secondary" onClick={() => navigate('/reservations')}>Borrow Requests</Button>
          <Button variant="secondary" onClick={() => navigate('/borrowings')}>Borrowed Items</Button>
          <Button variant="secondary" onClick={() => navigate('/inventory')}>Inventory</Button>
          <Button variant="secondary" onClick={() => navigate('/maintenance')}>Maintenance</Button>
          <Button variant="secondary" onClick={() => navigate('/reports')}>Reports</Button>
          <Button variant="secondary" onClick={() => navigate('/users')}>Users</Button>
        </div>
      </div>
    </div>
  )
}
