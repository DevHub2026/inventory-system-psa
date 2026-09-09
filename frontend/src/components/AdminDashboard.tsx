/**
 * AdminDashboard
 *
 * Redesigned per approved Stage 2 / Stage 3 plan.
 *
 * Layout zones:
 *  1. Header — greeting + refresh
 *  2. Asset KPI row (6 compact DashboardStatCard)
 *  3. Charts row — Asset Status Distribution donut + Supply Stock Health donut
 *  4. Trends row — Borrowing Trend line + Reservation Trend line
 *  5. Bottom row — Operational Insights | Recent Activities | System Overview
 *  6. Pending Borrow Requests table (Approve / Reject inline)
 *
 * Data: all from existing getStats(), getAnalytics(), getRecentActivity(),
 * getOverdueAssets(), reservationService.list(), and
 * borrowExtensionService.getPendingExtensionRequests().
 * No new API calls. No fabricated metrics. No fake status banners.
 *
 * RBAC: Admin/Staff see full system data. This component is only rendered
 * when getUserRoleCategory(user) === 'admin' — enforced by DashboardPage.
 */
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Archive,
  BadgeCheck,
  Boxes,
  Clock3,
  TrendingUp,
  Wrench,
  RefreshCw,
} from 'lucide-react'
import { Alert, Button, EmptyState, Table, type Column } from '@/components/ui'
import { DashboardStatCard } from '@/components/DashboardStatCard'
import { DashboardPanel } from '@/components/dashboard/DashboardPanel'
import { DashboardDonutChart, type DonutSegment } from '@/components/dashboard/DashboardDonutChart'
import { DashboardLineChart } from '@/components/dashboard/DashboardLineChart'
import { OperationalInsights } from '@/components/dashboard/OperationalInsights'
import { SystemOverview } from '@/components/dashboard/SystemOverview'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { InventoryClassificationOverview } from '@/components/dashboard/InventoryClassificationOverview'
import { dashboardService } from '@/services/dashboardService'
import { reservationService } from '@/services/reservationService'
import { borrowExtensionService } from '@/services/borrowExtensionService'
import type {
  ActivityItem,
  DashboardAnalytics,
  DashboardStats,
  Reservation,
  DashboardSeriesPoint,
} from '@/types'
import { affectsScope, notifyDataChanged, onDataChanged } from '@/utils/dataRefresh'
import { useAuth } from '@/hooks/useAuth'

/* ── Human-readable asset status label map ──────────────────────────────── */
const ASSET_STATUS_LABELS: Record<string, string> = {
  AVAILABLE:   'Available',
  BORROWED:    'Borrowed',
  RESERVED:    'Reserved',
  MAINTENANCE: 'Under Maintenance',
  FOR_DISPOSAL:'For Disposal',
  RETIRED:     'Retired',
  DISPOSED:    'Disposed',
  UNAVAILABLE: 'Unavailable',
}

/* ── Asset status → donut segment colour ────────────────────────────────── */
const ASSET_STATUS_COLORS: Record<string, string> = {
  AVAILABLE:    '#2E7D32',
  BORROWED:     '#003DA5',
  RESERVED:     '#5B21B6',
  MAINTENANCE:  '#F9A825',
  FOR_DISPOSAL: '#64748B',
  RETIRED:      '#94A3B8',
  DISPOSED:     '#CBD5E1',
  UNAVAILABLE:  '#475569',
}
const ASSET_STATUS_COLOR_FALLBACK = '#CBD5E1'

/* ── Supply stock health colours ─────────────────────────────────────────── */
const SUPPLY_HEALTH_COLORS: Record<string, string> = {
  'In Stock':     '#2E7D32',
  'Low Stock':    '#F9A825',
  'Out of Stock': '#D32F2F',
}

/* ── Time-of-day greeting ────────────────────────────────────────────────── */
function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

/* ── Build donut segments from API data ──────────────────────────────────── */
function buildAssetDonut(data: DashboardSeriesPoint[]): DonutSegment[] {
  return data.map((p) => ({
    label: ASSET_STATUS_LABELS[p.label] ?? p.label,
    value: p.value,
    color: ASSET_STATUS_COLORS[p.label] ?? ASSET_STATUS_COLOR_FALLBACK,
  }))
}

function buildSupplyDonut(data: DashboardSeriesPoint[] | undefined): DonutSegment[] | null {
  if (!data) return null
  return data.map((p) => ({
    label: p.label,
    value: p.value,
    color: SUPPLY_HEALTH_COLORS[p.label] ?? '#CBD5E1',
  }))
}

/* ── Reservation table columns ───────────────────────────────────────────── */
function useReservationColumns(
  onApprove: (id: number) => void,
  onReject: (id: number) => void,
): Column<Reservation>[] {
  return [
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
      key: 'employee_name',
      header: 'Employee',
      render: (r) => (
        <span style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>
          {r.employee_name}
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
            color: '#475569',
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
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button size="sm" variant="success" onClick={() => onApprove(r.id)}>
            Approve
          </Button>
          <Button size="sm" variant="outline" onClick={() => onReject(r.id)}>
            Reject
          </Button>
        </div>
      ),
    },
  ]
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════════ */
export function AdminDashboard() {
  const navigate = useNavigate()
  const { user }  = useAuth()

  const [stats,               setStats]               = useState<DashboardStats | null>(null)
  const [analytics,           setAnalytics]           = useState<DashboardAnalytics | null>(null)
  const [recentActivity,      setRecentActivity]       = useState<ActivityItem[]>([])
  const [pendingReservations, setPendingReservations]  = useState<Reservation[]>([])
  const [overdueAssets,       setOverdueAssets]        = useState<{ id: number }[]>([])
  const [pendingExtCount,     setPendingExtCount]      = useState(0)
  const [loading,             setLoading]             = useState(true)
  const [chartsLoading,       setChartsLoading]       = useState(true)
  const [message,             setMessage]             = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setChartsLoading(true)
    try {
      const [statsRes, analyticsRes, activityRes, reservationsRes, extCountRes, overdueRes] =
        await Promise.all([
          dashboardService.getStats(),
          dashboardService.getAnalytics(),
          dashboardService.getRecentActivity(),
          reservationService.list({ status: 'PENDING', per_page: 10 }),
          borrowExtensionService.getPendingExtensionRequests().catch(() => ({ count: 0 })),
          dashboardService.getOverdueAssets().catch(() => []),
        ])
      setStats(statsRes)
      setAnalytics(analyticsRes)
      setRecentActivity(activityRes)
      setPendingReservations(reservationsRes.items)
      setPendingExtCount(extCountRes.count ?? 0)
      setOverdueAssets(overdueRes)
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to load dashboard data.',
      })
    } finally {
      setLoading(false)
      setChartsLoading(false)
    }
  }, [])

  useEffect(() => { void loadData() }, [loadData])

  useEffect(
    () =>
      onDataChanged((scope) => {
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
      }),
    [loadData],
  )

  /* ── Reservation actions (preserved exactly) ─────────────────────────── */
  const handleApproveReservation = async (id: number) => {
    try {
      await reservationService.approve(id)
      setMessage({ type: 'success', text: 'Borrow request approved successfully.' })
      notifyDataChanged('all')
      await loadData()
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to approve borrow request.',
      })
    }
  }

  const handleRejectReservation = async (id: number) => {
    try {
      await reservationService.reject(id)
      setMessage({ type: 'success', text: 'Borrow request rejected.' })
      notifyDataChanged('all')
      await loadData()
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to reject borrow request.',
      })
    }
  }

  const reservationColumns = useReservationColumns(
    (id) => void handleApproveReservation(id),
    (id) => void handleRejectReservation(id),
  )

  /* ── Derived values ──────────────────────────────────────────────────── */
  const assets       = stats?.assets
  const inventory    = stats?.inventory
  const reservations = stats?.reservations
  const users        = stats?.users

  const totalAssets = assets?.total ?? stats?.total_assets ?? 0

  const assetKpiCards = [
    {
      label: 'Total Assets',
      value: totalAssets,
      description: 'All registered assets',
      icon: Boxes,
      tone: 'blue' as const,
    },
    {
      label: 'Available',
      value: assets?.available ?? stats?.available ?? 0,
      description: 'Ready for use',
      icon: BadgeCheck,
      tone: 'green' as const,
    },
    {
      label: 'Borrowed',
      value: assets?.borrowed ?? stats?.borrowed ?? 0,
      description: 'Currently in use',
      icon: Archive,
      tone: 'amber' as const,
    },
    {
      label: 'Reserved',
      value: assets?.reserved ?? stats?.reserved ?? 0,
      description: 'Held for requests',
      icon: Clock3,
      tone: 'violet' as const,
    },
    {
      label: 'Under Maintenance',
      value: assets?.maintenance ?? stats?.maintenance ?? 0,
      description: 'Temporarily unavailable',
      icon: Wrench,
      tone: 'red' as const,
    },
    {
      label: 'Re-issued This Month',
      value: assets?.reissued_this_month ?? 0,
      description: 'Permanent transfers',
      icon: TrendingUp,
      tone: 'teal' as const,
    },
  ]

  const assetDonutData = buildAssetDonut(analytics?.asset_status_distribution ?? [])
  const supplyDonutData = buildSupplyDonut(analytics?.supply_stock_health)

  const pendingCount = reservations?.pending ?? pendingReservations.length
  const overdueCount = overdueAssets.length

  const userName = user?.full_name?.trim() || user?.name?.trim() || user?.email || ''

  /* ── Grid utility removed — grids use CSS classes instead ── */

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── 1. Header ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
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
            Here's what's happening with your inventory today.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void loadData()}
          loading={loading}
          aria-label="Refresh dashboard data"
        >
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>

      {/* Alert */}
      {message && (
        <Alert tone={message.type} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* ── 2. Asset KPI row (6 compact cards) ── */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.10em',
            color: '#64748b',
            marginBottom: 10,
          }}
        >
          Assets
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))',
            gap: 12,
          }}
        >
          {assetKpiCards.map((c) => (
            <DashboardStatCard key={c.label} compact {...c} />
          ))}
        </div>
      </div>

      {/* ── 3. Charts row — two donuts ── */}
      <div className="dashboard-two-col">
        {/* Asset Status Distribution */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            padding: 20,
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.10em',
              color: '#64748b',
              marginBottom: 4,
            }}
          >
            Asset Status Distribution
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 14 }}>
            Overview of all assets by status
          </div>
          <DashboardDonutChart
            data={assetDonutData}
            centerLabel={String(totalAssets)}
            centerSublabel="Total Assets"
            loading={chartsLoading}
            ariaLabel="Asset Status Distribution"
            actionLabel="View all assets"
            onAction={() => navigate('/assets')}
            height={200}
          />
        </div>

        {/* Supply Stock Health */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            padding: 20,
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.10em',
              color: '#64748b',
              marginBottom: 4,
            }}
          >
            Inventory Health (Supply Only)
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 14 }}>
            Stock health for SUPPLY category
          </div>

          {chartsLoading ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: 200,
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  border: '2px solid #e2e8f0',
                  borderTopColor: '#003DA5',
                  borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite',
                }}
              />
            </div>
          ) : supplyDonutData === null ? (
            <div>
              <EmptyState
                title="Supply stock health unavailable"
                description="The dashboard backend needs updating to provide classification-scoped supply data."
              />
            </div>
          ) : (
            <DashboardDonutChart
              data={supplyDonutData}
              centerLabel={String(
                supplyDonutData.reduce((s, d) => s + d.value, 0),
              )}
              centerSublabel="Supply Items"
              loading={false}
              ariaLabel="Supply Stock Health"
              actionLabel="View inventory"
              onAction={() => navigate('/inventory')}
              note="PPE and SE categories are not evaluated for stock health — they are not consumable."
              height={200}
            />
          )}
        </div>
      </div>

      {/* ── 4. Inventory Classification Overview ── */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          padding: 20,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.10em',
            color: '#64748b',
            marginBottom: 4,
          }}
        >
          Inventory Classification Overview
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>
          Item counts by classification — PPE, SE, and Supply
        </div>
        <InventoryClassificationOverview
          data={analytics?.inventory_classification}
          loading={chartsLoading}
        />
      </div>

      {/* ── 5. Trend charts row ── */}
      <div className="dashboard-two-col">
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            padding: 20,
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.10em',
              color: '#64748b',
              marginBottom: 4,
            }}
          >
            Borrowing Trend
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
            Borrowings over the past 5 months
          </div>
          <DashboardLineChart
            data={analytics?.borrowing_trend ?? []}
            color="#003DA5"
            loading={chartsLoading}
            ariaLabel="Borrowing Trend"
            emptyTitle="No borrowing activity in the past 5 months"
            emptyDescription="Borrowing data will appear here once records exist."
          />
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            padding: 20,
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.10em',
              color: '#64748b',
              marginBottom: 4,
            }}
          >
            Reservation Trend
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
            Reservations over the past 5 months
          </div>
          <DashboardLineChart
            data={analytics?.reservation_trend ?? []}
            color="#5B21B6"
            loading={chartsLoading}
            ariaLabel="Reservation Trend"
            emptyTitle="No reservation activity in the past 5 months"
            emptyDescription="Reservation data will appear here once records exist."
          />
        </div>
      </div>

      {/* ── 6. Bottom 3-column row ── */}
      <div className="dashboard-three-col">
        {/* Operational Insights */}
        <DashboardPanel
          title="Operational Insights"
          subtitle="Items requiring attention"
          loading={loading}
        >
          <OperationalInsights
            overdueCount={overdueCount}
            lowStockCount={inventory?.low_stock ?? 0}
            pendingRequests={pendingCount}
            pendingExtensions={pendingExtCount}
            maintenancePending={analytics?.maintenance_summary?.pending ?? 0}
            maintenanceOngoing={analytics?.maintenance_summary?.ongoing ?? 0}
          />
        </DashboardPanel>

        {/* Recent Activities */}
        <DashboardPanel
          title="Recent Activities"
          subtitle="Latest actions across all modules"
          onViewAll={() => navigate('/history')}
          loading={loading}
        >
          <ActivityFeed items={recentActivity} />
        </DashboardPanel>

        {/* System Overview */}
        <DashboardPanel
          title="System Overview"
          subtitle="User and role counts"
          loading={loading}
        >
          <SystemOverview
            total={users?.total ?? null}
            active={users?.active ?? null}
            employees={users?.employees ?? null}
            staff={users?.staff ?? null}
            administrators={users?.administrators ?? null}
          />
        </DashboardPanel>
      </div>

      {/* ── 7. Pending Borrow Requests table ── */}
      <DashboardPanel
        title="Pending Borrow Requests"
        subtitle="Waiting for approval before release"
        count={pendingCount}
        countTone="amber"
        onViewAll={() => navigate('/reservations')}
        loading={loading}
      >
        {pendingReservations.length === 0 ? (
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
      </DashboardPanel>

    </div>
  )
}
