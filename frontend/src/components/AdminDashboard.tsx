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
  Card,
  EmptyState,
  Spinner,
  Table,
  type Column,
} from '@/components/ui'
import { DashboardStatCard } from '@/components/DashboardStatCard'
import { PageHeader } from '@/components/PageHeader'
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
import { cn } from '@/utils/cn'

/* ─────────────────────────────────────────────────────────────────────────────
   Small reusable sub-components local to this file
   ───────────────────────────────────────────────────────────────────────────── */

/** Slim section heading used inside dashboard panels */
function SectionLabel({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <h3 className="text-[14px] font-semibold text-slate-800">{title}</h3>
      {subtitle && <p className="mt-0.5 text-[12px] text-slate-400">{subtitle}</p>}
    </div>
  )
}

/** Horizontal divider with optional label */
function SectionDivider({ label }: { label?: string }) {
  if (!label) return <hr className="my-5 border-slate-100" />
  return (
    <div className="my-5 flex items-center gap-3">
      <hr className="flex-1 border-slate-100" />
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <hr className="flex-1 border-slate-100" />
    </div>
  )
}

/** Compact stat panel card (used in utilization / health row) */
function MetricPanel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white px-5 py-4',
        'shadow-[0_1px_3px_rgba(0,0,0,.06)]',
        className,
      )}
    >
      {children}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main component
   ───────────────────────────────────────────────────────────────────────────── */

export function AdminDashboard() {
  const navigate = useNavigate()

  /* ── State ── */
  const [stats,               setStats]               = useState<DashboardStats | null>(null)
  const [recentActivity,      setRecentActivity]      = useState<ActivityItem[]>([])
  const [pendingReservations, setPendingReservations] = useState<Reservation[]>([])
  const [overdueBorrowings,   setOverdueBorrowings]   = useState<Borrowing[]>([])
  const [pendingMaintenance,  setPendingMaintenance]  = useState<MaintenanceRequest[]>([])
  const [loading,             setLoading]             = useState(true)
  const [message,             setMessage]             = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  /* ── Data loading ── */
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
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to load dashboard data.',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadData() }, [])

  /* Cross-tab/component refresh */
  useEffect(
    () =>
      onDataChanged((scope) => {
        if (
          affectsScope(scope, 'dashboard') ||
          affectsScope(scope, 'borrowings') ||
          affectsScope(scope, 'reservations') ||
          affectsScope(scope, 'assets')
        ) {
          void loadData()
        }
      }),
    [],
  )

  /* ── Actions ── */
  const handleApproveReservation = async (id: number) => {
    try {
      await reservationService.approve(id)
      setMessage({ type: 'success', text: 'Borrow request approved successfully.' })
      await loadData()
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to approve borrow request.',
      })
    }
  }

  /* ── Derived values ── */
  const utilizationRate = stats?.total_assets
    ? Math.round(((stats.borrowed || 0) / stats.total_assets) * 100)
    : 0

  const isHealthy = overdueBorrowings.length === 0 && pendingReservations.length < 5

  /* ── Column definitions ── */
  const activityColumns: Column<ActivityItem>[] = [
    {
      key: 'action',
      header: 'Action',
      render: (r) => (
        <span className="block max-w-[240px] truncate text-[13px] font-medium text-slate-700">
          {r.action}
        </span>
      ),
    },
    {
      key: 'user',
      header: 'User',
      render: (r) => <span className="text-[13px] text-slate-600">{r.user}</span>,
    },
    {
      key: 'module',
      header: 'Module',
      render: (r) => (
        <Badge tone="blue">{r.module}</Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Time',
      render: (r) => (
        <span className="whitespace-nowrap font-mono text-[12px] text-slate-400">
          {new Date(r.created_at).toLocaleString()}
        </span>
      ),
    },
  ]

  const reservationColumns: Column<Reservation>[] = [
    {
      key: 'id',
      header: '#',
      render: (r) => (
        <span className="font-mono text-[12px] text-slate-400">#{r.id}</span>
      ),
    },
    {
      key: 'employee_name',
      header: 'Employee',
      render: (r) => (
        <span className="text-[13px] font-medium text-slate-800">{r.employee_name}</span>
      ),
    },
    {
      key: 'purpose',
      header: 'Purpose',
      render: (r) => (
        <span className="block max-w-[180px] truncate text-[13px] text-slate-500">
          {r.purpose}
        </span>
      ),
    },
    {
      key: 'dates',
      header: 'Schedule',
      render: (r) => (
        <span className="whitespace-nowrap font-mono text-[12px] text-slate-400">
          {r.reserved_from} → {r.reserved_until}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <Button
          size="sm"
          variant="success"
          onClick={() => handleApproveReservation(r.id)}
        >
          Approve
        </Button>
      ),
    },
  ]

  const borrowingColumns: Column<Borrowing>[] = [
    {
      key: 'id',
      header: '#',
      render: (r) => <span className="font-mono text-[12px] text-slate-400">#{r.id}</span>,
    },
    {
      key: 'asset_name',
      header: 'Asset',
      render: (r) => (
        <span className="text-[13px] font-medium text-slate-800">{r.asset_name}</span>
      ),
    },
    {
      key: 'employee_name',
      header: 'Borrower',
      render: (r) => <span className="text-[13px] text-slate-500">{r.employee_name}</span>,
    },
    {
      key: 'due_at',
      header: 'Due Date',
      render: (r) => (
        <span className="whitespace-nowrap font-mono text-[12px] text-red-500">{r.due_at}</span>
      ),
    },
  ]

  const maintenanceColumns: Column<MaintenanceRequest>[] = [
    {
      key: 'id',
      header: '#',
      render: (r) => <span className="font-mono text-[12px] text-slate-400">#{r.id}</span>,
    },
    {
      key: 'asset_name',
      header: 'Asset',
      render: (r) => (
        <span className="text-[13px] font-medium text-slate-800">{r.asset_name}</span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (r) => (
        <span className="block max-w-[200px] truncate text-[13px] text-slate-500">
          {r.description}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <Badge tone={maintenanceStatusTone(r.status)}>
          {maintenanceStatusLabel(r.status)}
        </Badge>
      ),
    },
    {
      key: 'scheduled_at',
      header: 'Scheduled',
      render: (r) => (
        <span className="whitespace-nowrap font-mono text-[12px] text-slate-400">
          {r.scheduled_at}
        </span>
      ),
    },
  ]

  /* ── Stat card rows ── */
  /* Row 1: primary asset counts */
  const primaryCards = [
    {
      label: 'Total Assets',
      value: stats?.total_assets || 0,
      description: 'All registered assets',
      icon: Boxes,
      tone: 'blue' as const,
    },
    {
      label: 'Available',
      value: stats?.available || 0,
      description: 'Ready for use',
      icon: BadgeCheck,
      tone: 'green' as const,
    },
    {
      label: 'Borrowed',
      value: stats?.borrowed || 0,
      description: 'Currently in use',
      icon: Archive,
      tone: 'amber' as const,
    },
    {
      label: 'Reserved',
      value: stats?.reserved || 0,
      description: 'Pending collection',
      icon: Clock3,
      tone: 'violet' as const,
    },
  ]

  /* Row 2: operational indicators */
  const operationalCards = [
    {
      label: 'Under Maintenance',
      value: stats?.maintenance || 0,
      description: 'Requires attention',
      icon: Wrench,
      tone: 'red' as const,
    },
    {
      label: 'Borrow Requests',
      value: pendingReservations.length,
      description: 'Awaiting approval',
      icon: CalendarClock,
      tone: 'amber' as const,
    },
    {
      label: 'Overdue Items',
      value: overdueBorrowings.length,
      description: 'Past return date',
      icon: Activity,
      tone: 'red' as const,
    },
    {
      label: 'Pending Maintenance',
      value: pendingMaintenance.length,
      description: 'Scheduled repairs',
      icon: Wrench,
      tone: 'teal' as const,
    },
  ]

  /* ── Render ── */
  return (
    <div className="space-y-6">

      {/* ── 1. Page header ── */}
      <PageHeader
        breadcrumb="PSA Region XII · Asset Management"
        title="Admin Dashboard"
        subtitle="Overview of assets, borrowings, reservations, maintenance, and system activity."
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-500 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Live
          </span>
        }
      />

      {/* ── Alert ── */}
      {message && (
        <Alert tone={message.type} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* ─────────────────────────────────────────────────────────────────
          ROW 1 — Primary asset counts
          4 cols desktop / 2 cols tablet / 1 col mobile
         ───────────────────────────────────────────────────────────────── */}
      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Asset Overview
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {primaryCards.map((card) => (
            <DashboardStatCard key={card.label} {...card} />
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          ROW 2 — Operational indicators
         ───────────────────────────────────────────────────────────────── */}
      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Operational Indicators
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {operationalCards.map((card) => (
            <DashboardStatCard key={card.label} {...card} />
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          ROW 3 — Utilization + Health
          Two equal panels side by side
         ───────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

        {/* Asset Utilization */}
        <MetricPanel>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Asset Utilization Rate
              </p>
              <div className="mt-1 flex items-end gap-2">
                <span className="text-[32px] font-bold leading-none tracking-tight text-slate-800">
                  {utilizationRate}%
                </span>
                <span className="mb-1 text-[12px] text-slate-400">of assets borrowed</span>
              </div>
            </div>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50">
              <TrendingUp className="h-5 w-5 text-[#1565C0]" />
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-4">
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#1565C0] transition-all duration-700"
                style={{ width: `${Math.min(utilizationRate, 100)}%` }}
                role="progressbar"
                aria-valuenow={utilizationRate}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] text-slate-400">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
        </MetricPanel>

        {/* System Health */}
        <MetricPanel>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                System Health
              </p>
              <div className="mt-1 flex items-center gap-2">
                {isHealthy ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <ShieldAlert className="h-5 w-5 text-amber-500" />
                )}
                <span
                  className={cn(
                    'text-[20px] font-bold leading-none',
                    isHealthy ? 'text-emerald-600' : 'text-amber-600',
                  )}
                >
                  {isHealthy ? 'Healthy' : 'Attention Needed'}
                </span>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-slate-400">
                {isHealthy
                  ? 'All critical indicators are within normal levels.'
                  : `${overdueBorrowings.length} overdue item${overdueBorrowings.length !== 1 ? 's' : ''} · ${pendingReservations.length} pending request${pendingReservations.length !== 1 ? 's' : ''} require attention.`}
              </p>
            </div>
            <span
              className={cn(
                'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
                isHealthy ? 'bg-emerald-50' : 'bg-amber-50',
              )}
            >
              <ShieldCheck
                className={cn('h-5 w-5', isHealthy ? 'text-emerald-500' : 'text-amber-500')}
              />
            </span>
          </div>

          {/* Health indicators */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              {
                label: 'Overdue',
                value: overdueBorrowings.length,
                ok: overdueBorrowings.length === 0,
              },
              {
                label: 'Pending Requests',
                value: pendingReservations.length,
                ok: pendingReservations.length < 5,
              },
            ].map((item) => (
              <div
                key={item.label}
                className={cn(
                  'rounded-lg px-3 py-2',
                  item.ok ? 'bg-slate-50' : 'bg-amber-50',
                )}
              >
                <p className="text-[11px] text-slate-400">{item.label}</p>
                <p
                  className={cn(
                    'mt-0.5 text-[18px] font-bold leading-none',
                    item.ok ? 'text-slate-700' : 'text-amber-600',
                  )}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </MetricPanel>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          ROW 4 — Recent Activity + Borrow Requests
         ───────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

        {/* Recent Activity */}
        <section className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,.06)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <div>
              <h3 className="text-[13px] font-semibold text-slate-800">Recent Activity</h3>
              <p className="text-[11px] text-slate-400">Latest actions across all modules</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate('/reports')}
            >
              View all
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Spinner />
              </div>
            ) : recentActivity.length === 0 ? (
              <EmptyState
                title="No recent activity"
                description="System activity will appear here."
              />
            ) : (
              <Table
                columns={activityColumns}
                rows={recentActivity}
                rowKey={(r) => r.id}
                empty={<EmptyState title="No recent activity" />}
              />
            )}
          </div>
        </section>

        {/* Borrow Requests Waiting for Approval */}
        <section className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,.06)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <div>
              <h3 className="text-[13px] font-semibold text-slate-800">
                Borrow Requests
                {pendingReservations.length > 0 && (
                  <span className="ml-2 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-100 px-1.5 text-[10px] font-bold text-amber-700">
                    {pendingReservations.length}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">Waiting for approval before release</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate('/reservations')}
            >
              View all
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Spinner />
              </div>
            ) : pendingReservations.length === 0 ? (
              <EmptyState
                title="No pending requests"
                description="All borrow requests have been processed."
              />
            ) : (
              <Table
                columns={reservationColumns}
                rows={pendingReservations}
                rowKey={(r) => r.id}
                empty={<EmptyState title="No pending requests" />}
              />
            )}
          </div>
        </section>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          ROW 5 — Overdue Items + Pending Maintenance
         ───────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

        {/* Overdue Borrowed Items */}
        <section className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,.06)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <div>
              <h3 className="text-[13px] font-semibold text-slate-800">
                Overdue Borrowed Items
                {overdueBorrowings.length > 0 && (
                  <span className="ml-2 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-100 px-1.5 text-[10px] font-bold text-red-600">
                    {overdueBorrowings.length}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">Items past their return date</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => navigate('/borrowings')}>
              View all
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Spinner />
              </div>
            ) : overdueBorrowings.length === 0 ? (
              <EmptyState
                title="No overdue items"
                description="All borrowed assets have been returned on time."
              />
            ) : (
              <Table
                columns={borrowingColumns}
                rows={overdueBorrowings}
                rowKey={(r) => r.id}
                empty={<EmptyState title="No overdue items" />}
              />
            )}
          </div>
        </section>

        {/* Pending Maintenance */}
        <section className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,.06)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <div>
              <h3 className="text-[13px] font-semibold text-slate-800">
                Pending Maintenance
                {pendingMaintenance.length > 0 && (
                  <span className="ml-2 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-teal-100 px-1.5 text-[10px] font-bold text-teal-700">
                    {pendingMaintenance.length}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">Scheduled repairs awaiting completion</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => navigate('/maintenance')}>
              View all
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Spinner />
              </div>
            ) : pendingMaintenance.length === 0 ? (
              <EmptyState
                title="No pending maintenance"
                description="No maintenance requests are currently scheduled."
              />
            ) : (
              <Table
                columns={maintenanceColumns}
                rows={pendingMaintenance}
                rowKey={(r) => r.id}
                empty={<EmptyState title="No pending maintenance" />}
              />
            )}
          </div>
        </section>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          ROW 6 — Quick Actions
         ───────────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,.06)]">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Quick Actions
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigate('/assets')}>Manage Assets</Button>
          <Button variant="secondary" onClick={() => navigate('/reservations')}>
            Borrow Requests
          </Button>
          <Button variant="secondary" onClick={() => navigate('/maintenance')}>
            Maintenance
          </Button>
          <Button variant="secondary" onClick={() => navigate('/reports')}>
            Reports
          </Button>
          <Button variant="secondary" onClick={() => navigate('/users')}>
            Users
          </Button>
        </div>
      </div>

    </div>
  )
}
