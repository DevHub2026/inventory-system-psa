import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity, Archive, BadgeCheck, Boxes,
  CalendarClock, Clock3, ShieldCheck, Wrench,
} from 'lucide-react'
import {
  Badge, Button, Card, EmptyState, Spinner, Table, Alert, type Column,
} from '@/components/ui'
import { DashboardStatCard } from '@/components/DashboardStatCard'
import { PageHeader } from '@/components/PageHeader'
import { dashboardService } from '@/services/dashboardService'
import { reservationService } from '@/services/reservationService'
import { borrowingService } from '@/services/borrowingService'
import { maintenanceService } from '@/services/maintenanceService'
import type { DashboardStats, ActivityItem, Reservation, Borrowing, MaintenanceRequest } from '@/types'
import { maintenanceStatusTone } from '@/utils/statusTone'
import { maintenanceStatusLabel } from '@/utils/displayLabels'
import { affectsScope, onDataChanged } from '@/utils/dataRefresh'

/* ─── shared label styles ─────────────────────────────────────────── */
const SECTION_TITLE = 'text-[16px] font-semibold text-[#1F2937]'
const SECTION_SUB   = 'mt-0.5 text-[13px] text-[#6B7280]'

export function AdminDashboard() {
  const navigate = useNavigate()
  const [stats,              setStats]              = useState<DashboardStats | null>(null)
  const [recentActivity,     setRecentActivity]     = useState<ActivityItem[]>([])
  const [pendingReservations,setPendingReservations] = useState<Reservation[]>([])
  const [overdueBorrowings,  setOverdueBorrowings]  = useState<Borrowing[]>([])
  const [pendingMaintenance, setPendingMaintenance] = useState<MaintenanceRequest[]>([])
  const [loading,            setLoading]            = useState(true)
  const [message,            setMessage]            = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, activityRes, reservationsRes, borrowingsRes, maintenanceRes] =
        await Promise.all([
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

  /* Initial load */
  useEffect(() => { void loadData() }, [])

  /* Cross-component data refresh subscription */
  useEffect(() => onDataChanged((scope) => {
    if (
      affectsScope(scope, 'dashboard') ||
      affectsScope(scope, 'borrowings') ||
      affectsScope(scope, 'reservations') ||
      affectsScope(scope, 'assets')
    ) {
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

  /* ── Column definitions ── */
  const activityColumns: Column<ActivityItem>[] = [
    { key: 'action',     header: 'Action',  render: (r) => r.action },
    { key: 'user',       header: 'User',    render: (r) => r.user },
    { key: 'module',     header: 'Module',  render: (r) => r.module },
    { key: 'created_at', header: 'Time',    render: (r) => new Date(r.created_at).toLocaleString() },
  ]

  const reservationColumns: Column<Reservation>[] = [
    { key: 'id',            header: '#',         render: (r) => <span className="font-mono text-xs text-[#9CA3AF]">#{r.id}</span> },
    { key: 'employee_name', header: 'Employee',  render: (r) => <span className="font-medium text-[#1F2937]">{r.employee_name}</span> },
    { key: 'purpose',       header: 'Purpose',   render: (r) => r.purpose },
    { key: 'dates',         header: 'Schedule',  render: (r) => <span className="font-mono text-xs text-[#6B7280]">{r.reserved_from} → {r.reserved_until}</span> },
    {
      key: 'actions', header: 'Actions',
      render: (r) => (
        <Button size="sm" variant="success" onClick={() => handleApproveReservation(r.id)}>
          Approve
        </Button>
      ),
    },
  ]

  const borrowingColumns: Column<Borrowing>[] = [
    { key: 'id',            header: '#',        render: (r) => <span className="font-mono text-xs text-[#9CA3AF]">#{r.id}</span> },
    { key: 'asset_name',    header: 'Asset',    render: (r) => <span className="font-medium text-[#1F2937]">{r.asset_name}</span> },
    { key: 'employee_name', header: 'Employee', render: (r) => r.employee_name },
    { key: 'due_at',        header: 'Due',      render: (r) => <span className="font-mono text-xs text-[#6B7280]">{r.due_at}</span> },
  ]

  const maintenanceColumns: Column<MaintenanceRequest>[] = [
    { key: 'id',           header: '#',           render: (r) => <span className="font-mono text-xs text-[#9CA3AF]">#{r.id}</span> },
    { key: 'asset_name',   header: 'Asset',       render: (r) => <span className="font-medium text-[#1F2937]">{r.asset_name}</span> },
    { key: 'description',  header: 'Description', render: (r) => <span className="text-[#6B7280]">{r.description}</span> },
    {
      key: 'status', header: 'Status',
      render: (r) => <Badge tone={maintenanceStatusTone(r.status)}>{maintenanceStatusLabel(r.status)}</Badge>,
    },
    { key: 'scheduled_at', header: 'Scheduled',   render: (r) => <span className="font-mono text-xs text-[#6B7280]">{r.scheduled_at}</span> },
  ]

  /* ── Stat cards ── */
  const statCards = [
    { label: 'Total Assets',        value: stats?.total_assets  || 0, description: 'All registered assets',     icon: Boxes,        tone: 'blue'   as const },
    { label: 'Available',           value: stats?.available     || 0, description: 'Ready for use',             icon: BadgeCheck,   tone: 'green'  as const },
    { label: 'Borrowed',            value: stats?.borrowed      || 0, description: 'Currently in use',          icon: Archive,      tone: 'amber'  as const },
    { label: 'Reserved',            value: stats?.reserved      || 0, description: 'Pending collection',        icon: Clock3,       tone: 'violet' as const },
    { label: 'Maintenance',         value: stats?.maintenance   || 0, description: 'Requires attention',        icon: Wrench,       tone: 'red'    as const },
    { label: 'Borrow Requests',     value: pendingReservations.length, description: 'Waiting for approval',     icon: CalendarClock,tone: 'amber'  as const },
    { label: 'Overdue Items',       value: overdueBorrowings.length,   description: 'Past due date',            icon: Activity,     tone: 'red'    as const },
    { label: 'Pending Maintenance', value: pendingMaintenance.length,  description: 'Scheduled repairs',        icon: Wrench,       tone: 'teal'   as const },
  ]

  const utilizationRate = stats?.total_assets
    ? Math.round(((stats.borrowed || 0) / stats.total_assets) * 100)
    : 0
  const isHealthy = overdueBorrowings.length === 0 && pendingReservations.length < 5

  return (
    <div className="space-y-6">

      <PageHeader
        title="Admin Dashboard"
        subtitle="Full system overview and management controls."
        actions={
          <span className="inline-flex items-center rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#6B7280] shadow-sm">
            Live system overview
          </span>
        }
      />

      {message && (
        <Alert tone={message.type} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* Stat grid: 1 → 2 → 4 cols */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <DashboardStatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Utilization + Health */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className={SECTION_TITLE}>Asset Utilization Rate</p>
              <p className={SECTION_SUB}>Percentage of assets currently borrowed</p>
            </div>
            <span className="text-[28px] font-extrabold text-[#1F2937]">{utilizationRate}%</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#F3F4F6]">
            <div
              className="h-full rounded-full bg-[#0D47A1] transition-all duration-500"
              style={{ width: `${utilizationRate}%` }}
              role="progressbar"
              aria-valuenow={utilizationRate}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className={SECTION_TITLE}>System Health</p>
              <p className={SECTION_SUB}>Based on overdue items and pending borrow requests</p>
            </div>
            <span className={['inline-flex items-center gap-1.5 text-[18px] font-bold', isHealthy ? 'text-[#2E7D32]' : 'text-[#B45309]'].join(' ')}>
              <ShieldCheck className="h-5 w-5" />
              {isHealthy ? 'Healthy' : 'Attention Needed'}
            </span>
          </div>
        </Card>
      </div>

      {/* Activity + Pending Reservations */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="mb-4">
            <p className={SECTION_TITLE}>Recent Activity</p>
            <p className={SECTION_SUB}>Latest system actions across all modules</p>
          </div>
          {loading ? <Spinner /> : recentActivity.length === 0
            ? <EmptyState title="No recent activity" description="System activity will appear here." />
            : <Table columns={activityColumns} rows={recentActivity} rowKey={(r) => r.id} empty={<EmptyState title="No recent activity" />} />
          }
        </Card>

        <Card>
          <div className="mb-4">
            <p className={SECTION_TITLE}>Borrow Requests Waiting for Approval</p>
            <p className={SECTION_SUB}>Review requests before assets are released.</p>
          </div>
          {loading ? <Spinner /> : pendingReservations.length === 0
            ? <EmptyState title="No pending requests" description="All borrow requests have been processed." />
            : <Table columns={reservationColumns} rows={pendingReservations} rowKey={(r) => r.id} empty={<EmptyState title="No pending requests" />} />
          }
        </Card>
      </div>

      {/* Overdue + Pending Maintenance */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="mb-4">
            <p className={SECTION_TITLE}>Overdue Borrowed Items</p>
            <p className={SECTION_SUB}>Items past due date requiring attention</p>
          </div>
          {loading ? <Spinner /> : overdueBorrowings.length === 0
            ? <EmptyState title="No overdue items" description="All items returned on time." />
            : <Table columns={borrowingColumns} rows={overdueBorrowings} rowKey={(r) => r.id} empty={<EmptyState title="No overdue items" />} />
          }
        </Card>

        <Card>
          <div className="mb-4">
            <p className={SECTION_TITLE}>Pending Maintenance</p>
            <p className={SECTION_SUB}>Scheduled maintenance requests awaiting completion</p>
          </div>
          {loading ? <Spinner /> : pendingMaintenance.length === 0
            ? <EmptyState title="No pending maintenance" description="No maintenance requests are currently scheduled." />
            : <Table columns={maintenanceColumns} rows={pendingMaintenance} rowKey={(r) => r.id} empty={<EmptyState title="No pending maintenance" />} />
          }
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <div className="mb-4">
          <p className={SECTION_TITLE}>Quick Actions</p>
          <p className={SECTION_SUB}>Common administrative tasks</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Button onClick={() => navigate('/assets')}>Manage Assets</Button>
          <Button variant="secondary" onClick={() => navigate('/reservations')}>Borrow Requests</Button>
          <Button variant="secondary" onClick={() => navigate('/maintenance')}>Maintenance</Button>
          <Button variant="secondary" onClick={() => navigate('/reports')}>View Reports</Button>
        </div>
      </Card>
    </div>
  )
}
