import { useEffect, useState } from 'react'
import { Button, Card, EmptyState, Spinner, Table, Alert, type Column } from '@/components/ui'
import { reportService, type AssetReportItem, type BorrowingReportItem, type OverdueReportItem } from '@/services/reportService'

type ReportType = 'assets' | 'borrowings' | 'overdue'
type ReportData = AssetReportItem[] | BorrowingReportItem[] | OverdueReportItem[]

export function ReportPage() {
  const [reportType, setReportType] = useState<ReportType>('assets')
  const [data, setData] = useState<ReportData>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadReport = async () => {
    setLoading(true)
    setMessage(null)
    try {
      let result: ReportData = []
      switch (reportType) {
        case 'assets':
          result = await reportService.getAssets()
          break
        case 'borrowings':
          result = await reportService.getBorrowings()
          break
        case 'overdue':
          result = await reportService.getOverdue()
          break
      }
      setData(result)
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to load report.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadReport()
  }, [reportType])

  const assetColumns: Column<AssetReportItem>[] = [
    { key: 'asset_number', header: 'Asset Number', render: (row) => row.asset_number },
    { key: 'name', header: 'Name', render: (row) => row.name },
    { key: 'category', header: 'Category', render: (row) => row.category },
    { key: 'status', header: 'Status', render: (row) => row.status },
    { key: 'location', header: 'Location', render: (row) => row.location },
  ]

  const borrowingColumns: Column<BorrowingReportItem>[] = [
    { key: 'asset_name', header: 'Asset', render: (row) => row.asset_name },
    { key: 'borrower', header: 'Borrower', render: (row) => row.borrower },
    { key: 'borrow_date', header: 'Borrow Date', render: (row) => row.borrow_date },
    { key: 'due_date', header: 'Due Date', render: (row) => row.due_date },
    { key: 'status', header: 'Status', render: (row) => row.status },
  ]

  const overdueColumns: Column<OverdueReportItem>[] = [
    { key: 'asset_name', header: 'Asset', render: (row) => row.asset_name },
    { key: 'borrower', header: 'Borrower', render: (row) => row.borrower },
    { key: 'due_date', header: 'Due Date', render: (row) => row.due_date },
    { key: 'days_overdue', header: 'Days Overdue', render: (row) => row.days_overdue },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500">Analytics and reporting</p>
      </div>

      <div className="flex gap-2">
        <Button variant={reportType === 'assets' ? 'primary' : 'secondary'} onClick={() => setReportType('assets')}>
          Assets
        </Button>
        <Button variant={reportType === 'borrowings' ? 'primary' : 'secondary'} onClick={() => setReportType('borrowings')}>
          Borrowings
        </Button>
        <Button variant={reportType === 'overdue' ? 'primary' : 'secondary'} onClick={() => setReportType('overdue')}>
          Overdue
        </Button>
      </div>

      {message && (
        <Alert tone={message.type} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Card>
        {loading ? (
          <Spinner />
        ) : data.length === 0 ? (
          <EmptyState title="No data available" description="This report has no data to display." />
        ) : reportType === 'assets' ? (
          <Table columns={assetColumns} rows={data as AssetReportItem[]} rowKey={(row) => row.id} />
        ) : reportType === 'borrowings' ? (
          <Table columns={borrowingColumns} rows={data as BorrowingReportItem[]} rowKey={(row) => row.id} />
        ) : (
          <Table columns={overdueColumns} rows={data as OverdueReportItem[]} rowKey={(row) => row.id} />
        )}
      </Card>
    </div>
  )
}
