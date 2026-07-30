import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CalendarClock, ClipboardCheck, HandCoins, QrCode as QrCodeIcon, Camera } from 'lucide-react'
import {
  Badge, Button, EmptyState, Spinner, Table, Alert, Input, type Column,
} from '@/components/ui'
import { DashboardStatCard } from '@/components/DashboardStatCard'
import { PageHeader } from '@/components/PageHeader'
import { AssetQrScanner } from '@/components/AssetQrScanner'
import { assetService } from '@/services/assetService'
import { reservationService } from '@/services/reservationService'
import { borrowingService } from '@/services/borrowingService'
import type { Reservation, Borrowing } from '@/types'
import { borrowingStatusTone } from '@/utils/statusTone'
import { borrowingStatusLabel } from '@/utils/displayLabels'
import { affectsScope, notifyDataChanged, onDataChanged } from '@/utils/dataRefresh'

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

export function StaffDashboard() {
  const navigate = useNavigate()
  const [pendingReservations, setPendingReservations] = useState<Reservation[]>([])
  const [activeBorrowings,    setActiveBorrowings]    = useState<Borrowing[]>([])
  const [overdueBorrowings,   setOverdueBorrowings]   = useState<Borrowing[]>([])
  const [loading,             setLoading]             = useState(true)
  const [message,             setMessage]             = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [qrCode,              setQrCode]              = useState('')
  const [scannerOpen,         setScannerOpen]         = useState(false)
  const [scannerMode,         setScannerMode]         = useState<'transaction' | 'authorize'>('transaction')

  const loadData = async () => {
    setLoading(true)
    try {
      const [reservationsRes, borrowingsRes] = await Promise.all([
        reservationService.list(),
        borrowingService.list(),
      ])
      setPendingReservations(reservationsRes.items.filter((r) => r.status === 'PENDING'))
      setActiveBorrowings(borrowingsRes.items.filter((b) => b.status === 'BORROWED' || b.status === 'ACTIVE'))
      setOverdueBorrowings(borrowingsRes.items.filter((b) => b.status === 'OVERDUE'))
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

  const overdueColumns: Column<Borrowing>[] = [
    { key: 'id',            header: '#',        render: (r) => <span className="font-mono text-[12px] text-slate-400">#{r.id}</span> },
    { key: 'asset_name',    header: 'Asset',    render: (r) => <span className="text-[13px] font-medium text-slate-800">{r.asset_name}</span> },
    { key: 'employee_name', header: 'Employee', render: (r) => <span className="text-[13px] text-slate-500">{r.employee_name}</span> },
    { key: 'status',        header: 'Status',   render: (r) => <Badge tone={borrowingStatusTone(r.status)}>{borrowingStatusLabel(r.status)}</Badge> },
    { key: 'due_at',        header: 'Due',      render: (r) => <span className="whitespace-nowrap font-mono text-[12px] text-red-500">{r.due_at}</span> },
    { key: 'actions',       header: '',         render: (r) => <Button size="sm" variant="danger" onClick={() => handleReturnBorrowing(r.id)}>Return</Button> },
  ]

  const statCards = [
    { label: 'Borrow Requests',  value: pendingReservations.length,                           description: 'Waiting for approval',          icon: CalendarClock,  tone: 'blue'  as const },
    { label: 'Borrowed Items',   value: activeBorrowings.length,                              description: 'Currently borrowed items',       icon: HandCoins,      tone: 'green' as const },
    { label: 'Overdue Items',    value: overdueBorrowings.length,                             description: 'Need immediate follow-up',       icon: AlertTriangle,  tone: 'red'   as const },
    { label: 'Ready to Process', value: pendingReservations.length + activeBorrowings.length, description: 'Operations requiring attention', icon: ClipboardCheck, tone: 'amber' as const },
  ]

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
          <Button variant="secondary" onClick={() => { setScannerMode('authorize'); setScannerOpen(true) }}>
            <Camera size={16} style={{ marginRight: 6 }} />
            Scan to Borrow
          </Button>
          <Button variant="secondary" onClick={() => { setScannerMode('transaction'); setScannerOpen(true) }}>
            <Camera size={16} style={{ marginRight: 6 }} />
            Scan to Borrow/Return
          </Button>
        </div>
      </div>

      <AssetQrScanner open={scannerOpen} mode={scannerMode} onClose={() => setScannerOpen(false)} onCompleted={loadData} />

      {/* Pending + Active */}
      <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <Panel
          title="Borrow Requests"
          subtitle="Approve before releasing assets for pickup"
          count={pendingReservations.length}
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
          onViewAll={() => navigate('/borrowings')}
          loading={loading}
        >
          {activeBorrowings.length === 0
            ? <EmptyState title="No borrowed items" description="No items are currently borrowed." />
            : <Table columns={borrowingColumns} rows={activeBorrowings} rowKey={(r) => r.id} empty={<EmptyState title="No borrowed items" />} />
          }
        </Panel>
      </div>

      {/* Overdue — only shown when there are overdue items */}
      {overdueBorrowings.length > 0 && (
        <Panel
          title="Overdue Items"
          subtitle="These items are past their return date"
          count={overdueBorrowings.length}
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