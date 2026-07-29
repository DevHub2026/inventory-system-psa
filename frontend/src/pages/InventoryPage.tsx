import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Upload, Filter, Plus, Monitor, Package, ChevronRight, Search, CheckCircle2, XCircle } from 'lucide-react'
import {
  Alert, Button, EmptyState, Input, SetupDropdown,
  Modal, Spinner,
} from '@/components/ui'
import {
  inventoryService,
  type CreateInventoryItemPayload,
  type UpdateInventoryItemPayload,
} from '@/services/inventoryService'
import { setupService, type SetupRecord } from '@/services/setupService'
import { api, unwrapData } from '@/services/api'
import type { InventoryItem, StockMovement } from '@/types'
import { inventoryStatusLabel } from '@/utils/displayLabels'
import { InventoryImportWizard } from '@/components/InventoryImportWizard'
import { notifyDataChanged } from '@/utils/dataRefresh'

// ─── helpers ─────────────────────────────────────────────────────────────────

function movementTypeLabel(t: string) {
  return ({ stock_in: 'Stock Added', stock_out: 'Stock Removed', adjustment: 'Quantity Corrected' }[t] ?? t)
}

type TabKey = 'all' | 'non_expendable' | 'expendable'

interface SummaryData {
  nonExp: { total: number; in_use: number; available: number; maintenance: number }
  exp:    { total: number; in_stock: number; low_stock: number; out_of_stock: number }
}

// ─── Summary cards ────────────────────────────────────────────────────────────

function SummaryCard({ data, onNavigate }: { data: SummaryData; onNavigate: (tab: TabKey) => void }) {
  const [hovNE, setHovNE] = useState(false)
  const [hovEx, setHovEx] = useState(false)

  const cardBase: React.CSSProperties = {
    flex: '1 1 0', minWidth: 280,
    background: '#ffffff',
    borderRadius: 16,
    border: '1px solid #E2E8F0',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    padding: '20px 24px',
    cursor: 'pointer',
    transition: 'box-shadow 0.18s, border-color 0.18s',
    display: 'flex', alignItems: 'center', gap: 20,
    boxSizing: 'border-box',
  }

  const row = (label: string, value: number, dot: string) => (
    <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot, flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: '#64748B' }}>{label}</span>
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{value}</span>
    </div>
  )
  //ismeringohy
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}> 
      {/* Non-expendable */}
      <div
        style={{ ...cardBase, borderColor: hovNE ? '#93C5FD' : '#E2E8F0', boxShadow: hovNE ? '0 4px 16px rgba(0,0,0,0.10)' : '0 1px 4px rgba(0,0,0,0.06)' }}
        onClick={() => onNavigate('non_expendable')}
        onMouseEnter={() => setHovNE(true)} onMouseLeave={() => setHovNE(false)}
      >
        <div style={{ width: 52, height: 52, borderRadius: 14, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Monitor size={26} style={{ color: '#2563EB' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Non-Expendable Assets</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#0F172A', lineHeight: 1.1, marginBottom: 12 }}>{data.nonExp.total}</div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 8 }}>Total Assets</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {row('In Use', data.nonExp.in_use, '#3B82F6')}
            {row('Available', data.nonExp.available, '#22C55E')}
            {row('Under Maintenance', data.nonExp.maintenance, '#A855F7')}
          </div>
        </div>
        <ChevronRight size={18} style={{ color: '#CBD5E1', flexShrink: 0 }} />
      </div>

      {/* Expendable */}
      <div
        style={{ ...cardBase, borderColor: hovEx ? '#6EE7B7' : '#E2E8F0', boxShadow: hovEx ? '0 4px 16px rgba(0,0,0,0.10)' : '0 1px 4px rgba(0,0,0,0.06)' }}
        onClick={() => onNavigate('expendable')}
        onMouseEnter={() => setHovEx(true)} onMouseLeave={() => setHovEx(false)}
      >
        <div style={{ width: 52, height: 52, borderRadius: 14, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Package size={26} style={{ color: '#16A34A' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Expendable Items</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#0F172A', lineHeight: 1.1, marginBottom: 12 }}>{data.exp.total}</div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 8 }}>Total Items</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {row('In Stock', data.exp.in_stock, '#22C55E')}
            {row('Low Stock', data.exp.low_stock, '#F59E0B')}
            {row('Out of Stock', data.exp.out_of_stock, '#EF4444')}
          </div>
        </div>
        <ChevronRight size={18} style={{ color: '#CBD5E1', flexShrink: 0 }} />
      </div>
    </div>
  )
}

// ─── Type badge ──────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type?: string | null }) {
  const isNE = type === 'non_expendable'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
      background: isNE ? '#EFF6FF' : '#F0FDF4',
      color: isNE ? '#1E40AF' : '#15803D',
      border: `1px solid ${isNE ? '#BFDBFE' : '#BBF7D0'}`,
      whiteSpace: 'nowrap',
    }}>
      {isNE ? 'Non-Expendable' : 'Expendable'}
    </span>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string; border: string }> = {
    IN_STOCK:         { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
    LOW_STOCK:        { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
    OUT_OF_STOCK:     { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
    AVAILABLE:        { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
    IN_USE:           { bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE' },
    UNDER_MAINTENANCE:{ bg: '#FAF5FF', color: '#7C3AED', border: '#DDD6FE' },
  }
  const s = cfg[status] ?? { bg: '#F8FAFC', color: '#475569', border: '#E2E8F0' }
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 999,
      fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' as const,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {inventoryStatusLabel(status)}
    </span>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function Tabs({ active, onChange }: { active: TabKey; onChange: (t: TabKey) => void }) {
  const tabs: { key: TabKey; label: string }[] = [
    { key: 'all',           label: 'All Items' },
    { key: 'non_expendable',label: 'Non-Expendable' },
    { key: 'expendable',    label: 'Expendable' },
  ]
  return (
    <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #E2E8F0' }}>
      {tabs.map((t) => {
        const isActive = t.key === active
        return (
          <button
            key={t.key} type="button"
            onClick={() => onChange(t.key)}
            style={{
              padding: '12px 20px', fontSize: 13.5, fontWeight: isActive ? 700 : 500,
              color: isActive ? '#1E40AF' : '#64748B',
              background: 'none', border: 'none', borderBottom: isActive ? '2px solid #1E40AF' : '2px solid transparent',
              cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s',
              fontFamily: 'inherit', marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Action cell ─────────────────────────────────────────────────────────────

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
  // Grouped button — no individual border, sits flush inside a group container
  const groupBtn = (label: string, onClick: () => void, primary = false) => (
    <button
      key={label}
      onClick={onClick}
      style={{
        height: 30, paddingInline: 11,
        border: 'none',
        background: primary ? '#1E40AF' : 'transparent',
        color: primary ? '#fff' : '#374151',
        fontSize: 12, fontWeight: 600, cursor: 'pointer',
        fontFamily: 'inherit',
        display: 'inline-flex', alignItems: 'center',
        whiteSpace: 'nowrap' as const,
        transition: 'background 0.12s',
        borderRadius: 0,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = primary ? '#1D3FAB' : '#EEF2F7'
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = primary ? '#1E40AF' : 'transparent'
      }}
    >
      {label}
    </button>
  )

  // Internal divider between buttons inside a group
  const sep = <div style={{ width: 1, alignSelf: 'stretch', background: '#E2E8F0', flexShrink: 0 }} />

  // Group wrapper — rounded pill with border
  const Group = ({ children }: { children: React.ReactNode }) => (
    <div style={{
      display: 'inline-flex', alignItems: 'stretch',
      border: '1px solid #D1D5DB', borderRadius: 8,
      overflow: 'hidden', background: '#fff',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    }}>
      {children}
    </div>
  )

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>

      {/* Stock group */}
      <Group>
        {groupBtn('+ Stock', onStockIn,  true)}
        {sep}
        {groupBtn('− Stock', onStockOut)}
        {sep}
        {groupBtn('Adjust',  onAdjust)}
      </Group>

      {/* Management group */}
      <Group>
        {groupBtn('History', onHistory)}
        {sep}
        {groupBtn('Edit',    onEdit)}
        {onAsset && sep}
        {onAsset && groupBtn('View Asset', onAsset)}
      </Group>

      {/* Delete — standalone, clearly destructive */}
      <button
        onClick={onDelete}
        style={{
          height: 30, paddingInline: 11, borderRadius: 8,
          border: '1px solid #FECACA',
          background: '#FEF2F2', color: '#DC2626',
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'inherit',
          display: 'inline-flex', alignItems: 'center',
          whiteSpace: 'nowrap' as const,
          transition: 'background 0.12s',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#FEE2E2' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2' }}
      >
        Delete
      </button>
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

  // Setup options for SetupDropdowns
  const [offices, setOffices]                 = useState<SetupRecord[]>([])
  const [locations, setLocations]             = useState<SetupRecord[]>([])
  const [assetCategories, setAssetCategories] = useState<SetupRecord[]>([])
  const [manufacturers, setManufacturers]     = useState<SetupRecord[]>([])

  // Live SKU validation state
  const [codeValidation, setCodeValidation]   = useState<{ exists: boolean; message: string } | null>(null)

  const [formData, setFormData] = useState<CreateInventoryItemPayload & {
    asset_category_id?: number | null
    manufacturer_id?: number | null
    office_id?: number | null
    location_id?: number | null
    description?: string
  }>({
    name: '', sku: '', quantity: 0, unit: '', reorder_level: 0,
    track_as_asset: true, type: 'non_expendable',
    asset_category_id: null, manufacturer_id: null, office_id: null, location_id: null, description: '',
  })

  const loadSetupOptions = useCallback(async () => {
    try {
      const [offs, locs, cats, mans] = await Promise.all([
        setupService.list('offices'),
        setupService.list('locations'),
        setupService.list('asset-categories'),
        setupService.list('manufacturers'),
      ])
      setOffices(offs)
      setLocations(locs)
      setAssetCategories(cats)
      setManufacturers(mans)
    } catch { /* best effort */ }
  }, [])

  useEffect(() => {
    void loadSetupOptions()
  }, [loadSetupOptions])

  const validateCodeLive = useCallback(async (code: string, currentItemId?: number) => {
    if (!code.trim()) { setCodeValidation(null); return }
    try {
      const { data } = await api.get('/assets/validate-code', {
        params: { code: code.trim(), ignore_id: currentItemId }
      })
      setCodeValidation(unwrapData(data))
    } catch {
      setCodeValidation(null)
    }
  }, [])

  // Load table rows — pg=1 resets list, pg>1 appends (infinite scroll)
  const loadInventory = useCallback(async (pg = 1) => {
    if (pg === 1) setLoading(true); else setLoadingMore(true)
    try {
      const result = await inventoryService.list({
        page: pg,
        per_page: 20,
        search: search || undefined,
        status: statusFilter || undefined,
        type: activeTab === 'all' ? undefined : activeTab as 'non_expendable' | 'expendable',
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
      const [ne, ex, neAll, exAll] = await Promise.all([
        inventoryService.list({ type: 'non_expendable', per_page: 1 }),
        inventoryService.list({ type: 'expendable',    per_page: 1 }),
        inventoryService.list({ type: 'non_expendable', per_page: 100 }),
        inventoryService.list({ type: 'expendable',    per_page: 100 }),
      ])
      const count = (arr: InventoryItem[], s: string) => arr.filter((i) => i.status === s).length
      setSummary({
        nonExp: {
          total:       ne.meta.total,
          in_use:      count(neAll.items, 'IN_USE'),
          available:   count(neAll.items, 'IN_STOCK'),
          maintenance: count(neAll.items, 'UNDER_MAINTENANCE'),
        },
        exp: {
          total:        ex.meta.total,
          in_stock:     count(exAll.items, 'IN_STOCK'),
          low_stock:    count(exAll.items, 'LOW_STOCK'),
          out_of_stock: count(exAll.items, 'OUT_OF_STOCK'),
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
    void loadSetupOptions()
    setFormData({
      name: '', sku: '', quantity: 0, unit: '', reorder_level: 0,
      track_as_asset: activeTab !== 'expendable',
      type: activeTab === 'all' ? 'non_expendable' : activeTab as 'non_expendable' | 'expendable',
      asset_category_id: null, manufacturer_id: null, office_id: null, location_id: null, description: '',
    })
    setModalOpen(true)
  }

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setCodeValidation(null)
    void loadSetupOptions()
    setFormData({
      name: item.name,
      sku: item.sku ?? '',
      quantity: item.quantity,
      unit: item.unit,
      reorder_level: item.reorder_level || 0,
      track_as_asset: Boolean(item.asset_id),
      type: (item.type as 'non_expendable' | 'expendable') ?? 'non_expendable',
      asset_category_id: item.asset_category_id ?? null,
      manufacturer_id: item.manufacturer_id ?? null,
      office_id: item.office_id ?? null,
      location_id: item.location_id ?? null,
      description: item.description ?? '',
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
  const [exportScope,      setExportScope]      = useState<'all' | 'non_expendable' | 'expendable'>('all')
  const [exporting,        setExporting]        = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const scopeFilter = exportScope === 'all' ? undefined : exportScope as 'non_expendable' | 'expendable'

      if (exportFormat === 'json') {
        // JSON: fetch all items client-side and serialise
        const result = await inventoryService.list({
          per_page: 9999,
          search: search || undefined,
          type: scopeFilter,
        })
        const json = JSON.stringify(result.items, null, 2)
        const blob = new Blob([json], { type: 'application/json' })
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        a.href     = url
        a.download = `inventory-${exportScope}-${Date.now()}.json`
        document.body.appendChild(a); a.click(); document.body.removeChild(a)
        URL.revokeObjectURL(url)

      } else if (exportFormat === 'csv') {
        // CSV: fetch all items and build CSV client-side
        const result = await inventoryService.list({
          per_page: 9999,
          search: search || undefined,
          type: scopeFilter,
        })
        const headers = ['id', 'name', 'type', 'sku', 'asset_number', 'quantity', 'unit', 'status', 'reorder_level', 'remarks']
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
        // XLSX: use existing backend endpoint
        const blob = await inventoryService.downloadExport({
          search: search || undefined,
          status: statusFilter || undefined,
          type: scopeFilter,
        })
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

  const td: React.CSSProperties = { padding: '14px 16px', fontSize: 13.5, color: '#374151', borderBottom: '1px solid #F1F5F9', verticalAlign: 'middle' }
  const th: React.CSSProperties = { padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.07em', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left' as const, whiteSpace: 'nowrap' as const }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>Inventory</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13.5, color: '#64748B' }}>Manage consumable items and available quantities.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button variant="secondary" size="sm" onClick={() => setWizardOpen(true)}>
            <Upload size={14} />Import
          </Button>
          <Button variant="secondary" size="sm" onClick={() => { setExportScope(activeTab === 'all' ? 'all' : activeTab as 'non_expendable' | 'expendable'); setExportModalOpen(true) }}>
            <Download size={14} />Export
          </Button>
          <Button size="sm" onClick={handleCreate}>
            <Plus size={14} />Add Item
          </Button>
        </div>
      </div>

      {message && <Alert tone={message.type} onClose={() => setMessage(null)}>{message.text}</Alert>}

      {/* ── Summary cards ── */}
      <SummaryCard data={summary} onNavigate={handleTabChange} />

      {/* ── Table card ── */}
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>

        {/* Tabs + search/filter — unified top bar */}
        <div style={{ borderBottom: '1px solid #E2E8F0' }}>
          {/* Tab row */}
          <div style={{ padding: '0 20px' }}>
            <Tabs active={activeTab} onChange={handleTabChange} />
          </div>

          {/* Search + filter row — sits flush below tabs */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 16px 10px' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 0', minWidth: 0 }}>
              <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearch}
                placeholder="Search by name, code, or unit…"
                style={{
                  width: '100%', height: 36, paddingLeft: 32, paddingRight: 12,
                  borderRadius: 8, border: '1.5px solid #E2E8F0',
                  fontSize: 13, color: '#1E293B', outline: 'none',
                  boxSizing: 'border-box', fontFamily: 'inherit',
                  background: '#F8FAFC',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#93C5FD'; e.currentTarget.style.background = '#fff' }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC' }}
              />
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); void loadInventory(1) }}
              style={{
                height: 36, paddingInline: '10px 28px', borderRadius: 8,
                border: '1.5px solid #E2E8F0', fontSize: 13, color: statusFilter ? '#1E293B' : '#94A3B8',
                background: `#F8FAFC url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2394A3B8'/%3E%3C/svg%3E") no-repeat right 10px center`,
                backgroundSize: '10px 6px',
                appearance: 'none', cursor: 'pointer', fontFamily: 'inherit',
                outline: 'none', flexShrink: 0,
              }}
            >
              <option value="">All statuses</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>

            {/* Filter button */}
            <button
              onClick={handleFilter}
              style={{
                height: 36, paddingInline: 14, borderRadius: 8,
                border: '1.5px solid #E2E8F0', background: '#F8FAFC',
                fontSize: 13, fontWeight: 600, color: '#374151',
                cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                display: 'inline-flex', alignItems: 'center', gap: 5,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#F1F5F9' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#F8FAFC' }}
            >
              <Filter size={13} /> Filter
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spinner /></div>
          ) : rows.length === 0 ? (
            <div style={{ padding: '60px 0' }}>
              <EmptyState title="No inventory items found" description="Add your first item to begin tracking stock." />
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' as const }}>
              <colgroup>
                <col style={{ minWidth: 160 }} />
                <col style={{ width: 155 }} />
                <col style={{ width: 60 }} />
                <col style={{ width: 90 }} />
                <col style={{ width: 105 }} />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <th style={th}>Item</th>
                  <th style={th}>Code / Asset No.</th>
                  <th style={{ ...th, textAlign: 'center' as const }}>Qty</th>
                  <th style={th}>Unit</th>
                  <th style={th}>Status</th>
                  <th style={{ ...th, textAlign: 'right' as const, paddingRight: 16 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = '#FAFBFD' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = '' }}
                  >
                    {/* Item — name + type badge + optional remark */}
                    <td style={td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap' as const }}>
                        <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{r.name}</div>
                        <TypeBadge type={r.type} />
                      </div>
                      {r.remarks && (
                        <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.remarks}
                        </div>
                      )}
                    </td>

                    {/* Code */}
                    <td style={td}>
                      {(r.asset_number ?? r.sku) ? (
                        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11.5, color: '#475569', background: '#F1F5F9', padding: '3px 7px', borderRadius: 5, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.asset_number ?? r.sku}
                        </span>
                      ) : <span style={{ color: '#CBD5E1' }}>—</span>}
                    </td>

                    {/* Qty */}
                    <td style={{ ...td, textAlign: 'center' as const }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: '#1E293B' }}>{r.quantity}</span>
                    </td>

                    {/* Unit */}
                    <td style={td}><span style={{ color: '#64748B', fontSize: 13 }}>{r.unit || '—'}</span></td>

                    {/* Status */}
                    <td style={td}><StatusBadge status={r.status} /></td>

                    {/* Actions */}
                    <td style={{ ...td, textAlign: 'right' as const, paddingRight: 16, paddingTop: 10, paddingBottom: 10 }}>
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
          <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0', borderTop: '1px solid #F1F5F9' }}>
            <Spinner />
          </div>
        )}
      </div>


      {/* ── Add / Edit modal ── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Item' : 'Add Item'}
        maxWidth={650}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving || Boolean(codeValidation?.exists)}>
              {saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Add Item'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Basic Information */}
          <div className="space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#94A3B8]">Basic Information</p>
            
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Item Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Bond Paper A4"
              />
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-[#334155]">Item Code / SKU</label>
                <div className="relative">
                  <Input
                    value={formData.sku || ''}
                    onChange={(e) => {
                      const val = e.target.value
                      setFormData({ ...formData, sku: val })
                      void validateCodeLive(val, editingItem?.id)
                    }}
                    placeholder="e.g. SKU-001"
                  />
                  {codeValidation && (
                    <div className="mt-1 flex items-center gap-1 text-xs">
                      {codeValidation.exists ? (
                        <span className="flex items-center gap-1 font-medium text-red-600">
                          <XCircle size={14} /> ❌ Already exists
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 font-medium text-emerald-600">
                          <CheckCircle2 size={14} /> ✓ Available
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[#1F2937]">Description</label>
              <textarea
                className="w-full rounded-[10px] border border-[#E5E7EB] bg-white p-3 text-[14px] text-[#1F2937] shadow-[0_1px_2px_rgba(0,0,0,.05)] focus:border-[#0D47A1] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]/15"
                rows={2}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Item description..."
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <SetupDropdown
                label="Asset Category"
                resource="asset-categories"
                options={assetCategories.map((c) => ({ label: c.name, value: c.id, raw: c }))}
                value={formData.asset_category_id}
                onChange={(val) => setFormData({ ...formData, asset_category_id: val })}
                onRefreshNeeded={loadSetupOptions}
                placeholder="Select Category"
              />
              <SetupDropdown
                label="Manufacturer"
                resource="manufacturers"
                options={manufacturers.map((m) => ({ label: m.name, value: m.id, raw: m }))}
                value={formData.manufacturer_id}
                onChange={(val) => setFormData({ ...formData, manufacturer_id: val })}
                onRefreshNeeded={loadSetupOptions}
                placeholder="Select Manufacturer"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <SetupDropdown
                label="Office"
                resource="offices"
                options={offices.map((o) => ({ label: o.name, value: o.id, raw: o }))}
                value={formData.office_id}
                onChange={(val) => setFormData({ ...formData, office_id: val, location_id: null })}
                onRefreshNeeded={loadSetupOptions}
                placeholder="Select Office"
              />
              <SetupDropdown
                label="Location"
                resource="locations"
                options={locations
                  .filter((l) => !formData.office_id || l.office_id === formData.office_id)
                  .map((l) => ({ label: l.name, value: l.id, raw: l }))}
                value={formData.location_id}
                onChange={(val) => setFormData({ ...formData, location_id: val })}
                onRefreshNeeded={loadSetupOptions}
                needsOffice
                currentOfficeId={formData.office_id}
                placeholder="Select Location"
              />
            </div>
          </div>

          {/* Inventory Section */}
          <div className="space-y-3 pt-2 border-t border-[#E5E7EB]">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#94A3B8]">Inventory</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Input
                  label="Available Quantity (Current Stock)"
                  type="number"
                  value={formData.quantity.toString()}
                  disabled={Boolean(editingItem)}
                  helperText={editingItem ? 'Available Quantity is read-only. Use Stock Adjustment to update stock.' : undefined}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                />
              </div>
              <Input
                label="Unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="e.g. reams, pcs"
              />
            </div>
            <Input
              label="Low Stock Alert"
              helperText="Warn when quantity reaches this number."
              type="number"
              value={formData.reorder_level?.toString() || '0'}
              onChange={(e) => setFormData({ ...formData, reorder_level: parseInt(e.target.value) || 0 })}
            />
            <div>
              <div className="mb-2 text-[13px] font-semibold text-[#334155]">Inventory Type</div>
              <div className="flex gap-2.5">
                {(['non_expendable', 'expendable'] as const).map((t) => {
                  const active = formData.type === t
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: t, track_as_asset: t === 'non_expendable' })}
                      className={`flex-1 rounded-[10px] border px-3 py-2 text-center text-[13px] font-medium transition-all ${
                        active
                          ? 'border-[#0D47A1] bg-[#EFF6FF] font-bold text-[#0D47A1]'
                          : 'border-[#E5E7EB] bg-white text-[#64748B] hover:bg-slate-50'
                      }`}
                    >
                      {t === 'non_expendable' ? 'Non-Expendable' : 'Expendable'}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Audit Section */}
          {editingItem && (
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3.5 pt-3">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#94A3B8]">Audit Information</p>
              <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                <div>
                  <span className="font-semibold text-slate-700">Created By:</span>{' '}
                  {editingItem.created_by_name || 'System'}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Created At:</span>{' '}
                  {editingItem.created_at ? new Date(editingItem.created_at).toLocaleString() : '—'}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Updated By:</span>{' '}
                  {editingItem.updated_by_name || '—'}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Updated At:</span>{' '}
                  {editingItem.updated_at ? new Date(editingItem.updated_at).toLocaleString() : '—'}
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ── Stock In / Out modal ── */}
      <Modal open={stockModalOpen} onClose={() => setStockModalOpen(false)}
        title={`${stockType === 'in' ? 'Add Stock' : 'Remove Stock'} — ${stockItem?.name}`}
        footer={<><Button variant="secondary" onClick={() => setStockModalOpen(false)}>Cancel</Button><Button onClick={handleStockSubmit} disabled={saving}>{saving ? 'Processing...' : stockType === 'in' ? 'Add Stock' : 'Remove Stock'}</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Input label="Quantity" type="number" min={1} value={stockQty.toString()} onChange={(e) => setStockQty(parseInt(e.target.value) || 1)} />
          <Input label="Reason" value={stockReason} onChange={(e) => setStockReason(e.target.value)} placeholder={stockType === 'in' ? 'New supplies received' : 'Office use'} />
        </div>
      </Modal>

      {/* ── Adjust Quantity modal ── */}
      <Modal open={adjustItem !== null} onClose={() => setAdjustItem(null)}
        title={`Correct Stock Quantity — ${adjustItem?.name}`}
        footer={<><Button variant="secondary" onClick={() => setAdjustItem(null)}>Cancel</Button><Button onClick={() => void handleAdjustSubmit()} disabled={saving}>{saving ? 'Saving...' : 'Save Correction'}</Button></>}>
        {adjustItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc', padding: '14px 16px' }}>
              {[['Current', adjustItem.quantity, '#1e293b'], ['New', adjustQty, '#1e293b'], ['Diff', adjustQty - adjustItem.quantity, adjustQty - adjustItem.quantity < 0 ? '#DC2626' : '#16A34A']].map(([l, v, c]) => (
                <div key={String(l)}><div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{String(l)}</div><div style={{ fontSize: 16, fontWeight: 700, color: String(c) }}>{Number(v) > 0 && l === 'Diff' ? '+' : ''}{String(v)}</div></div>
              ))}
            </div>
            <Input label="Corrected Quantity" type="number" min={0} value={adjustQty.toString()} onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)} />
            <Input label="Reason" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} placeholder="Physical count correction, damage, expiry..." />
          </div>
        )}
      </Modal>

      {/* ── Stock History modal ── */}
      <Modal open={historyItem !== null} onClose={() => { setHistoryItem(null); setHistoryRows([]) }}
        title={`Stock Movement History — ${historyItem?.name}`}>
        {historyLoading ? <Spinner /> : historyRows.length === 0
          ? <EmptyState title="No movement history" description="Stock changes will appear here." />
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {historyRows.map((m) => (
                <div key={m.id} style={{ borderRadius: 12, border: '1px solid #E5E7EB', background: '#fff', padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                    <div><div style={{ fontWeight: 600, color: '#1F2937', fontSize: 14 }}>{movementTypeLabel(m.type)}</div><div style={{ fontSize: 12, color: '#9CA3AF' }}>{m.created_at ?? 'Date unavailable'}</div></div>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: m.quantity < 0 ? '#DC2626' : '#16A34A', fontSize: 15 }}>{m.quantity > 0 ? '+' : ''}{m.quantity}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12, color: '#6B7280' }}>
                    <div>Previous: <strong style={{ color: '#1F2937' }}>{m.quantity_before}</strong></div>
                    <div>New: <strong style={{ color: '#1F2937' }}>{m.quantity_after}</strong></div>
                    <div>Reason: <strong style={{ color: '#1F2937' }}>{m.reason ?? 'Not provided'}</strong></div>
                    <div>By: <strong style={{ color: '#1F2937' }}>{m.performed_by ?? 'System'}</strong></div>
                  </div>
                </div>
              ))}
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
            <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 10 }}>File Format</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {([
                {
                  fmt: 'xlsx' as const,
                  label: 'Excel (.xlsx)',
                  icon: (
                    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 32, height: 32 }}>
                      <rect width="40" height="40" rx="8" fill="#E8F5E9"/>
                      <rect x="8" y="7" width="18" height="26" rx="2" fill="#43A047"/>
                      <rect x="14" y="7" width="18" height="26" rx="2" fill="#66BB6A"/>
                      <rect x="20" y="7" width="12" height="26" rx="2" fill="#fff" opacity="0.15"/>
                      <text x="20" y="23" textAnchor="middle" fontSize="10" fontWeight="800" fill="#fff" fontFamily="Arial,sans-serif">XLS</text>
                    </svg>
                  ),
                },
                {
                  fmt: 'csv' as const,
                  label: 'CSV (.csv)',
                  icon: (
                    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 32, height: 32 }}>
                      <rect width="40" height="40" rx="8" fill="#E3F2FD"/>
                      <rect x="8" y="7" width="18" height="26" rx="2" fill="#1E88E5"/>
                      <rect x="14" y="7" width="12" height="4" rx="1" fill="#fff" opacity="0.5"/>
                      <line x1="12" y1="17" x2="28" y2="17" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
                      <line x1="12" y1="21" x2="28" y2="21" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
                      <line x1="12" y1="25" x2="22" y2="25" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
                      <line x1="20" y1="14" x2="20" y2="29" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.35"/>
                    </svg>
                  ),
                },
                {
                  fmt: 'json' as const,
                  label: 'JSON (.json)',
                  icon: (
                    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 32, height: 32 }}>
                      <rect width="40" height="40" rx="8" fill="#FFF3E0"/>
                      <rect x="8" y="7" width="18" height="26" rx="2" fill="#FB8C00"/>
                      <text x="20" y="23" textAnchor="middle" fontSize="9" fontWeight="900" fill="#fff" fontFamily="monospace,Arial">{'{ }'}</text>
                    </svg>
                  ),
                },
              ]).map(({ fmt, label, icon }) => {
                const active = exportFormat === fmt
                return (
                  <button key={fmt} type="button" onClick={() => setExportFormat(fmt)}
                    style={{ flex: 1, padding: '12px 8px', borderRadius: 12, border: `2px solid ${active ? '#1E40AF' : '#E2E8F0'}`, background: active ? '#EFF6FF' : '#FAFAFA', color: active ? '#1E40AF' : '#475569', fontWeight: active ? 700 : 500, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    {icon}
                    <span>{label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Scope */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 10 }}>Inventory Scope</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {([
                { value: 'all',            label: 'All Items',           desc: 'Export both non-expendable and expendable items' },
                { value: 'non_expendable', label: 'Non-Expendable Only', desc: 'Durable assets — computers, equipment, furniture' },
                { value: 'expendable',     label: 'Expendable Only',     desc: 'Consumables — paper, toner, pens, supplies' },
              ] as const).map((opt) => {
                const active = exportScope === opt.value
                return (
                  <button key={opt.value} type="button" onClick={() => setExportScope(opt.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `2px solid ${active ? '#1E40AF' : '#E2E8F0'}`, background: active ? '#EFF6FF' : '#FAFAFA', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${active ? '#1E40AF' : '#CBD5E1'}`, background: active ? '#1E40AF' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {active && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'block' }} />}
                    </span>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: active ? '#1E40AF' : '#0F172A' }}>{opt.label}</div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>{opt.desc}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Summary */}
          <div style={{ padding: '10px 14px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: 12.5, color: '#64748B' }}>
            Will export <strong style={{ color: '#0F172A' }}>{exportScope === 'all' ? 'all' : exportScope.replace('_', '-')} inventory items</strong> as a <strong style={{ color: '#0F172A' }}>.{exportFormat}</strong> file.
            {search && <> Filtered by search: <em>"{search}"</em>.</>}
          </div>

        </div>
      </Modal>

      {/* ── Import Wizard ── */}
      <InventoryImportWizard open={wizardOpen} onClose={() => setWizardOpen(false)}
        onCompleted={() => { void loadInventory(1); void loadSummary(); setMessage({ type: 'success', text: 'Import completed.' }) }} />
    </div>
  )
}
