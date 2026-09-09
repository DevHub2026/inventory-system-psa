import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CalendarClock, ClipboardCheck, HandCoins, QrCode as QrCodeIcon, Camera, TrendingUp } from 'lucide-react'
import {
 Button, EmptyState, Spinner, Table, Alert, Input, type Column,
} from '@/components/ui'
import { DashboardStatCard } from '@/components/DashboardStatCard'
import { PageHeader } from '@/components/PageHeader'
import { SharedQrScanner } from '@/components/qr/SharedQrScanner'
import { assetService } from '@/services/assetService'
import { reservationService } from '@/services/reservationService'
import { borrowingService } from '@/services/borrowingService'
import { borrowExtensionService } from '@/services/borrowExtensionService'
import { dashboardService, type OverdueAsset } from '@/services/dashboardService'
import { useAuth } from '@/hooks/useAuth'
import type { Reservation, Borrowing, DashboardAnalytics, DashboardStats } from '@/types'


import { affectsScope, notifyDataChanged, onDataChanged } from '@/utils/dataRefresh'
import { hasRole, isAdmin } from '@/utils/roleHelpers'

/* ── Design tokens ── */
const T = {
  text:       '#1e293b',
  textMuted:  '#94a3b8',
  border:     '#e2e8f0',
  borderL:    '#f1f5f9',
  white:      '#ffffff',
  primary:    '#1565C0',
  primaryDk:  '#0D47A1',
  red:        '#dc2626',
  redBg:      '#fef2f2',
  redBdr:     '#fecaca',
  amber:      '#d97706',
  amberBg:    '#fffbeb',
  amberBdr:   '#fde68a',
}

function Panel({
  title, subtitle, count, countTone, onViewAll, loading, urgent, children,
}: {
  title: string
  subtitle: string
  count?: number
  countTone?: 'amber' | 'red'
  onViewAll?: () => void
  loading: boolean
  urgent?: boolean
  children: React.ReactNode
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      borderRadius: 16, border: `1px solid ${urgent ? T.redBdr : T.border}`,
      background: T.white, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        borderBottom: `1px solid ${urgent ? T.redBdr : T.borderL}`,
        background: urgent ? T.redBg : T.white,
        padding: '14px 20px', flexShrink: 0,
      }}>
        <div style={{ minWidth: 0 }}>
          <h3 style={{
            display: 'flex', alignItems: 'center',
            fontSize: 14, fontWeight: 600,
            color: urgent ? '#b91c1c' : T.text,
          }}>
            {title}
            {count !== undefined && count > 0 && countTone && (
              <span style={{
                marginLeft: 8, display: 'inline-flex', minWidth: 18,
                alignItems: 'center', justifyContent: 'center',
                borderRadius: '50%', padding: '0 6px',
                height: 18, fontSize: 10, fontWeight: 700, lineHeight: 1,
                background: countTone === 'red' ? '#fecaca' : T.amberBg,
                color: countTone === 'red' ? T.red : T.amber,
              }}>
                {count}
              </span>
            )}
          </h3>
          <p style={{
            marginTop: 2, fontSize: 12,
            color: urgent ? '#fca5a5' : T.textMuted,
          }}>
            {subtitle}
          </p>
        </div>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            style={{
              whiteSpace: 'nowrap', fontSize: 12, fontWeight: 500,
              color: urgent ? T.red : T.primary,
              background: 'none', border: 'none', cursor: 'pointer',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = urgent ? '#991b1b' : T.primaryDk }}
            onMouseLeave={(e) => { e.currentTarget.style.color = urgent ? T.red : T.primary }}
          >
            View all
          </button>
        )}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {loading
          ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}><Spinner /></div>
          : children
        }
      </div>
    </div>
  )
}

function MiniBarChart({ data, color }: { data: Array<{ label: string; value: number }>; color: string }) {
  const max = Math.max(...data.map((item) => Number(item.value)), 1)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(54px, 1fr))', gap: 10, alignItems: 'end', minHeight: 150, marginTop: 16 }}>
      {data.map((item) => (
        <div key={item.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ width: '100%', height: 120, display: 'flex', alignItems: 'end', justifyContent: 'center' }}>
            <div
              style={{
                width: '100%',
                maxWidth: 42,
                height: `${Math.max((Number(item.value) / max) * 100, Number(item.value) > 0 ? 18 : 6)}px`,
                borderRadius: '10px 10px 0 0',
                background: color,
                boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.4)',
              }}
              aria-label={`${item.label}: ${item.value}`}
            />
          </div>
          <span style={{ fontSize: 10, color: T.textMuted, textAlign: 'center', lineHeight: 1.3 }}>{item.label}</span>
          <strong style={{ fontSize: 11, color: T.text }}>{item.value}</strong>
        </div>
      ))}
    </div>
  )
}

export function StaffDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null)
  const [pendingReservations, setPendingReservations] = useState<Reservation[]>([])
  const [activeBorrowings,       setActiveBorrowings]       = useState<Borrowing[]>([])
  const [overdueBorrowings, setOverdueBorrowings] = useState<OverdueAsset[]>([])
  const [pendingExtensionsCount, setPendingExtensionsCount] = useState<number>(0)
  const [reissuedCount,          setReissuedCount]          = useState<number>(0)
  const [loading,                setLoading]                = useState(true)
  const [message,                setMessage]                = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [qrCode,                 setQrCode]                 = useState('')
  const [scannerOpen,            setScannerOpen]            = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [reservationsRes, borrowingsRes, overdueRes, extCountRes, statsRes, analyticsRes] = await Promise.all([
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
      setPendingExtensionsCount(extCountRes.count ?? 0)
      setStats(statsRes)
      setAnalytics(analyticsRes)
      if (statsRes?.assets) {
        setReissuedCount(statsRes.assets.reissued_this_month ?? 0)
      }
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to load dashboard data.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadData() }, [])
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

  const reservationColumns: Column<Reservation>[] = [
    { key: 'id',            header: '#',        render: (r) => <span className="font-mono text-[12px] text-slate-400">#{r.id}</span> },
    { key: 'employee_name', header: 'Employee', render: (r) => <span className="text-[13px] font-medium text-slate-800">{r.employee_name}</span> },
    { key: 'purpose',       header: 'Purpose',  render: (r) => <span className="block max-w-[140px] truncate text-[13px] text-slate-500">{r.purpose}</span> },
    { key: 'dates',         header: 'Schedule', render: (r) => <span className="whitespace-nowrap font-mono text-[12px] text-slate-400">{r.reserved_from} → {r.reserved_until}</span> },
    { key: 'actions',       header: '',         render: (r) => <Button size="sm" variant="success" onClick={() => handleApproveReservation(r.id)}>Approve</Button> },
  ]

  const borrowingColumns: Column<Borrowing>[] = [
    { key: 'id',            header: '#',        render: (r) => <span className="font-mono text-[12px] text-slate-400">#{r.id}</span> },
    { key: 'asset_name',    header: 'Asset',    render: (r) => <span className="text-[13px] font-medium text-slate-800">{r.asset_name}</span> },
    { key: 'employee_name', header: 'Employee', render: (r) => <span className="text-[13px] text-slate-500">{r.employee_name}</span> },
    { key: 'due_at',        header: 'Due',      render: (r) => <span className="whitespace-nowrap font-mono text-[12px] text-slate-400">{r.due_at}</span> },
    { key: 'actions',       header: '',         render: (r) => <Button size="sm" variant="primary" onClick={() => handleReturnBorrowing(r.id)}>Return</Button> },
  ]

  const overdueColumns: Column<OverdueAsset>[] = [
    { key: 'id',           header: '#',           render: (r) => <span className="font-mono text-[12px] text-slate-400">#{r.id}</span> },
    { key: 'asset_name',   header: 'Asset',       render: (r) => <span className="text-[13px] font-medium text-slate-800">{r.asset_name}</span> },
    { key: 'borrower',     header: 'Borrower',    render: (r) => <span className="text-[13px] text-slate-500">{r.borrower}</span> },
    { key: 'days_overdue', header: 'Days Overdue',render: (r) => <span className="font-mono text-[12px] text-red-600 font-semibold">{r.days_overdue}d</span> },
    { key: 'due_date',     header: 'Due',         render: (r) => <span className="whitespace-nowrap font-mono text-[12px] text-red-500">{r.due_date}</span> },
  ]

  const pendingCount = stats?.reservations?.pending ?? pendingReservations.length
  const activeCount = stats?.borrowings?.active ?? activeBorrowings.length
  const overdueCount = stats?.borrowings?.overdue ?? overdueBorrowings.length

  const statCards = [
    { label: 'Borrow Requests',    value: pendingCount,                               description: 'Waiting for approval',                icon: CalendarClock,  tone: 'blue'  as const },
    { label: 'Borrowed Items',     value: activeCount,                                description: 'Currently borrowed items',             icon: HandCoins,      tone: 'green' as const },
    { label: 'Pending Extensions', value: pendingExtensionsCount,                     description: 'Awaiting due date extension approval', icon: CalendarClock,  tone: 'amber' as const, onClick: () => navigate('/extension-requests') },
    { label: 'Overdue Items',      value: overdueCount,                               description: 'Need immediate follow-up',             icon: AlertTriangle,  tone: 'red'   as const },
    { label: 'Ready to Process',   value: pendingCount + activeCount,                 description: 'Operations requiring attention',       icon: ClipboardCheck, tone: 'amber' as const },
    ...(hasRole(user, 'Property Custodian') || isAdmin(user) ? [{
      label: 'Re-Issued This Month', value: reissuedCount, description: 'Permanent accountability transfers', icon: TrendingUp, tone: 'teal' as const,
    }] : []),
  ]

  const analyticsCharts = analytics ? [
    { title: 'Asset Status Distribution', data: analytics.asset_status_distribution, color: '#1565C0' },
    { title: 'Inventory Health', data: analytics.inventory_health, color: '#2E7D32' },
    { title: 'Borrowing Trend', data: analytics.borrowing_trend, color: '#D97706' },
    { title: 'Reservation Trend', data: analytics.reservation_trend, color: '#7C3AED' },
  ] : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <PageHeader title="Staff Dashboard" subtitle="Manage operational requests and asset handovers." />

      {message && <Alert tone={message.type} onClose={() => setMessage(null)}>{message.text}</Alert>}

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16,
      }}>
        {statCards.map((c) => <DashboardStatCard key={c.label} {...c} />)}
      </div>

      {analyticsCharts.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, minmax(0,1fr))', gap: 20 }} className="xl:!grid-cols-2">
          {analyticsCharts.map((chart) => (
            <div key={chart.title} style={{
              background: T.white,
              border: `1px solid ${T.border}`,
              borderRadius: 16,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              padding: 20,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: T.textMuted }}>
                {chart.title}
              </div>
              {chart.data.length > 0 ? (
                <MiniBarChart data={chart.data} color={chart.color} />
              ) : (
                <div style={{ paddingTop: 20, color: T.textMuted }}>No data available.</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Quick QR Scanner ── */}
      <div style={{
        background: T.white, borderRadius: 16,
        border: `1px solid ${T.border}`,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        padding: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <QrCodeIcon size={18} style={{ color: T.primary }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Quick QR Scanner</p>
        </div>
        <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 14 }}>
          Scan an asset QR code to quickly process a borrow or return
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Input
              placeholder="Enter QR code or asset ID…"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleScanQR() }}
            />
          </div>
          <Button onClick={() => void handleScanQR()}>
            <QrCodeIcon size={16} style={{ marginRight: 6 }} />
            Scan
          </Button>
          <Button variant="secondary" onClick={() => setScannerOpen(true)}>
            <Camera size={16} style={{ marginRight: 6 }} />
            Scan to Borrow/Return
          </Button>
        </div>
      </div>

      <SharedQrScanner open={scannerOpen} onClose={() => setScannerOpen(false)} scanSource="sidebar_scanner" mode="modal" onCompleted={loadData} />

      {/* Pending + Active */}
      <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <Panel
          title="Borrow Requests"
          subtitle="Approve before releasing assets for pickup"
          count={pendingCount}
          countTone="amber"
          onViewAll={() => navigate('/reservations')}
          loading={loading}
        >
          {pendingReservations.length === 0
            ? <EmptyState title="No pending requests" description="All borrow requests have been processed." />
            : <Table columns={reservationColumns} rows={pendingReservations} rowKey={(r) => r.id} empty={<EmptyState title="No pending requests" />} />
          }
        </Panel>

        <Panel
          title="Currently Borrowed Items"
          subtitle="Process returns for currently borrowed items"
          count={activeCount}
          countTone="amber"
          onViewAll={() => navigate('/borrowings')}
          loading={loading}
        >
          {activeBorrowings.length === 0
            ? <EmptyState title="No borrowed items" description="No items are currently borrowed." />
            : <Table columns={borrowingColumns} rows={activeBorrowings} rowKey={(r) => r.id} empty={<EmptyState title="No borrowed items" />} />
          }
        </Panel>
      </div>

      {/* Overdue – only shown when there are overdue items */}
      {overdueCount > 0 && (
        <Panel
          title="Overdue Items"
          subtitle="These items are past their return date"
          count={overdueCount}
          countTone="red"
          onViewAll={() => navigate('/borrowings')}
          loading={loading}
          urgent
        >
          <Table columns={overdueColumns} rows={overdueBorrowings} rowKey={(r) => r.id} empty={<EmptyState title="No overdue items" />} />
        </Panel>
      )}

    </div>
  )
}
