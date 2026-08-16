import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Download, Upload, Filter, Plus, Monitor, Package, ChevronRight, Search, TrendingUp, TrendingDown, RotateCcw, History, Edit3, Trash2, Eye, FileDown, FileText, FileCode, CheckCircle2, XCircle, ArrowRightLeft, ClipboardCheck, Save } from 'lucide-react'
import {
  Alert, Button, EmptyState, Input,
  Modal, Spinner, Badge, Card, SetupDropdown,
} from '@/components/ui'
import {
  inventoryService,
  type CreateInventoryItemPayload,
  type InventoryCountSession,
  type UpdateInventoryItemPayload,
} from '@/services/inventoryService'
import { assetService } from '@/services/assetService'
import { setupService, type SetupRecord } from '@/services/setupService'
import { api, unwrapData } from '@/services/api'
import type { ApiResponse, InventoryItem, StockMovement } from '@/types'
import { inventoryStatusLabel } from '@/utils/displayLabels'
import { InventoryImportWizard } from '@/components/InventoryImportWizard'
import { notifyDataChanged } from '@/utils/dataRefresh'
import ScrollableTableWrapper from '@/components/ui/ScrollableTableWrapper'

// ─── helpers ─────────────────────────────────────────────────────────────────

function movementTypeLabel(t: string) {
  return ({
    stock_in: 'Stock Added',
    stock_out: 'Stock Removed',
    adjustment: 'Quantity Corrected',
    transfer_in: 'Transfer Received',
    transfer_out: 'Transfer Sent',
    count_reconciliation: 'Count Reconciliation',
  }[t] ?? t)
}

type TabKey = 'all' | 'ppe' | 'se' | 'supply' | 'disposal' | 'counts'

interface SummaryData {
  ppe: { total: number; in_use: number; available: number; maintenance: number; disposed: number }
  se:  { total: number; in_use: number; available: number; maintenance: number; disposed: number }
  supply: { total: number; in_stock: number; low_stock: number; out_of_stock: number }
}

// ─── Color palette ───────────────────────────────────────────────────────────

const colors = {
  blue:    { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE', icon: '#2563EB' },
  green:   { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0', icon: '#16A34A' },
  amber:   { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A', icon: '#D97706' },
  red:     { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', icon: '#EF4444' },
  violet:  { bg: '#FAF5FF', text: '#7C3AED', border: '#DDD6FE', icon: '#8B5CF6' },
  gray:    { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0', icon: '#94A3B8' },
}

// ─── Stat card (individual stat inside a summary card) ────────────────────────

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: '#475569', flex: 1 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  )
}

// ─── Icon wrapper ─────────────────────────────────────────────────────────────

function IconBox({ icon, color }: { icon: React.ReactNode; color: typeof colors.blue }) {
  return (
    <div style={{
      width: 48, height: 48, borderRadius: 12,
      background: color.bg, border: `1px solid ${color.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {icon}
    </div>
  )
}

// ─── Summary cards ────────────────────────────────────────────────────────────

function SummaryCard({ data, onNavigate }: { data: SummaryData; onNavigate: (tab: TabKey) => void }) {
  const cardStyle: React.CSSProperties = {
    flex: '1 1 0', minWidth: 260,
    background: '#ffffff',
    borderRadius: 16,
    border: '1px solid #E2E8F0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    padding: '24px',
    cursor: 'pointer',
    transition: 'box-shadow 0.2s, border-color 0.2s',
    display: 'flex', flexDirection: 'column', gap: 0,
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
      {/* PPE Card */}
      <SummaryCardInner
        style={cardStyle}
        onClick={() => onNavigate('ppe')}
        icon={<Monitor size={22} style={{ color: colors.blue.icon }} />}
        color={colors.blue}
        title="Property, Plant & Equipment"
        subtitle="PPE — Durable Assets"
        total={data.ppe.total}
        totalLabel="Total Assets"
        stats={[
          { label: 'In Use', value: data.ppe.in_use, color: colors.blue.text },
          { label: 'Available', value: data.ppe.available, color: colors.green.text },
          { label: 'Under Maintenance', value: data.ppe.maintenance, color: colors.violet.text },
          { label: 'Disposed', value: data.ppe.disposed, color: colors.gray.text },
        ]}
      />

      {/* SE Card (now aligned with PPE metrics) */}
      <SummaryCardInner
        style={cardStyle}
        onClick={() => onNavigate('se')}
        icon={<Package size={22} style={{ color: colors.green.icon }} />}
        color={colors.green}
        title="Semi-Expendable"
        subtitle="SE — Accountable Property"
        total={data.se.total}
        totalLabel="Total Items"
        stats={[
          { label: 'In Use', value: data.se.in_use, color: colors.blue.text },
          { label: 'Available', value: data.se.available, color: colors.green.text },
          { label: 'Under Maintenance', value: data.se.maintenance, color: colors.violet.text },
          { label: 'Disposed', value: data.se.disposed, color: colors.gray.text },
        ]}
      />

      {/* Supply Card (stock status metrics moved here) */}
      <SummaryCardInner
        style={cardStyle}
        onClick={() => onNavigate('supply')}
        icon={<Package size={22} style={{ color: colors.amber.icon }} />}
        color={colors.amber}
        title="Supply"
        subtitle="Consumable Supplies"
        total={data.supply.total}
        totalLabel="Total Items"
        stats={[
          { label: 'In Stock', value: data.supply.in_stock, color: colors.green.text },
          { label: 'Low Stock', value: data.supply.low_stock, color: colors.amber.text },
          { label: 'Out of Stock', value: data.supply.out_of_stock, color: colors.red.text },
        ]}
      />
    </div>
  )
}

function SummaryCardInner({
  style, onClick, icon, color, title, subtitle, total, totalLabel, stats,
}: {
  style: React.CSSProperties
  onClick: () => void
  icon: React.ReactNode
  color: typeof colors.blue
  title: string
  subtitle: string
  total: number
  totalLabel: string
  stats: { label: string; value: number; color: string }[]
}) {
  const [hovered, setHovered] = useState(false)
  //ismeringohy
  return (
    <div
      style={{ 
        ...style,
        borderColor: hovered ? color.border : '#E2E8F0',
        boxShadow: hovered ? '0 4px 20px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.05)',
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top row: icon + title */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
        <IconBox icon={icon} color={color} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', lineHeight: 1.3 }}>{title}</div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 1 }}>{subtitle}</div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 28, height: 28, borderRadius: 8,
          background: hovered ? color.bg : 'transparent',
          transition: 'background 0.2s',
        }}>
          <ChevronRight size={16} style={{ color: '#CBD5E1' }} />
        </div>
      </div>

      {/* Total figure */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 36, fontWeight: 800, color: '#0F172A', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {total}
        </span>
        <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>{totalLabel}</span>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: '#F1F5F9', marginBottom: 12 }} />

      {/* Stats breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {stats.map((s) => (
          <Stat key={s.label} label={s.label} value={s.value} color={s.color} />
        ))}
      </div>
    </div>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function Tabs({ active, onChange }: { active: TabKey; onChange: (t: TabKey) => void }) {
  const tabs: { key: TabKey; label: string }[] = [
    { key: 'all',           label: 'All Items' },
    { key: 'ppe',           label: 'PPE' },
    { key: 'se',            label: 'Semi-Expendable' },
    { key: 'supply',        label: 'Supply' },
    { key: 'disposal',      label: 'Disposal' },
    { key: 'counts',        label: 'Cycle Counts' },
  ]
  return (
    <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #E2E8F0', background: '#FAFBFC' }}>
      {tabs.map((t) => {
        const isActive = t.key === active
        return (
          <button
            key={t.key} type="button"
            onClick={() => onChange(t.key)}
            style={{
              position: 'relative',
              padding: '14px 24px',
              fontSize: 13,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? '#1E40AF' : '#64748B',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'color 0.15s',
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = '#334155'
            }}
            onMouseLeave={(e) => {
              if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = '#64748B'
            }}
          >
            {t.label}
            {isActive && (
              <span style={{
                position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                width: 28, height: 2.5, borderRadius: '1px',
                background: '#1E40AF',
              }} />
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string; border: string; tone: 'green' | 'yellow' | 'red' | 'blue' | 'violet' }> = {
    IN_STOCK:          { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0', tone: 'green' },
    LOW_STOCK:         { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A', tone: 'yellow' },
    OUT_OF_STOCK:      { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA', tone: 'red' },
    AVAILABLE:         { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0', tone: 'green' },
    IN_USE:            { bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE', tone: 'blue' },
    UNDER_MAINTENANCE: { bg: '#FAF5FF', color: '#7C3AED', border: '#DDD6FE', tone: 'violet' },
  }
  const s = cfg[status] ?? { bg: '#F8FAFC', color: '#475569', border: '#E2E8F0', tone: 'green' as const }
  return (
    <Badge tone={s.tone}>
      {inventoryStatusLabel(status)}
    </Badge>
  )
}

// ─── Action cell ──────────────────────────────────────────────────────────────

interface ActionCellProps {
  item: InventoryItem
  onStockIn: () => void
  onStockOut: () => void
  onTransfer: () => void
  onAdjust: () => void
  onHistory: () => void
  onEdit: () => void
  onAsset?: () => void
  onDelete: () => void
  onMarkForDisposal?: () => void
  onFinalizeDisposal?: () => void
  onCancelDisposal?: () => void
  onViewDisposal?: () => void
}

function ActionCell({ item, onStockIn, onStockOut, onTransfer, onAdjust, onHistory, onEdit, onAsset, onDelete, onMarkForDisposal, onFinalizeDisposal, onCancelDisposal, onViewDisposal }: ActionCellProps) {
  const [openMenu, setOpenMenu] = useState(false)
  const menuContainerRef = useRef<HTMLDivElement | null>(null)
  const selectRef = useRef<HTMLButtonElement | null>(null)
  const popupRef = useRef<HTMLDivElement | null>(null)
  const [popupPos, setPopupPos] = useState<React.CSSProperties>({})

  // Close on click outside (check both trigger and popup since popup is portaled)
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

  /* Position the portaled popup relative to the trigger button. */
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
    // align to trigger right edge when possible
    const left = Math.max(8, Math.min(r.right - MIN, window.innerWidth - MIN - 8))
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

  // Primary actions (most used)
  const primaryBtn = (icon: React.ReactNode, label: string, onClick: () => void, variant: 'primary' | 'secondary' | 'danger' = 'secondary') => {
    const v = variant === 'primary'
      ? { bg: '#1E40AF', color: '#fff', border: '#1E40AF', hoverBg: '#1D4ED8' }
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
          fontSize: 13,
          fontWeight: 600,
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = v.hoverBg }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = v.bg }}
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

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
      {/* Quick action: Stock In (always visible) */}
      {primaryBtn(<TrendingUp size={14} />, 'Add Stock', onStockIn, 'primary')}

      {/* Quick action: Stock Out (always visible) */}
      {primaryBtn(<TrendingDown size={14} />, 'Remove Stock', onStockOut)}

      {/* More actions dropdown */}
      <div ref={menuContainerRef} style={{ position: 'relative' }}>
        {/* Use a dedicated trigger button so we can anchor the portaled popup */}
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
            {menuItem(<ArrowRightLeft size={14} />, 'Transfer Location', onTransfer)}
            {menuItem(<RotateCcw size={14} />, 'Adjust Quantity', onAdjust)}
            {menuItem(<History size={14} />, 'View History', onHistory)}
            {menuItem(<Edit3 size={14} />, 'Edit Item', onEdit)}
            {onAsset && menuItem(<Eye size={14} />, 'View Asset', onAsset)}
            {onViewDisposal && menuItem(<Monitor size={14} />, 'View Disposal', onViewDisposal)}

            {/* Disposal actions for linked assets */}
            {item.asset_id && item.asset_status !== 'FOR_DISPOSAL' && item.asset_status !== 'DISPOSED' && onMarkForDisposal && (
              <div style={{ marginTop: 6 }} />
            )}
            {item.asset_id && item.asset_status !== 'FOR_DISPOSAL' && item.asset_status !== 'DISPOSED' && onMarkForDisposal && menuItem(<Trash2 size={14} />, 'Mark for Disposal', onMarkForDisposal)}
            {item.asset_id && item.asset_status === 'FOR_DISPOSAL' && onFinalizeDisposal && menuItem(<CheckCircle2 size={14} />, 'Finalize Disposal', onFinalizeDisposal)}
            {item.asset_id && item.asset_status === 'FOR_DISPOSAL' && onCancelDisposal && menuItem(<XCircle size={14} />, 'Cancel Disposal', onCancelDisposal)}

            <div style={{ height: 1, background: '#F1F5F9', margin: '4px 0' }} />
            {menuItem(<Trash2 size={14} />, 'Delete Item', onDelete, 'danger')}
          </div>,
          document.body,
        )}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function InventoryPage() {
  const navigate = useNavigate()

  // Table state
  const [rows,           setRows]           = useState<InventoryItem[]>([])
  const [loading,        setLoading]        = useState(true)
  const [loadingMore,    setLoadingMore]    = useState(false)
  const [page,           setPage]           = useState(1)
  const [lastPage,       setLastPage]       = useState(1)
  const [search,         setSearch]         = useState('')
  const [statusFilter,   setStatusFilter]   = useState('')
  const [activeTab,      setActiveTab]      = useState<TabKey>('all')

  // Sentinel ref for infinite scroll
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Summary
  const [summary,        setSummary]        = useState<SummaryData>({
    ppe:   { total: 0, in_use: 0, available: 0, maintenance: 0, disposed: 0 },
    se:    { total: 0, in_use: 0, available: 0, maintenance: 0, disposed: 0 },
    supply:{ total: 0, in_stock: 0, low_stock: 0, out_of_stock: 0 },
  })

  // Modal state
  const [modalOpen,      setModalOpen]      = useState(false)
  const [editingItem,    setEditingItem]    = useState<InventoryItem | null>(null)
  const [saving,         setSaving]         = useState(false)
  const [message,        setMessage]        = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [stockModalOpen, setStockModalOpen] = useState(false)
  const [stockItem,      setStockItem]      = useState<InventoryItem | null>(null)
  const [stockQty,       setStockQty]       = useState(1)
  const [stockReason,    setStockReason]    = useState('')
  const [stockType,      setStockType]      = useState<'in' | 'out'>('in')
  const [adjustItem,     setAdjustItem]     = useState<InventoryItem | null>(null)
  const [adjustQty,      setAdjustQty]      = useState(0)
  const [adjustReason,   setAdjustReason]   = useState('')
  const [transferItem,   setTransferItem]   = useState<InventoryItem | null>(null)
  const [transferQty,    setTransferQty]    = useState(1)
  const [transferSourceLocationId, setTransferSourceLocationId] = useState<number | null>(null)
  const [transferDestinationLocationId, setTransferDestinationLocationId] = useState<number | null>(null)
  const [transferReason, setTransferReason] = useState('')
  const [historyItem,    setHistoryItem]    = useState<InventoryItem | null>(null)
  const [historyRows,    setHistoryRows]    = useState<StockMovement[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [wizardOpen,     setWizardOpen]     = useState(false)
  const [countSessions, setCountSessions] = useState<InventoryCountSession[]>([])
  const [countSessionsLoading, setCountSessionsLoading] = useState(false)
  const [countSessionModalOpen, setCountSessionModalOpen] = useState(false)
  const [countLocationId, setCountLocationId] = useState<number | null>(null)
  const [countDate, setCountDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [countNotes, setCountNotes] = useState('')
  const [selectedCountSession, setSelectedCountSession] = useState<InventoryCountSession | null>(null)
  const [selectedCountLoading, setSelectedCountLoading] = useState(false)
  const [countActuals, setCountActuals] = useState<Record<number, string>>({})
  const [countRemarks, setCountRemarks] = useState<Record<number, string>>({})
  const [reconcileSession, setReconcileSession] = useState<InventoryCountSession | null>(null)

  // Disposal (inventory-initiated, operates on linked Asset when present)
  const [disposeModalOpen, setDisposeModalOpen] = useState(false)
  const [disposeItem, setDisposeItem] = useState<InventoryItem | null>(null)
  const [disposeReason, setDisposeReason] = useState('')
  const [disposeDate, setDisposeDate] = useState<string>(new Date().toISOString().slice(0,10))
  const [disposeMethod, setDisposeMethod] = useState('')
  const [disposeApprovalRef, setDisposeApprovalRef] = useState('')
  const [disposalActionLoading, setDisposalActionLoading] = useState(false)

  const [finalizeModalOpen, setFinalizeModalOpen] = useState(false)
  const [finalizeItem, setFinalizeItem] = useState<InventoryItem | null>(null)
  const [finalizeMethod, setFinalizeMethod] = useState('')
  const [finalizeDate, setFinalizeDate] = useState<string>(new Date().toISOString().slice(0,10))
  const [finalizeApprovalRef, setFinalizeApprovalRef] = useState('')

  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelItem, setCancelItem] = useState<InventoryItem | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  // Export column selection (used for CSV/JSON client-side exports)
  const availableExportColumns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Item Name' },
    { key: 'sku', label: 'SKU' },
    { key: 'type', label: 'Type' },
    { key: 'classification', label: 'Classification' },
    { key: 'property_number', label: 'Property No.' },
    { key: 'serial_number', label: 'Serial No.' },
    { key: 'asset_number', label: 'Asset No.' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'unit', label: 'Unit' },
    { key: 'status', label: 'Status' },
    { key: 'unit_cost', label: 'Unit Cost' },
    { key: 'reorder_level', label: 'Low Stock Alert' },
    { key: 'remarks', label: 'Remarks' },
    { key: 'accountability', label: 'Accountability' },
  ]
  const [exportColumns, setExportColumns] = useState<string[]>(['id','name','sku','classification','property_number','asset_number','serial_number','quantity','unit','status'])

  // Live SKU validation state
  const [codeValidation, setCodeValidation]   = useState<{ exists: boolean; message: string } | null>(null)
  // SKU generation state
  const [skuGenerating,  setSkuGenerating]    = useState(false)

  // Setup/master-data options for the Add/Edit form dropdowns
  const [manufacturers,   setManufacturers]   = useState<SetupRecord[]>([])
  const [assetCategories, setAssetCategories] = useState<SetupRecord[]>([])
  const [offices,         setOffices]         = useState<SetupRecord[]>([])
  const [locations,       setLocations]       = useState<SetupRecord[]>([])
  const [units,           setUnits]           = useState<SetupRecord[]>([])
  const [inventoryItemTypes, setInventoryItemTypes] = useState<SetupRecord[]>([])
 
  const loadSetupOptions = useCallback(async () => {
    try {
      const [mfr, cats, offs, locs, uns, itemTypes] = await Promise.all([
        setupService.list('manufacturers'),
        setupService.list('asset-categories'),
        setupService.list('offices'),
        setupService.list('locations'),
        setupService.list('units'),
        setupService.list('inventory-item-types'),
      ])
      setManufacturers(mfr)
      setAssetCategories(cats)
      setOffices(offs)
      setLocations(locs)
      setUnits(uns)
      setInventoryItemTypes(itemTypes)
    } catch { /* best-effort — dropdowns degrade gracefully if unavailable */ }
  }, [])

  const [formData, setFormData] = useState<CreateInventoryItemPayload>({
    name: '', sku: '', quantity: 0, unit_cost: null, unit: '', unit_id: null, reorder_level: 0,
    is_borrowable: true,
    track_as_asset: true, type: 'non_expendable', classification: null, item_nature: 'ACCOUNTABLE_PROPERTY',
    description: '', model: null,
    asset_category_id: null, manufacturer_id: null, office_id: null, location_id: null,
    item_type_id: null,
    // Procurement — inventory-owned
    purchase_date: null,
    warranty_until: null,
    supplier_id: null,
    // Identifiers — synced to linked Asset on save
    property_number: null,
    serial_number: null,
  })

  const editingItemId = editingItem?.id

  useEffect(() => {
    const validateCode = async () => {
      try {
        const { data } = await api.get<ApiResponse<{ exists: boolean; message: string }>>('/inventory/validate-sku', {
          params: {
            sku: formData.sku,
            // Pass the inventory item's id so the backend ignores the item's own SKU
            ...(editingItemId ? { ignore_id: editingItemId } : {}),
          },
        })
        setCodeValidation(unwrapData(data))
      } catch {
        setCodeValidation(null)
      }
    }
    if (formData.sku) {
      void validateCode()
    } else {
      setCodeValidation(null)
    }
  }, [formData.sku, editingItemId])

  // Load table rows — pg=1 resets list, pg>1 appends (infinite scroll)
  const loadInventory = useCallback(async (pg = 1) => {
    if (activeTab === 'counts') return
    if (pg === 1) setLoading(true); else setLoadingMore(true)
    try {
      const classification =
        activeTab === 'ppe'
          ? 'PPE'
          : activeTab === 'se'
            ? 'SE'
            : activeTab === 'supply'
              ? 'SUPPLY'
              : undefined

      const result = await inventoryService.list({
        page: pg,
        per_page: 20,
        search: search || undefined,
        status: statusFilter || undefined,
        classification,
      })
      setRows(prev => pg === 1 ? result.items : [...prev, ...result.items])
      setPage(result.meta.current_page)
      setLastPage(result.meta.last_page)
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unable to load inventory items.' })
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [search, statusFilter, activeTab])

  // Load summary counts — fires once and on explicit refresh only
  const loadSummary = useCallback(async () => {
    try {
      const [ppeMeta, seMeta, supplyMeta, ppeAll, seAll, supplyAll] = await Promise.all([
        inventoryService.list({ classification: 'PPE', per_page: 1 }),
        inventoryService.list({ classification: 'SE', per_page: 1 }),
        inventoryService.list({ classification: 'SUPPLY', per_page: 1 }),
        inventoryService.list({ classification: 'PPE', per_page: 100 }),
        inventoryService.list({ classification: 'SE', per_page: 100 }),
        inventoryService.list({ classification: 'SUPPLY', per_page: 100 }),
      ])
      const count = (arr: InventoryItem[], s: string) => arr.filter((i) => i.status === s).length
      setSummary({
        ppe: {
          total:       ppeMeta.meta.total,
          in_use:      count(ppeAll.items, 'IN_USE'),
          available:   count(ppeAll.items, 'IN_STOCK'),
          maintenance: count(ppeAll.items, 'UNDER_MAINTENANCE'),
          disposed:    count(ppeAll.items, 'DISPOSED'),
        },
        se: {
          total:       seMeta.meta.total,
          in_use:      count(seAll.items, 'IN_USE'),
          available:   count(seAll.items, 'IN_STOCK'),
          maintenance: count(seAll.items, 'UNDER_MAINTENANCE'),
          disposed:    count(seAll.items, 'DISPOSED'),
        },
        supply: {
          total:        supplyMeta.meta.total,
          in_stock:     count(supplyAll.items, 'IN_STOCK'),
          low_stock:    count(supplyAll.items, 'LOW_STOCK'),
          out_of_stock: count(supplyAll.items, 'OUT_OF_STOCK'),
        },
      })
    } catch { /* summary is best-effort */ }
  }, [])

  // Trigger on tab / filter changes
  useEffect(() => {
    if (activeTab === 'counts') return
    void loadInventory(1)
  }, [activeTab, loadInventory, statusFilter])

  // Summary loads once on mount
  useEffect(() => {
    void loadSummary()
  }, [loadSummary])

  // Infinite scroll — observe sentinel at bottom of table
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (activeTab !== 'counts' && entries[0].isIntersecting && page < lastPage && !loadingMore && !loading) {
          void loadInventory(page + 1)
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [activeTab, page, lastPage, loading, loadingMore, loadInventory])

  const handleTabChange = (t: TabKey) => { 
    setActiveTab(t); 
    setPage(1);
    // When switching to Disposal tab, show disposed items by setting status filter
    if (t === 'disposal') {
      setStatusFilter('DISPOSED')
    } else if (t === 'counts') {
      setStatusFilter('')
      setSearch('')
    } else {
      setStatusFilter('')
    }
  }
  const handleFilter    = () => { void loadInventory(1) }
  const handleSearch    = (e: React.KeyboardEvent) => { if (e.key === 'Enter') void loadInventory(1) }

  // ── CRUD handlers ────────────────────────────────────────────────────────────

  const handleCreate = () => {
    setEditingItem(null)
    setCodeValidation(null)
    void loadSetupOptions()
    setFormData({
      name: '', sku: '', quantity: 0, unit_cost: null, unit: '', unit_id: null, reorder_level: 0,
      is_borrowable: activeTab !== 'supply',
      track_as_asset: activeTab !== 'supply',
      classification: activeTab === 'all' ? 'PPE' : activeTab === 'ppe' ? 'PPE' : activeTab === 'se' ? 'SE' : 'SUPPLY',
      item_nature: activeTab === 'supply' ? 'CONSUMABLE_SUPPLY' : 'ACCOUNTABLE_PROPERTY',
      type: activeTab === 'supply' ? 'expendable' : 'non_expendable',
      description: '', model: null,
      asset_category_id: null, manufacturer_id: null, office_id: null, location_id: null,
      item_type_id: null,
      purchase_date: null, warranty_until: null, supplier_id: null,
      // Identifier fields — empty on create
      property_number: null,
      serial_number: null,
    })
    setModalOpen(true)
    // Auto-generate SKU after opening the modal
    setSkuGenerating(true)
    inventoryService.generateSku().then((sku) => {
      setFormData((prev) => ({ ...prev, sku }))
    }).catch(() => {
      // If generation fails, leave SKU empty so user can enter manually
    }).finally(() => setSkuGenerating(false))
  }

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setCodeValidation(null)
    void loadSetupOptions()
    setFormData({
      name: item.name,
      sku: item.sku ?? '',
      quantity: item.quantity,
      unit_cost: item.unit_cost ?? null,
      unit: item.unit,
      unit_id: item.unit_id ?? null,
      reorder_level: item.reorder_level || 0,
      is_borrowable: item.is_borrowable !== false,
      track_as_asset: item.track_as_asset !== false,
      classification: (item.classification as 'PPE' | 'SE' | 'SUPPLY') ?? ((item.type === 'expendable') ? 'SUPPLY' : 'PPE'),
      item_nature: (item.item_nature as 'ACCOUNTABLE_PROPERTY' | 'CONSUMABLE_SUPPLY') ?? ((item.type === 'expendable') ? 'CONSUMABLE_SUPPLY' : 'ACCOUNTABLE_PROPERTY'),
      type: (item.type as 'non_expendable' | 'expendable') ?? 'non_expendable',
      description: item.description ?? '',
      model: item.model ?? null,
      asset_category_id: item.asset_category_id ?? null,
      manufacturer_id: item.manufacturer_id ?? null,
      office_id: item.office_id ?? null,
      location_id: item.location_id ?? null,
      item_type_id: item.item_type_id ?? null,
      purchase_date: item.purchase_date ?? null,
      warranty_until: item.warranty_until ?? null,
      supplier_id: item.supplier_id ?? null,
      // Identifier fields — populate from linked Asset (read from API response)
      property_number: item.property_number ?? null,
      serial_number: item.serial_number ?? null,
    })
    setModalOpen(true)
  }

  const handleDelete = async (item: InventoryItem) => {
    if (!confirm(`Delete "${item.name}"?`)) return
    try {
      await inventoryService.delete(item.id)
      setMessage({ type: 'success', text: 'Item deleted.' })
      notifyDataChanged('inventory')
      void loadInventory(1); void loadSummary()
    } catch (e: unknown) { setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to delete.' }) }
  }

  // ── Disposal actions (inventory-initiated, operate on linked Asset when present) ──
  const openMarkForDisposal = (item: InventoryItem) => {
    setDisposeItem(item)
    setDisposeReason('')
    setDisposeMethod('')
    setDisposeApprovalRef('')
    setDisposeDate(new Date().toISOString().slice(0,10))
    setDisposeModalOpen(true)
  }

  const openFinalizeDisposal = (item: InventoryItem) => {
    setFinalizeItem(item)
    setFinalizeMethod('')
    setFinalizeApprovalRef('')
    setFinalizeDate(new Date().toISOString().slice(0,10))
    setFinalizeModalOpen(true)
  }

  const openCancelDisposal = (item: InventoryItem) => {
    setCancelItem(item)
    setCancelReason('')
    setCancelModalOpen(true)
  }

  const submitMarkForDisposal = async () => {
    if (!disposeItem || !disposeItem.asset_id) return
    if (!disposeReason.trim()) { setMessage({ type: 'error', text: 'Please provide a disposal reason.' }); return }
    setDisposalActionLoading(true)
    try {
      await assetService.markForDisposal(disposeItem.asset_id, {
        disposal_reason: disposeReason.trim(),
        disposal_date: disposeDate,
        disposal_method: disposeMethod.trim() || undefined,
        disposal_approval_ref: disposeApprovalRef.trim() || undefined,
      })
      setDisposeModalOpen(false)
      setDisposeItem(null)
      setMessage({ type: 'success', text: 'Asset marked for disposal.' })
      notifyDataChanged('assets')
      void loadInventory(page); void loadSummary()
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unable to mark asset for disposal.' })
    } finally {
      setDisposalActionLoading(false)
    }
  }

  const submitFinalizeDisposal = async () => {
    if (!finalizeItem || !finalizeItem.asset_id) return
    if (!finalizeMethod.trim()) { setMessage({ type: 'error', text: 'Please provide a disposal method before finalizing.' }); return }
    setDisposalActionLoading(true)
    try {
      await assetService.finalizeDisposal(finalizeItem.asset_id, {
        disposal_date: finalizeDate,
        disposal_method: finalizeMethod.trim(),
        disposal_approval_ref: finalizeApprovalRef.trim() || undefined,
      })
      setFinalizeModalOpen(false)
      setFinalizeItem(null)
      setMessage({ type: 'success', text: 'Asset disposal finalized.' })
      notifyDataChanged('assets')
      void loadInventory(page); void loadSummary()
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unable to finalize disposal.' })
    } finally { setDisposalActionLoading(false) }
  }

  const submitCancelDisposal = async () => {
    if (!cancelItem || !cancelItem.asset_id) return
    if (!cancelReason.trim()) { setMessage({ type: 'error', text: 'A cancellation reason is required.' }); return }
    setDisposalActionLoading(true)
    try {
      await assetService.cancelDisposal(cancelItem.asset_id, { disposal_cancel_reason: cancelReason.trim() })
      setCancelModalOpen(false)
      setCancelItem(null)
      setMessage({ type: 'success', text: 'Disposal proposal cancelled.' })
      notifyDataChanged('assets')
      void loadInventory(page); void loadSummary()
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unable to cancel disposal.' })
    } finally { setDisposalActionLoading(false) }
  }


  const handleSubmit = async () => {
    if (codeValidation?.exists) {
      setMessage({ type: 'error', text: 'Please fix duplicate Item Code / SKU before saving.' })
      return
    }
    setSaving(true); setMessage(null)
    try {
      if (editingItem) { await inventoryService.update(editingItem.id, formData as UpdateInventoryItemPayload) }
      else { await inventoryService.create(formData) }
      setMessage({ type: 'success', text: editingItem ? 'Item updated.' : 'Item created.' })
      setModalOpen(false)
      notifyDataChanged('inventory')
      void loadInventory(1); void loadSummary()
    } catch (e: unknown) { setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to save.' }) }
    finally { setSaving(false) }
  }

  const handleStockSubmit = async () => {
    if (!stockItem) return; setSaving(true)
    try {
      if (stockType === 'in') { await inventoryService.stockIn(stockItem.id,  { quantity: stockQty, reason: stockReason || undefined }) }
      else                    { await inventoryService.stockOut(stockItem.id, { quantity: stockQty, reason: stockReason || undefined }) }
      setMessage({ type: 'success', text: stockType === 'in' ? 'Stock added.' : 'Stock removed.' })
      setStockModalOpen(false)
      notifyDataChanged('inventory')
      void loadInventory(page); void loadSummary()
    } catch (e: unknown) { setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to update stock.' }) }
    finally { setSaving(false) }
  }

  const handleAdjustSubmit = async () => {
    if (!adjustItem) return
    if (!adjustReason.trim()) { setMessage({ type: 'error', text: 'Please provide a reason.' }); return }
    setSaving(true)
    try {
      await inventoryService.adjust(adjustItem.id, { quantity: adjustQty, reason: adjustReason.trim() })
      setAdjustItem(null)
      setMessage({ type: 'success', text: 'Quantity corrected.' })
      notifyDataChanged('inventory')
      void loadInventory(page); void loadSummary()
    } catch (e: unknown) { setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to adjust.' }) }
    finally { setSaving(false) }
  }

  const loadHistory = async (item: InventoryItem) => {
    setHistoryItem(item); setHistoryLoading(true)
    try { const r = await inventoryService.history(item.id); setHistoryRows(r.items) }
    catch (e: unknown) { setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to load history.' }) }
    finally { setHistoryLoading(false) }
  }

  const openTransfer = (item: InventoryItem) => {
    void loadSetupOptions()
    setTransferItem(item)
    setTransferQty(1)
    setTransferSourceLocationId(item.location_id ?? null)
    setTransferDestinationLocationId(null)
    setTransferReason('')
  }

  const handleTransferSubmit = async () => {
    if (!transferItem) return
    if (!transferSourceLocationId || !transferDestinationLocationId) {
      setMessage({ type: 'error', text: 'Select both source and destination locations.' })
      return
    }
    if (transferSourceLocationId === transferDestinationLocationId) {
      setMessage({ type: 'error', text: 'Destination must be different from the source location.' })
      return
    }
    if (transferQty < 1 || transferQty > transferItem.quantity) {
      setMessage({ type: 'error', text: 'Transfer quantity must be within the available stock.' })
      return
    }
    setSaving(true)
    try {
      await inventoryService.transfer(transferItem.id, {
        quantity: transferQty,
        source_location_id: transferSourceLocationId,
        destination_location_id: transferDestinationLocationId,
        reason: transferReason.trim() || undefined,
      })
      setTransferItem(null)
      setMessage({ type: 'success', text: 'Inventory transferred.' })
      notifyDataChanged('inventory')
      void loadInventory(page); void loadSummary()
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to transfer inventory.' })
    } finally { setSaving(false) }
  }

  const hydrateCountInputs = (session: InventoryCountSession) => {
    setCountActuals(Object.fromEntries(session.items.map((item) => [item.inventory_item_id, item.actual_quantity === null || item.actual_quantity === undefined ? '' : String(item.actual_quantity)])))
    setCountRemarks(Object.fromEntries(session.items.map((item) => [item.inventory_item_id, item.remarks ?? ''])))
  }

  const loadCountSessions = useCallback(async () => {
    setCountSessionsLoading(true)
    try {
      const result = await inventoryService.countSessions()
      setCountSessions(result.items)
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unable to load count sessions.' })
    } finally { setCountSessionsLoading(false) }
  }, [])

  useEffect(() => {
    if (activeTab === 'counts') void loadCountSessions()
  }, [activeTab, loadCountSessions])

  const openCountSession = async (sessionId: number) => {
    setSelectedCountLoading(true)
    try {
      const session = await inventoryService.getCountSession(sessionId)
      setSelectedCountSession(session)
      hydrateCountInputs(session)
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unable to load count session.' })
    } finally { setSelectedCountLoading(false) }
  }

  const handleCreateCountSession = async () => {
    setSaving(true)
    try {
      const session = await inventoryService.createCountSession({
        location_id: countLocationId,
        counted_at: countDate || undefined,
        notes: countNotes.trim() || undefined,
      })
      setCountSessionModalOpen(false)
      setCountLocationId(null)
      setCountNotes('')
      setMessage({ type: 'success', text: 'Count session started.' })
      await loadCountSessions()
      setSelectedCountSession(session)
      hydrateCountInputs(session)
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to start count session.' })
    } finally { setSaving(false) }
  }

  const handleRecordCount = async (itemId: number) => {
    if (!selectedCountSession) return
    const rawActual = countActuals[itemId]
    const actualQuantity = Number(rawActual)
    if (!Number.isFinite(actualQuantity) || actualQuantity < 0) {
      setMessage({ type: 'error', text: 'Enter a valid actual quantity before saving the count.' })
      return
    }
    setSaving(true)
    try {
      const session = await inventoryService.recordCount(selectedCountSession.id, itemId, {
        actual_quantity: actualQuantity,
        remarks: countRemarks[itemId]?.trim() || undefined,
      })
      setSelectedCountSession(session)
      hydrateCountInputs(session)
      await loadCountSessions()
      setMessage({ type: 'success', text: 'Count saved.' })
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to save count.' })
    } finally { setSaving(false) }
  }

  const handleCompleteCountSession = async () => {
    if (!selectedCountSession) return
    setSaving(true)
    try {
      const session = await inventoryService.completeCountSession(selectedCountSession.id)
      setSelectedCountSession(session)
      hydrateCountInputs(session)
      await loadCountSessions()
      setMessage({ type: 'success', text: 'Count session completed.' })
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to complete count session.' })
    } finally { setSaving(false) }
  }

  const handleReconcileCountSession = async () => {
    if (!reconcileSession) return
    setSaving(true)
    try {
      const session = await inventoryService.reconcileCountSession(reconcileSession.id)
      setReconcileSession(null)
      setSelectedCountSession(session)
      hydrateCountInputs(session)
      await loadCountSessions()
      notifyDataChanged('inventory')
      void loadSummary()
      setMessage({ type: 'success', text: 'Count session reconciled to inventory.' })
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to reconcile count session.' })
    } finally { setSaving(false) }
  }

  // ── Export modal state ─────────────────────────────────────────────────────
  const [exportModalOpen,  setExportModalOpen]  = useState(false)
  const [exportFormat,     setExportFormat]     = useState<'xlsx' | 'csv' | 'json'>('xlsx')
  const [exportScope,      setExportScope]      = useState<'all' | 'ppe' | 'se' | 'supply' | 'disposal'>('all')
  const [exporting,        setExporting]        = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const scopeFilter = exportScope === 'all'
        ? undefined
        : exportScope === 'ppe'
          ? 'PPE'
          : exportScope === 'se'
            ? 'SE'
            : 'SUPPLY'

      if (exportFormat === 'json') {
        const result = await inventoryService.list({ per_page: 9999, search: search || undefined, classification: scopeFilter })
        // Filter object keys based on selected exportColumns when exporting JSON
        const filtered = result.items.map((it) => {
          const obj: Record<string, unknown> = {}
          for (const k of exportColumns) {
            obj[k] = (it as unknown as Record<string, unknown>)[k]
          }
          return obj
        })
        const json = JSON.stringify(filtered, null, 2)
        const blob = new Blob([json], { type: 'application/json' })
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        a.href     = url
        a.download = `inventory-${exportScope}-${Date.now()}.json`
        document.body.appendChild(a); a.click(); document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else if (exportFormat === 'csv') {
        const result = await inventoryService.list({ per_page: 9999, search: search || undefined, classification: scopeFilter })
        const headers = exportColumns.length ? exportColumns : ['id', 'name', 'type', 'classification', 'sku', 'property_number', 'asset_number', 'serial_number', 'accountability', 'quantity', 'unit', 'status', 'reorder_level', 'remarks']
        const lines   = [headers.join(',')]
        for (const item of result.items) {
          const itemMap = item as unknown as Record<string, unknown>
          const row = headers.map((h) => {
            const raw = itemMap[h] ?? ''
            const val = String(raw)
            const needsQuote = val.includes(',') || val.includes('"') || val.includes('\n')
            return needsQuote ? ('"' + val.replace(/"/g, '""') + '"') : val
          })
          lines.push(row.join(','))
        }
        const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        a.href     = url
        a.download = `inventory-${exportScope}-${Date.now()}.csv`
        document.body.appendChild(a); a.click(); document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        const blob = await inventoryService.downloadExport({ search: search || undefined, status: statusFilter || undefined, classification: scopeFilter })
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        a.href     = url
        a.download = `inventory-${exportScope}-${Date.now()}.xlsx`
        document.body.appendChild(a); a.click(); document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }

      setExportModalOpen(false)
      setMessage({ type: 'success', text: 'Export downloaded successfully.' })
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Export failed.' })
    } finally { setExporting(false) }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const td: React.CSSProperties = {
    padding: '14px 16px',
    fontSize: 13.5,
    color: '#374151',
    borderBottom: '1px solid #F1F5F9',
    verticalAlign: 'middle',
  }

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

  const countSessionProgress = (session: InventoryCountSession) => {
    const counted = session.items.filter((item) => item.actual_quantity !== null && item.actual_quantity !== undefined).length
    return { counted, total: session.items.length }
  }

  const countSessionVariance = (session: InventoryCountSession) => {
    return session.items.filter((item) => Number(item.variance ?? 0) !== 0).length
  }

  const countStatusTone = (status: string) => {
    if (status === 'reconciled') return 'green' as const
    if (status === 'completed') return 'blue' as const
    return 'yellow' as const
  }

  const countCardStyle: React.CSSProperties = {
    border: '1px solid #E2E8F0',
    borderRadius: 12,
    background: '#fff',
    padding: 16,
  }

  const renderCountSessions = () => (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0F172A', fontWeight: 800, fontSize: 16 }}>
            <ClipboardCheck size={18} />
            Physical Count Sessions
          </div>
          <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: 13 }}>
            Record actual stock by location, complete the count, then reconcile approved variances.
          </p>
        </div>
        <Button size="sm" onClick={() => { void loadSetupOptions(); setCountDate(new Date().toISOString().slice(0, 10)); setCountSessionModalOpen(true) }}>
          <Plus size={14} />
          Start Count
        </Button>
      </div>

      {countSessionsLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '42px 0' }}><Spinner /></div>
      ) : countSessions.length === 0 ? (
        <EmptyState title="No count sessions yet" description="Start a count session to verify inventory quantities." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {countSessions.map((session) => {
            const progress = countSessionProgress(session)
            return (
              <button
                key={session.id}
                type="button"
                onClick={() => void openCountSession(session.id)}
                style={{
                  ...countCardStyle,
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: selectedCountSession?.id === session.id ? '0 0 0 2px #BFDBFE' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                  <strong style={{ color: '#0F172A', fontSize: 14 }}>{session.location_name ?? 'All Locations'}</strong>
                  <Badge tone={countStatusTone(session.status)}>{session.status}</Badge>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12.5, color: '#475569' }}>
                  <div>Counted: <strong>{progress.counted}/{progress.total}</strong></div>
                  <div>Variance: <strong>{countSessionVariance(session)}</strong></div>
                  <div>Started by: <strong>{session.started_by ?? 'System'}</strong></div>
                  <div>Date: <strong>{session.counted_at ?? session.completed_at ?? 'Draft'}</strong></div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {selectedCountLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}><Spinner /></div>
      ) : selectedCountSession && (
        <div style={{ ...countCardStyle, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 800, color: '#0F172A' }}>
                {selectedCountSession.location_name ?? 'All Locations'} Count
              </div>
              <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 3 }}>
                {selectedCountSession.notes || 'No notes provided.'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Badge tone={countStatusTone(selectedCountSession.status)}>{selectedCountSession.status}</Badge>
              {selectedCountSession.status === 'draft' && (
                <Button size="sm" onClick={() => void handleCompleteCountSession()} disabled={saving}>
                  Complete Count
                </Button>
              )}
              {selectedCountSession.status === 'completed' && (
                <Button size="sm" onClick={() => setReconcileSession(selectedCountSession)} disabled={saving}>
                  Reconcile
                </Button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {selectedCountSession.items.map((item) => {
              const actualRaw = countActuals[item.inventory_item_id] ?? ''
              const actual = actualRaw === '' ? null : Number(actualRaw)
              const variance = actual === null || Number.isNaN(actual) ? item.variance : actual - item.expected_quantity
              const isDraft = selectedCountSession.status === 'draft'
              return (
                <div key={item.id} style={{ border: '1px solid #E5E7EB', borderRadius: 10, padding: 12, background: '#F8FAFC' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, alignItems: 'end' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#1E293B', fontSize: 13.5 }}>{item.item_name ?? `Item #${item.inventory_item_id}`}</div>
                      <div style={{ color: '#64748B', fontSize: 12 }}>{item.sku ?? 'No SKU'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700 }}>Expected</div>
                      <div style={{ fontWeight: 800, color: '#0F172A' }}>{item.expected_quantity}</div>
                    </div>
                    <Input
                      label="Actual"
                      type="number"
                      min={0}
                      value={actualRaw}
                      disabled={!isDraft}
                      onChange={(e) => setCountActuals((prev) => ({ ...prev, [item.inventory_item_id]: e.target.value }))}
                    />
                    <div>
                      <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700 }}>Variance</div>
                      <div style={{ fontWeight: 800, color: variance === 0 ? '#166534' : variance < 0 ? '#DC2626' : '#D97706' }}>
                        {variance > 0 ? '+' : ''}{variance}
                      </div>
                    </div>
                    {isDraft && (
                      <Button size="sm" variant="secondary" onClick={() => void handleRecordCount(item.inventory_item_id)} disabled={saving}>
                        <Save size={14} />
                        Save
                      </Button>
                    )}
                  </div>
                  <Input
                    label="Remarks"
                    value={countRemarks[item.inventory_item_id] ?? ''}
                    disabled={!isDraft}
                    onChange={(e) => setCountRemarks((prev) => ({ ...prev, [item.inventory_item_id]: e.target.value }))}
                    placeholder="Optional count note"
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )

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
            Inventory
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: '#64748B', lineHeight: 1.4 }}>
            Track and manage all items, supplies, and equipment in one place.
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button variant="secondary" size="sm" onClick={() => setWizardOpen(true)}>
            <Upload size={14} />
            Import
          </Button>
          <Button variant="secondary" size="sm" onClick={() => {
            setExportScope(['ppe', 'se', 'supply', 'disposal'].includes(activeTab) ? activeTab as 'ppe' | 'se' | 'supply' | 'disposal' : 'all')
            setExportModalOpen(true)
          }}>
            <Download size={14} />
            Export
          </Button>
          <Button size="sm" onClick={handleCreate}>
            <Plus size={14} />
            Add Item
          </Button>
        </div>
      </div>

      {/* Alert message */}
      {message && (
        <Alert tone={message.type} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* ── Summary cards ── */}
      <SummaryCard data={summary} onNavigate={handleTabChange} />

      {/* ── Table card ── */}
      <Card noPadding>
        {/* Tabs + search/filter — unified top bar */}
        <div>
          {/* Tab row */}
          <Tabs active={activeTab} onChange={handleTabChange} />

          {/* Search + filter row — sits flush below tabs */}
          {activeTab !== 'counts' && (
          <div style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
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
                onKeyDown={handleSearch}
                placeholder="Search by name, code, or unit..."
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
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); void loadInventory(1) }}
              style={{
                height: 38, paddingInline: '12px 32px', borderRadius: 10,
                border: '1.5px solid #E2E8F0', fontSize: 13, color: statusFilter ? '#1E293B' : '#94A3B8',
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
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
              <option value="AVAILABLE">Available</option>
              <option value="IN_USE">In Use</option>
              <option value="UNDER_MAINTENANCE">Under Maintenance</option>
            </select>

            {/* Filter button */}
            <button
              onClick={handleFilter}
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
          )}
        </div>

        {/* Table */}
        {activeTab === 'counts' ? renderCountSessions() : (
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
              <Spinner />
            </div>
          ) : rows.length === 0 ? (
            <div style={{ padding: '80px 0' }}>
              <EmptyState
                title="No inventory items found"
                description={
                  search || statusFilter
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Add your first item to begin tracking stock.'
                }
              />
            </div>
          ) : (
            <ScrollableTableWrapper><table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' as const }}>
              <colgroup>
                <col style={{ minWidth: 200 }} />
                <col style={{ width: 130 }} />
                <col style={{ width: 130 }} />
                <col style={{ width: 130 }} />
                <col style={{ width: 120 }} />
                <col style={{ width: 170 }} />
                <col style={{ width: 72 }} />
                <col style={{ width: 80 }} />
                <col style={{ width: 110 }} />
                <col style={{ width: 140 }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={th}>Item</th>
                  <th style={th}>SKU</th>
                  <th style={th}>Property No.</th>
                  <th style={th}>Serial No.</th>
                  <th style={th}>Asset No.</th>
                  <th style={th}>Unit Cost</th>
                  <th style={th}>Accountability</th>
                  <th style={{ ...th, textAlign: 'center' as const }}>Qty</th>
                  <th style={th}>Unit</th>
                  <th style={th}>Status</th>
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
                    {/* Item — name + type badge + optional remark */}
                    <td style={td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap' as const }}>
                        <span style={{
                          fontWeight: 600, color: '#0F172A', fontSize: 13.5,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          minWidth: 0, maxWidth: 220,
                        }}>
                          {r.name}
                        </span>
                        <Badge tone={r.classification === 'SUPPLY' ? 'yellow' : r.classification === 'SE' ? 'green' : (r.classification === 'PPE' ? 'blue' : 'gray') }>
                          {r.classification ?? '—'}
                        </Badge>
                      </div>
                      {r.remarks && (
                        <div style={{
                          fontSize: 11.5, color: '#9CA3AF', marginTop: 3,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          maxWidth: 300,
                        }}>
                          {r.remarks}
                        </div>
                      )}
                    </td>

                    {/* SKU */}
                    <td style={td}>
                      {r.sku ? (
                        <code style={{
                          fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace",
                          fontSize: 11.5, color: '#475569',
                          background: '#F1F5F9', padding: '3px 8px', borderRadius: 6,
                          display: 'inline-block', maxWidth: 130,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {r.sku}
                        </code>
                      ) : (
                        <span style={{ color: '#CBD5E1' }}>—</span>
                      )}
                    </td>

                    {/* Property Number */}
                    <td style={td}>
                      {r.property_number ? (
                        <code style={{
                          fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace",
                          fontSize: 11.5, color: '#475569',
                          background: '#F1F5F9', padding: '3px 8px', borderRadius: 6,
                          display: 'inline-block', maxWidth: 130,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {r.property_number}
                        </code>
                      ) : (
                        <span style={{ color: '#CBD5E1' }}>—</span>
                      )}
                    </td>

                    {/* Serial Number */}
                    <td style={td}>
                      {r.serial_number ? (
                        <code style={{
                          fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace",
                          fontSize: 11.5, color: '#475569',
                          background: '#F1F5F9', padding: '3px 8px', borderRadius: 6,
                          display: 'inline-block', maxWidth: 130,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {r.serial_number}
                        </code>
                      ) : (
                        <span style={{ color: '#CBD5E1' }}>—</span>
                      )}
                    </td>

                    {/* Asset Number */}
                    <td style={td}>
                      {r.asset_number ? (
                        <code style={{
                          fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace",
                          fontSize: 11.5, color: '#475569',
                          background: '#F1F5F9', padding: '3px 8px', borderRadius: 6,
                          display: 'inline-block', maxWidth: 130,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {r.asset_number}
                        </code>
                      ) : (
                        <span style={{ color: '#CBD5E1' }}>—</span>
                      )}
                    </td>

                    {/* Unit Cost */}
                    <td style={td}>
                      {r.unit_cost != null ? (
                        <span style={{ fontWeight: 600, fontSize: 13, color: '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
                          ₱{Number(r.unit_cost).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span style={{ color: '#CBD5E1' }}>—</span>
                      )}
                    </td>

                    {/* Accountability */}
                    <td style={td}>
                      <span style={{ color: '#64748B', fontSize: 13 }}>
                        {r.classification === 'SUPPLY' ? '—' : (r.accountability ?? '—')}
                      </span>
                      {r.is_unlinked_holder && (
                        <div style={{ fontSize: 11.5, color: '#B45309', marginTop: 2 }}>
                          Legacy unlinked holder
                        </div>
                      )}
                    </td>

                    {/* Qty */}
                    <td style={{ ...td, textAlign: 'center' as const }}>
                      <span style={{
                        fontWeight: 700, fontSize: 15, color: '#0F172A',
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {r.quantity}
                      </span>
                    </td>

                    {/* Unit */}
                    <td style={td}>
                      <span style={{ color: '#64748B', fontSize: 13 }}>
                        {r.unit || '—'}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={td}>
                      <StatusBadge status={r.status} />
                    </td>

                    {/* Actions */}
                    <td style={{
                      ...td, textAlign: 'right' as const,
                      paddingRight: 20, paddingTop: 10, paddingBottom: 10,
                      position: 'sticky' as const, right: 0, background: '#fff', zIndex: 5,
                    }}>
                      <ActionCell
                        item={r}
                        onStockIn   ={() => { setStockItem(r); setStockType('in');  setStockQty(1); setStockReason(''); setStockModalOpen(true) }}
                        onStockOut  ={() => { setStockItem(r); setStockType('out'); setStockQty(1); setStockReason(''); setStockModalOpen(true) }}
                        onTransfer  ={() => openTransfer(r)}
                        onAdjust    ={() => { setAdjustItem(r); setAdjustQty(r.quantity); setAdjustReason('') }}
                        onHistory   ={() => void loadHistory(r)}
                        onEdit      ={() => handleEdit(r)}
                        onAsset     ={r.asset_number ? () => navigate(`/assets?search=${encodeURIComponent(r.asset_number ?? '')}`) : undefined}
                        onDelete    ={() => handleDelete(r)}
                        onMarkForDisposal={r.asset_id ? () => openMarkForDisposal(r) : undefined}
                        onFinalizeDisposal={r.asset_id ? () => openFinalizeDisposal(r) : undefined}
                        onCancelDisposal={r.asset_id ? () => openCancelDisposal(r) : undefined}
                        onViewDisposal={() => { setActiveTab('disposal'); setSearch(r.name ?? r.asset_number ?? r.sku ?? '') }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></ScrollableTableWrapper>
          )}
        </div>
        )}

        {/* Infinite scroll sentinel */}
        {activeTab !== 'counts' && <div ref={sentinelRef} style={{ height: 1 }} />}
        {activeTab !== 'counts' && loadingMore && (
          <div style={{
            display: 'flex', justifyContent: 'center', padding: '20px 0',
            borderTop: '1px solid #F1F5F9',
          }}>
            <Spinner />
          </div>
        )}
      </Card>

      {/* ── Add / Edit modal ── */}
      {/* ── Add / Edit modal ── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'Edit Item' : 'Add Item'}
        maxWidth={660}
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSubmit} disabled={saving || Boolean(codeValidation?.exists)}>{saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Add Item'}</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* ── A. BASIC INFORMATION ── */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#94A3B8', marginBottom: 14 }}>Basic Information</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Input label="Item Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Laptop EB-X1 001" />

              {/* ── Item Identification group ── */}
              <div style={{ borderRadius: 12, border: '1px solid #E2E8F0', background: '#FAFBFC', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#64748B' }}>Item Identification</div>

                {/* SKU / Item Code */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Item Code / SKU</label>
                    {!editingItem && (
                      <button
                        type="button"
                        disabled={skuGenerating}
                        onClick={() => {
                          setSkuGenerating(true)
                          inventoryService.generateSku().then((sku) => {
                            setFormData((prev) => ({ ...prev, sku }))
                          }).catch(() => {}).finally(() => setSkuGenerating(false))
                        }}
                        style={{
                          fontSize: 11.5, fontWeight: 600, color: '#1E40AF',
                          background: 'none', border: 'none', cursor: skuGenerating ? 'wait' : 'pointer',
                          padding: 0, textDecoration: 'underline', fontFamily: 'inherit',
                          opacity: skuGenerating ? 0.5 : 1,
                        }}
                      >
                        {skuGenerating ? 'Generating…' : '↻ Re-generate'}
                      </button>
                    )}
                  </div>
                  <Input
                    value={formData.sku || ''}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder={skuGenerating ? 'Generating SKU…' : 'e.g. INV-20260809-A1B2'}
                  />
                  <div style={{ marginTop: 4, fontSize: 11.5, color: '#94A3B8' }}>
                    {editingItem
                      ? 'Leave unchanged to keep the existing code.'
                      : skuGenerating
                        ? 'Generating a unique SKU…'
                        : 'Auto-generated SKU — edit if needed.'}
                  </div>
                  {codeValidation && formData.sku && (
                    <div style={{ marginTop: 4, fontSize: 12, fontWeight: 600, color: codeValidation.exists ? '#DC2626' : '#16A34A' }}>
                      {codeValidation.exists ? '❌ ' : '✓ '}{codeValidation.message}
                    </div>
                  )}
                </div>

                {/* Track as Asset control */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Track as Asset</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                      When enabled this inventory item will be represented as an Asset in the Assets module. Disabling will hide the linked Asset from active asset lists but will not delete historical records.
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={Boolean(formData.track_as_asset)}
                        disabled={formData.classification === 'SUPPLY'}
                        onChange={(e) => {
                          const next = e.target.checked
                          if (!next && editingItem?.asset_number) {
                            const ok = window.confirm('Disable Track as Asset?\n\nThis will hide the linked Asset record from active lists. The Asset record will NOT be deleted. Proceed?')
                            if (!ok) return
                          }
                          setFormData({ ...formData, track_as_asset: next })
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Asset-linked identifier fields — only when track_as_asset is on */}
                {formData.track_as_asset && formData.classification !== 'SUPPLY' && (
                  <>
                    {/* Asset Number — read-only display on edit; empty hint on create */}
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                        Asset Number
                      </label>
                      <div style={{
                        padding: '8px 12px', borderRadius: 10,
                        border: '1px solid #E2E8F0', background: '#F1F5F9',
                        fontSize: 13, fontFamily: "'SF Mono','Fira Code',ui-monospace,monospace",
                        color: editingItem?.asset_number ? '#1E293B' : '#94A3B8',
                      }}>
                        {editingItem?.asset_number ?? 'Auto-generated by the system on save'}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 3 }}>
                        Asset Number is system-generated and cannot be changed.
                      </div>
                    </div>

                    {/* Property Number */}
                    <div>
                      <Input
                        label="Property Number"
                        value={formData.property_number ?? ''}
                        onChange={(e) => setFormData({ ...formData, property_number: e.target.value || null })}
                        placeholder="e.g. PROP-2026-0001"
                      />
                      <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 3 }}>
                        Government property record number for this asset instance.
                      </div>
                    </div>

                    {/* Serial Number */}
                    <div>
                      <Input
                        label="Serial Number"
                        value={formData.serial_number ?? ''}
                        onChange={(e) => setFormData({ ...formData, serial_number: e.target.value || null })}
                        placeholder="e.g. SN-ABCD-1234567"
                      />
                      <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 3 }}>
                        Manufacturer's serial number printed on the physical unit.
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional item description…"
                  rows={2}
                  style={{ width: '100%', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#F8FAFC', padding: '8px 12px', fontSize: 13.5, color: '#1E293B', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' as const, outline: 'none' }}
                />
              </div>
              <div>
                <SetupDropdown
                  label="Type"
                  resource="inventory-item-types"
                  options={inventoryItemTypes.map((type) => ({ label: type.name, value: type.id, raw: type }))}
                  value={formData.item_type_id ?? null}
                  onChange={(val) => setFormData({ ...formData, item_type_id: val })}
                  onRefreshNeeded={loadSetupOptions}
                  placeholder="Select or add a type"
                  codeLabel="Type Code"
                />
                <div style={{ marginTop: 4, fontSize: 11.5, color: '#94A3B8' }}>
                  Select an existing type or add a new one.
                </div>
              </div>
              {/* Inventory Type */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>Inventory Type</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {(['PPE', 'SE', 'SUPPLY'] as const).map((c) => {
                    const active = formData.classification === c
                    return (
                      <button key={c} type="button"
                        onClick={() => {
                          const isActive = formData.classification === c
                          if (isActive) {
                            // Deselect — allow unclassified items
                            setFormData({ ...formData, classification: null })
                          } else {
                            // Select — apply inferred flags for the chosen classification
                            setFormData({ ...formData, classification: c, item_nature: c === 'SUPPLY' ? 'CONSUMABLE_SUPPLY' : 'ACCOUNTABLE_PROPERTY', is_borrowable: c !== 'SUPPLY', track_as_asset: c !== 'SUPPLY', type: c === 'SUPPLY' ? 'expendable' : 'non_expendable' })
                          }
                        }}
                        style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: `2px solid ${active ? '#1E40AF' : '#E2E8F0'}`, background: active ? '#EFF6FF' : '#fff', color: active ? '#1E40AF' : '#64748B', fontWeight: active ? 700 : 500, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                        {c === 'SUPPLY' ? 'Supply' : c}
                      </button>
                    )
                  })}
                </div>
                <div style={{ marginTop: 6, fontSize: 11.5, color: '#94A3B8' }}>
                  {formData.classification === 'PPE' && 'Property, Plant & Equipment — unit cost ≥ ₱50,000'}
                  {formData.classification === 'SE' && 'Semi-Expendable — unit cost below ₱50,000'}
                  {formData.classification === 'SUPPLY' && 'Consumable supply — quantity-based, not individually tracked'}
                </div>
              </div>
            </div>
          </div>

          {/* ── B. STOCK AND COST ── */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#94A3B8', marginBottom: 14 }}>Stock and Cost</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Input
                  label="Available Quantity"
                  type="number"
                  value={formData.quantity.toString()}
                  disabled={Boolean(editingItem)}
                  helperText={editingItem ? 'Use Stock In/Out/Adjust to change.' : undefined}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                />
                <div style={{ position: 'relative' }}>
                  <SetupDropdown
                    label="Unit of Measure"
                    resource="units"
                    options={units.map((u) => ({ label: u.name, value: u.id, raw: u }))}
                    value={formData.unit_id}
                    onChange={(val) => {
                      const selected = units.find((u) => u.id === val)
                      setFormData({ ...formData, unit_id: val, unit: selected?.name ?? formData.unit })
                    }}
                    onRefreshNeeded={loadSetupOptions}
                    placeholder="e.g. piece, unit, ream"
                  />
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>e.g. piece, unit, ream, box, cartridge</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Input
                  label="Low Stock Alert"
                  helperText="Warn when quantity reaches this."
                  type="number"
                  value={formData.reorder_level?.toString() || '0'}
                  onChange={(e) => setFormData({ ...formData, reorder_level: parseInt(e.target.value) || 0 })}
                />
                <div>
                  <Input
                    label="Unit Cost (₱)"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="e.g. 75000.00"
                    value={formData.unit_cost !== null && formData.unit_cost !== undefined ? String(formData.unit_cost) : ''}
                    onChange={(e) => { const r = e.target.value; setFormData({ ...formData, unit_cost: r === '' ? null : parseFloat(r) || 0 }) }}
                  />
                  <div style={{ marginTop: 4, fontSize: 11, color: '#94A3B8' }}>
                    {formData.classification !== 'SUPPLY' && (
                      formData.unit_cost != null && formData.unit_cost >= 50000
                        ? <span style={{ color: '#1D4ED8', fontWeight: 600 }}>→ PPE (≥ ₱50,000)</span>
                        : formData.unit_cost != null && formData.unit_cost > 0
                          ? <span style={{ color: '#15803D', fontWeight: 600 }}>→ SE (&lt; ₱50,000)</span>
                          : 'Drives PPE / SE auto-classification'
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── C. PROCUREMENT ── */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#94A3B8', marginBottom: 6 }}>Procurement</div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 12 }}>
              Inventory is the single source of truth for procurement information. These values appear read-only in Asset Management.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Input
                  label="Purchase Date"
                  type="date"
                  value={formData.purchase_date ?? ''}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value || null })}
                />
                <Input
                  label="Warranty Until"
                  type="date"
                  value={formData.warranty_until ?? ''}
                  onChange={(e) => setFormData({ ...formData, warranty_until: e.target.value || null })}
                />
              </div>
              {/* Supplier — display-only for now; full management in future Supplier module */}
              <div style={{
                padding: '10px 14px', borderRadius: 10,
                border: '1px dashed #E2E8F0', background: '#FAFBFC',
                fontSize: 12.5, color: '#94A3B8',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 16 }}>🏭</span>
                <span>
                  <strong style={{ color: '#64748B' }}>Supplier:</strong>{' '}
                  {editingItem?.supplier_name
                    ? <span style={{ color: '#334155', fontWeight: 600 }}>{editingItem.supplier_name}</span>
                    : <span style={{ fontStyle: 'italic' }}>Not assigned — Supplier module coming soon</span>
                  }
                </span>
              </div>
            </div>
          </div>

          {/* ── D. SHARED ITEM DETAILS (PPE / SE) ── */}
          {formData.classification !== 'SUPPLY' && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#94A3B8', marginBottom: 14 }}>Shared Item Details</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <SetupDropdown
                    label="Manufacturer"
                    resource="manufacturers"
                    options={manufacturers.map((m) => ({ label: m.name, value: m.id, raw: m }))}
                    value={formData.manufacturer_id}
                    onChange={(val) => setFormData({ ...formData, manufacturer_id: val })}
                    onRefreshNeeded={loadSetupOptions}
                    placeholder="Select manufacturer"
                  />
                  <Input
                    label="Model Number"
                    value={formData.model || ''}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value || null })}
                    placeholder="e.g. ThinkPad X1 Carbon"
                  />
                </div>
                <SetupDropdown
                  label="Asset Category"
                  resource="asset-categories"
                  options={assetCategories.map((c) => ({ label: c.name, value: c.id, raw: c }))}
                  value={formData.asset_category_id}
                  onChange={(val) => setFormData({ ...formData, asset_category_id: val })}
                  onRefreshNeeded={loadSetupOptions}
                  placeholder="Select category"
                />
              </div>
            </div>
          )}

          {/* ── E. DEFAULT ASSIGNMENT ── */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#94A3B8', marginBottom: 6 }}>
              Default Assignment
              {editingItem && editingItem.asset_id && (
                <span style={{ marginLeft: 8, fontWeight: 400, fontSize: 10, color: '#F59E0B', textTransform: 'none' as const }}>
                  ⚠ Editing default office/location will not move the existing asset.
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 12 }}>
              {formData.classification === 'SUPPLY'
                ? 'Office and location for supply storage tracking.'
                : 'Initial office and location used when a new linked asset is created. Does not override an existing asset\'s current location.'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <SetupDropdown
                label="Default Office"
                resource="offices"
                options={offices.map((o) => ({ label: o.name, value: o.id, raw: o }))}
                value={formData.office_id}
                onChange={(val) => setFormData({ ...formData, office_id: val, location_id: null })}
                onRefreshNeeded={loadSetupOptions}
                placeholder="Select office"
              />
              <SetupDropdown
                label="Default Location"
                resource="locations"
                options={locations.filter((l) => !formData.office_id || l.office_id === formData.office_id).map((l) => ({ label: l.name, value: l.id, raw: l }))}
                value={formData.location_id}
                onChange={(val) => setFormData({ ...formData, location_id: val })}
                onRefreshNeeded={loadSetupOptions}
                needsOffice
                currentOfficeId={formData.office_id}
                placeholder="Select location"
              />
            </div>
          </div>

          {/* ── E. BORROWING POLICY (PPE / SE only) ── */}
          {formData.classification !== 'SUPPLY' && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#94A3B8', marginBottom: 10 }}>Borrowing Policy</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, border: '1px solid #E2E8F0', background: '#FAFBFC', padding: '12px 16px', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0F172A' }}>
                    {formData.is_borrowable !== false ? 'Borrowing enabled' : 'Borrowing disabled'}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                    {formData.is_borrowable !== false
                      ? 'This item can be selected in borrow requests when its asset status allows.'
                      : 'This item will not appear in borrow requests. Permanent issuance is still possible.'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_borrowable: formData.is_borrowable === false })}
                  style={{
                    flexShrink: 0, borderRadius: 9,
                    border: `1.5px solid ${formData.is_borrowable !== false ? '#BBF7D0' : '#E2E8F0'}`,
                    background: formData.is_borrowable !== false ? '#F0FDF4' : '#fff',
                    color: formData.is_borrowable !== false ? '#166534' : '#64748B',
                    fontSize: 13, fontWeight: 700, padding: '6px 14px',
                    cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
                  }}
                >
                  {formData.is_borrowable !== false ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          )}

          {/* ── F. NOTES ── */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#94A3B8', marginBottom: 10 }}>Notes</div>
            <Input
              label="Inventory Remarks"
              value={formData.remarks || ''}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Optional internal notes…"
            />
          </div>

        </div>
      </Modal>
      <Modal
        open={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        title={`${stockType === 'in' ? 'Add Stock' : 'Remove Stock'} — ${stockItem?.name ?? ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setStockModalOpen(false)}>Cancel</Button>
            <Button onClick={handleStockSubmit} disabled={saving}>
              {saving ? 'Processing...' : stockType === 'in' ? 'Add Stock' : 'Remove Stock'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Input
            label="Quantity"
            type="number"
            min={1}
            value={stockQty.toString()}
            onChange={(e) => setStockQty(parseInt(e.target.value) || 1)}
          />
          <Input
            label="Reason"
            value={stockReason}
            onChange={(e) => setStockReason(e.target.value)}
            placeholder={stockType === 'in' ? 'New supplies received' : 'Office use'}
          />
        </div>
      </Modal>

      {/* ── Transfer modal ── */}
      <Modal
        open={transferItem !== null}
        onClose={() => setTransferItem(null)}
        title={`Transfer Location - ${transferItem?.name ?? ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setTransferItem(null)}>Cancel</Button>
            <Button onClick={() => void handleTransferSubmit()} disabled={saving}>
              {saving ? 'Transferring...' : 'Transfer'}
            </Button>
          </>
        }
      >
        {transferItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12,
              borderRadius: 12, border: '1px solid #E2E8F0', background: '#F8FAFC', padding: 14,
            }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8' }}>Available</div>
                <div style={{ fontWeight: 800, color: '#0F172A' }}>{transferItem.quantity} {transferItem.unit}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8' }}>Current Location</div>
                <div style={{ fontWeight: 800, color: '#0F172A' }}>{transferItem.location_name ?? 'Unassigned'}</div>
              </div>
            </div>

            <Input
              label="Quantity to Transfer"
              type="number"
              min={1}
              max={transferItem.quantity}
              value={transferQty.toString()}
              onChange={(e) => setTransferQty(parseInt(e.target.value) || 1)}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Source Location</span>
                <select
                  value={transferSourceLocationId ?? ''}
                  onChange={(e) => setTransferSourceLocationId(e.target.value ? Number(e.target.value) : null)}
                  style={{ height: 40, borderRadius: 10, border: '1.5px solid #E2E8F0', padding: '0 12px', fontFamily: 'inherit', color: '#1E293B' }}
                >
                  <option value="">Select source</option>
                  {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
                </select>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Destination Location</span>
                <select
                  value={transferDestinationLocationId ?? ''}
                  onChange={(e) => setTransferDestinationLocationId(e.target.value ? Number(e.target.value) : null)}
                  style={{ height: 40, borderRadius: 10, border: '1.5px solid #E2E8F0', padding: '0 12px', fontFamily: 'inherit', color: '#1E293B' }}
                >
                  <option value="">Select destination</option>
                  {locations
                    .filter((location) => location.id !== transferSourceLocationId)
                    .map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
                </select>
              </label>
            </div>

            <Input
              label="Reason"
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              placeholder="Office transfer, reassignment, stock balancing..."
            />
          </div>
        )}
      </Modal>

      {/* ── Count session modal ── */}
      <Modal
        open={countSessionModalOpen}
        onClose={() => setCountSessionModalOpen(false)}
        title="Start Inventory Count"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCountSessionModalOpen(false)}>Cancel</Button>
            <Button onClick={() => void handleCreateCountSession()} disabled={saving}>
              {saving ? 'Starting...' : 'Start Count'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Location</span>
            <select
              value={countLocationId ?? ''}
              onChange={(e) => setCountLocationId(e.target.value ? Number(e.target.value) : null)}
              style={{ height: 40, borderRadius: 10, border: '1.5px solid #E2E8F0', padding: '0 12px', fontFamily: 'inherit', color: '#1E293B' }}
            >
              <option value="">All locations</option>
              {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
            </select>
          </label>
          <Input label="Count Date" type="date" value={countDate} onChange={(e) => setCountDate(e.target.value)} />
          <Input label="Notes" value={countNotes} onChange={(e) => setCountNotes(e.target.value)} placeholder="Optional count instructions or scope" />
        </div>
      </Modal>

      {/* ── Reconcile confirmation ── */}
      <Modal
        open={reconcileSession !== null}
        onClose={() => setReconcileSession(null)}
        title="Reconcile Count Session"
        footer={
          <>
            <Button variant="secondary" onClick={() => setReconcileSession(null)}>Cancel</Button>
            <Button onClick={() => void handleReconcileCountSession()} disabled={saving}>
              {saving ? 'Reconciling...' : 'Reconcile Inventory'}
            </Button>
          </>
        }
      >
        <p style={{ margin: 0, color: '#475569', fontSize: 14, lineHeight: 1.6 }}>
          This will apply the counted variances to inventory quantities and create stock movement records for the reconciliation.
        </p>
      </Modal>

      {/* ── Adjust Quantity modal ── */}
      <Modal
        open={adjustItem !== null}
        onClose={() => setAdjustItem(null)}
        title={`Correct Stock Quantity — ${adjustItem?.name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAdjustItem(null)}>Cancel</Button>
            <Button onClick={() => void handleAdjustSubmit()} disabled={saving}>
              {saving ? 'Saving...' : 'Save Correction'}
            </Button>
          </>
        }
      >
        {adjustItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Quick summary of current vs new */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
              borderRadius: 12, border: '1px solid #E2E8F0', background: '#F8FAFC',
              padding: '16px 20px',
            }}>
              {[
                { label: 'Current', value: adjustItem.quantity, color: '#1E293B' },
                { label: 'New', value: adjustQty, color: '#1E293B' },
                {
                  label: 'Diff',
                  value: adjustQty - adjustItem.quantity,
                  color: adjustQty - adjustItem.quantity < 0 ? '#DC2626' : '#16A34A',
                },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div style={{
                    fontSize: 11, color: '#94A3B8', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4,
                  }}>
                    {label}
                  </div>
                  <div style={{
                    fontSize: 18, fontWeight: 700, color,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {value > 0 && label === 'Diff' ? '+' : ''}{value}
                  </div>
                </div>
              ))}
            </div>

            <Input
              label="Corrected Quantity"
              type="number"
              min={0}
              value={adjustQty.toString()}
              onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
            />
            <Input
              label="Reason"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="Physical count correction, damage, expiry..."
            />
          </div>
        )}
      </Modal>

      {/* ── Stock History modal ── */}
      <Modal
        open={historyItem !== null}
        onClose={() => { setHistoryItem(null); setHistoryRows([]) }}
        title={`Stock Movement History — ${historyItem?.name ?? ''}`}
      >
        {historyLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <Spinner />
          </div>
        ) : historyRows.length === 0 ? (
          <EmptyState
            title="No movement history"
            description="Stock changes will appear here."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {historyRows.map((m) => {
              const typeIcon = m.type === 'stock_in'
                ? <TrendingUp size={14} style={{ color: '#16A34A' }} />
                : m.type === 'stock_out'
                  ? <TrendingDown size={14} style={{ color: '#DC2626' }} />
                  : m.type.startsWith('transfer')
                    ? <ArrowRightLeft size={14} style={{ color: '#2563EB' }} />
                    : <RotateCcw size={14} style={{ color: '#D97706' }} />

              return (
                <div key={m.id} style={{
                  borderRadius: 12, border: '1px solid #E5E7EB',
                  background: '#fff', padding: 16,
                  transition: 'box-shadow 0.15s',
                }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: 8, marginBottom: 10,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: m.type === 'stock_in'
                          ? '#F0FDF4'
                          : m.type === 'stock_out'
                            ? '#FEF2F2'
                            : m.type.startsWith('transfer')
                              ? '#EFF6FF'
                              : '#FFFBEB',
                      }}>
                        {typeIcon}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#1F2937', fontSize: 14 }}>
                          {movementTypeLabel(m.type)}
                        </div>
                        <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                          {m.created_at ?? 'Date unavailable'}
                        </div>
                      </div>
                    </div>
                    <Badge
                      tone={m.quantity > 0 ? 'green' : 'red'}
                    >
                      {m.quantity > 0 ? '+' : ''}{m.quantity}
                    </Badge>
                  </div>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px',
                    fontSize: 12, color: '#6B7280',
                  }}>
                    <div>Previous: <strong style={{ color: '#1F2937' }}>{m.quantity_before}</strong></div>
                    <div>New: <strong style={{ color: '#1F2937' }}>{m.quantity_after}</strong></div>
                    <div>
                      Reason: <strong style={{ color: '#1F2937' }}>
                        {m.reason ?? 'Not provided'}
                      </strong>
                    </div>
                    <div>
                      By: <strong style={{ color: '#1F2937' }}>
                        {m.performed_by ?? 'System'}
                      </strong>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Modal>

          {/* ── Disposal modals (inventory-initiated) ── */}
          <Modal
            open={disposeModalOpen}
            onClose={() => setDisposeModalOpen(false)}
            title={`Mark for Disposal — ${disposeItem?.name ?? ''}`}
            footer={<>
              <Button variant="secondary" onClick={() => setDisposeModalOpen(false)}>Cancel</Button>
              <Button onClick={() => void submitMarkForDisposal()} disabled={disposalActionLoading}>{disposalActionLoading ? 'Working…' : 'Mark for Disposal'}</Button>
            </>}
            maxWidth={600}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input label="Disposal Reason" value={disposeReason} onChange={(e) => setDisposeReason(e.target.value)} placeholder="Reason for disposal" />
              <Input label="Disposal Date" type="date" value={disposeDate} onChange={(e) => setDisposeDate(e.target.value)} />
              <Input label="Disposal Method" value={disposeMethod} onChange={(e) => setDisposeMethod(e.target.value)} placeholder="e.g. sale, recycling, donation" />
              <Input label="Approval Ref (optional)" value={disposeApprovalRef} onChange={(e) => setDisposeApprovalRef(e.target.value)} placeholder="Reference or approval code" />
            </div>
          </Modal>

          <Modal
            open={finalizeModalOpen}
            onClose={() => setFinalizeModalOpen(false)}
            title={`Finalize Disposal — ${finalizeItem?.name ?? ''}`}
            footer={<>
              <Button variant="secondary" onClick={() => setFinalizeModalOpen(false)}>Cancel</Button>
              <Button onClick={() => void submitFinalizeDisposal()} disabled={disposalActionLoading}>{disposalActionLoading ? 'Working…' : 'Finalize Disposal'}</Button>
            </>}
            maxWidth={600}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input label="Disposal Date" type="date" value={finalizeDate} onChange={(e) => setFinalizeDate(e.target.value)} />
              <Input label="Disposal Method (required)" value={finalizeMethod} onChange={(e) => setFinalizeMethod(e.target.value)} placeholder="e.g. sale, recycling, donation" />
              <Input label="Approval Ref (optional)" value={finalizeApprovalRef} onChange={(e) => setFinalizeApprovalRef(e.target.value)} placeholder="Reference or approval code" />
            </div>
          </Modal>

          <Modal
            open={cancelModalOpen}
            onClose={() => setCancelModalOpen(false)}
            title={`Cancel Disposal — ${cancelItem?.name ?? ''}`}
            footer={<>
              <Button variant="secondary" onClick={() => setCancelModalOpen(false)}>Back</Button>
              <Button onClick={() => void submitCancelDisposal()} disabled={disposalActionLoading}>{disposalActionLoading ? 'Working…' : 'Confirm Cancel'}</Button>
            </>}
            maxWidth={520}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ color: '#64748B', fontSize: 13 }}>Provide a brief reason for cancelling the disposal proposal.</div>
              <textarea rows={4} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #E2E8F0', fontFamily: 'inherit' }} />
            </div>
          </Modal>

          {/* ── Export Modal ── */}
          <Modal
            open={exportModalOpen}
            onClose={() => setExportModalOpen(false)}
            title="Export Inventory"
            footer={
              <>
                <Button variant="secondary" onClick={() => setExportModalOpen(false)}>Cancel</Button>
                <Button onClick={() => void handleExport()} disabled={exporting}>
                  {exporting ? 'Exporting...' : <><Download size={14} />Download</>}
                </Button>
              </>
            }
          >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Format */}
          <div>
            <div style={{
              fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 10,
            }}>
              File Format
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {([
                { fmt: 'xlsx' as const, label: 'Excel (.xlsx)', icon: <FileDown size={22} style={{ color: '#43A047' }} />, bg: '#E8F5E9' },
                { fmt: 'csv' as const,  label: 'CSV (.csv)',   icon: <FileText size={22} style={{ color: '#1E88E5' }} />, bg: '#E3F2FD' },
                { fmt: 'json' as const, label: 'JSON (.json)', icon: <FileCode size={22} style={{ color: '#FB8C00' }} />, bg: '#FFF3E0' },
              ]).map(({ fmt, label, icon, bg }) => {
                const active = exportFormat === fmt
                return (
                  <button
                    key={fmt} type="button"
                    onClick={() => setExportFormat(fmt)}
                    style={{
                      flex: 1, padding: '14px 8px', borderRadius: 12,
                      border: `2px solid ${active ? '#1E40AF' : '#E2E8F0'}`,
                      background: active ? '#EFF6FF' : '#FAFAFA',
                      color: active ? '#1E40AF' : '#475569',
                      fontWeight: active ? 700 : 500,
                      fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit',
                      transition: 'all 0.15s',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: bg,
                    }}>
                      {icon}
                    </div>
                    <span>{label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Scope */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 10 }}>
              Inventory Scope
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {([
                { value: 'all',    label: 'All Items',            desc: 'Export PPE, SE, and Supply records' },
                { value: 'ppe',    label: 'PPE',                  desc: 'Accountable property with value threshold at or above ₱50,000' },
                { value: 'se',     label: 'Semi-Expendable',      desc: 'Accountable property below ₱50,000' },
                { value: 'supply', label: 'Supply',               desc: 'Consumable stock items' },
              ] as const).map((opt) => {
                const active = exportScope === opt.value
                return (
                  <button
                    key={opt.value} type="button"
                    onClick={() => setExportScope(opt.value)}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 10,
                      border: `2px solid ${active ? '#1E40AF' : '#E2E8F0'}`,
                      background: active ? '#EFF6FF' : '#FAFAFA',
                      textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                      transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}
                  >
                    <span style={{
                      width: 18, height: 18, borderRadius: '50%',
                      border: `2px solid ${active ? '#1E40AF' : '#CBD5E1'}`,
                      background: active ? '#1E40AF' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, transition: 'all 0.15s',
                    }}>
                      {active && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'block' }} />}
                    </span>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: active ? '#1E40AF' : '#0F172A' }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>
                        {opt.desc}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Columns selection (applies to CSV / JSON exports) */}
          <div style={{ padding: '6px 0' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>Columns</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => setExportColumns(availableExportColumns.map(c => c.key))} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer' }}>Select all</button>
              <button type="button" onClick={() => setExportColumns([])} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer' }}>Clear</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8, marginTop: 10 }}>
              {availableExportColumns.map((col) => (
                <label key={col.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, border: `1px solid ${exportColumns.includes(col.key) ? '#1E40AF' : '#E2E8F0'}`, background: exportColumns.includes(col.key) ? '#EFF6FF' : '#fff', cursor: 'pointer' }}>
                  <input type="checkbox" checked={exportColumns.includes(col.key)} onChange={(e) => {
                    if (e.currentTarget.checked) setExportColumns((prev) => Array.from(new Set([...prev, col.key])))
                    else setExportColumns((prev) => prev.filter((k) => k !== col.key))
                  }} />
                  <span style={{ fontSize: 13 }}>{col.label}</span>
                </label>
              ))}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#64748B' }}>
              Column selection will be applied to <strong>CSV</strong> and <strong>JSON</strong> exports. Excel (.xlsx) uses the server export (full dataset) for performance on large exports.
            </div>
          </div>

          {/* Summary info */}
          <div style={{
            padding: '12px 16px', borderRadius: 10,
            background: '#F8FAFC', border: '1px solid #E2E8F0',
            fontSize: 12.5, color: '#64748B', lineHeight: 1.5,
          }}>
            Will export <strong style={{ color: '#0F172A' }}>
              {exportScope === 'all' ? 'all' : exportScope.toUpperCase()} inventory items
            </strong> as a <strong style={{ color: '#0F172A' }}>.{exportFormat}</strong> file.
            {search && <> Filtered by search: <em>"{search}"</em>.</>}
          </div>

        </div>
      </Modal>

      {/* ── Import Wizard ── */}
      <InventoryImportWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onCompleted={() => {
          void loadInventory(1)
          void loadSummary()
          setMessage({ type: 'success', text: 'Import completed.' })
        }}
      />
    </div>
  )
}
