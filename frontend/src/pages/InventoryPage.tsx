import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Badge, Button, Card, Dropdown, EmptyState, Input, Modal, Pagination, SearchBar, Spinner, Table, type Column } from '@/components/ui'
import { inventoryService, type CreateInventoryItemPayload, type UpdateInventoryItemPayload } from '@/services/inventoryService'
import type { InventoryItem, StockMovement } from '@/types'
import { inventoryStatusLabel } from '@/utils/displayLabels'

function movementTypeLabel(type: string) {
  const labels: Record<string, string> = {
    stock_in: 'Stock Added',
    stock_out: 'Stock Removed',
    adjustment: 'Quantity Corrected',
  }

  return labels[type] ?? type
}

export function InventoryPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [stockModalOpen, setStockModalOpen] = useState(false)
  const [stockItem, setStockItem] = useState<InventoryItem | null>(null)
  const [stockQuantity, setStockQuantity] = useState(1)
  const [stockReason, setStockReason] = useState('')
  const [stockType, setStockType] = useState<'in' | 'out'>('in')
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null)
  const [adjustQuantity, setAdjustQuantity] = useState(0)
  const [adjustReason, setAdjustReason] = useState('')
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null)
  const [historyRows, setHistoryRows] = useState<StockMovement[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const [formData, setFormData] = useState<CreateInventoryItemPayload>({
    name: '',
    sku: '',
    quantity: 0,
    unit: '',
    reorder_level: 0,
    track_as_asset: true,
  })

  const loadInventory = async (nextPage = page) => {
    setLoading(true)
    try {
      const result = await inventoryService.list({
        page: nextPage,
        per_page: 10,
        search: search || undefined,
        status: statusFilter || undefined,
      })
      setRows(result.items)
      setPage(result.meta.current_page)
      setLastPage(result.meta.last_page)
      setTotal(result.meta.total)
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to load inventory items.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const run = async () => {
      await loadInventory(1)
    }

    void run()
  }, [])

  const handleCreate = () => {
    setEditingItem(null)
    setFormData({
      name: '',
      sku: '',
      quantity: 0,
      unit: '',
      reorder_level: 0,
      track_as_asset: true,
    })
    setModalOpen(true)
  }

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      sku: (item as unknown as { sku?: string }).sku ?? '',
      quantity: item.quantity,
      unit: item.unit,
      reorder_level: item.reorder_level || 0,
      track_as_asset: Boolean(item.asset_id),
    })
    setModalOpen(true)
  }

  const handleDelete = async (item: InventoryItem) => {
    if (!confirm(`Are you sure you want to delete ${item.name}?`)) return

    try {
      await inventoryService.delete(item.id)
      setMessage({ type: 'success', text: 'Item deleted successfully.' })
      await loadInventory()
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to delete item.' })
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    setMessage(null)

    try {
      if (editingItem) {
        await inventoryService.update(editingItem.id, formData as UpdateInventoryItemPayload)
        setMessage({ type: 'success', text: 'Item updated successfully.' })
      } else {
        await inventoryService.create(formData)
        setMessage({ type: 'success', text: 'Item created successfully.' })
      }
      setModalOpen(false)
      await loadInventory()
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to save item.' })
    } finally {
      setSaving(false)
    }
  }

  const handleStockIn = (item: InventoryItem) => {
    setStockItem(item)
    setStockType('in')
    setStockQuantity(1)
    setStockReason('')
    setStockModalOpen(true)
  }

  const handleStockOut = (item: InventoryItem) => {
    setStockItem(item)
    setStockType('out')
    setStockQuantity(1)
    setStockReason('')
    setStockModalOpen(true)
  }

  const handleAdjust = (item: InventoryItem) => {
    setAdjustItem(item)
    setAdjustQuantity(item.quantity)
    setAdjustReason('')
  }

  const loadHistory = async (item: InventoryItem) => {
    setHistoryItem(item)
    setHistoryLoading(true)
    try {
      const result = await inventoryService.history(item.id)
      setHistoryRows(result.items)
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to load stock movement history.' })
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleStockSubmit = async () => {
    if (!stockItem) return

    setSaving(true)
    try {
      if (stockType === 'in') {
        await inventoryService.stockIn(stockItem.id, { quantity: stockQuantity, reason: stockReason || undefined })
        setMessage({ type: 'success', text: 'Stock added successfully.' })
      } else {
        await inventoryService.stockOut(stockItem.id, { quantity: stockQuantity, reason: stockReason || undefined })
        setMessage({ type: 'success', text: 'Stock removed successfully.' })
      }
      setStockModalOpen(false)
      await loadInventory(page)
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to update the item quantity.' })
    } finally {
      setSaving(false)
    }
  }

  const handleAdjustSubmit = async () => {
    if (!adjustItem) return

    if (!adjustReason.trim()) {
      setMessage({ type: 'error', text: 'Please provide a reason for correcting the quantity.' })
      return
    }

    setSaving(true)
    try {
      await inventoryService.adjust(adjustItem.id, {
        quantity: adjustQuantity,
        reason: adjustReason.trim(),
      })
      setAdjustItem(null)
      setMessage({ type: 'success', text: 'Stock quantity corrected successfully.' })
      await loadInventory(page)
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to correct stock quantity.' })
    } finally {
      setSaving(false)
    }
  }

  const columns: Column<InventoryItem>[] = [
    { key: 'name', header: 'Item', render: (row) => row.name },
    { key: 'asset_number', header: 'Asset Number', render: (row) => row.asset_number ?? 'Not linked' },
    { key: 'quantity', header: 'Available Quantity', render: (row) => row.quantity },
    { key: 'unit', header: 'Unit', render: (row) => row.unit },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge
          tone={
            row.status === 'OUT_OF_STOCK' ? 'red' : row.status === 'LOW_STOCK' ? 'yellow' : 'green'
          }
        >
          {inventoryStatusLabel(row.status)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="success" onClick={() => handleStockIn(row)}>
            Add Stock
          </Button>
          <Button size="sm" variant="secondary" onClick={() => handleStockOut(row)}>
            Remove Stock
          </Button>
          <Button size="sm" variant="secondary" onClick={() => handleAdjust(row)}>
            Correct Quantity
          </Button>
          <Button size="sm" variant="ghost" onClick={() => void loadHistory(row)}>
            History
          </Button>
          <Button size="sm" variant="secondary" onClick={() => handleEdit(row)}>
            Edit
          </Button>
          {row.asset_number && (
            <Button size="sm" variant="ghost" onClick={() => navigate(`/assets?search=${encodeURIComponent(row.asset_number ?? '')}`)}>
              View Asset
            </Button>
          )}
          <Button size="sm" variant="danger" onClick={() => handleDelete(row)}>
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500">Manage consumable items and available quantities.</p>
        </div>
        <Button onClick={handleCreate}>Add Item</Button>
      </div>

      {message && (
        <Alert tone={message.type} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Card>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <SearchBar
            placeholder="Search item name, code, or unit..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void loadInventory(1)
            }}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Dropdown
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              placeholder="All stock statuses"
              options={[
                { label: 'In Stock', value: 'IN_STOCK' },
                { label: 'Low Stock', value: 'LOW_STOCK' },
                { label: 'Out of Stock', value: 'OUT_OF_STOCK' },
              ]}
            />
            <Button variant="secondary" onClick={() => void loadInventory(1)}>
              Apply Filters
            </Button>
          </div>
        </div>
        {loading ? (
          <Spinner />
        ) : (
          <>
            <Table
              columns={columns}
              rows={rows}
              rowKey={(row) => row.id}
              empty={<EmptyState title="No inventory items found" description="Add your first item to begin tracking stock." />}
            />
            <Pagination page={page} lastPage={lastPage} total={total} onPageChange={(nextPage) => void loadInventory(nextPage)} />
          </>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Item' : 'Add Item'}
      >
        <div className="space-y-4">
          <Input
            label="Item Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Item Code"
            helperText="Use the existing item code or stock keeping code if available."
            value={formData.sku || ''}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label="Available Quantity"
              type="number"
              value={formData.quantity.toString()}
              disabled={Boolean(editingItem)}
              helperText={editingItem ? 'Use Correct Quantity to update stock and record a reason.' : undefined}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
            />
            <Input
              label="Unit"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            />
          </div>
          <Input
            label="Low Stock Alert"
            helperText="Show a warning when the available quantity reaches this number."
            type="number"
            value={formData.reorder_level?.toString() || '0'}
            onChange={(e) => setFormData({ ...formData, reorder_level: parseInt(e.target.value) || 0 })}
          />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={Boolean(formData.track_as_asset)}
              onChange={(e) => setFormData({ ...formData, track_as_asset: e.target.checked })}
              disabled={Boolean(editingItem?.asset_id)}
              className="h-4 w-4 accent-brand-600"
            />
            Also show this item in Assets
          </label>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Add Item'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        title={`${stockType === 'in' ? 'Add Stock' : 'Remove Stock'} - ${stockItem?.name}`}
      >
        <div className="space-y-4">
          <Input
            label="Quantity"
            type="number"
            value={stockQuantity.toString()}
            onChange={(e) => setStockQuantity(parseInt(e.target.value) || 1)}
            min={1}
          />
          <Input
            label="Reason"
            value={stockReason}
            onChange={(e) => setStockReason(e.target.value)}
            placeholder={stockType === 'in' ? 'New supplies received' : 'Office use'}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setStockModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStockSubmit} disabled={saving}>
              {saving ? 'Processing...' : stockType === 'in' ? 'Add Stock' : 'Remove Stock'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={adjustItem !== null}
        onClose={() => setAdjustItem(null)}
        title={`Correct Stock Quantity - ${adjustItem?.name}`}
      >
        {adjustItem && (
          <div className="space-y-4">
            <div className="grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm md:grid-cols-3">
              <div>
                <div className="text-gray-500">Current Quantity</div>
                <div className="font-semibold text-gray-900">{adjustItem.quantity}</div>
              </div>
              <div>
                <div className="text-gray-500">New Quantity</div>
                <div className="font-semibold text-gray-900">{adjustQuantity}</div>
              </div>
              <div>
                <div className="text-gray-500">Difference</div>
                <div className={adjustQuantity - adjustItem.quantity < 0 ? 'font-semibold text-red-700' : 'font-semibold text-green-700'}>
                  {adjustQuantity - adjustItem.quantity > 0 ? '+' : ''}
                  {adjustQuantity - adjustItem.quantity}
                </div>
              </div>
            </div>
            <Input
              label="Corrected Quantity"
              type="number"
              min={0}
              value={adjustQuantity.toString()}
              onChange={(event) => setAdjustQuantity(parseInt(event.target.value) || 0)}
            />
            <Input
              label="Reason"
              value={adjustReason}
              onChange={(event) => setAdjustReason(event.target.value)}
              placeholder="Damaged, lost, expired, physical count correction, or data entry error"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setAdjustItem(null)}>
                Cancel
              </Button>
              <Button onClick={() => void handleAdjustSubmit()} disabled={saving}>
                {saving ? 'Saving...' : 'Save Correction'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={historyItem !== null}
        onClose={() => {
          setHistoryItem(null)
          setHistoryRows([])
        }}
        title={`Stock Movement History - ${historyItem?.name}`}
      >
        {historyLoading ? (
          <Spinner />
        ) : historyRows.length === 0 ? (
          <EmptyState title="No stock movement history" description="Stock changes will appear here after quantities are added, removed, or corrected." />
        ) : (
          <div className="space-y-3">
            {historyRows.map((movement) => (
              <div key={movement.id} className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-gray-900">{movementTypeLabel(movement.type)}</div>
                    <div className="text-xs text-gray-500">{movement.created_at ?? 'Date not available'}</div>
                  </div>
                  <div className={movement.quantity < 0 ? 'font-mono font-semibold text-red-700' : 'font-mono font-semibold text-green-700'}>
                    {movement.quantity > 0 ? '+' : ''}
                    {movement.quantity}
                  </div>
                </div>
                <dl className="mt-3 grid gap-2 text-xs text-gray-600 sm:grid-cols-2">
                  <div>Previous Quantity: <span className="font-medium text-gray-900">{movement.quantity_before}</span></div>
                  <div>New Quantity: <span className="font-medium text-gray-900">{movement.quantity_after}</span></div>
                  <div>Reason: <span className="font-medium text-gray-900">{movement.reason ?? 'Not provided'}</span></div>
                  <div>Performed by: <span className="font-medium text-gray-900">{movement.performed_by ?? 'System'}</span></div>
                </dl>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
