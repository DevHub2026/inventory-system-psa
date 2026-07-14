import { useEffect, useState } from 'react'
import { Badge, Card, EmptyState, Spinner, Table, type Column } from '@/components/ui'
import { inventoryService } from '@/services/inventoryService'
import type { InventoryItem } from '@/types'

export function InventoryPage() {
  const [rows, setRows] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void inventoryService
      .list()
      .then((result) => setRows(result.items))
      .finally(() => setLoading(false))
  }, [])

  const columns: Column<InventoryItem>[] = [
    { key: 'name', header: 'Item', render: (row) => row.name },
    { key: 'quantity', header: 'Qty', render: (row) => row.quantity },
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
          {row.status}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Inventory</h1>
        <p className="text-sm text-gray-500">Mock consumable stock until Inventory API is ready.</p>
      </div>
      <Card>
        {loading ? (
          <Spinner />
        ) : (
          <Table
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            empty={<EmptyState title="No inventory records" />}
          />
        )}
      </Card>
    </div>
  )
}
