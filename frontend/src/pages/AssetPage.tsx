import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ScanLine, Printer, Search, Filter, ExternalLink,
  Eye, QrCode as QrIcon, Edit3, Trash2, ArrowUpRight, RotateCcw,
  Package, Wrench, Clock, Send, ToggleLeft, ToggleRight,
} from 'lucide-react'
import {
  Alert, Badge, Button, ConfirmDialog, EmptyState,
  Input, Modal, Pagination, Spinner, Card,
} from '@/components/ui'
import { assetService, type UpdateAssetPayload } from '@/services/assetService'
import { reservationService } from '@/services/reservationService'
import { borrowingService } from '@/services/borrowingService'
import { useAuth } from '@/hooks/useAuth'
import { ReceiptModal, type ReceiptRecord } from '@/components/ReceiptModal'
import { SharedQrScanner } from '@/components/qr/SharedQrScanner'
import { QrCode } from '@/components/QrCode'
import type { Asset, AssetStatus } from '@/types'
import { getEffectiveAssetStatus } from '@/utils/displayLabels'
import { affectsScope, notifyDataChanged, onDataChanged } from '@/utils/dataRefresh'
import { GenerateDocumentModal } from '@/components/documents/GenerateDocumentModal'
import { ReissueAssetModal } from '@/components/assets/ReissueAssetModal'
import { PermanentIssueModal } from '@/components/issuance/PermanentIssueModal'
import { IssuanceUserSearchSelect } from '@/components/issuance/IssuanceUserSearchSelect'
import { permanentIssuanceService } from '@/services/permanentIssuanceService'
import type { IssuanceUserSummary } from '@/types/permanentIssuance'
import { canManageIssuance, isAdmin, isStaff } from '@/utils/roleHelpers'


/* ── shared select / textarea style ── */
const SELECT_CLS =
  'w-full h-11 rounded-[10px] border border-[#E5E7EB] bg-white px-3.5 text-[14px] text-[#1F2937] ' +
  'shadow-[0_1px_2px_rgba(0,0,0,.05)] transition-colors duration-200 ' +
  'focus:border-[#0D47A1] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]/15'

const TEXTAREA_CLS =
  'block w-full rounded-[10px] border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-[14px] text-[#1F2937] ' +
  'placeholder:text-[#9CA3AF] shadow-[0_1px_2px_rgba(0,0,0,.05)] transition-colors duration-200 ' +
  'focus:border-[#0D47A1] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]/15'

const LABEL_CLS = 'mb-1.5 block text-[13px] font-medium text-[#1F2937]'

function hasPermanentHolder(asset: Asset): boolean {
  return Boolean(asset.issued_to_user_id || asset.issued_to)
}

function canPermanentIssueAsset(asset: Asset): boolean {
  return !['BORROWED', 'RESERVED', 'MAINTENANCE', 'RETIRED', 'DISPOSED'].includes(asset.status)
}

// ─── Color palette for summary cards ──────────────────────────────────────────
const colors = {
  blue:    { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE', icon: '#2563EB' },
  green:   { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0', icon: '#16A34A' },
  amber:   { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A', icon: '#D97706' },
  red:     { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', icon: '#EF4444' },
  violet:  { bg: '#FAF5FF', text: '#7C3AED', border: '#DDD6FE', icon: '#8B5CF6' },
  gray:    { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0', icon: '#94A3B8' },
}

// ─── Summary Card ──────────────────────────────────────────────────────────────
function SummaryCard({
  icon, color, label, value, onClick, active,
}: {
  icon: React.ReactNode
  color: typeof colors.blue
  label: string
  value: number
  onClick?: () => void
  active?: boolean
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: '1 1 0', minWidth: 180,
        background: '#fff',
        borderRadius: 14,
        border: `1px solid ${active ? color.icon : '#E2E8F0'}`,
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.04)',
        padding: '18px 20px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        display: 'flex', alignItems: 'center', gap: 14,
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: color.bg, border: `1px solid ${color.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </div>
      </div>
    </div>
  )
}

// ─── Action Cell ───────────────────────────────────────────────────────────────
interface ActionCellProps {
  asset: Asset
  canManageAssets: boolean
  canManageIssuance: boolean
  canCompleteBorrowing: boolean
  onView: () => void
  onQrLabel: () => void
  onEdit: () => void
  onDelete: () => void
  onBorrow: () => void
  onReserve: () => void
  onReturn: () => void
  onRelease: () => void
  onPermanentIssue: () => void
}

function ActionCell({
  asset, canManageAssets, canManageIssuance, canCompleteBorrowing,
  onView, onQrLabel, onEdit, onDelete, onBorrow, onReserve, onReturn, onRelease, onPermanentIssue,
}: ActionCellProps) {
  const [openMenu, setOpenMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(false)
      }
    }
    if (openMenu) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [openMenu])

  const iconBtn = (
    icon: React.ReactNode,
    label: string,
    onClick: () => void,
    variant: 'primary' | 'secondary' | 'success' | 'danger' = 'secondary'
  ) => {
    const v = variant === 'primary'
      ? { bg: '#1E40AF', color: '#fff', border: '#1E40AF', hoverBg: '#1D4ED8' }
      : variant === 'success'
        ? { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0', hoverBg: '#DCFCE7' }
        : variant === 'danger'
          ? { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA', hoverBg: '#FEE2E2' }
          : { bg: '#fff', color: '#475569', border: '#D1D5DB', hoverBg: '#F1F5F9' }
    return (
      <button
        onClick={onClick}
        title={label}
        style={{
          height: 32, width: 32, padding: 0,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${v.border}`,
          borderRadius: 8,
          background: v.bg,
          color: v.color,
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'all 0.15s',
        }}
      >
        {icon}
      </button>
    )
  }

  const menuItem = (icon: React.ReactNode, label: string, onClick: () => void, variant: 'normal' | 'danger' = 'normal') => (
    <button
      onClick={() => { onClick(); setOpenMenu(false) }}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
        padding: '8px 12px', border: 'none', background: 'transparent',
        color: variant === 'danger' ? '#DC2626' : '#1E293B',
        fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
        fontFamily: 'inherit', borderRadius: 6,
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#F1F5F9' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
    >
      {icon}
      <span style={{ whiteSpace: 'nowrap' }}>{label}</span>
    </button>
  )

  // Determine primary action based on status
  const primaryAction = asset.status === 'AVAILABLE' && canCompleteBorrowing
    ? iconBtn(<ArrowUpRight size={14} />, 'Borrow', onBorrow, 'primary')
    : asset.status === 'BORROWED' && canCompleteBorrowing
      ? iconBtn(<RotateCcw size={14} />, 'Return', onReturn, 'success')
      : null

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
      {/* Primary action */}
      {primaryAction}

      {/* More actions dropdown */}
      <div ref={menuRef} style={{ position: 'relative' }}>
        {iconBtn(
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none" />
          </svg>,
          'More actions',
          () => setOpenMenu(!openMenu),
        )}

        {openMenu && (
          <div style={{
            position: 'absolute', right: 0, top: '100%', marginTop: 4,
            background: '#fff', border: '1px solid #E2E8F0',
            borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            padding: 6, zIndex: 50, minWidth: 160,
          }}>
            {menuItem(<Eye size={14} />, 'View Details', onView)}
            {menuItem(<QrIcon size={14} />, 'QR Label', onQrLabel)}
            {asset.status === 'AVAILABLE' && menuItem(<Clock size={14} />, 'Request Borrow', onReserve)}
            {asset.status === 'RESERVED' && asset.reservation_context?.status === 'APPROVED' && canCompleteBorrowing && menuItem(<Send size={14} />, 'Release Asset', onRelease)}
            {canManageIssuance && !hasPermanentHolder(asset) && canPermanentIssueAsset(asset) && (
              menuItem(<Package size={14} />, 'Permanent Issue', onPermanentIssue)
            )}
            {canManageAssets && menuItem(<Edit3 size={14} />, 'Edit Asset', onEdit)}
            {canManageAssets && (
              <>
                <div style={{ height: 1, background: '#F1F5F9', margin: '4px 0' }} />
                {menuItem(<Trash2 size={14} />, 'Archive', onDelete, 'danger')}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function AssetPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const canManageAssets     = isAdmin(user)
  const canIssueAssets      = canManageIssuance(user)
  const canCompleteBorrowing = isAdmin(user) || isStaff(user)

  const [rows,      setRows]      = useState<Asset[]>([])
  const [page,      setPage]      = useState(1)
  const [lastPage,  setLastPage]  = useState(1)
  const [total,     setTotal]     = useState(0)
  const [search,    setSearch]    = useState(searchParams.get('search') ?? '')
  const [status,    setStatus]    = useState('')
  const [loading,   setLoading]   = useState(true)
  const [message,   setMessage]   = useState<string | null>(null)
  const [deleteId,  setDeleteId]  = useState<number | null>(null)
  const [borrowId,  setBorrowId]  = useState<number | null>(null)
  const [reserveId, setReserveId] = useState<number | null>(null)
  const [returnId,  setReturnId]  = useState<number | null>(null)
  const [releaseAsset, setReleaseAsset] = useState<Asset | null>(null)
  const [returnNotes,    setReturnNotes]    = useState('')
  const [borrowNotes,    setBorrowNotes]    = useState('')
  const [borrowDueDays,  setBorrowDueDays]  = useState<number | undefined>(undefined)
  const [reserveStartDate, setReserveStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [reserveEndDate,   setReserveEndDate]   = useState(new Date().toISOString().slice(0, 10))
  const [reserveRemarks,   setReserveRemarks]   = useState('')
  const [receipt,    setReceipt]    = useState<ReceiptRecord | null>(null)
  const [viewAsset,  setViewAsset]  = useState<Asset | null>(null)
  const [qrAsset,    setQrAsset]    = useState<Asset | null>(null)
  const [scannerOpen,setScannerOpen]= useState(false)
  const [editAsset,  setEditAsset]  = useState<Asset | null>(null)
  const [issueAsset, setIssueAsset] = useState<Asset | null>(null)
  const [saving,     setSaving]     = useState(false)
  const [issuing,    setIssuing]    = useState(false)
  const [issueUserId, setIssueUserId] = useState<number | null>(null)
  const [issueUser, setIssueUser] = useState<IssuanceUserSummary | null>(null)
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10))

  // Printable issuance receipt
  const [printIssuanceId, setPrintIssuanceId] = useState<number | null>(null)

  // Summary counts
  const [summary, setSummary] = useState({ available: 0, borrowed: 0, reserved: 0, maintenance: 0, total: 0 })

  // Re-issuance State
  const [reissueAsset, setReissueAsset] = useState<Asset | null>(null)
  const [detailTab, setDetailTab] = useState<'info' | 'history'>('info')
  const [issuanceHistory, setIssuanceHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Borrowable toggle state
  const [borrowableLoading, setBorrowableLoading] = useState(false)

  const [editForm, setEditForm] = useState<UpdateAssetPayload>({
    status: 'AVAILABLE', condition_status: '', remarks: '',
    purchase_date: null, purchase_cost: null, warranty_until: null,
  })

  async function load(nextPage = page, nextSearch = search) {
    setLoading(true)
    try {
      const result = await assetService.list({ page: nextPage, search: nextSearch || undefined, status: status || undefined })
      setRows(result.items)
      setPage(result.meta.current_page)
      setLastPage(result.meta.last_page)
      setTotal(result.meta.total)
    } finally {
      setLoading(false)
    }
  }

  // Load summary counts
  const loadSummary = useCallback(async () => {
    try {
      const all = await assetService.list({ per_page: 9999 })
      const count = (s: AssetStatus) => all.items.filter((a) => a.status === s).length
      setSummary({
        available: count('AVAILABLE'),
        borrowed: count('BORROWED'),
        reserved: count('RESERVED'),
        maintenance: count('MAINTENANCE'),
        total: all.meta.total,
      })
    } catch { /* best effort */ }
  }, [])

  useEffect(() => { void loadSummary() }, [loadSummary])

  async function openView(id: number) {
    setMessage(null)
    setDetailTab('info')
    setIssuanceHistory([])
    try {
      const assetData = await assetService.show(id)
      setViewAsset(assetData)
      
      setLoadingHistory(true)
      const historyData = await assetService.getIssuanceHistory(id)
      setIssuanceHistory(historyData)
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : 'Unable to load asset details.')
    } finally {
      setLoadingHistory(false)
    }
  }

  async function openEdit(id: number) {
    if (!canManageAssets) { setMessage('Only administrators can edit asset records.'); return }
    setMessage(null)
    try {
      const a = await assetService.show(id)
      setEditAsset(a)
      setEditForm({
        status: a.status,
        condition_status: a.condition_status ?? '',
        remarks: a.remarks ?? '',
        purchase_date: a.purchase_date ?? null,
        purchase_cost: typeof a.purchase_cost === 'string' ? parseFloat(a.purchase_cost) || null : (a.purchase_cost ?? null),
        warranty_until: a.warranty_until ?? null,
      })
      setIssueUserId(a.issued_to_user_id ?? null)
      setIssueUser(a.issued_to_user ? {
        id: a.issued_to_user.id,
        full_name: a.issued_to_user.full_name,
        employee_number: a.issued_to_user.employee_number,
        email: a.issued_to_user.email ?? undefined,
        department: a.issued_to_user.department ? { id: 0, name: a.issued_to_user.department } : null,
        office: a.issued_to_user.office ? { id: 0, name: a.issued_to_user.office } : null,
        roles: a.issued_to_user.roles?.map((name, index) => ({ id: index, name })) ?? [],
      } : null)
      setIssueDate(a.date_issued ?? new Date().toISOString().slice(0, 10))
    } catch (e: unknown) { setMessage(e instanceof Error ? e.message : 'Unable to load asset for editing.') }
  }

  async function openQrLabel(id: number) {
    setMessage(null)
    try { setQrAsset(await assetService.show(id)) }
    catch (e: unknown) { setMessage(e instanceof Error ? e.message : 'Unable to load PSA QR label.') }
  }

  async function submitEdit() {
    if (!editAsset) return
    const shouldIssue =
      !hasPermanentHolder(editAsset) &&
      issueUserId !== null &&
      Boolean(issueDate)

    setSaving(true); setMessage(null)
    try {
      await assetService.update(editAsset.id, {
        status:           editForm.status,
        condition_status: editForm.condition_status || null,
        remarks:          editForm.remarks || null,
        purchase_date:    editForm.purchase_date || null,
        purchase_cost:    editForm.purchase_cost ?? null,
        warranty_until:   editForm.warranty_until || null,
      })

      if (shouldIssue) {
        await permanentIssuanceService.assignPermanentIssue(editAsset.id, {
          issued_to_user_id: issueUserId!,
          date_issued: issueDate,
        })
        notifyDataChanged('assets')
        setMessage('Asset updated and permanently issued successfully.')
      } else {
        setMessage('Asset updated successfully.')
      }

      setEditAsset(null)
      await load(page)
      void loadSummary()
    } catch (e: unknown) { setMessage(e instanceof Error ? e.message : 'Unable to update asset.') }
    finally { setSaving(false) }
  }

  async function toggleBorrowable(asset: Asset) {
    const next = !(asset.is_borrowable ?? true)
    setBorrowableLoading(true)
    try {
      await assetService.setBorrowable(asset.id, next)
      // Refresh so the updated flag surfaces in the modal and table
      const refreshed = await assetService.show(asset.id)
      setEditAsset(refreshed)
      await load(page)
      setMessage(next ? 'Borrowing enabled for this asset.' : 'Borrowing disabled for this asset.')
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : 'Unable to update borrowable setting.')
    } finally {
      setBorrowableLoading(false)
    }
  }

  useEffect(() => { void load(1) }, [status])
  useEffect(() => {
    const q = searchParams.get('search') ?? ''
    setSearch(q); void load(1, q)
  }, [searchParams])

  /* Cross-component data refresh subscription */
  useEffect(() => onDataChanged((scope) => {
    if (affectsScope(scope, 'assets') || affectsScope(scope, 'borrowings') || affectsScope(scope, 'reservations')) {
      void load(page)
      void loadSummary()
      if (viewAsset) void openView(viewAsset.id)
      if (qrAsset)   void openQrLabel(qrAsset.id)
    }
  }), [page, search, status, viewAsset?.id, qrAsset?.id])

  // ── Table styles ─────────────────────────────────────────────────────────────
  const th: React.CSSProperties = {
    padding: '10px 16px',
    fontSize: 11,
    fontWeight: 700,
    color: '#94A3B8',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.07em',
    background: '#FAFBFC',
    borderBottom: '1px solid #E2E8F0',
    textAlign: 'left' as const,
    whiteSpace: 'nowrap' as const,
  }

  const td: React.CSSProperties = {
    padding: '14px 16px',
    fontSize: 13.5,
    color: '#374151',
    borderBottom: '1px solid #F1F5F9',
    verticalAlign: 'middle',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 32 }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: 26,
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.03em',
            lineHeight: 1.2,
          }}>
            Assets
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: '#64748B', lineHeight: 1.4 }}>
            Search, scan, borrow, and view PSA-tracked assets.
          </p>
        </div>

        <button
          onClick={() => setScannerOpen(true)}
          style={{
            height: 38, paddingInline: 18, borderRadius: 10,
            border: 'none', background: '#1E40AF', color: '#fff',
            fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit',
            display: 'inline-flex', alignItems: 'center', gap: 7,
            boxShadow: '0 2px 8px rgba(30,64,175,0.25)',
            transition: 'background 0.1s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#1D3FAB' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#1E40AF' }}
        >
          <ScanLine size={14} />
          Scan Asset QR
        </button>
      </div>

      {/* Alert message */}
      {message && <Alert tone="info" onClose={() => setMessage(null)}>{message}</Alert>}

      {/* ── Summary cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <SummaryCard
          icon={<Package size={20} style={{ color: colors.blue.icon }} />}
          color={colors.blue}
          label="Total Assets"
          value={summary.total}
          onClick={() => { setStatus(''); void load(1) }}
          active={status === ''}
        />
        <SummaryCard
          icon={<CheckCircle2 size={20} style={{ color: colors.green.icon }} />}
          color={colors.green}
          label="Available"
          value={summary.available}
          onClick={() => { setStatus('AVAILABLE'); void load(1) }}
          active={status === 'AVAILABLE'}
        />
        <SummaryCard
          icon={<ArrowUpRight size={20} style={{ color: colors.amber.icon }} />}
          color={colors.amber}
          label="Borrowed"
          value={summary.borrowed}
          onClick={() => { setStatus('BORROWED'); void load(1) }}
          active={status === 'BORROWED'}
        />
        <SummaryCard
          icon={<Clock size={20} style={{ color: colors.violet.icon }} />}
          color={colors.violet}
          label="Reserved"
          value={summary.reserved}
          onClick={() => { setStatus('RESERVED'); void load(1) }}
          active={status === 'RESERVED'}
        />
        <SummaryCard
          icon={<Wrench size={20} style={{ color: colors.red.icon }} />}
          color={colors.red}
          label="Maintenance"
          value={summary.maintenance}
          onClick={() => { setStatus('MAINTENANCE'); void load(1) }}
          active={status === 'MAINTENANCE'}
        />
      </div>

      {/* ── Table card ── */}
      <Card noPadding>
        {/* Toolbar */}
        <div style={{
          display: 'flex', gap: 10, alignItems: 'center',
          padding: '12px 20px',
          borderBottom: '1px solid #E2E8F0',
          background: '#fff',
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 0', minWidth: 0 }}>
            <Search size={14} style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: '#94A3B8', pointerEvents: 'none',
            }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void load(1) }}
              placeholder="Search by asset number, name, or category..."
              style={{
                width: '100%', height: 38, paddingLeft: 34, paddingRight: 14,
                borderRadius: 10, border: '1.5px solid #E2E8F0',
                fontSize: 13.5, color: '#1E293B', outline: 'none',
                boxSizing: 'border-box', fontFamily: 'inherit',
                background: '#F8FAFC',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#93C5FD'
                e.currentTarget.style.background = '#fff'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#E2E8F0'
                e.currentTarget.style.background = '#F8FAFC'
              }}
            />
          </div>

          {/* Status filter */}
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); void load(1) }}
            style={{
              height: 38, paddingInline: '12px 32px', borderRadius: 10,
              border: '1.5px solid #E2E8F0', fontSize: 13, color: status ? '#1E293B' : '#94A3B8',
              background: `#F8FAFC url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2394A3B8'/%3E%3C/svg%3E") no-repeat right 12px center`,
              backgroundSize: '10px 6px',
              appearance: 'none', cursor: 'pointer', fontFamily: 'inherit',
              outline: 'none', flexShrink: 0,
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#93C5FD' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0' }}
          >
            <option value="">All statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="BORROWED">Borrowed</option>
            <option value="RESERVED">Reserved</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="UNAVAILABLE">Unavailable</option>
            <option value="RETIRED">Retired</option>
            <option value="DISPOSED">Disposed</option>
          </select>

          {/* Search button */}
          <button
            onClick={() => void load(1)}
            style={{
              height: 38, paddingInline: 14, borderRadius: 10,
              border: '1.5px solid #E2E8F0', background: '#F8FAFC',
              fontSize: 13, fontWeight: 600, color: '#374151',
              cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', gap: 6,
              transition: 'background 0.12s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#F1F5F9' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#F8FAFC' }}
          >
            <Filter size={14} />
            Filter
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
              <Spinner />
            </div>
          ) : rows.length === 0 ? (
            <div style={{ padding: '80px 0' }}>
              <EmptyState
                title="No assets found"
                description="Try another search term or clear the status filter."
              />
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' as const }}>
              <colgroup>
                <col style={{ width: 140 }} />
                <col style={{ width: 140 }} />
                <col style={{ minWidth: 200 }} />
                <col style={{ width: 160 }} />
                <col style={{ width: 120 }} />
                <col style={{ width: 180 }} />
                <col style={{ width: 140 }} />
                <col style={{ width: 120 }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={th}>Asset Number</th>
                  <th style={th}>Property Number</th>
                  <th style={th}>Name</th>
                  <th style={th}>Category</th>
                  <th style={th}>Status</th>
                  <th style={th}>Accountability</th>
                  <th style={th}>Location</th>
                  <th style={{ ...th, textAlign: 'right' as const, paddingRight: 20 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr
                    key={r.id}
                    style={{
                      background: idx % 2 === 0 ? '#fff' : '#FAFBFC',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = '#F1F5F9' }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.background = idx % 2 === 0 ? '#fff' : '#FAFBFC'
                    }}
                  >
                    {/* Asset Number */}
                    <td style={td}>
                      <code style={{
                        fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace",
                        fontSize: 11.5, color: '#475569',
                        background: '#F1F5F9', padding: '3px 8px', borderRadius: 6,
                        display: 'inline-block',
                      }}>
                        {r.asset_number}
                      </code>
                    </td>

                    {/* Property Number */}
                    <td style={td}>
                      {r.property_number ? (
                        <code style={{
                          fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace",
                          fontSize: 11.5, color: '#475569',
                          background: '#F1F5F9', padding: '3px 8px', borderRadius: 6,
                          display: 'inline-block',
                        }}>
                          {r.property_number}
                        </code>
                      ) : (
                        <span style={{ color: '#94A3B8' }}>—</span>
                      )}
                    </td>

                    {/* Name */}
                    <td style={td}>
                      <div>
                        <span style={{ fontWeight: 600, color: '#0F172A', fontSize: 13.5 }}>
                          {r.name}
                        </span>
                        {r.description && (
                          <div style={{
                            fontSize: 11.5, color: '#9CA3AF', marginTop: 2,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            maxWidth: 300,
                          }}>
                            {r.description}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td style={td}>
                      <span style={{ color: '#64748B', fontSize: 13 }}>
                        {r.category ?? '—'}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={td}>
                      {(() => {
                        const eff = getEffectiveAssetStatus(r)
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                            <Badge tone={eff.tone}>{eff.label}</Badge>
                            {eff.subtext && eff.subtextTone && (
                              <Badge tone={eff.subtextTone}>{eff.subtext}</Badge>
                            )}
                          </div>
                        )
                      })()}
                    </td>

                    {/* Accountability */}
                    <td style={td}>
                      <span style={{ color: '#64748B', fontSize: 13 }}>
                        {r.issued_to_user?.full_name
                          ? `Issued to ${r.issued_to_user.full_name}`
                          : r.issued_to
                            ? `Issued to ${r.issued_to}`
                            : 'Unassigned'}
                      </span>
                      {r.is_unlinked_holder && (
                        <div style={{ fontSize: 11.5, color: '#B45309', marginTop: 2 }}>
                          Legacy unlinked holder
                        </div>
                      )}
                    </td>

                    {/* Location */}
                    <td style={td}>
                      <span style={{ color: '#64748B', fontSize: 13 }}>
                        {r.location ?? '—'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{
                      ...td, textAlign: 'right' as const,
                      paddingRight: 20, paddingTop: 10, paddingBottom: 10,
                    }}>
                      <ActionCell
                        asset={r}
                        canManageAssets={canManageAssets}
                        canManageIssuance={canIssueAssets}
                        canCompleteBorrowing={canCompleteBorrowing}
                        onView={() => void openView(r.id)}
                        onQrLabel={() => void openQrLabel(r.id)}
                        onEdit={() => void openEdit(r.id)}
                        onDelete={() => setDeleteId(r.id)}
                        onBorrow={() => setBorrowId(r.id)}
                        onReserve={() => setReserveId(r.id)}
                        onReturn={() => setReturnId(r.id)}
                        onRelease={() => r.reservation_context ? setReleaseAsset(r) : null}
                        onPermanentIssue={() => setIssueAsset(r)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div style={{ borderTop: '1px solid #F1F5F9', padding: '10px 20px' }}>
          <Pagination page={page} lastPage={lastPage} total={total} onPageChange={(p) => void load(p)} />
        </div>
      </Card>

      {/* ── Dialogs ── */}
      <ConfirmDialog
        open={deleteId !== null} title="Archive Asset"
        message="Are you sure you want to archive this asset? It will no longer appear as an active item."
        confirmLabel="Archive Item"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId === null) return
          void assetService.remove(deleteId).then(() => { setDeleteId(null); setMessage('Asset archived.'); void load(page); void loadSummary() })
        }}
      />

      <ConfirmDialog
        open={returnId !== null} title="Return Item"
        message={
          <div className="space-y-3">
            <p className="text-[14px] text-[#374151]">Return this borrowed item and mark it available again?</p>
            <div>
              <label className={LABEL_CLS}>Return Notes</label>
              <textarea className={TEXTAREA_CLS} rows={2} placeholder="Optional return notes" value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)} />
            </div>
          </div>
        }
        confirmLabel="Return Item" tone="primary"
        onCancel={() => { setReturnId(null); setReturnNotes('') }}
        onConfirm={() => {
          if (returnId === null) return
          void assetService.returnAsset(returnId, returnNotes).then(() => {
            setReturnId(null)
            setReturnNotes('')
            setMessage('Item returned successfully.')
            notifyDataChanged('all')
            void load(page)
            void loadSummary()
          })
        }}
      />

      <ConfirmDialog
        open={borrowId !== null} title="Borrow Item"
        message={
          <div className="space-y-3">
            <p className="text-[14px] text-[#374151]">Borrow this item now? A receipt will be generated for the transaction.</p>
            <div>
              <label className={LABEL_CLS}>Due Date (days)</label>
              <input type="number" min="1" className={SELECT_CLS} placeholder="Optional" value={borrowDueDays ?? ''} onChange={(e) => setBorrowDueDays(e.target.value ? Number(e.target.value) : undefined)} />
            </div>
            <div>
              <label className={LABEL_CLS}>Notes</label>
              <textarea className={TEXTAREA_CLS} rows={2} placeholder="Optional notes" value={borrowNotes} onChange={(e) => setBorrowNotes(e.target.value)} />
            </div>
          </div>
        }
        confirmLabel="Borrow Item"
        onCancel={() => { setBorrowId(null); setBorrowNotes(''); setBorrowDueDays(undefined) }}
        onConfirm={() => {
          if (borrowId === null) return
          void assetService.borrow(borrowId, borrowDueDays, borrowNotes).then((b) => {
            setBorrowId(null); setBorrowNotes(''); setBorrowDueDays(undefined)
            setReceipt({ type: 'Borrowing', code: b.receipt_code ?? `PSA-BOR-${b.id}`, payload: b.receipt_payload ?? `PSA-BOR-${b.id}|${b.asset_number ?? b.asset_id}|${b.user_id}`, employee: b.employee_name, assetName: b.asset_name, assetNumber: b.asset_number, timestamp: b.created_at, startDate: b.borrow_date, endDate: b.due_date, status: b.status, authorizedBy: b.authorized_by_name, authorizedAt: b.authorized_at, remarks: b.remarks })
            setMessage('Item borrowed successfully. Your receipt is ready.')
            notifyDataChanged('all')
            void load(page)
            void loadSummary()
          })
        }}
      />

      <ConfirmDialog
        open={reserveId !== null} title="Send Borrow Request"
        message={
          <div className="space-y-3">
            <p className="text-[14px] text-[#374151]">Send a request to borrow this asset later. Staff will approve it before release.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLS}>Start Date</label>
                <input type="date" className={SELECT_CLS} value={reserveStartDate} onChange={(e) => setReserveStartDate(e.target.value)} />
              </div>
              <div>
                <label className={LABEL_CLS}>End Date</label>
                <input type="date" className={SELECT_CLS} value={reserveEndDate} onChange={(e) => setReserveEndDate(e.target.value)} />
              </div>
            </div>
            <div>
              <label className={LABEL_CLS}>Purpose / Notes</label>
              <textarea className={TEXTAREA_CLS} rows={2} placeholder="Optional borrow request purpose" value={reserveRemarks} onChange={(e) => setReserveRemarks(e.target.value)} />
            </div>
          </div>
        }
        confirmLabel="Send Request"
        onCancel={() => { setReserveId(null); setReserveRemarks('') }}
        onConfirm={() => {
          if (reserveId === null) return
          void reservationService
            .create({
              asset_ids: [reserveId],
              start_date: reserveStartDate,
              end_date: reserveEndDate,
              remarks: reserveRemarks || undefined,
            })
            .then((res) => {
              setReserveId(null)
              setReserveRemarks('')
              setReceipt({
                type: 'Reservation',
                code: res.receipt_code ?? `PSA-RES-${res.id}`,
                payload: res.receipt_payload ?? `PSA-RES-${res.id}|${res.asset_numbers?.join(',') ?? res.asset_ids?.join(',')}|${res.user_id}`,
                employee: res.employee_name,
                assetName: res.asset_names?.join(', '),
                assetNumber: res.asset_numbers?.join(', '),
                timestamp: res.created_at,
                startDate: res.start_date,
                endDate: res.end_date,
                status: res.status,
                authorizedBy: res.authorized_by_name,
                authorizedAt: res.authorized_at,
                remarks: res.remarks,
              })
              setMessage('Borrow request sent successfully. Present the receipt QR/reference to staff for approval.')
              notifyDataChanged('all')
              void load(page)
              void loadSummary()
            })
        }}
      />

      <ConfirmDialog
        open={releaseAsset !== null}
        title="Release Asset"
        message={
          <div className="space-y-3">
            <p className="text-[14px] text-[#374151]">This will record the asset as physically released and mark it as currently borrowed.</p>
            {releaseAsset ? (
              <>
                <p className="text-[14px] text-[#374151]">Asset: {releaseAsset.name}</p>
                <p className="text-[14px] text-[#374151]">Asset No.: {releaseAsset.asset_number}</p>
              </>
            ) : null}
          </div>
        }
        confirmLabel="Release Asset"
        tone="primary"
        onCancel={() => setReleaseAsset(null)}
        onConfirm={() => {
          if (!releaseAsset || !releaseAsset.reservation_context) return
          void borrowingService.releaseFromReservation(releaseAsset.reservation_context.id).then(() => {
            setReleaseAsset(null)
            setMessage('Asset released and marked as currently borrowed.')
            notifyDataChanged('all')
            void load(page)
            void loadSummary()
          })
        }}
      />
 
      <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />
      <SharedQrScanner open={scannerOpen} onClose={() => setScannerOpen(false)} scanSource="assets_page_scanner" mode="modal" onCompleted={() => { void load(page); void loadSummary() }} />

      {/* ── View Asset ── */}
      <Modal
        open={viewAsset !== null}
        title="Asset Details"
        onClose={() => setViewAsset(null)}
        footer={
          viewAsset ? (
            <div className="flex items-center justify-between w-full gap-3">
              <div className="flex flex-wrap gap-2">
                {canIssueAssets && viewAsset && !hasPermanentHolder(viewAsset) && canPermanentIssueAsset(viewAsset) && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setIssueAsset(viewAsset)
                      setViewAsset(null)
                    }}
                  >
                    Permanent Issue
                  </Button>
                )}
                {viewAsset && hasPermanentHolder(viewAsset) &&
                  canIssueAssets &&
                  viewAsset.status !== 'BORROWED' &&
                  viewAsset.status !== 'RESERVED' &&
                  viewAsset.status !== 'MAINTENANCE' &&
                  !['RETIRED', 'DISPOSED'].includes(viewAsset.status) && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setReissueAsset(viewAsset)
                        setViewAsset(null)
                      }}
                    >
                      Re-Issue / Transfer
                    </Button>
                  )}
              </div>
              {viewAsset && hasPermanentHolder(viewAsset) && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setPrintIssuanceId(viewAsset.id)
                    setViewAsset(null)
                  }}
                >
                  <Printer size={14} className="mr-1.5" /> Generate Issuance Receipt (PAR)
                </Button>
              )}
            </div>
          ) : null
        }
      >
        {viewAsset && (
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex border-b border-slate-200">
              <button
                type="button"
                className={`flex-1 pb-2.5 text-center text-sm font-semibold border-b-2 transition-all ${
                  detailTab === 'info'
                    ? 'border-[#0D47A1] text-[#0D47A1]'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
                onClick={() => setDetailTab('info')}
              >
                General Info
              </button>
              <button
                type="button"
                className={`flex-1 pb-2.5 text-center text-sm font-semibold border-b-2 transition-all ${
                  detailTab === 'history'
                    ? 'border-[#0D47A1] text-[#0D47A1]'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
                onClick={() => setDetailTab('history')}
              >
                Issuance History
              </button>
            </div>

            {detailTab === 'info' ? (
              <dl className="grid gap-4 text-sm sm:grid-cols-2 mt-2">
                {[
                  { label: 'Asset Number', value: viewAsset.asset_number, mono: true },
                  { label: 'Property Number', value: viewAsset.property_number ?? '—', mono: true },
                  { label: 'Status', value: (() => {
                    const eff = getEffectiveAssetStatus(viewAsset)
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                        <Badge tone={eff.tone}>{eff.label}</Badge>
                        {eff.subtext && eff.subtextTone && (
                          <Badge tone={eff.subtextTone}>
                            {eff.subtext}
                            {viewAsset.reservation_context?.requester_name && (
                              <span style={{ fontWeight: 400, opacity: 0.75 }}> · {viewAsset.reservation_context.requester_name}</span>
                            )}
                          </Badge>
                        )}
                      </div>
                    )
                  })() },
                  { label: 'Name',         value: viewAsset.name },
                  { label: 'Category',     value: viewAsset.category ?? '—' },
                  { label: 'Office',       value: viewAsset.office ?? '—' },
                  { label: 'Location',     value: viewAsset.location ?? '—' },
                  { label: 'Model',        value: viewAsset.model ?? '—' },
                  { label: 'Condition',    value: viewAsset.condition_status ?? '—' },
                  { label: 'Description',  value: viewAsset.description ?? '—', full: true },
                  { label: 'Remarks',      value: viewAsset.remarks ?? '—',     full: true },
                  { label: 'Accountable To', value: viewAsset.issued_to_user?.full_name ?? viewAsset.issued_to ?? '—' },
                  { label: 'Employee No.', value: viewAsset.issued_to_user?.employee_number ?? (viewAsset.is_unlinked_holder ? 'Unlinked record' : '—') },
                  { label: 'Issued By', value: viewAsset.issued_by_name ?? '—' },
                  { label: 'Date Issued', value: viewAsset.date_issued ?? '—', full: true },
                ].map((item) => (
                  <div key={item.label} className={item.full ? 'sm:col-span-2' : ''}>
                    <dt className="text-[11px] font-bold uppercase tracking-wide text-[#9CA3AF]">{item.label}</dt>
                    <dd className={`mt-0.5 font-medium text-[#1F2937] ${item.mono ? 'font-mono text-xs' : 'text-[14px]'}`}>{item.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <div className="mt-2 space-y-4">
                {loadingHistory ? (
                  <div className="flex justify-center py-8">
                    <Spinner label="Loading history logs..." />
                  </div>
                ) : issuanceHistory.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500 italic">
                    No re-issuance history logs recorded for this asset.
                  </div>
                ) : (
                  <div className="relative border-l border-slate-200 ml-4 pl-6 space-y-6 py-2">
                    {issuanceHistory.map((h, idx) => (
                      <div key={h.id || idx} className="relative">
                        {/* Dot */}
                        <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white border-2 border-[#0D47A1]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#0D47A1]" />
                        </span>
                        
                        <div className="text-[11px] font-semibold text-slate-400">{h.transfer_date}</div>
                        <div className="mt-0.5 text-sm font-medium text-slate-800">
                          Accountability reassigned to <strong className="text-[#0D47A1]">{h.new_employee?.full_name || h.new_employee || 'N/A'}</strong>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Previous Holder: {h.previous_employee?.full_name || h.previous_employee || 'N/A'}
                        </div>
                        <div className="text-xs text-slate-400">
                          Authorized by: {h.officer?.full_name || h.officer || 'N/A'}
                        </div>
                        {h.reason && (
                          <div className="mt-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-2 max-w-md">
                            <strong>Reason:</strong> {h.reason}
                          </div>
                        )}
                        {h.remarks && (
                          <div className="mt-1 text-[11px] text-slate-400 italic">
                            Remarks: {h.remarks}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── QR Label ── */}
      <Modal
        open={qrAsset !== null} title="PSA Asset QR Label" onClose={() => setQrAsset(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setQrAsset(null)}>Close</Button>
            <Button onClick={() => window.print()}>Print QR Label</Button>
          </>
        }
      >
        {qrAsset && (
          <div className="asset-qr-print-area" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
            borderRadius: 16, border: '1px solid #e2e8f0', background: '#ffffff',
            padding: '32px 28px', textAlign: 'center',
          }}>
            {/* Header */}
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.2em', color: '#0B3D91',
                background: '#EEF4FF', border: '1px solid #C5D8FF',
                borderRadius: 20, padding: '4px 14px',
                marginBottom: 10,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <rect x="7" y="7" width="3" height="3" />
                  <rect x="14" y="7" width="3" height="3" />
                  <rect x="7" y="14" width="3" height="3" />
                  <rect x="14" y="14" width="3" height="3" />
                </svg>
                PSA Inventory
              </div>
              <h3 style={{
                fontSize: 20, fontWeight: 700, color: '#1e293b',
                margin: '0 0 4px', lineHeight: 1.25,
              }}>
                {qrAsset.name}
              </h3>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
                Permanent organization-owned asset identifier
              </p>
            </div>

            {/* Divider */}
            <div style={{ width: 60, height: 2, background: '#e2e8f0', borderRadius: 1 }} />

            {/* QR Code */}
            <div style={{
              borderRadius: 14, border: '1px solid #e2e8f0', background: '#ffffff',
              padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
              <QrCode value={qrAsset.psa_qr_payload ?? qrAsset.psa_qr_identifier ?? qrAsset.asset_number} />
            </div>

            {/* Identifier */}
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', letterSpacing: '0.02em' }}>
                {qrAsset.psa_qr_identifier ?? 'PSA QR not generated'}
              </div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
                Asset No: {qrAsset.asset_number}
              </div>
            </div>

            {/* Identifiers list */}
            <div style={{
              width: '100%', borderRadius: 10, background: '#f8fafc',
              border: '1px solid #f1f5f9', padding: 14, textAlign: 'left',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 8 }}>
                Supported scan identifiers
              </div>
              {(qrAsset.identifiers ?? []).length > 0 ? (
                <ul style={{
                  margin: 0, padding: 0, listStyle: 'none',
                  display: 'flex', flexDirection: 'column', gap: 6,
                }}>
                  {(qrAsset.identifiers ?? []).map((id) => (
                    <li key={id.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      fontSize: 12, color: '#64748b',
                    }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: '#0B3D91', flexShrink: 0,
                      }} />
                      <span style={{ fontWeight: 600, color: '#334155' }}>{id.identifier_type}:</span>
                      <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{id.identifier_value}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>No additional identifiers registered.</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Edit Asset Modal ── */}
      {/* ── Edit Asset Modal ── */}
      <Modal
        open={editAsset !== null}
        title={`Edit Asset: ${editAsset?.name ?? ''}`}
        onClose={() => setEditAsset(null)}
        maxWidth={680}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditAsset(null)}>Cancel</Button>
            <Button onClick={() => void submitEdit()} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </>
        }
      >
        {editAsset && (
          <div className="space-y-6">

            {/* Inventory-owned fields notice */}
            {editAsset.inventory_item_id && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                borderRadius: 12, border: '1px solid #BFDBFE',
                background: '#EFF6FF', padding: '12px 16px',
              }}>
                <div style={{ color: '#2563EB', flexShrink: 0, marginTop: 1 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1E40AF' }}>
                    Item details are managed in Inventory
                  </p>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: '#3B82F6', lineHeight: 1.5 }}>
                    Name, category, manufacturer, office, location, model and property number are edited from the linked Inventory Item only.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setEditAsset(null); navigate(`/inventory?highlight=${editAsset.inventory_item_id}`) }}
                  style={{
                    flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5,
                    borderRadius: 8, border: '1.5px solid #93C5FD', background: '#fff',
                    color: '#1D4ED8', fontSize: 12, fontWeight: 700, padding: '5px 12px',
                    cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.12s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#DBEAFE' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fff' }}
                >
                  <ExternalLink size={12} />
                  Open Inventory Item
                </button>
              </div>
            )}

            {/* A: Read-only item identity */}
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#94A3B8]">Item Identity (read-only)</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {([
                  { label: 'Item Name',       value: editAsset.name },
                  { label: 'Asset Number',    value: editAsset.asset_number,          mono: true },
                  { label: 'Property Number', value: editAsset.property_number ?? '—', mono: true },
                  { label: 'Category',        value: editAsset.category ?? '—' },
                  { label: 'Model',           value: editAsset.model ?? '—' },
                  { label: 'Office',          value: editAsset.office ?? '—' },
                  { label: 'Location',        value: editAsset.location ?? '—' },
                  { label: 'Description',     value: editAsset.description ?? '—' },
                ] as { label: string; value: string; mono?: boolean }[]).map(({ label, value, mono }) => (
                  <div key={label} className={label === 'Description' ? 'sm:col-span-2' : ''}>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#94A3B8] mb-0.5">{label}</p>
                    <p style={{
                      fontSize: 13.5, margin: 0,
                      fontFamily: mono ? "'SF Mono','Fira Code',ui-monospace,monospace" : undefined,
                      color: value === '—' ? '#CBD5E1' : '#1E293B', fontWeight: 500,
                      padding: '7px 12px', borderRadius: 8,
                      border: '1px solid #F1F5F9', background: '#F8FAFC',
                    }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* B: Operational status */}
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#94A3B8]">Operational Status</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={LABEL_CLS}>Status</label>
                  <select
                    className={SELECT_CLS}
                    value={editForm.status ?? 'AVAILABLE'}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as AssetStatus })}
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="UNAVAILABLE">Unavailable</option>
                    <option value="FOR_DISPOSAL">For Disposal</option>
                    <option value="RETIRED">Retired</option>
                    <option value="DISPOSED">Disposed</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS}>Condition</label>
                  <select
                    className={SELECT_CLS}
                    value={editForm.condition_status ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, condition_status: e.target.value || null })}
                  >
                    <option value="">— Not specified —</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                    <option value="POOR">Poor</option>
                    <option value="DAMAGED">Damaged</option>
                    <option value="FOR_REPAIR">For Repair</option>
                  </select>
                </div>
              </div>
            </div>

            {/* C: Procurement */}
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#94A3B8]">Procurement</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className={LABEL_CLS}>Purchase Date</label>
                  <input type="date" className={SELECT_CLS}
                    value={editForm.purchase_date ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, purchase_date: e.target.value || null })} />
                </div>
                <div>
                  <label className={LABEL_CLS}>Purchase Cost (₱)</label>
                  <input type="number" min={0} step="0.01" className={SELECT_CLS} placeholder="0.00"
                    value={editForm.purchase_cost ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, purchase_cost: e.target.value ? parseFloat(e.target.value) : null })} />
                </div>
                <div>
                  <label className={LABEL_CLS}>Warranty Until</label>
                  <input type="date" className={SELECT_CLS}
                    value={editForm.warranty_until ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, warranty_until: e.target.value || null })} />
                </div>
              </div>
            </div>

            {/* D: Borrowable toggle */}
            {editAsset.inventory_item_id && (
              <div>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#94A3B8]">Borrowing</p>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  borderRadius: 12, border: '1px solid #E2E8F0',
                  background: '#FAFBFC', padding: '14px 18px', gap: 16,
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0F172A' }}>
                      {(editAsset.is_borrowable ?? true) ? 'Borrowing enabled' : 'Borrowing disabled'}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                      {(editAsset.is_borrowable ?? true)
                        ? 'This item can be selected in borrow requests and QR workflows.'
                        : 'This item will not appear in borrow requests. Permanent issuance is still possible.'}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={borrowableLoading || ['BORROWED', 'RESERVED'].includes(editAsset.status)}
                    onClick={() => void toggleBorrowable(editAsset)}
                    style={{
                      flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 7,
                      borderRadius: 9, border: '1.5px solid',
                      borderColor: (editAsset.is_borrowable ?? true) ? '#BBF7D0' : '#E2E8F0',
                      background: (editAsset.is_borrowable ?? true) ? '#F0FDF4' : '#fff',
                      color: (editAsset.is_borrowable ?? true) ? '#166534' : '#64748B',
                      fontSize: 13, fontWeight: 700, padding: '7px 14px',
                      cursor: (borrowableLoading || ['BORROWED', 'RESERVED'].includes(editAsset.status)) ? 'not-allowed' : 'pointer',
                      opacity: borrowableLoading ? 0.6 : 1,
                      transition: 'all 0.15s',
                    }}
                  >
                    {(editAsset.is_borrowable ?? true)
                      ? <><ToggleRight size={16} /> Disable</>
                      : <><ToggleLeft size={16} /> Enable</>}
                  </button>
                </div>
                {['BORROWED', 'RESERVED'].includes(editAsset.status) && (
                  <p style={{ marginTop: 6, fontSize: 11.5, color: '#B45309' }}>
                    Borrowing cannot be changed while the asset is {editAsset.status.toLowerCase()}. Resolve the active transaction first.
                  </p>
                )}
              </div>
            )}

            {/* E: Remarks */}
            <div>
              <label className={LABEL_CLS}>Remarks / Internal Notes</label>
              <textarea className={TEXTAREA_CLS} rows={2}
                value={editForm.remarks ?? ''}
                onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                placeholder="Optional operational notes…" />
            </div>

            {/* F: Permanent Issuance */}
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#94A3B8]">Permanent Issuance</p>
              {hasPermanentHolder(editAsset) ? (
                <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-4 space-y-1.5">
                  <p className="text-sm font-semibold text-[#0F172A]">
                    Accountable To: {editAsset.issued_to_user?.full_name ?? editAsset.issued_to ?? '—'}
                  </p>
                  {editAsset.is_unlinked_holder && (
                    <p className="text-xs text-amber-700">This record uses a legacy unlinked holder name.</p>
                  )}
                  <p className="text-sm text-[#64748B]">
                    To transfer accountability, close this form and use <strong>Re-Issue / Transfer</strong> from Asset Details.
                  </p>
                </div>
              ) : canIssueAssets ? (
                <div className="space-y-3 rounded-xl border border-[#E5E7EB] p-4">
                  <IssuanceUserSearchSelect
                    value={issueUserId}
                    initialUser={issueUser}
                    onChange={(userId, user) => { setIssueUserId(userId); setIssueUser(user) }}
                  />
                  <div>
                    <label className={LABEL_CLS}>Date Issued</label>
                    <input type="date" className={SELECT_CLS} value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)} />
                  </div>
                  <Button
                    type="button"
                    disabled={issuing || !issueUserId}
                    onClick={() => {
                      if (!editAsset || !issueUserId) return
                      setIssuing(true)
                      void permanentIssuanceService.assignPermanentIssue(editAsset.id, {
                        issued_to_user_id: issueUserId,
                        date_issued: issueDate,
                      }).then(async () => {
                        setMessage('Asset permanently issued successfully.')
                        notifyDataChanged('assets')
                        const refreshed = await assetService.show(editAsset.id)
                        setEditAsset(refreshed)
                      }).catch((e: unknown) => {
                        setMessage(e instanceof Error ? e.message : 'Unable to issue asset.')
                      }).finally(() => setIssuing(false))
                    }}
                  >
                    {issuing ? 'Issuing…' : 'Issue Asset'}
                  </Button>
                  <p className="text-xs text-[#94A3B8]">
                    Select an employee and click <strong>Issue Asset</strong>, or use <strong>Save Changes</strong> to update status and issue in one step.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-[#64748B]">No permanent holder assigned.</p>
              )}
            </div>

            {/* G: Audit */}
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3.5">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#94A3B8]">Audit</p>
              <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                <div><span className="font-semibold text-slate-700">Created By:</span> {editAsset.created_by_name || 'System'}</div>
                <div><span className="font-semibold text-slate-700">Created At:</span> {editAsset.created_at ? new Date(editAsset.created_at).toLocaleString() : '—'}</div>
                <div><span className="font-semibold text-slate-700">Updated By:</span> {editAsset.updated_by_name || '—'}</div>
                <div><span className="font-semibold text-slate-700">Updated At:</span> {editAsset.updated_at ? new Date(editAsset.updated_at).toLocaleString() : '—'}</div>
              </div>
            </div>

          </div>
        )}
      </Modal>
      <GenerateDocumentModal
        open={printIssuanceId !== null}
        onClose={() => setPrintIssuanceId(null)}
        documentType="issuance"
        targetId={printIssuanceId}
        title="Property Acknowledgement Receipt (PAR)"
      />

      {/* Asset Re-Issuance Wizard Modal */}
      {reissueAsset && (
        <ReissueAssetModal
          open={reissueAsset !== null}
          onClose={() => setReissueAsset(null)}
          asset={reissueAsset}
          onSuccess={() => void load(page)}
        />
      )}

      {issueAsset && (
        <PermanentIssueModal
          open={issueAsset !== null}
          onClose={() => setIssueAsset(null)}
          asset={issueAsset}
          onSuccess={() => {
            setMessage('Asset permanently issued successfully.')
            notifyDataChanged('assets')
            void load(page)
            void loadSummary()
          }}
        />
      )}
    </div>
  )
}