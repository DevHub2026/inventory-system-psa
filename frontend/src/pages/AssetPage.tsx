// @ts-nocheck
import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ScanLine, CheckCircle2, Printer, Search, Filter, ExternalLink,
  Eye, QrCode as QrIcon, Edit3, Trash2, ArrowUpRight, RotateCcw,
  Package, Wrench, Clock, Send, ToggleLeft, ToggleRight,
} from 'lucide-react'
import { BrowserQRCodeSvgWriter } from '@zxing/browser'
import {
  Alert, Badge, Button, ConfirmDialog, EmptyState,
  Modal, Pagination, Spinner, Card,
} from '@/components/ui'
import JSZip from 'jszip'
import { assetService, type UpdateAssetPayload, type IssuanceHistoryEntry } from '@/services/assetService'
import { reservationService } from '@/services/reservationService'
import { borrowingService } from '@/services/borrowingService'
import { useAuth } from '@/hooks/useAuth'
import { ReceiptModal, type ReceiptRecord } from '@/components/ReceiptModal'
import { SharedQrScanner } from '@/components/qr/SharedQrScanner'
import { QrCode } from '@/components/QrCode'
import { AssetSheetSelector } from '@/components/AssetSheetSelector'
import type { Asset, AssetStatus } from '@/types'
import { getEffectiveAssetStatus } from '@/utils/displayLabels'
import PrintQrModal from '@/components/PrintQrModal'
import { affectsScope, notifyDataChanged, onDataChanged } from '@/utils/dataRefresh'
import { GenerateDocumentModal } from '@/components/documents/GenerateDocumentModal'
import { ReissueAssetModal } from '@/components/assets/ReissueAssetModal'
import { PermanentIssueModal } from '@/components/issuance/PermanentIssueModal'
import { IssuanceUserSearchSelect } from '@/components/issuance/IssuanceUserSearchSelect'
import { permanentIssuanceService } from '@/services/permanentIssuanceService'
import type { IssuanceUserSummary } from '@/types/permanentIssuance'
import { canManageDisposal, canManageIssuance, isAdmin, isStaff, hasAnyRole } from '@/utils/roleHelpers'
import { listAuditLogs } from '@/services/auditService'
import ScrollableTableWrapper from '@/components/ui/ScrollableTableWrapper'


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
  return !['BORROWED', 'RESERVED', 'MAINTENANCE', 'FOR_DISPOSAL', 'RETIRED', 'DISPOSED'].includes(asset.status)
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
  const menuContainerRef = useRef<HTMLDivElement | null>(null)
  const selectRef = useRef<HTMLButtonElement | null>(null)
  const popupRef = useRef<HTMLDivElement | null>(null)
  const [popupPos, setPopupPos] = useState<React.CSSProperties>({})

  // Close on click outside (check trigger and popup since popup is portaled)
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (selectRef.current?.contains(target)) return
      if (popupRef.current?.contains(target)) return
      setOpenMenu(false)
    }
    if (openMenu) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [openMenu])

  const updatePopupPosition = useCallback(() => {
    const el = selectRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    if (r.bottom < 0 || r.top > window.innerHeight || r.right < 0 || r.left > window.innerWidth) {
      setOpenMenu(false)
      return
    }
    const gap = 4
    const MIN = 160
    const spaceBelow = window.innerHeight - r.bottom - gap - 8
    const spaceAbove = r.top - gap - 8
    let top: number
    if (spaceBelow >= 160 || spaceBelow >= spaceAbove) {
      top = r.bottom + gap
    } else {
      top = Math.max(8, r.top - gap - 200)
    }
    let left = Math.max(8, Math.min(r.right - MIN, window.innerWidth - MIN - 8))
    setPopupPos({ position: 'fixed', left, top, minWidth: MIN, zIndex: 9999 })
  }, [])

  useEffect(() => {
    if (!openMenu) return
    updatePopupPosition()
    const reposition = () => updatePopupPosition()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenMenu(false) }
    window.addEventListener('scroll', reposition, true)
    window.addEventListener('resize', reposition)
    document.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', reposition, true)
      window.removeEventListener('resize', reposition)
      document.removeEventListener('keydown', onKey)
    }
  }, [openMenu, updatePopupPosition])

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
        role="menuitem"
        tabIndex={0}
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

      {/* Print labels quick button (row) */}
      {/* More actions dropdown */}
      <div ref={menuContainerRef} style={{ position: 'relative' }} >
        {/* Use dedicated trigger button for portaled popup */}
        <button
          ref={selectRef}
          onClick={() => setOpenMenu((v) => !v)}
          title="More actions"
                  aria-haspopup="menu"
                  aria-expanded={openMenu}
                  style={{
                    height: 32, width: 32, padding: 0,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid #D1D5DB', borderRadius: 8, background: '#fff', cursor: 'pointer'
                  }}
                >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none" />
          </svg>
        </button>

        {openMenu && createPortal(
                  <div ref={popupRef} role="menu" aria-label="Row actions" style={{ ...popupPos, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 6 }}>
            {menuItem(<Eye size={14} />, 'View Details', onView)}
            {menuItem(<QrIcon size={14} />, 'QR Label', onQrLabel)}
            {asset.status === 'AVAILABLE' && menuItem(<Clock size={14} />, 'Request Borrow', onReserve)}
            {asset.status === 'RESERVED' && asset.reservation_context?.status === 'APPROVED' && canCompleteBorrowing && menuItem(<Send size={14} />, 'Release Asset', onRelease)}
            {canManageIssuance && !hasPermanentHolder(asset) && canPermanentIssueAsset(asset) && (
              menuItem(<Package size={14} />, 'Permanent Issue', onPermanentIssue)
            )}
            {canManageAssets && asset.status !== 'FOR_DISPOSAL' && asset.status !== 'DISPOSED' && menuItem(<Edit3 size={14} />, 'Edit Asset', onEdit)}
            {canManageAssets && (
              <>
                <div style={{ height: 1, background: '#F1F5F9', margin: '4px 0' }} />
                {menuItem(<Trash2 size={14} />, 'Archive', onDelete, 'danger')}
              </>
            )}
          </div>,
          document.body,
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
  const canManageDisposalActions = canManageDisposal(user)
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
  const [custodianUser, setCustodianUser] = useState<IssuanceUserSummary | null>(null)
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10))

  // Printable issuance receipt
  const [printIssuanceId, setPrintIssuanceId] = useState<number | null>(null)

  // Summary counts
  const [summary, setSummary] = useState({ available: 0, borrowed: 0, reserved: 0, maintenance: 0, total: 0, disposalPending: 0, disposalDisposed: 0, disposalTotal: 0 })
  const [activeSection, setActiveSection] = useState<'all' | 'available' | 'disposal' | 'archived'>('all')
  const [disposalPending, setDisposalPending] = useState<Asset[]>([])
  const [disposalDisposed, setDisposalDisposed] = useState<Asset[]>([])
  const [disposalLoading, setDisposalLoading] = useState(false)
  const [finalizeAsset, setFinalizeAsset] = useState<Asset | null>(null)
  const [cancelAsset, setCancelAsset] = useState<Asset | null>(null)
  const [finalizeDate, setFinalizeDate] = useState(new Date().toISOString().slice(0, 10))
  const [finalizeMethod, setFinalizeMethod] = useState('')
  const [finalizeApprovalRef, setFinalizeApprovalRef] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [markForDisposalAsset, setMarkForDisposalAsset] = useState<Asset | null>(null)
  const [markReason, setMarkReason] = useState('')
  const [markDate, setMarkDate] = useState(new Date().toISOString().slice(0, 10))
  const [markMethod, setMarkMethod] = useState('')
  const [markApprovalRef, setMarkApprovalRef] = useState('')
  const [disposalActionLoading, setDisposalActionLoading] = useState(false)

  // QR sheet selection
  const [sheetSelectionOpen, setSheetSelectionOpen] = useState(false)
  const [assetsForSelection, setAssetsForSelection] = useState<Asset[]>([])
  const [selectionLoading, setSelectionLoading] = useState(false)
  const [selectedAssetIds, setSelectedAssetIds] = useState<number[]>([])
  const [sheetGenerating, setSheetGenerating] = useState(false)
  // Print modal state: open + assets to print
  const [printModalOpen, setPrintModalOpen] = useState(false)
  const [printAssets, setPrintAssets] = useState<Asset[] | null>(null)

  const SHEET_SELECTION_STORAGE_KEY = 'psa.sheet.selectedAssetIds'

  // Load persisted selection from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SHEET_SELECTION_STORAGE_KEY)
      if (raw) {
        const ids = JSON.parse(raw) as number[]
        if (Array.isArray(ids) && ids.length > 0) {
          setSelectedAssetIds(ids)
          // fetch the corresponding assets for later use
          ;(async () => {
            try {
              const fetched = await Promise.all(ids.map(async (id) => { try { return await assetService.show(id) } catch { return null } }))
              setAssetsForSelection(fetched.filter(Boolean) as Asset[])
            } catch { /* ignore */ }
          })()
        }
      }
    } catch {
      // ignore parse errors
    }
  }, [])

  const persistSelectedAssetIds = (ids: number[]) => {
    setSelectedAssetIds(ids)
    try { localStorage.setItem(SHEET_SELECTION_STORAGE_KEY, JSON.stringify(ids)) } catch { /* ignore */ }
  }

  // Re-issuance State
  const [reissueAsset, setReissueAsset] = useState<Asset | null>(null)
  const [detailTab, setDetailTab] = useState<'info' | 'history'>('info')
  const [issuanceHistory, setIssuanceHistory] = useState<IssuanceHistoryEntry[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  type AuditLogItem = {
    id: number
    user?: string | null
    action: string
    module?: string
    description?: string | null
    old_values?: Record<string, unknown> | null
    new_values?: Record<string, unknown> | null
    created_at?: string
  }

  const [disposalAudit, setDisposalAudit] = useState<AuditLogItem[]>([])
  const [loadingDisposalAudit, setLoadingDisposalAudit] = useState(false)

  const [archivedRows, setArchivedRows] = useState<Asset[]>([])
  const [archivedPage, setArchivedPage] = useState(1)
  const [archivedLastPage, setArchivedLastPage] = useState(1)
  const [archivedTotal, setArchivedTotal] = useState(0)
  const [archivedLoading, setArchivedLoading] = useState(false)
  const [restoreAsset, setRestoreAsset] = useState<Asset | null>(null)
  const [restoreLoading, setRestoreLoading] = useState(false)

  // Borrowable toggle state
  const [borrowableLoading, setBorrowableLoading] = useState(false)

  const [editForm, setEditForm] = useState<UpdateAssetPayload>({
    status: 'AVAILABLE', condition_status: '', remarks: '', property_number: '', custodian_id: null,
  })

  const load = useCallback(async (nextPage: number = 1, nextSearch?: string) => {
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
  }, [status])

  const loadArchived = useCallback(async (nextPage: number = 1, nextSearch?: string) => {
    setArchivedLoading(true)
    try {
      const result = await assetService.listArchived({ page: nextPage, search: nextSearch || undefined })
      setArchivedRows(result.items)
      setArchivedPage(result.meta.current_page)
      setArchivedLastPage(result.meta.last_page)
      setArchivedTotal(result.meta.total)
    } finally {
      setArchivedLoading(false)
    }
  }, [])

  async function loadDisposalData() {
    setDisposalLoading(true)
    try {
      const [pending, disposed] = await Promise.all([
        assetService.list({ status: 'FOR_DISPOSAL', per_page: 9999 }),
        assetService.list({ status: 'DISPOSED', per_page: 9999 }),
      ])
      setDisposalPending(pending.items)
      setDisposalDisposed(disposed.items)
    } finally {
      setDisposalLoading(false)
    }
  }

  // Load summary counts
  const loadSummary = useCallback(async () => {
    try {
      const [all, pending, disposed] = await Promise.all([
        assetService.list({ per_page: 9999 }),
        assetService.list({ status: 'FOR_DISPOSAL', per_page: 9999 }),
        assetService.list({ status: 'DISPOSED', per_page: 9999 }),
      ])
      const count = (s: AssetStatus) => all.items.filter((a) => a.status === s).length
      setSummary({
        available: count('AVAILABLE'),
        borrowed: count('BORROWED'),
        reserved: count('RESERVED'),
        maintenance: count('MAINTENANCE'),
        total: all.meta.total,
        disposalPending: pending.meta.total,
        disposalDisposed: disposed.meta.total,
        disposalTotal: pending.meta.total + disposed.meta.total,
      })
      setDisposalPending(pending.items)
      setDisposalDisposed(disposed.items)
    } catch { /* best effort */ }
  }, [])

  useEffect(() => { void loadSummary() }, [loadSummary])

  const loadDisposalAudit = useCallback(async (assetId: number) => {
    setLoadingDisposalAudit(true)
    try {
      const logs = (await listAuditLogs({ module: 'Asset' })) as AuditLogItem[]
      // Filter logs that reference this asset by id, asset number, or name
      const filtered = (logs || []).filter((l: AuditLogItem) => {
        const desc = (l.description || '')?.toString?.() ?? ''
        const oldVals = l.old_values ? JSON.stringify(l.old_values) : ''
        const newVals = l.new_values ? JSON.stringify(l.new_values) : ''
        const containsId = oldVals.includes(`"id":${assetId}`) || newVals.includes(`"id":${assetId}`) || desc.includes(`#${assetId}`)
        const containsAssetNumber = viewAsset && desc.includes(viewAsset.asset_number || '')
        return containsId || containsAssetNumber || desc.toLowerCase().includes('disposal') || ['ASSET_MARKED_FOR_DISPOSAL', 'ASSET_DISPOSED', 'ASSET_DISPOSAL_CANCELLED'].includes(l.action)
      })
      setDisposalAudit(filtered)
    } catch (_e) {
      // non-fatal - ignore
    } finally {
      setLoadingDisposalAudit(false)
    }
  }, [viewAsset])

  const openView = useCallback(async (id: number) => {
    setMessage(null)
    setDetailTab('info')
    setIssuanceHistory([])
    setDisposalAudit([])
    try {
      const assetData = await assetService.show(id)
      setViewAsset(assetData)

      setLoadingHistory(true)
      const historyData = await assetService.getIssuanceHistory(id)
      setIssuanceHistory(historyData)

      // Load disposal-related audit logs for this asset if the current user has permission
      try {
        // Only admins or auditors can call the audit log API per backend middleware
        if (hasAnyRole(user, ['Super Administrator', 'System Administrator', 'Auditor'])) {
          void loadDisposalAudit(id)
        }
      } catch {
        // ignore non-fatal errors here
      }
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : 'Unable to load asset details.')
    } finally {
      setLoadingHistory(false)
    }
  }, [user, loadDisposalAudit])

  const openArchivedView = useCallback((asset: Asset) => {
    setMessage(null)
    setDetailTab('info')
    setIssuanceHistory([])
    setDisposalAudit([])
    setViewAsset(asset)
  }, [])

  async function openEdit(id: number) {
    if (!canManageAssets) { setMessage('Only administrators can edit asset records.'); return }
    setMessage(null)
    try {
      const a = await assetService.show(id)
      if (a.status === 'FOR_DISPOSAL' || a.status === 'DISPOSED') {
        setMessage('Disposal assets cannot be edited through the regular asset modal. Use the Disposal workflow instead.')
        return
      }
      setEditAsset(a)
      setEditForm({
        status: a.status,
        condition_status: a.condition_status ?? '',
        remarks: a.remarks ?? '',
        property_number: a.property_number ?? '',
        custodian_id: a.custodian_id ?? null,
      })
      setIssueUserId(a.issued_to_user_id ?? null)
      setCustodianUser(a.custodian ? ((): any => {
        const cust: any = a.custodian
        return {
          id: cust.id,
          full_name: cust.full_name,
          employee_number: cust.employee_number,
          email: cust.email ?? undefined,
          department: cust.department ? { id: 0, name: cust.department } : null,
          office: cust.office ? { id: 0, name: cust.office } : null,
          roles: cust.roles?.map((name: any, index: number) => ({ id: index, name })) ?? [],
        }
      })() : null)
      setIssueUser(a.issued_to_user ? ((): any => {
        const u: any = a.issued_to_user
        return {
          id: u.id,
          full_name: u.full_name,
          employee_number: u.employee_number,
          email: u.email ?? undefined,
          department: u.department ? { id: 0, name: u.department } : null,
          office: u.office ? { id: 0, name: u.office } : null,
          roles: u.roles?.map((name: any, index: number) => ({ id: index, name })) ?? [],
        }
      })() : null)
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
        custodian_id:     editForm.custodian_id ?? null,
        // property_number is only editable here for standalone assets (no linked InventoryItem).
        // For inventory-linked assets, Property Number is edited from Inventory Edit.
        ...(editAsset.inventory_item_id ? {} : { property_number: editForm.property_number || null }),
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

  useEffect(() => {
    if (activeSection === 'disposal') {
      void loadDisposalData()
      return
    }
    if (activeSection === 'archived') {
      void loadArchived(1)
      return
    }
    void load(1)
  }, [activeSection, load, loadArchived])

  useEffect(() => {
    const q = searchParams.get('search') ?? ''
    setSearch(q)
    if (activeSection === 'disposal') {
      void loadDisposalData()
      return
    }
    if (activeSection === 'archived') {
      void loadArchived(1, q)
      return
    }
    void load(1, q)
  }, [activeSection, load, loadArchived, searchParams])

  /* Cross-component data refresh subscription */
  useEffect(() => onDataChanged((scope) => {
    if (affectsScope(scope, 'assets') || affectsScope(scope, 'borrowings') || affectsScope(scope, 'reservations')) {
      if (activeSection === 'disposal') {
        void loadDisposalData()
      } else if (activeSection === 'archived') {
        void loadArchived(archivedPage, search)
      } else {
        void load(page)
      }
      void loadSummary()
      if (viewAsset) void openView(viewAsset.id)
      if (qrAsset)   void openQrLabel(qrAsset.id)
    }
  }), [activeSection, archivedPage, page, search, status, viewAsset?.id, qrAsset?.id, load, loadArchived, loadSummary, viewAsset, qrAsset, openView])

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

  const renderDisposalField = (label: string, value: React.ReactNode) => (
    <div style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 13, color: '#0F172A', marginTop: 4, fontWeight: 600, overflowWrap: 'anywhere' }}>{value ?? '—'}</div>
    </div>
  )

  async function handleMarkForDisposal() {
    if (!markForDisposalAsset) return
    if (!markReason.trim()) {
      setMessage('Please provide a disposal reason before marking the asset for disposal.')
      return
    }
    if (!markDate.trim()) {
      setMessage('Please provide a disposal date before marking the asset for disposal.')
      return
    }

    setDisposalActionLoading(true)
    try {
      const updated = await assetService.markForDisposal(markForDisposalAsset.id, {
        disposal_reason: markReason.trim(),
        disposal_date: markDate,
        disposal_method: markMethod.trim() || undefined,
        disposal_approval_ref: markApprovalRef.trim() || undefined,
      })
      setMarkForDisposalAsset(null)
      setMarkReason('')
      setMarkDate(new Date().toISOString().slice(0, 10))
      setMarkMethod('')
      setMarkApprovalRef('')
      if (viewAsset?.id === updated.id) {
        setViewAsset(updated)
      }
      setMessage('Asset marked for disposal successfully.')
      notifyDataChanged('assets')
      void load(page)
      void loadSummary()
      void loadDisposalData()
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : 'Unable to mark asset for disposal.')
    } finally {
      setDisposalActionLoading(false)
    }
  }

  async function handleFinalizeDisposal() {
    if (!finalizeAsset) return
    if (!finalizeMethod.trim()) {
      setMessage('Please provide a disposal method before finalizing the asset.')
      return
    }

    setDisposalActionLoading(true)
    try {
      const updated = await assetService.finalizeDisposal(finalizeAsset.id, {
        disposal_date: finalizeDate,
        disposal_method: finalizeMethod.trim(),
        disposal_approval_ref: finalizeApprovalRef.trim() || undefined,
      })
      setFinalizeAsset(null)
      setFinalizeDate(new Date().toISOString().slice(0, 10))
      setFinalizeMethod('')
      setFinalizeApprovalRef('')
      if (viewAsset?.id === updated.id) {
        setViewAsset(updated)
      }
      setMessage('Asset finalized as disposed successfully.')
      notifyDataChanged('assets')
      void load(page)
      void loadSummary()
      void loadDisposalData()
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : 'Unable to finalize disposal.')
    } finally {
      setDisposalActionLoading(false)
    }
  }

  async function handleCancelDisposal() {
    if (!cancelAsset) return
    if (!cancelReason.trim()) {
      setMessage('A cancellation reason is required to reverse the disposal proposal.')
      return
    }

    setDisposalActionLoading(true)
    try {
      const updated = await assetService.cancelDisposal(cancelAsset.id, { disposal_cancel_reason: cancelReason.trim() })
      setCancelAsset(null)
      setCancelReason('')
      if (viewAsset?.id === updated.id) {
        setViewAsset(updated)
      }
      setMessage('Disposal proposal cancelled. The asset is available again.')
      notifyDataChanged('assets')
      void load(page)
      void loadSummary()
      void loadDisposalData()
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : 'Unable to cancel disposal.')
    } finally {
      setDisposalActionLoading(false)
    }
  }

  async function generatePngSheet() {
    if (sheetGenerating) return
    setSheetGenerating(true)
    try {
      const writer = new BrowserQRCodeSvgWriter()
      const selectedIds = selectedAssetIds.length > 0 ? selectedAssetIds : (qrAsset ? [qrAsset.id] : [])
      let assetsToUse: Asset[] = []
      if (selectedAssetIds.length > 0) {
        const cached = assetsForSelection.filter(a => selectedAssetIds.includes(a.id))
        if (cached.length === selectedAssetIds.length) {
          assetsToUse = cached
        } else {
          // Fall back to fetching each asset using the public show() API
          assetsToUse = await Promise.all(selectedAssetIds.map(async (id) => { try { return await assetService.show(id) } catch { return null } })).then(res => res.filter(Boolean) as Asset[])
        }
      } else if (qrAsset) {
        assetsToUse = [qrAsset]
      }

      if (!assetsToUse || assetsToUse.length === 0) {
        window.alert('No assets selected for sheet.')
        return
      }

      const labelW = 420
      const labelH = 540
      const qrLabelSize = 320
      const line1H = 24
      const line2H = 18
      const labelPadding = Math.round((labelH - qrLabelSize - line1H - line2H - 24) / 2)

      const makeLabelImage = (asset: Asset) => new Promise<HTMLImageElement>(async (resolve, reject) => {
        try {
          // Prefer explicit psa_qr_payload; if missing, try known identifier entries; then psa_qr_identifier, asset_number, and last-resort inventory.sku
          const identifier = (asset.identifiers || []).find(i => {
            const t = (i.identifier_type || '').toString().toUpperCase()
            return ['PSA_QR_PAYLOAD','QR_PAYLOAD','PSA_QR_IDENTIFIER','QR_IDENTIFIER','QR','PAYLOAD'].includes(t)
          })
          const value = asset.psa_qr_payload ?? identifier?.identifier_value ?? asset.psa_qr_identifier ?? asset.asset_number ?? asset.inventory?.sku ?? `asset-${asset.id}`
          const innerSvg = writer.write(String(value).replace(/[<>]/g, ''), qrLabelSize, qrLabelSize)
          // Serialize the SVG and use a base64 data URL for better browser compatibility
          const svgString = (new XMLSerializer()).serializeToString(innerSvg)
          const base64 = typeof window.btoa === 'function'
            ? window.btoa(unescape(encodeURIComponent(svgString)))
            : Buffer.from(svgString, 'utf-8').toString('base64')
          const innerData = 'data:image/svg+xml;base64,' + base64
          const assetName = (asset.name || 'asset')
          const assetId = asset.asset_number ?? (`asset-${asset.id}`)

          // Render label using a temporary canvas to avoid nested SVG image loading issues
          const canvas = document.createElement('canvas')
          canvas.width = labelW
          canvas.height = labelH
          const ctx = canvas.getContext('2d')!
          // white background
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, canvas.width, canvas.height)

          const loadQrImage = (): Promise<HTMLImageElement> => new Promise((res, rej) => {
            const qrImg = new Image()
            // Do NOT set crossOrigin for data URLs — that can cause failures in some browsers
            let attempts = 0
            const tryLoad = () => {
              attempts += 1
              qrImg.onload = () => res(qrImg)
              qrImg.onerror = () => {
                if (attempts < 2) {
                  // retry once after small delay
                  setTimeout(() => tryLoad(), 120)
                  return
                }
                rej(new Error('Failed to load QR image'))
              }
              // Assign the same base64 data URL
              qrImg.src = innerData
            }
            tryLoad()
          })

          try {
            const qrImg = await loadQrImage()
            const x = (labelW - qrLabelSize) / 2
            const y = labelPadding
            ctx.drawImage(qrImg, x, y, qrLabelSize, qrLabelSize)

            // Draw text
            ctx.fillStyle = '#0F172A'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            // bold line
            ctx.font = '700 18px Inter, sans-serif'
            ctx.fillText(assetName, labelW / 2, labelPadding + qrLabelSize + line1H)
            // secondary line
            ctx.fillStyle = '#64748B'
            ctx.font = '13px Inter, sans-serif'
            ctx.fillText(assetId, labelW / 2, labelPadding + qrLabelSize + line1H + line2H)

            const out = new Image()
            const dataUrl = canvas.toDataURL('image/png')
            out.onload = () => resolve(out)
            out.onerror = (e) => reject(e)
            out.src = dataUrl
          } catch (err) {
            // If QR image failed, render a fallback label with asset id text instead of QR
            console.warn('QR image load failed for asset', asset.id, err)
            ctx.fillStyle = '#F3F4F6'
            ctx.fillRect((labelW - qrLabelSize) / 2, labelPadding, qrLabelSize, qrLabelSize)
            ctx.fillStyle = '#0F172A'
            ctx.font = '14px Inter, sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(assetId, labelW / 2, labelPadding + qrLabelSize / 2)

            // Draw text lines as before
            ctx.fillStyle = '#0F172A'
            ctx.font = '700 18px Inter, sans-serif'
            ctx.fillText(assetName, labelW / 2, labelPadding + qrLabelSize + line1H)
            ctx.fillStyle = '#64748B'
            ctx.font = '13px Inter, sans-serif'
            ctx.fillText(assetId, labelW / 2, labelPadding + qrLabelSize + line1H + line2H)

            const out = new Image()
            const dataUrl = canvas.toDataURL('image/png')
            out.onload = () => resolve(out)
            out.onerror = (e) => reject(e)
            out.src = dataUrl
          }
        } catch (err) { reject(err) }
      })

      try {
        const sheetW = 2480
        const sheetH = 3508
        const cols = 2
        const rows = 4
        const margin = 80
        const cellW = (sheetW - margin * 2) / cols
        const cellH = (sheetH - margin * 2) / rows
        const pad = 20
        const drawW = Math.min(cellW - pad * 2, cellH - pad * 2)
        const drawH = drawW * (labelH / labelW)

        const slots = cols * rows
        const total = assetsToUse.length
        const sheets = Math.max(1, Math.ceil(total / slots))

        const sheetBlobs: { name: string; blob: Blob }[] = []
        const failedSheets: string[] = []
        for (let s = 0; s < sheets; s++) {
         const start = s * slots
         const slice = assetsToUse.slice(start, start + slots)
         let imgs: HTMLImageElement[] = []
         try {
           imgs = await Promise.all(slice.map(a => makeLabelImage(a)))
         } catch (err) {
           console.error('Failed to create one or more label images for sheet', s, err)
           // continue with whatever images were produced successfully in this sheet (if any)
           try {
             imgs = await Promise.all(slice.map(async (a) => { try { return await makeLabelImage(a) } catch { return null } })).then(res => res.filter(Boolean) as HTMLImageElement[])
           } catch (e) { imgs = [] }
           failedSheets.push(`sheet-${s + 1}`)
         }

         const sheetCanvas = document.createElement('canvas')
         sheetCanvas.width = sheetW
         sheetCanvas.height = sheetH
         const sctx = sheetCanvas.getContext('2d')!
         sctx.fillStyle = '#ffffff'
         sctx.fillRect(0, 0, sheetW, sheetH)

         for (let i = 0; i < imgs.length; i++) {
           const img = imgs[i]
           const r = Math.floor(i / cols)
           const c = i % cols
           const x = margin + c * cellW + (cellW - drawW) / 2
           const y = margin + r * cellH + (cellH - drawH) / 2
           sctx.drawImage(img, x, y, drawW, drawH)
         }

         // Collect this sheet as a blob for zipping later
         const filenameBase = slice.length > 0 ? (slice[0].asset_number ?? `psa-sheet-${start + 1}`) : `psa-sheet-${s + 1}`
         const suffix = sheets > 1 ? `-part${s + 1}` : ''
         const name = `${filenameBase}${suffix}-qr-sheet.png`

         const blob = await new Promise<Blob | null>((resolve) => sheetCanvas.toBlob((b) => resolve(b), 'image/png'))
         if (!blob) {
           console.error('sheet canvas produced null blob for', name)
           failedSheets.push(name)
           continue
         }
         sheetBlobs.push({ name, blob })
        }

        if (sheetBlobs.length === 0) {
         // nothing succeeded
         throw new Error('No sheets could be generated')
        }

        // Create a ZIP containing all sheets
        try {
         const zip = new JSZip()
         sheetBlobs.forEach((s) => zip.file(s.name, s.blob))
         const zipBlob = await zip.generateAsync({ type: 'blob' })
         const zipName = `psa-qr-sheets-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.zip`
         const zipUrl = URL.createObjectURL(zipBlob)
         const a = document.createElement('a')
         a.href = zipUrl
         a.download = zipName
         document.body.appendChild(a)
         a.click()
         a.remove()
         URL.revokeObjectURL(zipUrl)

         if (failedSheets.length > 0) {
           window.alert(`Some sheets failed to generate and were omitted from the ZIP: ${failedSheets.join(', ')}`)
         }
        } catch (err) {
         console.error('Failed to create ZIP', err)
         window.alert('Failed to package sheets into ZIP.')
        }
      } catch (err) {
        console.error(err)
        window.alert('Failed to generate sheet PNG.')
      }
    } finally {
      setSheetGenerating(false)
    }
  }

  async function openPrintLabels() {
    try {
      const selectedIds = selectedAssetIds.length > 0 ? selectedAssetIds : (qrAsset ? [qrAsset.id] : [])
      let assetsToUse: Asset[] = []
      if (selectedAssetIds.length > 0) {
        const cached = assetsForSelection.filter(a => selectedAssetIds.includes(a.id))
        if (cached.length === selectedAssetIds.length) {
          assetsToUse = cached
        } else {
          assetsToUse = await Promise.all(selectedAssetIds.map(async (id) => { try { return await assetService.show(id) } catch { return null } })).then(res => res.filter(Boolean) as Asset[])
        }
      } else if (qrAsset) {
        assetsToUse = [qrAsset]
      }

      if (!assetsToUse || assetsToUse.length === 0) {
        // No assets selected -> open the sheet selector so the user can pick items
        setSheetSelectionOpen(true)
        return
      }

      setPrintAssets(assetsToUse)
      setPrintModalOpen(true)
    } catch (err) {
      console.error('Failed to prepare assets for print modal', err)
      window.alert('Unable to open print dialog for the selected assets.')
    }
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

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setScannerOpen(true)}
            style={{
              height: 38, paddingInline: 14, borderRadius: 10,
              border: 'none', background: '#1E40AF', color: '#fff',
              fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 7,
              boxShadow: '0 2px 8px rgba(30,64,175,0.25)',
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#1D3FAB' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#1E40AF' }}
          >
            <ScanLine size={14} />
            Scan Asset QR
          </button>

          <button
            onClick={() => { void openPrintLabels() }}
            style={{
              height: 38, paddingInline: 14, borderRadius: 10,
              border: '1px solid #E2E8F0', background: '#fff', color: '#0F172A',
              fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#F8FAFC' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fff' }}
          >
            <Printer size={14} />
            QR Labels
          </button>
        </div>
      </div>

      {/* Alert message */}
      {message && <Alert tone="info" onClose={() => setMessage(null)}>{message}</Alert>}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            { key: 'all', label: 'All Assets' },
            { key: 'available', label: 'Available Assets' },
            { key: 'disposal', label: 'Disposal' },
            { key: 'archived', label: 'Archived Assets' },
          ].map((entry) => {
            const active = activeSection === entry.key
            return (
              <button
                key={entry.key}
                type="button"
                onClick={() => {
                  if (entry.key === 'disposal') {
                    setActiveSection('disposal')
                    void loadDisposalData()
                    return
                  }
                  if (entry.key === 'archived') {
                    setActiveSection('archived')
                    setStatus('')
                    void loadArchived(1, search)
                    return
                  }
                  setActiveSection(entry.key as 'all' | 'available')
                  setStatus(entry.key === 'available' ? 'AVAILABLE' : '')
                  void load(1, search)
                }}
                style={{
                  borderRadius: 999,
                  border: active ? '1px solid #1E40AF' : '1px solid #E2E8F0',
                  background: active ? '#EFF6FF' : '#fff',
                  color: active ? '#1E40AF' : '#475569',
                  padding: '8px 14px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: active ? '0 4px 12px rgba(30,64,175,0.12)' : 'none',
                }}
              >
                {entry.label}
              </button>
            )
          })}
        </div>
        <div style={{ fontSize: 13, color: '#64748B' }}>
          {activeSection === 'disposal' ? 'Manage disposal workflow and lifecycle actions.' : activeSection === 'archived' ? 'Review archived assets and restore them when permitted.' : 'Browse operational asset states and workflows.'}
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <SummaryCard
          icon={<Package size={20} style={{ color: colors.blue.icon }} />}
          color={colors.blue}
          label="Total Assets"
          value={summary.total}
          onClick={() => { setActiveSection('all'); setStatus(''); void load(1) }}
          active={activeSection === 'all' && status === ''}
        />
        <SummaryCard
          icon={<CheckCircle2 size={20} style={{ color: colors.green.icon }} />}
          color={colors.green}
          label="Available"
          value={summary.available}
          onClick={() => { setActiveSection('available'); setStatus('AVAILABLE'); void load(1) }}
          active={activeSection === 'available' && status === 'AVAILABLE'}
        />
        <SummaryCard
          icon={<ArrowUpRight size={20} style={{ color: colors.amber.icon }} />}
          color={colors.amber}
          label="Borrowed"
          value={summary.borrowed}
          onClick={() => { setActiveSection('all'); setStatus('BORROWED'); void load(1) }}
          active={activeSection === 'all' && status === 'BORROWED'}
        />
        <SummaryCard
          icon={<Clock size={20} style={{ color: colors.violet.icon }} />}
          color={colors.violet}
          label="Reserved"
          value={summary.reserved}
          onClick={() => { setActiveSection('all'); setStatus('RESERVED'); void load(1) }}
          active={activeSection === 'all' && status === 'RESERVED'}
        />
        <SummaryCard
          icon={<Wrench size={20} style={{ color: colors.red.icon }} />}
          color={colors.red}
          label="Maintenance"
          value={summary.maintenance}
          onClick={() => { setActiveSection('all'); setStatus('MAINTENANCE'); void load(1) }}
          active={activeSection === 'all' && status === 'MAINTENANCE'}
        />
        <SummaryCard
          icon={<Trash2 size={20} style={{ color: colors.gray.icon }} />}
          color={colors.gray}
          label="Disposal"
          value={summary.disposalTotal}
          onClick={() => { setActiveSection('disposal'); void loadDisposalData() }}
          active={activeSection === 'disposal'}
        />
      </div>

      {/* ── Table card ── */}
      {activeSection === 'disposal' ? (
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <Card noPadding>
              <div style={{ padding: '18px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending / For Disposal</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>{summary.disposalPending}</div>
                </div>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: '#FFFBEB', border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={18} style={{ color: '#D97706' }} />
                </div>
              </div>
            </Card>
            <Card noPadding>
              <div style={{ padding: '18px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Disposed</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>{summary.disposalDisposed}</div>
                </div>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={18} style={{ color: '#64748B' }} />
                </div>
              </div>
            </Card>
            <Card noPadding>
              <div style={{ padding: '18px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Disposal Records</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>{summary.disposalTotal}</div>
                </div>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package size={18} style={{ color: '#2563EB' }} />
                </div>
              </div>
            </Card>
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            <Card noPadding>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>Pending / For Disposal</h2>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>Assets marked for disposal but not yet finalized.</p>
                </div>
                <Badge tone="orange">{disposalPending.length} pending</Badge>
              </div>
              <div style={{ padding: 20 }}>
                {disposalLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}><Spinner /></div>
                ) : disposalPending.length === 0 ? (
                  <EmptyState title="No pending disposal records" description="Assets marked for disposal will appear here once they are submitted for review." />
                ) : (
                  <div style={{ display: 'grid', gap: 12 }}>
                    {disposalPending.map((asset) => (
                      <div key={asset.id} style={{ border: '1px solid #E2E8F0', borderRadius: 14, padding: 16, background: '#fff' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{asset.name}</div>
                            <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Asset No. {asset.asset_number} • Property {asset.property_number ?? '—'}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <Badge tone="orange">For Disposal</Badge>
                            <button type="button" onClick={() => void openView(asset.id)} style={{ border: '1px solid #D1D5DB', borderRadius: 8, background: '#fff', color: '#475569', padding: '7px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>View Details</button>
                            {canManageDisposalActions && (
                              <>
                                <button type="button" onClick={() => { setFinalizeAsset(asset); setFinalizeDate(asset.disposal_date ?? new Date().toISOString().slice(0, 10)); setFinalizeMethod(asset.disposal_method ?? ''); setFinalizeApprovalRef(asset.disposal_approval_ref ?? ''); }} style={{ border: '1px solid #1E40AF', borderRadius: 8, background: '#1E40AF', color: '#fff', padding: '7px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Finalize</button>
                                <button type="button" onClick={() => { setCancelAsset(asset); setCancelReason(''); }} style={{ border: '1px solid #DC2626', borderRadius: 8, background: '#fff', color: '#DC2626', padding: '7px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                              </>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 14 }}>
                          {renderDisposalField('Category', asset.category ?? '—')}
                          {renderDisposalField('Current / Last Office', asset.office ?? '—')}
                          {renderDisposalField('Status', 'FOR_DISPOSAL')}
                          {renderDisposalField('Reason', asset.disposal_reason ?? '—')}
                          {renderDisposalField('Disposal Date', asset.disposal_date ?? '—')}
                          {renderDisposalField('Method', asset.disposal_method ?? '—')}
                          {renderDisposalField('Approval Reference', asset.disposal_approval_ref ?? '—')}
                          {renderDisposalField('Approved By', asset.disposal_approved_by_name ?? '—')}
                          {renderDisposalField('Marked / Updated', asset.disposal_marked_at ?? asset.updated_at ?? '—')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <Card noPadding>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>Disposed</h2>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>Assets whose disposal has been finalized.</p>
                </div>
                <Badge tone="gray">{disposalDisposed.length} disposed</Badge>
              </div>
              <div style={{ padding: 20 }}>
                {disposalLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}><Spinner /></div>
                ) : disposalDisposed.length === 0 ? (
                  <EmptyState title="No disposed assets" description="Finalized disposal records will appear here once the workflow is completed." />
                ) : (
                  <div style={{ display: 'grid', gap: 12 }}>
                    {disposalDisposed.map((asset) => (
                      <div key={asset.id} style={{ border: '1px solid #E2E8F0', borderRadius: 14, padding: 16, background: '#fff' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{asset.name}</div>
                            <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Asset No. {asset.asset_number} • Property {asset.property_number ?? '—'}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <Badge tone="gray">Disposed</Badge>
                            <button type="button" onClick={() => void openView(asset.id)} style={{ border: '1px solid #D1D5DB', borderRadius: 8, background: '#fff', color: '#475569', padding: '7px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>View Details</button>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 14 }}>
                          {renderDisposalField('Category', asset.category ?? '—')}
                          {renderDisposalField('Current / Last Office', asset.office ?? '—')}
                          {renderDisposalField('Status', 'DISPOSED')}
                          {renderDisposalField('Reason', asset.disposal_reason ?? '—')}
                          {renderDisposalField('Disposal Date', asset.disposal_date ?? '—')}
                          {renderDisposalField('Method', asset.disposal_method ?? '—')}
                          {renderDisposalField('Approval Reference', asset.disposal_approval_ref ?? '—')}
                          {renderDisposalField('Approved By', asset.disposal_approved_by_name ?? '—')}
                          {renderDisposalField('Cancellation', asset.disposal_cancel_reason ?? '—')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      ) : activeSection === 'archived' ? (
        <Card noPadding>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>Archived Assets</h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>Archived assets remain linked to their inventory records and can be restored when permitted.</p>
            </div>
            <Badge tone="gray">{archivedTotal} archived</Badge>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #E2E8F0', background: '#fff' }}>
            <div style={{ position: 'relative', flex: '1 1 0', minWidth: 0 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') void loadArchived(1, search) }}
                placeholder="Search archived assets..."
                style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 12px 10px 40px', fontSize: 13.5, outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
            <button
              type="button"
              onClick={() => void loadArchived(1, search)}
              style={{ border: '1px solid #E2E8F0', borderRadius: 10, background: '#fff', color: '#475569', padding: '9px 12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              Refresh
            </button>
          </div>
          <div style={{ padding: 20 }}>
            {archivedLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}><Spinner /></div>
            ) : archivedRows.length === 0 ? (
              <EmptyState title="No archived assets" description="Assets archived from the active list will appear here for review and restoration." />
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={th}>Asset Number</th>
                      <th style={th}>Property Number</th>
                      <th style={th}>Name</th>
                      <th style={th}>Category</th>
                      <th style={th}>Status</th>
                      <th style={th}>Location</th>
                      <th style={{ ...th, textAlign: 'right' as const, paddingRight: 20, position: 'sticky' as const, right: 0, background: '#fff', zIndex: 10 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archivedRows.map((r, idx) => (
                      <tr key={r.id} style={{ background: idx % 2 === 0 ? '#fff' : '#FAFBFC', transition: 'background 0.1s' }} onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = '#F1F5F9' }} onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = idx % 2 === 0 ? '#fff' : '#FAFBFC' }}>
                        <td style={td}><code style={{ fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace", fontSize: 11.5, color: '#475569', background: '#F1F5F9', padding: '3px 8px', borderRadius: 6, display: 'inline-block' }}>{r.asset_number}</code></td>
                        <td style={td}>{r.property_number ? <code style={{ fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace", fontSize: 11.5, color: '#475569', background: '#F1F5F9', padding: '3px 8px', borderRadius: 6, display: 'inline-block' }}>{r.property_number}</code> : <span style={{ color: '#94A3B8' }}>—</span>}</td>
                        <td style={td}><div><span style={{ fontWeight: 600, color: '#0F172A', fontSize: 13.5 }}>{r.name}</span>{r.description && <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>{r.description}</div>}</div></td>
                        <td style={td}><span style={{ color: '#64748B', fontSize: 13 }}>{r.category ?? '—'}</span></td>
                        <td style={td}>{(() => { const eff = getEffectiveAssetStatus(r); return <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}><Badge tone={eff.tone}>{eff.label}</Badge>{eff.subtext && eff.subtextTone && <Badge tone={eff.subtextTone}>{eff.subtext}</Badge>}</div> })()}</td>
                        <td style={td}><span style={{ color: '#64748B', fontSize: 13 }}>{r.location ?? '—'}</span></td>
                        <td style={{ ...td, textAlign: 'right' as const, paddingRight: 20, position: 'sticky' as const, right: 0, background: '#fff', zIndex: 5 }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <button type="button" onClick={() => openArchivedView(r)} style={{ border: '1px solid #D1D5DB', borderRadius: 8, background: '#fff', color: '#475569', padding: '7px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>View</button>
                            {canManageAssets && (
                              <button type="button" onClick={() => setRestoreAsset(r)} style={{ border: '1px solid #1E40AF', borderRadius: 8, background: '#1E40AF', color: '#fff', padding: '7px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Restore</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div style={{ borderTop: '1px solid #F1F5F9', padding: '10px 20px' }}>
            <Pagination page={archivedPage} lastPage={archivedLastPage} total={archivedTotal} onPageChange={(p) => void loadArchived(p, search)} />
          </div>
        </Card>
      ) : (
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
              onKeyDown={(e) => { if (e.key === 'Enter') void load(1, search) }}
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
            onChange={(e) => { setStatus(e.target.value); void load(1, search) }}
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
            <option value="FOR_DISPOSAL">For Disposal</option>
            <option value="RETIRED">Retired</option>
            <option value="DISPOSED">Disposed</option>
          </select>

          {/* Search button */}
          <button
            onClick={() => void load(1, search)}
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
            <ScrollableTableWrapper><table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' as const }}>
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
                  <th style={{ ...th, textAlign: 'right' as const, paddingRight: 20, position: 'sticky' as const, right: 0, background: '#fff', zIndex: 10 }}>Actions</th>
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
                              <Badge tone={eff.subtextTone}>{String(eff.subtext)}</Badge>
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
                                          position: 'sticky' as const, right: 0, background: '#fff', zIndex: 5,
                                        }}>
                                          <ActionCell
                        asset={r}
                        canManageAssets={canManageAssets}
                        canManageIssuance={canIssueAssets}
                        canCompleteBorrowing={canCompleteBorrowing}
                        onView={() => void openView(r.id)}
                        onQrLabel={() => void openQrLabel(r.id)}
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
            </table></ScrollableTableWrapper>
          )}
        </div>

        {/* Pagination */}
        <div style={{ borderTop: '1px solid #F1F5F9', padding: '10px 20px' }}>
          <Pagination page={page} lastPage={lastPage} total={total} onPageChange={(p) => void load(p)} />
        </div>
      </Card>
      )}

      {/* ── Dialogs ── */}
      <ConfirmDialog
        open={markForDisposalAsset !== null}
        title="Mark Asset for Disposal"
        message={
          <div className="space-y-3">
            <p className="text-[14px] text-[#374151]">This will move the asset into the disposal workflow. The asset can still be cancelled before final disposal.</p>
            <div>
              <label className={LABEL_CLS}>Disposal Reason</label>
              <textarea className={TEXTAREA_CLS} rows={3} placeholder="Required reason" value={markReason} onChange={(e) => setMarkReason(e.target.value)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLS}>Disposal Date</label>
                <input type="date" className={SELECT_CLS} value={markDate} onChange={(e) => setMarkDate(e.target.value)} />
              </div>
              <div>
                <label className={LABEL_CLS}>Disposal Method</label>
                <input className={SELECT_CLS} placeholder="Optional" value={markMethod} onChange={(e) => setMarkMethod(e.target.value)} />
              </div>
            </div>
            <div>
              <label className={LABEL_CLS}>Approval Reference</label>
              <input className={SELECT_CLS} placeholder="Optional" value={markApprovalRef} onChange={(e) => setMarkApprovalRef(e.target.value)} />
            </div>
          </div>
        }
        confirmLabel={disposalActionLoading ? 'Working…' : 'Mark for Disposal'}
        onCancel={() => { setMarkForDisposalAsset(null); setMarkReason(''); setMarkDate(new Date().toISOString().slice(0, 10)); setMarkMethod(''); setMarkApprovalRef('') }}
        onConfirm={() => { void handleMarkForDisposal() }}
      />

      <ConfirmDialog
        open={finalizeAsset !== null}
        title="Finalize Disposal"
        message={
          <div className="space-y-3">
            <p className="text-[14px] text-[#374151]">This will move the asset from FOR_DISPOSAL to DISPOSED. DISPOSED is terminal under the current lifecycle, so confirm this action carefully.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLS}>Disposal Date</label>
                <input type="date" className={SELECT_CLS} value={finalizeDate} onChange={(e) => setFinalizeDate(e.target.value)} />
              </div>
              <div>
                <label className={LABEL_CLS}>Disposal Method</label>
                <input className={SELECT_CLS} placeholder="e.g. Public Auction" value={finalizeMethod} onChange={(e) => setFinalizeMethod(e.target.value)} />
              </div>
            </div>
            <div>
              <label className={LABEL_CLS}>Approval Reference</label>
              <input className={SELECT_CLS} placeholder="Optional" value={finalizeApprovalRef} onChange={(e) => setFinalizeApprovalRef(e.target.value)} />
            </div>
          </div>
        }
        confirmLabel={disposalActionLoading ? 'Working…' : 'Finalize Disposal'}
        onCancel={() => { setFinalizeAsset(null); setFinalizeDate(new Date().toISOString().slice(0, 10)); setFinalizeMethod(''); setFinalizeApprovalRef('') }}
        onConfirm={() => { void handleFinalizeDisposal() }}
      />

      <ConfirmDialog
        open={cancelAsset !== null}
        title="Cancel Disposal"
        message={
          <div className="space-y-3">
            <p className="text-[14px] text-[#374151]">Cancel this disposal proposal and restore the asset to normal availability. A cancellation reason is required.</p>
            <div>
              <label className={LABEL_CLS}>Cancellation Reason</label>
              <textarea className={TEXTAREA_CLS} rows={3} placeholder="Required reason" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
            </div>
          </div>
        }
        confirmLabel={disposalActionLoading ? 'Working…' : 'Cancel Disposal'}
        onCancel={() => { setCancelAsset(null); setCancelReason('') }}
        onConfirm={() => { void handleCancelDisposal() }}
      />

      <ConfirmDialog
        open={deleteId !== null} title="Archive Asset"
        message="Are you sure you want to archive this asset? It will no longer appear as an active item."
        confirmLabel="Archive Item"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId === null) return
          void assetService.archive(deleteId).then(() => {
            setDeleteId(null)
            setMessage('Asset archived.')
            setActiveSection('archived')
            setStatus('')
            void loadArchived(1, search)
            void load(1, search)
            void loadSummary()
          })
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
 
      <ConfirmDialog
        open={restoreAsset !== null}
        title="Restore Asset"
        message="Restore this archived asset and make it active again?"
        confirmLabel={restoreLoading ? 'Restoring…' : 'Restore Asset'}
        onCancel={() => setRestoreAsset(null)}
        onConfirm={() => {
          if (!restoreAsset) return
          setRestoreLoading(true)
          void assetService.restore(restoreAsset.id)
            .then(() => {
              setRestoreAsset(null)
              setMessage('Asset restored successfully.')
              notifyDataChanged('assets')
              void load(1, search)
              void loadArchived(1, search)
              void loadSummary()
            })
            .finally(() => setRestoreLoading(false))
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
              <div className="space-y-4 mt-2">
                {/* Disposal workflow block — only shown when relevant */}
                {(viewAsset.status === 'FOR_DISPOSAL' || viewAsset.status === 'DISPOSED' || viewAsset.disposal_reason || viewAsset.disposal_date || viewAsset.disposal_method || viewAsset.disposal_approval_ref || viewAsset.disposal_cancel_reason) && (
                  <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#94A3B8]">Disposal workflow</div>
                        <div className="mt-1 text-[15px] font-semibold text-[#0F172A]">
                          {viewAsset.status === 'FOR_DISPOSAL' ? 'Pending finalization' : viewAsset.status === 'DISPOSED' ? 'Finalized disposal' : 'Disposal information'}
                        </div>
                        <p className="mt-1 text-sm text-[#64748B]">
                          {viewAsset.status === 'FOR_DISPOSAL'
                            ? 'This asset is awaiting final disposal action. A cancellation reason is required if the proposal is reversed.'
                            : viewAsset.status === 'DISPOSED'
                              ? 'This asset is in the terminal disposed state and remains read-only under the current lifecycle.'
                              : 'This asset has disposal metadata recorded.'}
                        </p>
                      </div>
                      {canManageDisposalActions && (
                        <div className="flex flex-wrap gap-2">
                          {viewAsset.status === 'FOR_DISPOSAL' ? (
                            <>
                              <Button size="sm" onClick={() => { setFinalizeAsset(viewAsset); setFinalizeDate(viewAsset.disposal_date ?? new Date().toISOString().slice(0, 10)); setFinalizeMethod(viewAsset.disposal_method ?? ''); setFinalizeApprovalRef(viewAsset.disposal_approval_ref ?? ''); }}>
                                Finalize Disposal
                              </Button>
                              <Button size="sm" variant="secondary" onClick={() => { setCancelAsset(viewAsset); setCancelReason('') }}>
                                Cancel Disposal
                              </Button>
                            </>
                          ) : (
                            <Button size="sm" variant="secondary" onClick={() => { setMarkForDisposalAsset(viewAsset); setMarkReason(viewAsset.disposal_reason ?? ''); setMarkDate(viewAsset.disposal_date ?? new Date().toISOString().slice(0, 10)); setMarkMethod(viewAsset.disposal_method ?? ''); setMarkApprovalRef(viewAsset.disposal_approval_ref ?? ''); }}>
                              Mark for Disposal
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {renderDisposalField('Status', viewAsset.status === 'FOR_DISPOSAL' ? 'FOR_DISPOSAL' : viewAsset.status === 'DISPOSED' ? 'DISPOSED' : '—')}
                      {renderDisposalField('Reason', viewAsset.disposal_reason ?? '—')}
                      {renderDisposalField('Disposal Date', viewAsset.disposal_date ?? '—')}
                      {renderDisposalField('Method', viewAsset.disposal_method ?? '—')}
                      {renderDisposalField('Approval Reference', viewAsset.disposal_approval_ref ?? '—')}
                      {renderDisposalField('Approved By', viewAsset.disposal_approved_by_name ?? '—')}
                      {renderDisposalField('Marked / Updated', viewAsset.disposal_marked_at ?? viewAsset.updated_at ?? '—')}
                      {renderDisposalField('Cancellation', viewAsset.disposal_cancel_reason ?? '—')}
                    </div>
                  </div>
                )}

                {/* ── Item Information (from Inventory) ── */}
                {viewAsset.inventory && (
                  <div style={{ borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                    <div style={{
                      padding: '12px 16px', background: '#F8FAFC',
                      borderBottom: '1px solid #E2E8F0',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8' }}>
                        Item Information
                      </span>
                      <button
                        type="button"
                        onClick={() => { setViewAsset(null); navigate(`/inventory?highlight=${viewAsset.inventory_item_id}`) }}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          borderRadius: 7, border: '1px solid #BFDBFE', background: '#EFF6FF',
                          color: '#1D4ED8', fontSize: 11.5, fontWeight: 700, padding: '4px 10px',
                          cursor: 'pointer',
                        }}
                      >
                        <ExternalLink size={11} />
                        Open in Inventory
                      </button>
                    </div>
                    <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {[
                        { label: 'Item Name', value: viewAsset.inventory.name },
                        { label: 'SKU / Item Code', value: viewAsset.inventory.sku ?? '—', mono: true },
                                                { label: 'Type', value: viewAsset.inventory.item_type_name ?? '—' },
                                                                        { label: 'Classification', value: viewAsset.inventory.classification ?? (viewAsset.inventory.type === 'expendable' ? 'SUPPLY' : '—') },
                                                { label: 'Manufacturer', value: viewAsset.inventory.manufacturer ?? '—' },
                                                { label: 'Model', value: viewAsset.inventory.model ?? '—' },
                                                { label: 'Description', value: viewAsset.inventory.description ?? '—', full: true },
                      ].map(({ label, value, mono, full }) => (
                        <div key={label} style={full ? { gridColumn: '1 / -1' } : {}}>
                          <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8', marginBottom: 3 }}>{label}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: value === '—' ? '#CBD5E1' : '#1E293B', fontFamily: mono ? 'ui-monospace,monospace' : undefined }}>{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Asset Identity ── */}
                <div style={{ borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8' }}>Asset Identity</span>
                  </div>
                  <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[
                      { label: 'Asset Number', value: viewAsset.asset_number, mono: true },
                      { label: 'Property Number', value: viewAsset.property_number ?? '—', mono: true },
                    ].map(({ label, value, mono }) => (
                      <div key={label}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8', marginBottom: 3 }}>{label}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: value === '—' ? '#CBD5E1' : '#1E293B', fontFamily: mono ? 'ui-monospace,monospace' : undefined }}>{value}</div>
                      </div>
                    ))}
                    {/* Identifiers */}
                    {(viewAsset.identifiers?.length ?? 0) > 0 && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8', marginBottom: 6 }}>Identifiers</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {viewAsset.identifiers!.map((id) => (
                            <span key={id.id} style={{
                              fontSize: 11.5, padding: '3px 10px', borderRadius: 20,
                              background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#475569',
                              fontFamily: 'ui-monospace,monospace',
                            }}>
                              {id.identifier_type}: {id.identifier_value}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Operational Status ── */}
                <div style={{ borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8' }}>Operational Status</span>
                  </div>
                  <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8', marginBottom: 4 }}>Status</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                        {(() => {
                          const effectiveStatus = getEffectiveAssetStatus(viewAsset)
                          return (
                            <>
                              <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '2px 10px', fontSize: 12, fontWeight: 600, lineHeight: 1.5, whiteSpace: 'nowrap', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>{effectiveStatus.label}</span>
                              {effectiveStatus.subtext && effectiveStatus.subtextTone ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '2px 10px', fontSize: 12, fontWeight: 600, lineHeight: 1.5, whiteSpace: 'nowrap', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
                                  {effectiveStatus.subtext}
                                  {viewAsset.reservation_context?.requester_name ? (
                                    <span style={{ fontWeight: 400, opacity: 0.75 }}> · {String(viewAsset.reservation_context.requester_name)}</span>
                                  ) : null}
                                </span>
                              ) : null}
                            </>
                          )
                        })()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8', marginBottom: 4 }}>Condition</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: viewAsset.condition_status ? '#1E293B' : '#CBD5E1' }}>
                        {viewAsset.condition_status ?? '—'}
                      </div>
                    </div>
                    {[
                      { label: 'Current Office', value: viewAsset.office ?? '—' },
                      { label: 'Current Location', value: viewAsset.location ?? '—' },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8', marginBottom: 3 }}>{label}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: value === '—' ? '#CBD5E1' : '#1E293B' }}>{value}</div>
                      </div>
                    ))}
                    {viewAsset.remarks && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8', marginBottom: 3 }}>Operational Notes</div>
                        <div style={{ fontSize: 13, color: '#475569', whiteSpace: 'pre-line' }}>{viewAsset.remarks}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Accountability / Issuance ── */}
                <div style={{ borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8' }}>Accountability</span>
                  </div>
                  <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[
                      { label: 'Accountable To', value: viewAsset.issued_to_user?.full_name ?? viewAsset.issued_to ?? '—', full: true },
                      { label: 'Employee No.', value: viewAsset.issued_to_user?.employee_number ?? (viewAsset.is_unlinked_holder ? 'Unlinked record' : '—') },
                      { label: 'Issued By', value: viewAsset.issued_by_name ?? '—' },
                      { label: 'Date Issued', value: viewAsset.date_issued ?? '—' },
                    ].map(({ label, value, full }) => (
                      <div key={label} style={full ? { gridColumn: '1 / -1' } : {}}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8', marginBottom: 3 }}>{label}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: value === '—' || value === 'Unlinked record' ? '#CBD5E1' : '#1E293B' }}>{value}</div>
                      </div>
                    ))}

                    {/* Custodian display */}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8', marginBottom: 3 }}>Custodian</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: viewAsset.custodian ? '#1E293B' : '#CBD5E1' }}>{viewAsset.custodian?.full_name ?? '—'}</div>
                    </div>

                    {viewAsset.is_unlinked_holder && (
                      <div style={{ gridColumn: '1 / -1', fontSize: 11.5, color: '#B45309', fontStyle: 'italic' }}>
                        ⚠ This record uses a legacy unlinked holder name.
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Procurement Information (read-only from Inventory) ── */}
                {viewAsset.inventory && (
                  <div style={{ borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                    <div style={{
                      padding: '12px 16px', background: '#F8FAFC',
                      borderBottom: '1px solid #E2E8F0',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8' }}>
                        Procurement Information
                      </span>
                      <span style={{ fontSize: 11, color: '#94A3B8', fontStyle: 'italic' }}>owned by Inventory</span>
                    </div>
                    <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                      {[
                        {
                          label: 'Unit Cost',
                          value: viewAsset.inventory.procurement.unit_cost !== null && viewAsset.inventory.procurement.unit_cost !== undefined
                            ? `₱${Number(viewAsset.inventory.procurement.unit_cost).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : '—',
                        },
                        { label: 'Purchase Date', value: viewAsset.inventory.procurement.purchase_date ?? '—' },
                        { label: 'Warranty Until', value: viewAsset.inventory.procurement.warranty_until ?? '—' },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8', marginBottom: 3 }}>{label}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: value === '—' ? '#CBD5E1' : '#1E293B' }}>{value}</div>
                        </div>
                      ))}
                      {viewAsset.inventory.procurement.supplier_name && (
                        <div style={{ gridColumn: '1 / -1' }}>
                          <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8', marginBottom: 3 }}>Supplier</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{viewAsset.inventory.procurement.supplier_name}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Insurance ── */}
                {(viewAsset as unknown as Record<string, unknown>)['insurance_provider'] && (
                  <div style={{ borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8' }}>Insurance</span>
                    </div>
                    <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {[
                        { label: 'Provider', value: String((viewAsset as unknown as Record<string, unknown>)['insurance_provider'] ?? '—') },
                        { label: 'Policy Number', value: String((viewAsset as unknown as Record<string, unknown>)['insurance_policy_number'] ?? '—') },
                        { label: 'Expiration', value: String((viewAsset as unknown as Record<string, unknown>)['insurance_expiration_date'] ?? '—') },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94A3B8', marginBottom: 3 }}>{label}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: value === '—' ? '#CBD5E1' : '#1E293B' }}>{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Audit ── */}
                <div style={{ borderRadius: 14, border: '1px solid #E2E8F0', background: '#F8FAFC', padding: '14px 16px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', marginBottom: 10 }}>Audit</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12, color: '#64748B' }}>
                    <div><span style={{ fontWeight: 700, color: '#475569' }}>Created By:</span> {viewAsset.created_by_name ?? 'System'}</div>
                    <div><span style={{ fontWeight: 700, color: '#475569' }}>Created At:</span> {viewAsset.created_at ? new Date(viewAsset.created_at).toLocaleString() : '—'}</div>
                    <div><span style={{ fontWeight: 700, color: '#475569' }}>Updated By:</span> {viewAsset.updated_by_name ?? '—'}</div>
                    <div><span style={{ fontWeight: 700, color: '#475569' }}>Updated At:</span> {viewAsset.updated_at ? new Date(viewAsset.updated_at).toLocaleString() : '—'}</div>
                  </div>
                </div>

              </div>
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
                          Accountability reassigned to <strong className="text-[#0D47A1]">{
                            typeof h.new_employee === 'object' ? (h.new_employee?.full_name ?? 'N/A') : (h.new_employee || 'N/A')
                          }</strong>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Previous Holder: {typeof h.previous_employee === 'object' ? (h.previous_employee?.full_name ?? 'N/A') : (h.previous_employee || 'N/A')}
                        </div>
                        <div className="text-xs text-slate-400">
                          Authorized by: {typeof h.officer === 'object' ? (h.officer?.full_name ?? 'N/A') : (h.officer || 'N/A')}
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

                    {/* Disposal audit events (Admin/Auditor only) */}
                    {hasAnyRole(user, ['Super Administrator', 'System Administrator', 'Auditor']) && (
                      <div className="mt-6">
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">Disposal audit events</h3>
                        {loadingDisposalAudit ? (
                          <div className="flex justify-center py-6"><Spinner label="Loading disposal audit..." /></div>
                        ) : disposalAudit.length === 0 ? (
                          <div className="py-3 text-xs text-slate-500 italic">No disposal audit entries found for this asset.</div>
                        ) : (
                          <div className="relative border-l border-slate-200 ml-4 pl-6 space-y-6 py-2">
                            {disposalAudit.map((log) => (
                              <div key={log.id} className="relative">
                                <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white border-2 border-[#64748B]">
                                  <span className="h-1.5 w-1.5 rounded-full bg-[#64748B]" />
                                </span>
                                <div className="text-[11px] font-semibold text-slate-400">{log.created_at}</div>
                                <div className="mt-0.5 text-sm font-medium text-slate-800">{log.action}</div>
                                <div className="text-xs text-slate-500 mt-0.5">{log.user ?? 'System'}</div>
                                {log.description && (
                                  <div className="mt-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-2 max-w-md">
                                    {log.description}
                                  </div>
                                )}
                                {(log.new_values || log.old_values) && (
                                  <div className="mt-1 text-xs text-slate-400 italic">
                                    <pre className="whitespace-pre-wrap text-[11px]">{JSON.stringify(log.new_values || log.old_values)}</pre>
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
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', maxWidth: '100%', overflowX: 'auto', paddingTop: 6 }}>
             <Button size="sm" variant="secondary" onClick={() => setQrAsset(null)}>Close</Button>
              <Button size="sm" variant="secondary" onClick={() => { setPrintAssets([qrAsset]); setPrintModalOpen(true); setQrAsset(null); }}>Open QR Labels</Button>
            </div>
            </>
          }        >
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
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {/* Use the same identifier resolution as sheet generation: prefer psa_qr_payload, then identifier entries, then psa_qr_identifier, then asset_number */}
              <QrCode value={(() => {
                const identifier = (qrAsset.identifiers || []).find(i => {
                  const t = (i.identifier_type || '').toString().toUpperCase()
                  return ['PSA_QR_PAYLOAD','QR_PAYLOAD','PSA_QR_IDENTIFIER','QR_IDENTIFIER','QR','PAYLOAD'].includes(t)
                })
                return qrAsset.psa_qr_payload ?? identifier?.identifier_value ?? qrAsset.psa_qr_identifier ?? qrAsset.asset_number ?? (qrAsset.inventory?.sku ?? '')
              })()} size={320} />
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
              <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <button type="button" onClick={() => setSheetSelectionOpen(true)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer' }}>Select items for sheet</button>
                {selectedAssetIds.length > 0 && (
                  <div style={{ fontSize: 12, color: '#475569' }}>{selectedAssetIds.length} selected for sheet</div>
                )}
              </div>              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 8 }}>
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

      <AssetSheetSelector
        open={sheetSelectionOpen}
        onClose={() => setSheetSelectionOpen(false)}
        initialSelected={selectedAssetIds}
        onConfirm={async (ids: number[]) => {
          // persist selection and then fetch the asset records for generation
          persistSelectedAssetIds(ids)
          if (ids.length > 0) {
            const fetched = await Promise.all(ids.map(async (id) => { try { return await assetService.show(id) } catch { return null } }))
            const filtered = fetched.filter(Boolean) as Asset[]
            setAssetsForSelection(filtered)
            // Open the Print QR modal for the selected assets immediately
            setPrintAssets(filtered)
            setPrintModalOpen(true)
          } else {
            setAssetsForSelection([])
          }
        }}
      />

      {/* Print QR Modal (uses PrintQrModal component) */}
      <PrintQrModal
            open={printModalOpen}
            assets={printAssets ?? []}
            selectedAssetIds={selectedAssetIds}
            onSelectionChange={(ids: number[]) => { persistSelectedAssetIds(ids) }}
            onClose={() => { setPrintModalOpen(false); setPrintAssets(null) }}
          />

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
                    Name, category, manufacturer, office, location and model are edited from the linked Inventory Item only. Property Number, Serial Number, and Asset Number are also managed from Inventory Edit.
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
                  { label: 'Serial Number',   value: editAsset.inventory?.serial_number ?? editAsset.serial_number ?? '—', mono: true },
                  { label: 'Type',            value: editAsset.inventory?.item_type_name ?? '—' },
                  { label: 'Category',        value: editAsset.category ?? '—' },
                  { label: 'Model',           value: editAsset.model ?? '—' },
                  { label: 'Office',          value: editAsset.office ?? '—' },
                  { label: 'Location',        value: editAsset.location ?? '—' },
                  { label: 'Description',     value: editAsset.description ?? '—' },
                ] as { label: string; value: string; mono?: boolean }[]).map(({ label, value, mono }) => (                  <div key={label} className={label === 'Description' ? 'sm:col-span-2' : ''}>
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

            {canManageDisposalActions && !['FOR_DISPOSAL', 'DISPOSED', 'RETIRED'].includes(editAsset.status) && (
              <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#92400E]">Disposal workflow</p>
                    <p className="mt-1 text-sm text-[#B45309]">Start the formal disposal lifecycle for this asset. The backend will enforce the current blocking rules and transition history.</p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setMarkForDisposalAsset(editAsset)
                      setMarkReason(editAsset.disposal_reason ?? '')
                      setMarkDate(editAsset.disposal_date ?? new Date().toISOString().slice(0, 10))
                      setMarkMethod(editAsset.disposal_method ?? '')
                      setMarkApprovalRef(editAsset.disposal_approval_ref ?? '')
                    }}
                  >
                    Mark for Disposal
                  </Button>
                </div>
              </div>
            )}

            {/* B: Asset Identity (editable) */}
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#94A3B8]">Asset Identity</p>
              {editAsset.inventory_item_id ? (
                /* Inventory-linked asset: Property Number is edited from Inventory Edit */
                <div style={{
                  padding: '10px 14px', borderRadius: 10,
                  border: '1px solid #BFDBFE', background: '#EFF6FF',
                  fontSize: 12.5, color: '#1E40AF',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" style={{ flexShrink: 0 }}>
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>
                    Property Number, Serial Number, and Asset Number are managed from the linked{' '}
                    <strong>Inventory Item</strong>. Use the "Open Inventory Item" button above to edit them.
                  </span>
                </div>
              ) : (
                /* Standalone asset: Property Number editable here */
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={LABEL_CLS}>Property Number</label>
                    <input
                      className={SELECT_CLS}
                      value={editForm.property_number ?? ''}
                      onChange={(e) => setEditForm({ ...editForm, property_number: e.target.value })}
                      placeholder="e.g. PROP-0001"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* C: Operational status */}

            {/* B.5: Custodian */}
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#94A3B8]">Custodian</p>
              <div className="space-y-3 rounded-xl border border-[#E5E7EB] p-4">
                <IssuanceUserSearchSelect
                  value={editForm.custodian_id ?? null}
                  initialUser={custodianUser}
                  onChange={(userId, user) => { setEditForm({ ...editForm, custodian_id: userId }); setCustodianUser(user) }}
                />
                <p className="text-sm text-[#64748B]">Assign or clear the custodian responsible for this asset. This is a permanent assignment separate from temporary borrowing.</p>
              </div>
            </div>

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
                    <option value="RETIRED">Retired</option>
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

            {/* C: Procurement Information (read-only from Inventory) */}
            {editAsset.inventory && (
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 12,
                }}>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[#94A3B8]">Procurement Information</p>
                  <button
                    type="button"
                    onClick={() => { setEditAsset(null); navigate(`/inventory?highlight=${editAsset.inventory_item_id}`) }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      borderRadius: 8, border: '1.5px solid #93C5FD', background: '#fff',
                      color: '#1D4ED8', fontSize: 12, fontWeight: 700, padding: '5px 12px',
                      cursor: 'pointer', transition: 'background 0.12s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#DBEAFE' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fff' }}
                  >
                    <Edit3 size={12} />
                    Edit in Inventory
                  </button>
                </div>
                <p style={{ marginBottom: 12, fontSize: 12, color: '#64748B' }}>
                  Procurement is fully owned by Inventory. These values are read-only here and always reflect the linked Inventory Item's procurement data.
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {([
                    { label: 'Unit Cost', value: editAsset.inventory.procurement.unit_cost !== null && editAsset.inventory.procurement.unit_cost !== undefined ? `₱${Number(editAsset.inventory.procurement.unit_cost).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—' },
                    { label: 'Purchase Date', value: editAsset.inventory.procurement.purchase_date ?? '—' },
                    { label: 'Warranty Until', value: editAsset.inventory.procurement.warranty_until ?? '—' },
                  ]).map((item) => (
                    <div key={item.label}>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[#94A3B8] mb-0.5">{item.label}</p>
                      <p style={{
                        fontSize: 13.5, margin: 0, color: item.value === '—' ? '#CBD5E1' : '#1E293B',
                        fontWeight: 500, padding: '7px 12px', borderRadius: 8,
                        border: '1px solid #F1F5F9', background: '#F8FAFC',
                      }}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
                {editAsset.inventory.procurement.supplier_name && (
                  <div style={{
                    marginTop: 12, padding: '10px 14px', borderRadius: 10,
                    border: '1px dashed #E2E8F0', background: '#FAFBFC',
                    fontSize: 12.5, color: '#64748B',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span style={{ fontSize: 16 }}>🏭</span>
                    <span>
                      <strong style={{ color: '#334155' }}>Supplier:</strong>{' '}
                      <span style={{ color: '#0F172A', fontWeight: 600 }}>{editAsset.inventory.procurement.supplier_name}</span>
                    </span>
                  </div>
                )}
              </div>
            )}

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
