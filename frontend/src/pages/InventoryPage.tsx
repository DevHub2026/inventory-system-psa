import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, Card, EmptyState, Input, Modal, Spinner, Table, Alert, type Column } from '@/components/ui'
import { inventoryService, type CreateInventoryItemPayload, type UpdateInventoryItemPayload } from '@/services/inventoryService'
import type { InventoryItem } from '@/types'
import { inventoryStatusLabel } from '@/utils/displayLabels'

export function InventoryPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [stockModalOpen, setStockModalOpen] = useState(false)
  const [stockItem, setStockItem] = useState<InventoryItem | null>(null)
  const [stockQuantity, setStockQuantity] = useState(1)
  const [stockType, setStockType] = useState<'in' | 'out'>('in')

  const [formData, setFormData] = useState<CreateInventoryItemPayload>({
    name: '',
    sku: '',
    quantity: 0,
    unit: '',
    reorder_level: 0,
    track_as_asset: true,
  })

  const loadInventory = async () => {
    setLoading(true)
    try {
      const result = await inventoryService.list()
      setRows(result.items)
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to load inventory items.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const run = async () => {
      await loadInventory()
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
    setStockModalOpen(true)
  }

  const handleStockOut = (item: InventoryItem) => {
    setStockItem(item)
    setStockType('out')
    setStockQuantity(1)
    setStockModalOpen(true)
  }

  const handleStockSubmit = async () => {
    if (!stockItem) return

    setSaving(true)
    try {
      if (stockType === 'in') {
        await inventoryService.stockIn(stockItem.id, stockQuantity)
        setMessage({ type: 'success', text: 'Stock added successfully.' })
      } else {
        await inventoryService.stockOut(stockItem.id, stockQuantity)
        setMessage({ type: 'success', text: 'Stock removed successfully.' })
      }
      setStockModalOpen(false)
      await loadInventory()
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to update the item quantity.' })
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
        {loading ? (
          <Spinner />
        ) : (
          <Table
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            empty={<EmptyState title="No inventory items found" description="Add your first item to begin tracking stock." />}
          />
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
    </div>
  )
}
