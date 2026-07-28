import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Upload, Filter, Plus, Monitor, Package, ChevronRight, Search } from 'lucide-react'
import {
  Alert, Button, Dropdown, EmptyState, Input,
  Modal, Spinner,
} from '@/components/ui'
import {
  inventoryService,
  type CreateInventoryItemPayload,
  type UpdateInventoryItemPayload,
} from '@/services/inventoryService'
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
      fontSize: 11.5, fontWeight: 600,
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

// ─── Main page ────────────────────────────────────────────────────────────────

export function InventoryPage() {
  const navigate = useNavigate()

  // Table state
  const [rows,           setRows]           = useState<InventoryItem[]>([])
  const [loading,        setLoading]        = useState(true)
  const [page,           setPage]           = useState(1)
  const [perPage,        setPerPage]        = useState(10)
  const [lastPage,       setLastPage]       = useState(1)
  const [total,          setTotal]          = useState(0)
  const [search,         setSearch]         = useState('')
  const [statusFilter,   setStatusFilter]   = useState('')
  const [activeTab,      setActiveTab]      = useState<TabKey>('all')

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

  const [formData, setFormData] = useState<CreateInventoryItemPayload>({
    name: '', sku: '', quantity: 0, unit: '', reorder_level: 0,
    track_as_asset: true, type: 'non_expendable',
  })

  // Load table rows — accepts explicit params to avoid stale closure issues
  const loadInventory = useCallback(async (pg = 1) => {
    setLoading(true)
    try {
      const result = await inventoryService.list({
        page: pg,
        per_page: perPage,
        search: search || undefined,
        status: statusFilter || undefined,
        type: activeTab === 'all' ? undefined : activeTab as 'non_expendable' | 'expendable',
      })
      setRows(result.items)
      setPage(result.meta.current_page)
      setLastPage(result.meta.last_page)
      setTotal(result.meta.total)
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unable to load inventory items.' })
    } finally { setLoading(false) }
  }, [perPage, search, statusFilter, activeTab])

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

  // Trigger on tab / filter / perPage changes — loadInventory is stable per these deps
  useEffect(() => {
    void loadInventory(1)
  }, [activeTab, statusFilter, perPage]) // eslint-disable-line react-hooks/exhaustive-deps

  // Summary loads once on mount
  useEffect(() => {
    void loadSummary()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabChange = (t: TabKey) => { setActiveTab(t); setPage(1) }
  const handleFilter    = () => { void loadInventory(1) }
  const handleSearch    = (e: React.KeyboardEvent) => { if (e.key === 'Enter') void loadInventory(1) }

  // ── CRUD handlers ────────────────────────────────────────────────────────────

  const handleCreate = () => {
    setEditingItem(null)
    setFormData({ name: '', sku: '', quantity: 0, unit: '', reorder_level: 0,
      track_as_asset: activeTab !== 'expendable',
      type: activeTab === 'all' ? 'non_expendable' : activeTab as 'non_expendable' | 'expendable' })
    setModalOpen(true)
  }

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setFormData({ name: item.name, sku: (item as unknown as { sku?: string }).sku ?? '',
      quantity: item.quantity, unit: item.unit, reorder_level: item.reorder_level || 0,
      track_as_asset: Boolean(item.asset_id),
      type: (item.type as 'non_expendable' | 'expendable') ?? 'non_expendable' })
    setModalOpen(true)
  }

  const handleDelete = async (item: InventoryItem) => {
    if (!confirm(`Delete "${item.name}"?`)) return
    try {
      await inventoryService.delete(item.id)
      setMessage({ type: 'success', text: 'Item deleted.' })
      notifyDataChanged('inventory')
      void loadInventory(page); void loadSummary()
    } catch (e: unknown) { setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to delete.' }) }
  }

  const handleSubmit = async () => {
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

  const td: React.CSSProperties = { padding: '13px 16px', fontSize: 13.5, color: '#374151', borderBottom: '1px solid #F1F5F9', verticalAlign: 'middle' }
  const th: React.CSSProperties = { padding: '10px 16px', fontSize: 11.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '0.06em', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left' as const }

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

        {/* Tabs */}
        <div style={{ padding: '0 20px' }}>
          <Tabs active={activeTab} onChange={handleTabChange} />
        </div>

        {/* Search + filters */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #F1F5F9' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Search item name, code, or unit..."
              style={{ width: '100%', height: 38, paddingLeft: 34, paddingRight: 12, borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 13.5, color: '#1E293B', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#F8FAFC' }}
            />
          </div>
          <div style={{ width: 160 }}>
            <Dropdown value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} placeholder="All stock statuses"
              options={[{ label: 'In Stock', value: 'IN_STOCK' }, { label: 'Low Stock', value: 'LOW_STOCK' }, { label: 'Out of Stock', value: 'OUT_OF_STOCK' }]} />
          </div>
          <Button variant="secondary" size="sm" onClick={handleFilter}>
            <Filter size={13} />Filter
          </Button>
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
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
              <thead>
                <tr>
                  <th style={th}>Item</th>
                  <th style={th}>Type</th>
                  <th style={th}>Asset No. / Code</th>
                  <th style={th}>Available Qty</th>
                  <th style={th}>Unit</th>
                  <th style={th}>Status</th>
                  <th style={{ ...th, textAlign: 'right' as const }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} style={{ transition: 'background 0.1s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = '#F8FAFC' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = '' }}
                  >
                    <td style={td}>
                      <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 14 }}>{r.name}</div>
                      {r.remarks && <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{r.remarks}</div>}
                    </td>
                    <td style={td}><TypeBadge type={r.type} /></td>
                    <td style={td}><span style={{ fontFamily: 'monospace', fontSize: 12.5, color: '#64748B' }}>{r.asset_number ?? r.sku ?? '—'}</span></td>
                    <td style={td}><span style={{ fontWeight: 700, fontSize: 15, color: '#1E293B' }}>{r.quantity}</span></td>
                    <td style={td}><span style={{ color: '#475569', fontSize: 13 }}>{r.unit}</span></td>
                    <td style={td}><StatusBadge status={r.status} /></td>
                    <td style={{ ...td, textAlign: 'right' as const }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <Button size="sm" variant="primary"   onClick={() => { setStockItem(r); setStockType('in');  setStockQty(1); setStockReason(''); setStockModalOpen(true) }}>+ Stock</Button>
                        <Button size="sm" variant="secondary" onClick={() => { setStockItem(r); setStockType('out'); setStockQty(1); setStockReason(''); setStockModalOpen(true) }}>− Stock</Button>
                        <Button size="sm" variant="ghost"     onClick={() => { setAdjustItem(r); setAdjustQty(r.quantity); setAdjustReason('') }}>Adjust</Button>
                        <Button size="sm" variant="ghost"     onClick={() => void loadHistory(r)}>History</Button>
                        <Button size="sm" variant="secondary" onClick={() => handleEdit(r)}>Edit</Button>
                        {r.asset_number && <Button size="sm" variant="ghost" onClick={() => navigate(`/assets?search=${encodeURIComponent(r.asset_number ?? '')}`)}>Asset</Button>}
                        <Button size="sm" variant="danger"    onClick={() => handleDelete(r)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && rows.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, padding: '12px 20px', borderTop: '1px solid #F1F5F9' }}>
            <span style={{ fontSize: 13, color: '#64748B' }}>
              Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, total)} of {total} items
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button onClick={() => void loadInventory(page - 1)} disabled={page <= 1}
                style={{ height: 32, paddingInline: 10, borderRadius: 8, border: '1px solid #E2E8F0', background: page <= 1 ? '#F8FAFC' : '#fff', color: page <= 1 ? '#CBD5E1' : '#374151', cursor: page <= 1 ? 'not-allowed' : 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
                Previous
              </button>
              {Array.from({ length: Math.min(lastPage, 5) }, (_, i) => {
                const pg = i + 1
                return (
                  <button key={pg} onClick={() => void loadInventory(pg)}
                    style={{ height: 32, width: 32, borderRadius: 8, border: '1px solid', borderColor: pg === page ? '#1E40AF' : '#E2E8F0', background: pg === page ? '#1E40AF' : '#fff', color: pg === page ? '#fff' : '#374151', cursor: 'pointer', fontSize: 13, fontWeight: pg === page ? 700 : 400, fontFamily: 'inherit' }}>
                    {pg}
                  </button>
                )
              })}
              {lastPage > 5 && <span style={{ color: '#94A3B8', padding: '0 4px' }}>...</span>}
              {lastPage > 5 && (
                <button onClick={() => void loadInventory(lastPage)}
                  style={{ height: 32, width: 32, borderRadius: 8, border: '1px solid', borderColor: lastPage === page ? '#1E40AF' : '#E2E8F0', background: lastPage === page ? '#1E40AF' : '#fff', color: lastPage === page ? '#fff' : '#374151', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
                  {lastPage}
                </button>
              )}
              <button onClick={() => void loadInventory(page + 1)} disabled={page >= lastPage}
                style={{ height: 32, paddingInline: 10, borderRadius: 8, border: '1px solid #E2E8F0', background: page >= lastPage ? '#F8FAFC' : '#fff', color: page >= lastPage ? '#CBD5E1' : '#374151', cursor: page >= lastPage ? 'not-allowed' : 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
                Next
              </button>
              <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}
                style={{ height: 32, paddingInline: 8, borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13, color: '#374151', background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
              </select>
            </div>
          </div>
        )}
      </div>


      {/* ── Add / Edit modal ── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'Edit Item' : 'Add Item'}
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Add Item'}</Button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Input label="Item Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Bond Paper A4" />
          <Input label="Item Code / SKU" helperText="Use the existing code if available." value={formData.sku || ''} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} placeholder="e.g. SKU-001" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Input label="Available Quantity" type="number" value={formData.quantity.toString()} disabled={Boolean(editingItem)} helperText={editingItem ? 'Use Adjust to update stock.' : undefined} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })} />
            <Input label="Unit" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} placeholder="e.g. reams, pcs" />
          </div>
          <Input label="Low Stock Alert" helperText="Warn when quantity reaches this number." type="number" value={formData.reorder_level?.toString() || '0'} onChange={(e) => setFormData({ ...formData, reorder_level: parseInt(e.target.value) || 0 })} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>Inventory Type</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {(['non_expendable', 'expendable'] as const).map((t) => {
                const active = formData.type === t
                return (
                  <button key={t} type="button" onClick={() => setFormData({ ...formData, type: t, track_as_asset: t === 'non_expendable' })}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: `2px solid ${active ? '#1E40AF' : '#E2E8F0'}`, background: active ? '#EFF6FF' : '#fff', color: active ? '#1E40AF' : '#64748B', fontWeight: active ? 700 : 500, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                    {t === 'non_expendable' ? 'Non-Expendable' : 'Expendable'}
                  </button>
                )
              })}
            </div>
          </div>
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
              {(['xlsx', 'csv', 'json'] as const).map((fmt) => {
                const active = exportFormat === fmt
                const labels: Record<string, string> = { xlsx: 'Excel (.xlsx)', csv: 'CSV (.csv)', json: 'JSON (.json)' }
                const icons:  Record<string, string> = { xlsx: '📊', csv: '📄', json: '{ }' }
                return (
                  <button key={fmt} type="button" onClick={() => setExportFormat(fmt)}
                    style={{ flex: 1, padding: '10px 8px', borderRadius: 12, border: `2px solid ${active ? '#1E40AF' : '#E2E8F0'}`, background: active ? '#EFF6FF' : '#FAFAFA', color: active ? '#1E40AF' : '#475569', fontWeight: active ? 700 : 500, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 20 }}>{icons[fmt]}</span>
                    <span>{labels[fmt]}</span>
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
