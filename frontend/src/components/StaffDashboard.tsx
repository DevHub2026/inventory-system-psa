/**
 * StaffDashboard
 *
 * Redesigned per approved Stage 2 / Stage 3 plan.
 *
 * Layout zones:
 *  1. Header — title + refresh
 *  2. KPI row (3–4 compact DashboardStatCard)
 *  3. Trend charts row (Borrowing + Reservation)
 *  4. Quick QR Scanner (preserved — real operational workflow)
 *  5. Pending Borrow Requests | Currently Borrowed Items (2-col)
 *  6. Overdue Items (urgent, shown only when count > 0)
 *
 * Explicitly NOT shown to Staff:
 *   - Asset Status Distribution donut
 *   - Supply Stock Health donut
 *   - System Overview user counts
 *   - Recent Activities feed
 *   - Operational Insights section
 *
 * All existing actions, table columns, QR scanner, and navigation preserved.
 * RBAC: rendered only for getUserRoleCategory(user) === 'staff'.
 */
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  CalendarClock,
  HandCoins,
  ClipboardCheck,
  TrendingUp,
  Camera,
  QrCode as QrCodeIcon,
  RefreshCw,
} from 'lucide-react'
import { Alert, Button, EmptyState, Input, Spinner, Table, type Column } from '@/components/ui'
import { DashboardStatCard } from '@/components/DashboardStatCard'
import { DashboardPanel } from '@/components/dashboard/DashboardPanel'
import { DashboardLineChart } from '@/components/dashboard/DashboardLineChart'
import { SharedQrScanner } from '@/components/qr/SharedQrScanner'
import { assetService } from '@/services/assetService'
import { borrowingService } from '@/services/borrowingService'
import { borrowExtensionService } from '@/services/borrowExtensionService'
import { dashboardService, type OverdueAsset } from '@/services/dashboardService'
import { reservationService } from '@/services/reservationService'
import { useAuth } from '@/hooks/useAuth'
import type { Borrowing, DashboardAnalytics, DashboardStats, Reservation } from '@/types'
import { affectsScope, notifyDataChanged, onDataChanged } from '@/utils/dataRefresh'
import { hasRole, isAdmin } from '@/utils/roleHelpers'

export function StaffDashboard() {
  const navigate = useNavigate()
  const { user }  = useAuth()

  const [stats,               setStats]               = useState<DashboardStats | null>(null)
  const [analytics,           setAnalytics]           = useState<DashboardAnalytics | null>(null)
  const [pendingReservations, setPendingReservations]  = useState<Reservation[]>([])
  const [activeBorrowings,    setActiveBorrowings]     = useState<Borrowing[]>([])
  const [overdueBorrowings,   setOverdueBorrowings]    = useState<OverdueAsset[]>([])
  const [pendingExtCount,     setPendingExtCount]      = useState(0)
  const [reissuedCount,       setReissuedCount]        = useState(0)
  const [loading,             setLoading]             = useState(true)
  const [chartsLoading,       setChartsLoading]       = useState(true)
  const [message,             setMessage]             = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [qrCode,              setQrCode]              = useState('')
  const [scannerOpen,         setScannerOpen]         = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setChartsLoading(true)
    try {
      const [reservationsRes, borrowingsRes, overdueRes, extCountRes, statsRes, analyticsRes] =
        await Promise.all([
          reservationService.list({ status: 'PENDING', per_page: 10 }),
          borrowingService.list({ status: 'BORROWED', per_page: 10 }),
          dashboardService.getOverdueAssets().catch(() => []),
          borrowExtensionService.getPendingExtensionRequests().catch(() => ({ count: 0 })),
          dashboardService.getStats().catch(() => null),
          dashboardService.getAnalytics().catch(() => null),
        ])
      setPendingReservations(reservationsRes.items)
      setActiveBorrowings(borrowingsRes.items)
      setOverdueBorrowings(overdueRes)
      setPendingExtCount(extCountRes.count ?? 0)
      setStats(statsRes)
      setAnalytics(analyticsRes)
      if (statsRes?.assets) {
        setReissuedCount(statsRes.assets.reissued_this_month ?? 0)
      }
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
          affectsScope(scope, 'reservations')
        ) {
          void loadData()
        }
      }),
    [loadData],
  )

  /* ── Actions (preserved exactly) ────────────────────────────────────── */
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

  const handleScanQR = async () => {
    const val = qrCode.trim()
    if (!val) {
      setMessage({ type: 'error', text: 'Please enter a QR code or asset ID.' })
      return
    }
    try {
      const borrowing = await assetService.scanTransaction(val)
      setMessage({
        type: 'success',
        text:
          borrowing.status === 'RETURNED'
            ? `Returned ${borrowing.asset_name ?? 'asset'} successfully.`
            : `Borrowing authorized for ${borrowing.asset_name ?? 'asset'} and marked as borrowed.`,
      })
      setQrCode('')
      notifyDataChanged('all')
      await loadData()
    } catch (transactionError: unknown) {
      try {
        const asset = await assetService.scan(val)
        setMessage({
          type: 'success',
          text: `${asset.name} found. Status: ${asset.status}.`,
        })
        setQrCode('')
        setTimeout(
          () =>
            navigate(
              `/assets?search=${encodeURIComponent(
                asset.psa_qr_identifier ?? asset.asset_number,
              )}`,
            ),
          500,
        )
      } catch {
        setMessage({
          type: 'error',
          text:
            transactionError instanceof Error
              ? transactionError.message
              : 'No asset or transaction matched that QR code.',
        })
      }
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
            maxWidth: 140,
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
        <Button size="sm" variant="success" onClick={() => void handleApproveReservation(r.id)}>
          Approve
        </Button>
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
      key: 'employee_name',
      header: 'Employee',
      render: (r) => <span style={{ fontSize: 13, color: '#475569' }}>{r.employee_name}</span>,
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
        <Button size="sm" variant="primary" onClick={() => void handleReturnBorrowing(r.id)}>
          Return
        </Button>
      ),
    },
  ]

  const overdueColumns: Column<OverdueAsset>[] = [
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
      key: 'borrower',
      header: 'Borrower',
      render: (r) => <span style={{ fontSize: 13, color: '#475569' }}>{r.borrower}</span>,
    },
    {
      key: 'days_overdue',
      header: 'Days Overdue',
      render: (r) => (
        <span
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 12,
            color: '#dc2626',
            fontWeight: 700,
          }}
        >
          {r.days_overdue}d
        </span>
      ),
    },
    {
      key: 'due_date',
      header: 'Due',
      render: (r) => (
        <span
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 12,
            color: '#ef4444',
            whiteSpace: 'nowrap',
          }}
        >
          {r.due_date}
        </span>
      ),
    },
  ]

  /* ── Derived values ──────────────────────────────────────────────────── */
  const pendingCount = stats?.reservations?.pending ?? pendingReservations.length
  const activeCount  = stats?.borrowings?.active    ?? activeBorrowings.length
  const overdueCount = stats?.borrowings?.overdue   ?? overdueBorrowings.length

  const showReissued = hasRole(user, 'Property Custodian') || isAdmin(user)

  const statCards = [
    {
      label: 'Borrow Requests',
      value: pendingCount,
      description: 'Waiting for approval',
      icon: CalendarClock,
      tone: 'blue' as const,
    },
    {
      label: 'Borrowed Items',
      value: activeCount,
      description: 'Currently borrowed',
      icon: HandCoins,
      tone: 'green' as const,
    },
    {
      label: 'Overdue Items',
      value: overdueCount,
      description: 'Need immediate follow-up',
      icon: AlertTriangle,
      tone: 'red' as const,
    },
    {
      label: 'Pending Extensions',
      value: pendingExtCount,
      description: 'Awaiting due-date extension approval',
      icon: ClipboardCheck,
      tone: 'amber' as const,
      onClick: () => navigate('/extension-requests'),
    },
    ...(showReissued
      ? [
          {
            label: 'Re-issued This Month',
            value: reissuedCount,
            description: 'Permanent accountability transfers',
            icon: TrendingUp,
            tone: 'teal' as const,
          },
        ]
      : []),
  ]

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
            Staff Dashboard
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 5, lineHeight: 1.5 }}>
            Manage operational requests and asset handovers.
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
        {loading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '24px 0',
              gridColumn: '1 / -1',
            }}
          >
            <Spinner />
          </div>
        ) : (
          statCards.map((c) => <DashboardStatCard key={c.label} compact {...c} />)
        )}
      </div>

      {/* ── 3. Trend charts ── */}
      <div className="dashboard-two-col">
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            padding: 20,
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
            Past 5 months
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
            Past 5 months
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

      {/* ── 4. Quick QR Scanner (preserved) ── */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          padding: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <QrCodeIcon size={18} style={{ color: '#003DA5' }} aria-hidden="true" />
          <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: 0 }}>
            Quick QR Scanner
          </p>
        </div>
        <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 14 }}>
          Scan an asset QR code to quickly process a borrow or return
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Input
              placeholder="Enter QR code or asset ID…"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleScanQR()
              }}
            />
          </div>
          <Button onClick={() => void handleScanQR()}>
            <QrCodeIcon size={15} style={{ marginRight: 6 }} />
            Scan
          </Button>
          <Button variant="secondary" onClick={() => setScannerOpen(true)}>
            <Camera size={15} style={{ marginRight: 6 }} />
            Scan to Borrow/Return
          </Button>
        </div>
      </div>

      <SharedQrScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        scanSource="sidebar_scanner"
        mode="modal"
        onCompleted={loadData}
      />

      {/* ── 5. Tables row ── */}
      <div className="dashboard-staff-tables">
        <DashboardPanel
          title="Borrow Requests"
          subtitle="Approve before releasing assets for pickup"
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

        <DashboardPanel
          title="Currently Borrowed Items"
          subtitle="Process returns for currently borrowed items"
          count={activeCount}
          countTone="amber"
          onViewAll={() => navigate('/borrowings')}
          loading={loading}
        >
          {activeBorrowings.length === 0 ? (
            <EmptyState
              title="No borrowed items"
              description="No items are currently borrowed."
            />
          ) : (
            <Table
              columns={borrowingColumns}
              rows={activeBorrowings}
              rowKey={(r) => r.id}
              empty={<EmptyState title="No borrowed items" />}
            />
          )}
        </DashboardPanel>
      </div>

      {/* ── 6. Overdue panel (urgent, only when count > 0) ── */}
      {overdueCount > 0 && (
        <DashboardPanel
          title="Overdue Items"
          subtitle="These items are past their return date"
          count={overdueCount}
          countTone="red"
          onViewAll={() => navigate('/borrowings')}
          loading={loading}
          urgent
        >
          <Table
            columns={overdueColumns}
            rows={overdueBorrowings}
            rowKey={(r) => r.id}
            empty={<EmptyState title="No overdue items" />}
          />
        </DashboardPanel>
      )}

    </div>
  )
}
