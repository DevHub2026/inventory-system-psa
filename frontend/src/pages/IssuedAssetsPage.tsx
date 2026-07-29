import { useEffect, useState } from 'react'
import { Badge, Card, EmptyState, Input, Spinner, Table, type Column } from '@/components/ui'
import { borrowingService } from '@/services/borrowingService'
import type { Borrowing } from '@/types'
import { borrowingStatusTone } from '@/utils/statusTone'
import { borrowingStatusLabel } from '@/utils/displayLabels'
import { PageHeader } from '@/components/PageHeader'
import { affectsScope, onDataChanged } from '@/utils/dataRefresh'
import { formatDate, formatTime } from '@/utils/dateFormat'

export function IssuedAssetsPage() {
  const [rows, setRows] = useState<Borrowing[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredRows, setFilteredRows] = useState<Borrowing[]>([])

  const loadIssuedAssets = async () => {
    setLoading(true)
    try {
      const result = await borrowingService.list({ per_page: 100 })
      // Filter for currently issued items (not returned)
      const issuedAssets = result.items.filter(
        (b) => b.status === 'BORROWED' || b.status === 'ACTIVE' || b.status === 'OVERDUE'
      )
      setRows(issuedAssets)
      setFilteredRows(issuedAssets)
    } catch (e: unknown) {
      console.error('Unable to load issued assets:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadIssuedAssets()
  }, [])

  useEffect(() => {
    onDataChanged((scope) => {
      if (affectsScope(scope, 'borrowings')) {
        void loadIssuedAssets()
      }
    })
  }, [])

  // Search/filter functionality
  useEffect(() => {
    if (!searchTerm) {
      setFilteredRows(rows)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = rows.filter(
      (row) =>
        row.employee_name?.toLowerCase().includes(term) ||
        row.employee_id?.toLowerCase().includes(term) ||
        row.asset_name?.toLowerCase().includes(term) ||
        row.asset_number?.toLowerCase().includes(term) ||
        row.asset_code?.toLowerCase().includes(term)
    )
    setFilteredRows(filtered)
  }, [searchTerm, rows])

  const columns: Column<Borrowing>[] = [
    { key: 'employee_name', header: 'Employee Name', render: (r) => r.employee_name },
    { key: 'employee_id', header: 'Employee ID', render: (r) => r.employee_id ?? 'N/A' },
    { key: 'asset_name', header: 'Asset Name', render: (r) => r.asset_name },
    { key: 'asset_code', header: 'Asset Code', render: (r) => r.asset_code ?? r.asset_number ?? 'N/A' },
    { key: 'borrowed_at', header: 'Borrow Date', render: (r) => r.borrowed_at ? formatDate(r.borrowed_at) : 'N/A' },
    { key: 'borrowed_time', header: 'Borrow Time', render: (r) => r.borrowed_at ? formatTime(r.borrowed_at) : 'N/A' },
    { key: 'due_date', header: 'Due Date', render: (r) => r.due_date ? formatDate(r.due_date) : 'N/A' },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <Badge tone={borrowingStatusTone(r.status)}>{borrowingStatusLabel(r.status)}</Badge>,
    },
    { key: 'authorized_by_name', header: 'Issued By', render: (r) => r.authorized_by_name ?? 'N/A' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title=" employee / Issued Assets" subtitle="View all assets currently issued to employees." />

      <Card>
        <div className="p-4">
          <Input
            placeholder="Search by employee name, ID, asset name, or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      <Card noPadding>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <Table
            columns={columns}
            rows={filteredRows}
            rowKey={(r) => r.id}
            empty={
              <div className="py-16">
                <EmptyState
                  title="No issued assets found"
                  description="Currently issued assets will appear here."
                />
              </div>
            }
          />
        )}
      </Card>
    </div>
  )
}
