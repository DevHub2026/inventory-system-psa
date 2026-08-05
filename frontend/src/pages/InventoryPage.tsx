import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Upload, Filter, Plus, Monitor, Package, ChevronRight, Search, TrendingUp, TrendingDown, RotateCcw, History, Edit3, Trash2, Eye, FileDown, FileText, FileCode } from 'lucide-react'
import {
  Alert, Button, EmptyState, Input,
  Modal, Spinner, Badge, Card,
} from '@/components/ui'
import {
  inventoryService,
  type CreateInventoryItemPayload,
  type UpdateInventoryItemPayload,
} from '@/services/inventoryService'
import { api, unwrapData } from '@/services/api'
import type { ApiResponse, InventoryItem, StockMovement } from '@/types'
import { inventoryStatusLabel } from '@/utils/displayLabels'
import { InventoryImportWizard } from '@/components/InventoryImportWizard'
import { notifyDataChanged } from '@/utils/dataRefresh'

// ─── helpers ─────────────────────────────────────────────────────────────────

function movementTypeLabel(t: string) {
  return ({ stock_in: 'Stock Added', stock_out: 'Stock Removed', adjustment: 'Quantity Corrected' }[t] ?? t)
}

type TabKey = 'all' | 'ppe' | 'se' | 'supply'

interface SummaryData {
  nonExp: { total: number; in_use: number; available: number; maintenance: number }
  exp:    { total: number; in_stock: number; low_stock: number; out_of_stock: number }
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
    flex: '1 1 0', minWidth: 300,
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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
      {/* PPE Card */}
      <SummaryCardInner
        style={cardStyle}
        onClick={() => onNavigate('ppe')}
        icon={<Monitor size={22} style={{ color: colors.blue.icon }} />}
        color={colors.blue}
        title="Property, Plant & Equipment"
        subtitle="PPE — Durable Assets"
        total={data.nonExp.total}
        totalLabel="Total Assets"
        stats={[
          { label: 'In Use', value: data.nonExp.in_use, color: colors.blue.text },
          { label: 'Available', value: data.nonExp.available, color: colors.green.text },
          { label: 'Under Maintenance', value: data.nonExp.maintenance, color: colors.violet.text },
        ]}
      />

      {/* SE Card */}
      <SummaryCardInner
        style={cardStyle}
        onClick={() => onNavigate('se')}
        icon={<Package size={22} style={{ color: colors.green.icon }} />}
        color={colors.green}
        title="Semi-Expendable"
        subtitle="SE — Accountable Property"
        total={data.exp.total}
        totalLabel="Total Items"
        stats={[
          { label: 'In Stock', value: data.exp.in_stock, color: colors.green.text },
          { label: 'Low Stock', value: data.exp.low_stock, color: colors.amber.text },
          { label: 'Out of Stock', value: data.exp.out_of_stock, color: colors.red.text },
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
  onAdjust: () => void
  onHistory: () => void
  onEdit: () => void
  onAsset?: () => void
  onDelete: () => void
}

function ActionCell({ onStockIn, onStockOut, onAdjust, onHistory, onEdit, onAsset, onDelete }: ActionCellProps) {
  const [openMenu, setOpenMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(false)
      }
    }
    if (openMenu) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [openMenu])

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
      <div ref={menuRef} style={{ position: 'relative' }}>
        {primaryBtn(
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
            {menuItem(<RotateCcw size={14} />, 'Adjust Quantity', onAdjust)}
            {menuItem(<History size={14} />, 'View History', onHistory)}
            {menuItem(<Edit3 size={14} />, 'Edit Item', onEdit)}
            {onAsset && menuItem(<Eye size={14} />, 'View Asset', onAsset)}
            <div style={{ height: 1, background: '#F1F5F9', margin: '4px 0' }} />
            {menuItem(<Trash2 size={14} />, 'Delete Item', onDelete, 'danger')}
          </div>
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
    nonExp: { total: 0, in_use: 0, available: 0, maintenance: 0 },
    exp:    { total: 0, in_stock: 0, low_stock: 0, out_of_stock: 0 },
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
  const [historyItem,    setHistoryItem]    = useState<InventoryItem | null>(null)
  const [historyRows,    setHistoryRows]    = useState<StockMovement[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [wizardOpen,     setWizardOpen]     = useState(false)

  // Live SKU validation state
  const [codeValidation, setCodeValidation]   = useState<{ exists: boolean; message: string } | null>(null)

  const [formData, setFormData] = useState<CreateInventoryItemPayload & {
    asset_category_id?: number | null
    manufacturer_id?: number | null
    office_id?: number | null
    location_id?: number | null
    description?: string
    model?: string | null
    condition_status?: string | null
    property_number?: string | null
  }>({
    name: '', sku: '', quantity: 0, unit_cost: null, unit: '', unit_id: null, reorder_level: 0,
    is_borrowable: true,
    track_as_asset: true, type: 'non_expendable', classification: 'PPE', item_nature: 'ACCOUNTABLE_PROPERTY',
    asset_category_id: null, manufacturer_id: null, office_id: null, location_id: null, description: '',
    model: null, condition_status: null, property_number: null,
  })

  useEffect(() => {
    const validateCode = async () => {
      try {
        const { data } = await api.get<ApiResponse<{ exists: boolean; message: string }>>('/inventory/validate-sku', {
          params: {
            sku: formData.sku,
            // Pass the inventory item's id so the backend ignores the item's own SKU
            ...(editingItem ? { ignore_id: editingItem.id } : {}),
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
  }, [formData.sku, editingItem?.id])

  // Load table rows — pg=1 resets list, pg>1 appends (infinite scroll)
  const loadInventory = useCallback(async (pg = 1) => {
    if (pg === 1) setLoading(true); else setLoadingMore(true)
    try {
      const classification =
        activeTab === 'all'
          ? undefined
          : activeTab === 'ppe'
            ? 'PPE'
            : activeTab === 'se'
              ? 'SE'
              : 'SUPPLY'

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
      const [ppe, se, ppeAll, seAll] = await Promise.all([
        inventoryService.list({ classification: 'PPE', per_page: 1 }),
        inventoryService.list({ classification: 'SE', per_page: 1 }),
        inventoryService.list({ classification: 'PPE', per_page: 100 }),
        inventoryService.list({ classification: 'SE', per_page: 100 }),
      ])
      const count = (arr: InventoryItem[], s: string) => arr.filter((i) => i.status === s).length
      setSummary({
        nonExp: {
          total:       ppe.meta.total,
          in_use:      count(ppeAll.items, 'IN_USE'),
          available:   count(ppeAll.items, 'IN_STOCK'),
          maintenance: count(ppeAll.items, 'UNDER_MAINTENANCE'),
        },
        exp: {
          total:        se.meta.total,
          in_stock:     count(seAll.items, 'IN_STOCK'),
          low_stock:    count(seAll.items, 'LOW_STOCK'),
          out_of_stock: count(seAll.items, 'OUT_OF_STOCK'),
        },
      })
    } catch { /* summary is best-effort */ }
  }, [])

  // Trigger on tab / filter changes
  useEffect(() => {
    void loadInventory(1)
  }, [activeTab, statusFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  // Summary loads once on mount
  useEffect(() => {
    void loadSummary()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll — observe sentinel at bottom of table
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && page < lastPage && !loadingMore && !loading) {
          void loadInventory(page + 1)
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [page, lastPage, loading, loadingMore, loadInventory])

  const handleTabChange = (t: TabKey) => { setActiveTab(t); setPage(1) }
  const handleFilter    = () => { void loadInventory(1) }
  const handleSearch    = (e: React.KeyboardEvent) => { if (e.key === 'Enter') void loadInventory(1) }

  // ── CRUD handlers ────────────────────────────────────────────────────────────

  const handleCreate = () => {
    setEditingItem(null)
    setCodeValidation(null)
    setFormData({
      name: '', sku: '', quantity: 0, unit_cost: null, unit: '', unit_id: null, reorder_level: 0,
      is_borrowable: activeTab !== 'supply',
      track_as_asset: activeTab !== 'supply',
      classification: activeTab === 'all'
        ? 'PPE'
        : activeTab === 'ppe'
          ? 'PPE'
          : activeTab === 'se'
            ? 'SE'
            : 'SUPPLY',
      item_nature: activeTab === 'supply' ? 'CONSUMABLE_SUPPLY' : 'ACCOUNTABLE_PROPERTY',
      type: activeTab === 'supply' ? 'expendable' : 'non_expendable',
      asset_category_id: null, manufacturer_id: null, office_id: null, location_id: null, description: '',
      model: null, condition_status: null, property_number: null,
    })
    setModalOpen(true)
  }

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setCodeValidation(null)
    setFormData({
      name: item.name,
      sku: item.sku ?? '',
      quantity: item.quantity,
      unit_cost: item.unit_cost ?? null,
      unit: item.unit,
      unit_id: item.unit_id ?? null,
      reorder_level: item.reorder_level || 0,
      is_borrowable: item.is_borrowable !== false,
      track_as_asset: Boolean(item.asset_id),
      classification: (item.classification as 'PPE' | 'SE' | 'SUPPLY') ?? ((item.type === 'expendable') ? 'SUPPLY' : 'PPE'),
      item_nature: (item.item_nature as 'ACCOUNTABLE_PROPERTY' | 'CONSUMABLE_SUPPLY') ?? ((item.type === 'expendable') ? 'CONSUMABLE_SUPPLY' : 'ACCOUNTABLE_PROPERTY'),
      type: (item.type as 'non_expendable' | 'expendable') ?? 'non_expendable',
      asset_category_id: item.asset_category_id ?? null,
      manufacturer_id: item.manufacturer_id ?? null,
      office_id: item.office_id ?? null,
      location_id: item.location_id ?? null,
      description: item.description ?? '',
      model: item.model ?? null,
      condition_status: item.condition_status ?? null,
      property_number: item.property_number ?? null,
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

  // ── Export modal state ─────────────────────────────────────────────────────
  const [exportModalOpen,  setExportModalOpen]  = useState(false)
  const [exportFormat,     setExportFormat]     = useState<'xlsx' | 'csv' | 'json'>('xlsx')
  const [exportScope,      setExportScope]      = useState<'all' | 'ppe' | 'se' | 'supply'>('all')
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
        const json = JSON.stringify(result.items, null, 2)
        const blob = new Blob([json], { type: 'application/json' })
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        a.href     = url
        a.download = `inventory-${exportScope}-${Date.now()}.json`
        document.body.appendChild(a); a.click(); document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else if (exportFormat === 'csv') {
        const result = await inventoryService.list({ per_page: 9999, search: search || undefined, classification: scopeFilter })
        const headers = ['id', 'name', 'type', 'classification', 'sku', 'property_number', 'asset_number', 'accountability', 'quantity', 'unit', 'status', 'reorder_level', 'remarks']
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
            setExportScope(activeTab === 'all' ? 'all' : activeTab)
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
                title="No inventory items found"
                description={
                  search || statusFilter
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Add your first item to begin tracking stock.'
                }
              />
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' as const }}>
              <colgroup>
                <col style={{ minWidth: 200 }} />
                <col style={{ width: 160 }} />
                <col style={{ width: 160 }} />
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
                  <th style={th}>Property Number</th>
                  <th style={th}>Asset Number</th>
                  <th style={th}>Unit Cost</th>
                  <th style={th}>Accountability</th>
                  <th style={{ ...th, textAlign: 'center' as const }}>Qty</th>
                  <th style={th}>Unit</th>
                  <th style={th}>Status</th>
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
                        <Badge tone={r.classification === 'SUPPLY' ? 'yellow' : r.classification === 'SE' ? 'green' : 'blue'}>
                          {r.classification ?? (r.type === 'expendable' ? 'SUPPLY' : 'PPE')}
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

                    {/* Property Number */}
                    <td style={td}>
                      {r.classification === 'SUPPLY' ? (
                        <span style={{ color: '#CBD5E1' }}>—</span>
                      ) : r.property_number ? (
                        <code style={{
                          fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace",
                          fontSize: 11.5, color: '#475569',
                          background: '#F1F5F9', padding: '3px 8px', borderRadius: 6,
                          display: 'inline-block', maxWidth: 160,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {r.property_number}
                        </code>
                      ) : (
                        <span style={{ color: '#CBD5E1' }}>—</span>
                      )}
                    </td>

                    {/* Asset Number */}
                    <td style={td}>
                      {r.classification === 'SUPPLY' ? (
                        <span style={{ color: '#CBD5E1' }}>—</span>
                      ) : r.asset_number ? (
                        <code style={{
                          fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace",
                          fontSize: 11.5, color: '#475569',
                          background: '#F1F5F9', padding: '3px 8px', borderRadius: 6,
                          display: 'inline-block', maxWidth: 160,
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
                    }}>
                      <ActionCell
                        item={r}
                        onStockIn   ={() => { setStockItem(r); setStockType('in');  setStockQty(1); setStockReason(''); setStockModalOpen(true) }}
                        onStockOut  ={() => { setStockItem(r); setStockType('out'); setStockQty(1); setStockReason(''); setStockModalOpen(true) }}
                        onAdjust    ={() => { setAdjustItem(r); setAdjustQty(r.quantity); setAdjustReason('') }}
                        onHistory   ={() => void loadHistory(r)}
                        onEdit      ={() => handleEdit(r)}
                        onAsset     ={r.asset_number ? () => navigate(`/assets?search=${encodeURIComponent(r.asset_number ?? '')}`) : undefined}
                        onDelete    ={() => handleDelete(r)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} style={{ height: 1 }} />
        {loadingMore && (
          <div style={{
            display: 'flex', justifyContent: 'center', padding: '20px 0',
            borderTop: '1px solid #F1F5F9',
          }}>
            <Spinner />
          </div>
        )}
      </Card>

      {/* ── Add / Edit modal ── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'Edit Item' : 'Add Item'}
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSubmit} disabled={saving || Boolean(codeValidation?.exists)}>{saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Add Item'}</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Section: Basic Information */}
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: '#94A3B8' }}>
            Basic Information
          </div>

          <Input label="Item Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Laptop EB-X1 001" />

          {/* SKU with live validation */}
          <div>
            <Input
              label="Item Code / SKU"
              helperText={editingItem ? 'Editing the code is optional — leave unchanged to keep the existing code.' : 'Use a unique code for this item.'}
              value={formData.sku || ''}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              placeholder="e.g. SKU-001"
            />
            {codeValidation && formData.sku && (
              <div style={{ marginTop: 4, fontSize: 12, fontWeight: 600, color: codeValidation.exists ? '#DC2626' : '#16A34A' }}>
                {codeValidation.exists ? '❌ ' : '✓ '}{codeValidation.message}
              </div>
            )}
          </div>

          {/* Inventory Type */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>Inventory Type</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {(['PPE', 'SE', 'SUPPLY'] as const).map((c) => {
                const active = formData.classification === c
                return (
                  <button key={c} type="button" onClick={() => setFormData({
                    ...formData,
                    classification: c,
                    item_nature: c === 'SUPPLY' ? 'CONSUMABLE_SUPPLY' : 'ACCOUNTABLE_PROPERTY',
                    is_borrowable: c !== 'SUPPLY',
                    track_as_asset: c !== 'SUPPLY',
                    type: c === 'SUPPLY' ? 'expendable' : 'non_expendable',
                  })}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: `2px solid ${active ? '#1E40AF' : '#E2E8F0'}`, background: active ? '#EFF6FF' : '#fff', color: active ? '#1E40AF' : '#64748B', fontWeight: active ? 700 : 500, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                    {c === 'SUPPLY' ? 'Supply' : c}
                  </button>
                )
              })}
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: '#94A3B8' }}>
              {formData.classification === 'PPE' && 'Property, Plant & Equipment — unit cost ≥ ₱50,000'}
              {formData.classification === 'SE' && 'Semi-Expendable — unit cost below ₱50,000'}
              {formData.classification === 'SUPPLY' && 'Consumable supply — quantity-based, not individually tracked'}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Input
              label="Available Quantity"
              type="number"
              value={formData.quantity.toString()}
              disabled={Boolean(editingItem)}
              helperText={editingItem ? 'Use Stock In/Out/Adjust to change quantity.' : undefined}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
            />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Unit of Measure</div>
              <input
                value={formData.unit || ''}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="e.g. piece, unit, ream"
                list="unit-suggestions"
                style={{
                  width: '100%', height: 38, paddingInline: 12, borderRadius: 10,
                  border: '1.5px solid #E2E8F0', fontSize: 13.5, color: '#1E293B',
                  outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit',
                  background: '#F8FAFC',
                }}
              />
              <datalist id="unit-suggestions">
                {['piece', 'unit', 'ream', 'box', 'cartridge', 'pack', 'set', 'bottle', 'roll', 'bundle'].map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>
                e.g. piece, unit, ream, box, cartridge
              </div>
            </div>
          </div>

          <Input
            label="Low Stock Alert"
            helperText="Show a warning when quantity reaches this number."
            type="number"
            value={formData.reorder_level?.toString() || '0'}
            onChange={(e) => setFormData({ ...formData, reorder_level: parseInt(e.target.value) || 0 })}
          />

          {/* Unit Cost — drives PPE/SE auto-classification for accountable items */}
          {formData.classification !== 'SUPPLY' && (
            <div>
              <Input
                label="Unit Cost (₱)"
                type="number"
                min={0}
                step="0.01"
                placeholder="e.g. 75000.00"
                value={formData.unit_cost !== null && formData.unit_cost !== undefined ? String(formData.unit_cost) : ''}
                onChange={(e) => {
                  const raw = e.target.value
                  setFormData({
                    ...formData,
                    unit_cost: raw === '' ? null : parseFloat(raw) || 0,
                  })
                }}
              />
              <div style={{
                marginTop: 5, padding: '6px 10px', borderRadius: 7,
                background: '#F8FAFC', border: '1px solid #E2E8F0',
                fontSize: 11, color: '#64748B', lineHeight: 1.5,
              }}>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>Auto-classification: </span>
                {formData.unit_cost !== null && formData.unit_cost !== undefined && formData.unit_cost >= 50000
                  ? <span style={{ color: '#1D4ED8', fontWeight: 600 }}>PPE (₱50,000 and above)</span>
                  : formData.unit_cost !== null && formData.unit_cost !== undefined && formData.unit_cost > 0
                    ? <span style={{ color: '#15803D', fontWeight: 600 }}>SE (above ₱0, below ₱50,000)</span>
                    : <span style={{ color: '#94A3B8' }}>Leave blank to keep current classification ({formData.classification ?? 'manual review'})</span>}
              </div>
            </div>
          )}

          {/* Section: Equipment Details — PPE/SE only */}
          {formData.classification !== 'SUPPLY' && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: '#94A3B8', marginTop: 8 }}>
                Equipment Details
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <Input
                    label="Property Number"
                    value={formData.property_number || ''}
                    onChange={(e) => setFormData({ ...formData, property_number: e.target.value || null })}
                    placeholder="e.g. PPE-2026-001"
                  />
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>Optional — leave blank if not yet assigned.</div>
                </div>
                <Input
                  label="Model Number"
                  value={formData.model || ''}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value || null })}
                  placeholder="e.g. ThinkPad X1"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Condition</div>
                  <select
                    value={formData.condition_status || ''}
                    onChange={(e) => setFormData({ ...formData, condition_status: e.target.value || null })}
                    style={{
                      width: '100%', height: 38, paddingInline: '12px 32px', borderRadius: 10,
                      border: '1.5px solid #E2E8F0', fontSize: 13, color: formData.condition_status ? '#1E293B' : '#94A3B8',
                      background: `#F8FAFC url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2394A3B8'/%3E%3C/svg%3E") no-repeat right 12px center`,
                      backgroundSize: '10px 6px', appearance: 'none', cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
                    }}
                  >
                    <option value="">Select condition</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                    <option value="POOR">Poor</option>
                    <option value="DAMAGED">Damaged</option>
                    <option value="FOR_REPAIR">For Repair</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Borrowable</div>
                  <select
                    value={formData.is_borrowable !== false ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, is_borrowable: e.target.value === 'true' })}
                    style={{
                      width: '100%', height: 38, paddingInline: '12px 32px', borderRadius: 10,
                      border: '1.5px solid #E2E8F0', fontSize: 13, color: '#1E293B',
                      background: `#F8FAFC url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2394A3B8'/%3E%3C/svg%3E") no-repeat right 12px center`,
                      backgroundSize: '10px 6px', appearance: 'none', cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
                    }}
                  >
                    <option value="true">Yes — can be borrowed</option>
                    <option value="false">No — not available for borrowing</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Remarks */}
          <Input
            label="Remarks / Internal Notes"
            value={formData.remarks || ''}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            placeholder="Optional notes"
          />

        </div>
      </Modal>

      {/* ── Stock In / Out modal ── */}
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