import { useEffect, useState } from 'react'
import { Button, Card, EmptyState, Spinner, Table, Alert, type Column } from '@/components/ui'
import { reportService, type AssetReportItem, type BorrowingReportItem, type OverdueReportItem } from '@/services/reportService'
import { borrowingStatusLabel, inventoryStatusLabel } from '@/utils/displayLabels'
import { PageHeader } from '@/components/PageHeader'

type ReportType = 'assets' | 'borrowings' | 'overdue'
type ReportData = AssetReportItem[] | BorrowingReportItem[] | OverdueReportItem[]

const TABS: { key: ReportType; label: string }[] = [
  { key: 'assets', label: 'Assets' },
  { key: 'borrowings', label: 'Borrowed Items' },
  { key: 'overdue', label: 'Overdue' },
]

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
        case 'assets':    result = await reportService.getAssets();    break
        case 'borrowings': result = await reportService.getBorrowings(); break
        case 'overdue':   result = await reportService.getOverdue();   break
      }
      setData(result)
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to load report.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadReport() }, [reportType])

  const assetColumns: Column<AssetReportItem>[] = [
    { key: 'asset_number', header: 'Asset Number', render: (row) => <span className="font-mono text-xs text-slate-600">{row.asset_number}</span> },
    { key: 'name',         header: 'Name',         render: (row) => <span className="font-medium text-slate-800">{row.name}</span> },
    { key: 'category',     header: 'Category',     render: (row) => row.category },
    { key: 'status',       header: 'Status',       render: (row) => inventoryStatusLabel(row.status) },
    { key: 'location',     header: 'Location',     render: (row) => row.location },
  ]

  const borrowingColumns: Column<BorrowingReportItem>[] = [
    { key: 'asset_name',  header: 'Asset',       render: (row) => <span className="font-medium text-slate-800">{row.asset_name}</span> },
    { key: 'borrower',    header: 'Borrower',    render: (row) => row.borrower },
    { key: 'borrow_date', header: 'Borrow Date', render: (row) => <span className="font-mono text-xs text-slate-600">{row.borrow_date}</span> },
    { key: 'due_date',    header: 'Due Date',    render: (row) => <span className="font-mono text-xs text-slate-600">{row.due_date}</span> },
    { key: 'status',      header: 'Status',      render: (row) => borrowingStatusLabel(row.status) },
  ]

  const overdueColumns: Column<OverdueReportItem>[] = [
    { key: 'asset_name',  header: 'Asset',       render: (row) => <span className="font-medium text-slate-800">{row.asset_name}</span> },
    { key: 'borrower',    header: 'Borrower',    render: (row) => row.borrower },
    { key: 'due_date',    header: 'Due Date',    render: (row) => <span className="font-mono text-xs text-slate-600">{row.due_date}</span> },
    { key: 'days_overdue', header: 'Days Overdue', render: (row) => (
      <span className="font-semibold text-[#E31C23]">{row.days_overdue}</span>
    )},
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        subtitle="View asset, borrowing, and overdue item reports."
      />

      {message && (
        <Alert tone={message.type} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Card noPadding>
        {/* Tab bar */}
        <div className="flex items-center gap-0 border-b border-[#EEF2F8]">
          {TABS.map((tab) => {
            const active = reportType === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setReportType(tab.key)}
                className={[
                  'relative px-5 py-3 text-sm font-semibold transition-colors',
                  active
                    ? 'text-[#003DA5]'
                    : 'text-slate-500 hover:text-slate-800',
                ].join(' ')}
              >
                {tab.label}
                {/* active underline */}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-[#003DA5]" />
                )}
              </button>
            )
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-14">
            <Spinner />
          </div>
        ) : data.length === 0 ? (
          <div className="py-14">
            <EmptyState
              title="No report data found"
              description="No matching records are available for this report yet."
            />
          </div>
        ) : reportType === 'assets' ? (
          <Table columns={assetColumns}    rows={data as AssetReportItem[]}    rowKey={(r) => r.id} />
        ) : reportType === 'borrowings' ? (
          <Table columns={borrowingColumns} rows={data as BorrowingReportItem[]} rowKey={(r) => r.id} />
        ) : (
          <Table columns={overdueColumns}  rows={data as OverdueReportItem[]}  rowKey={(r) => r.id} />
        )}
      </Card>
    </div>
  )
}
