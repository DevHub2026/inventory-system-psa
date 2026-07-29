import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert, Badge, Button, Card, Dropdown, EmptyState, Input,
  Modal, Pagination, SearchBar, Spinner, Table, type Column,
} from '@/components/ui'
import {
  inventoryService,
  type CreateInventoryItemPayload,
  type UpdateInventoryItemPayload,
} from '@/services/inventoryService'
import type { InventoryItem, StockMovement } from '@/types'
import { inventoryStatusLabel } from '@/utils/displayLabels'
import { PageHeader } from '@/components/PageHeader'

const ITEM_TYPE = 'expendable' as const

function movementTypeLabel(type: string) {
  return (
    { stock_in: 'Stock Added', stock_out: 'Stock Removed', adjustment: 'Quantity Corrected' }[type] ?? type
  )
}

const BLANK_FORM: CreateInventoryItemPayload = {
  name: '', sku: '', type: ITEM_TYPE, quantity: 0, unit: '', reorder_level: 0, track_as_asset: false,
}

export function ExpendableInventoryPage() {
  const navigate = useNavigate()

  const [rows,           setRows]           = useState<InventoryItem[]>([])
  const [loading,        setLoading]        = useState(true)
  const [page,           setPage]           = useState(1)
  const [lastPage,       setLastPage]       = useState(1)
  const [total,          setTotal]          = useState(0)
  const [search,         setSearch]         = useState('')
  const [statusFilter,   setStatusFilter]   = useState('')
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
  const [formData,       setFormData]       = useState<CreateInventoryItemPayload>(BLANK_FORM)

  const loadInventory = async (nextPage = page) => {
    setLoading(true)
    try {
      const result = await inventoryService.list({
        page: nextPage, per_page: 10,
        search: search || undefined,
        status: statusFilter || undefined,
        type: ITEM_TYPE,
      })
      setRows(result.items)
      setPage(result.meta.current_page)
      setLastPage(result.meta.last_page)
      setTotal(result.meta.total)
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unable to load inventory items.' })
    } finally { setLoading(false) }
  }

  useEffect(() => { void loadInventory(1) }, [])
  useEffect(() => { if (statusFilter !== undefined) void loadInventory(1) }, [statusFilter])

  const handleCreate = () => { setEditingItem(null); setFormData(BLANK_FORM); setModalOpen(true) }

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      sku: (item as unknown as { sku?: string }).sku ?? '',
      type: ITEM_TYPE,
      quantity: item.quantity,
      unit: item.unit,
      reorder_level: item.reorder_level || 0,
      track_as_asset: Boolean(item.asset_id),
    })
    setModalOpen(true)
  }

  const handleDelete = async (item: InventoryItem) => {
    if (!confirm(`Delete ${item.name}?`)) return
    try {
      await inventoryService.delete(item.id)
      setMessage({ type: 'success', text: 'Item deleted successfully.' })
      await loadInventory()
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to delete item.' })
    }
  }

  const handleSubmit = async () => {
    setSaving(true); setMessage(null)
    try {
      if (editingItem) {
        await inventoryService.update(editingItem.id, formData as UpdateInventoryItemPayload)
        setMessage({ type: 'success', text: 'Item updated successfully.' })
      } else {
        await inventoryService.create(formData)
        setMessage({ type: 'success', text: 'Item created successfully.' })
      }
      setModalOpen(false); await loadInventory()
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to save item.' })
    } finally { setSaving(false) }
  }

  const handleStockSubmit = async () => {
    if (!stockItem) return; setSaving(true)
    try {
      if (stockType === 'in') {
        await inventoryService.stockIn(stockItem.id, { quantity: stockQty, reason: stockReason || undefined })
        setMessage({ type: 'success', text: 'Stock added successfully.' })
      } else {
        await inventoryService.stockOut(stockItem.id, { quantity: stockQty, reason: stockReason || undefined })
        setMessage({ type: 'success', text: 'Stock removed successfully.' })
      }
      setStockModalOpen(false); await loadInventory(page)
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unable to update the item quantity.' })
    } finally { setSaving(false) }
  }

  const handleAdjustSubmit = async () => {
    if (!adjustItem) return
    if (!adjustReason.trim()) { setMessage({ type: 'error', text: 'Please provide a reason for correcting the quantity.' }); return }
    setSaving(true)
    try {
      await inventoryService.adjust(adjustItem.id, { quantity: adjustQty, reason: adjustReason.trim() })
      setAdjustItem(null)
      setMessage({ type: 'success', text: 'Stock quantity corrected successfully.' })
      await loadInventory(page)
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unable to correct stock quantity.' })
    } finally { setSaving(false) }
  }

  const loadHistory = async (item: InventoryItem) => {
    setHistoryItem(item); setHistoryLoading(true)
    try { const r = await inventoryService.history(item.id); setHistoryRows(r.items) }
    catch (e: unknown) { setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unable to load history.' }) }
    finally { setHistoryLoading(false) }
  }

  const columns: Column<InventoryItem>[] = [
    { key: 'name',         header: 'Item',          render: (r) => <span className="font-medium text-[#1F2937]">{r.name}</span> },
    { key: 'asset_number', header: 'Asset No.',     render: (r) => <span className="font-mono text-xs text-[#6B7280]">{r.asset_number ?? 'Not linked'}</span> },
    { key: 'quantity',     header: 'Available Qty', render: (r) => <span className="font-semibold">{r.quantity}</span> },
    { key: 'unit',         header: 'Unit',          render: (r) => r.unit },
    { key: 'status',       header: 'Status',        render: (r) => <Badge tone={r.status === 'OUT_OF_STOCK' ? 'red' : r.status === 'LOW_STOCK' ? 'yellow' : 'green'}>{inventoryStatusLabel(r.status)}</Badge> },
    {
      key: 'actions', header: 'Actions',
      render: (r) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <Button size="sm" variant="primary"   onClick={() => { setStockItem(r); setStockType('in');  setStockQty(1); setStockReason(''); setStockModalOpen(true) }}>+ Stock</Button>
          <Button size="sm" variant="secondary" onClick={() => { setStockItem(r); setStockType('out'); setStockQty(1); setStockReason(''); setStockModalOpen(true) }}>- Stock</Button>
          <Button size="sm" variant="ghost"     onClick={() => { setAdjustItem(r); setAdjustQty(r.quantity); setAdjustReason('') }}>Adjust</Button>
          <Button size="sm" variant="ghost"     onClick={() => void loadHistory(r)}>History</Button>
          <Button size="sm" variant="secondary" onClick={() => handleEdit(r)}>Edit</Button>
          {r.asset_number && <Button size="sm" variant="ghost" onClick={() => navigate(`/assets?search=${encodeURIComponent(r.asset_number ?? '')}`)}>Asset</Button>}
          <Button size="sm" variant="danger"    onClick={() => handleDelete(r)}>Delete</Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Back */}
      <button type="button" onClick={() => navigate('/inventory')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: '#065F46', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}><path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" /></svg>
        Back to Inventory
      </button>

      <PageHeader title="Semi-Expendable (SE)" subtitle="Manage consumable items and supplies that are used up during operations." actions={<Button onClick={handleCreate}>Add Item</Button>} />

      {message && <Alert tone={message.type} onClose={() => setMessage(null)}>{message.text}</Alert>}

      <Card noPadding>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #E5E7EB', padding: '12px 20px' }}>
          <SearchBar placeholder="Search item name, code, or unit..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void loadInventory(1) }} style={{ maxWidth: 'none', flex: 1 }} />
          <Dropdown value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} placeholder="All stock statuses" options={[{ label: 'In Stock', value: 'IN_STOCK' }, { label: 'Low Stock', value: 'LOW_STOCK' }, { label: 'Out of Stock', value: 'OUT_OF_STOCK' }]} />
          <Button variant="secondary" onClick={() => void loadInventory(1)}>Filter</Button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16"><Spinner /></div>
        ) : (
          <>
            <Table columns={columns} rows={rows} rowKey={(r) => r.id} empty={<div className="py-16"><EmptyState title="No SE items found" description="Add consumable supplies such as bond paper, toner, and pens." /></div>} />
            <div className="border-t border-[#E5E7EB] px-5 py-3">
              <Pagination page={page} lastPage={lastPage} total={total} onPageChange={(p) => void loadInventory(p)} />
            </div>
          </>
        )}
      </Card>

      {/* Add / Edit */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'Edit Item' : 'Add Item'}
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Add Item'}</Button></>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Input label="Item Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Bond Paper A4" />
          <Input label="Item Code" helperText="Use the existing stock keeping code if available." value={formData.sku || ''} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} placeholder="e.g. SKU-001" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Input label="Available Quantity" type="number" value={formData.quantity.toString()} disabled={Boolean(editingItem)} helperText={editingItem ? 'Use Adjust to update stock.' : undefined} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })} />
            <Input label="Unit" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} placeholder="e.g. reams, pcs" />
          </div>
          <Input label="Low Stock Alert" helperText="Show a warning when available quantity reaches this number." type="number" value={formData.reorder_level?.toString() || '0'} onChange={(e) => setFormData({ ...formData, reorder_level: parseInt(e.target.value) || 0 })} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
            <input type="checkbox" checked={Boolean(formData.track_as_asset)} disabled={Boolean(editingItem?.asset_id)} onChange={(e) => setFormData({ ...formData, track_as_asset: e.target.checked })} style={{ width: 16, height: 16, accentColor: '#0B3D91', cursor: 'pointer' }} />
            <span style={{ fontSize: 14, color: '#334155', lineHeight: 1.4 }}>Also show this item in Assets</span>
          </label>
        </div>
      </Modal>

      {/* Stock In / Out */}
      <Modal open={stockModalOpen} onClose={() => setStockModalOpen(false)} title={`${stockType === 'in' ? 'Add Stock' : 'Remove Stock'} - ${stockItem?.name}`}
        footer={<><Button variant="secondary" onClick={() => setStockModalOpen(false)}>Cancel</Button><Button onClick={handleStockSubmit} disabled={saving}>{saving ? 'Processing...' : stockType === 'in' ? 'Add Stock' : 'Remove Stock'}</Button></>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Input label="Quantity" type="number" min={1} value={stockQty.toString()} onChange={(e) => setStockQty(parseInt(e.target.value) || 1)} />
          <Input label="Reason" value={stockReason} onChange={(e) => setStockReason(e.target.value)} placeholder={stockType === 'in' ? 'New supplies received' : 'Office use'} />
        </div>
      </Modal>

      {/* Adjust Quantity */}
      <Modal open={adjustItem !== null} onClose={() => setAdjustItem(null)} title={`Correct Stock Quantity - ${adjustItem?.name}`}
        footer={<><Button variant="secondary" onClick={() => setAdjustItem(null)}>Cancel</Button><Button onClick={() => void handleAdjustSubmit()} disabled={saving}>{saving ? 'Saving...' : 'Save Correction'}</Button></>}
      >
        {adjustItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc', padding: '14px 16px' }}>
              <div><div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Current</div><div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{adjustItem.quantity}</div></div>
              <div><div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>New</div><div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{adjustQty}</div></div>
              <div><div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Difference</div><div style={{ fontSize: 16, fontWeight: 700, color: adjustQty - adjustItem.quantity < 0 ? '#C62828' : '#2E7D32' }}>{adjustQty - adjustItem.quantity > 0 ? '+' : ''}{adjustQty - adjustItem.quantity}</div></div>
            </div>
            <Input label="Corrected Quantity" type="number" min={0} value={adjustQty.toString()} onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)} />
            <Input label="Reason" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} placeholder="Damaged, lost, expired, physical count correction..." />
          </div>
        )}
      </Modal>

      {/* Stock History */}
      <Modal open={historyItem !== null} onClose={() => { setHistoryItem(null); setHistoryRows([]) }} title={`Stock Movement History - ${historyItem?.name}`}>
        {historyLoading ? <Spinner /> : historyRows.length === 0
          ? <EmptyState title="No stock movement history" description="Stock changes will appear here after quantities are added, removed, or corrected." />
          : (
            <div className="space-y-3">
              {historyRows.map((m) => (
                <div key={m.id} className="rounded-xl border border-[#E5E7EB] bg-white p-4 text-[14px]">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div><div className="font-semibold text-[#1F2937]">{movementTypeLabel(m.type)}</div><div className="text-[12px] text-[#9CA3AF]">{m.created_at ?? 'Date not available'}</div></div>
                    <div className={`font-mono font-semibold ${m.quantity < 0 ? 'text-[#D32F2F]' : 'text-[#2E7D32]'}`}>{m.quantity > 0 ? '+' : ''}{m.quantity}</div>
                  </div>
                  <dl className="mt-3 grid gap-2 text-[12px] text-[#6B7280] sm:grid-cols-2">
                    <div>Previous: <span className="font-medium text-[#1F2937]">{m.quantity_before}</span></div>
                    <div>New: <span className="font-medium text-[#1F2937]">{m.quantity_after}</span></div>
                    <div>Reason: <span className="font-medium text-[#1F2937]">{m.reason ?? 'Not provided'}</span></div>
                    <div>By: <span className="font-medium text-[#1F2937]">{m.performed_by ?? 'System'}</span></div>
                  </dl>
                </div>
              ))}
            </div>
          )
        }
      </Modal>
    </div>
  )
}
