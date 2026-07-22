import { useEffect, useState } from 'react'
import { Button, Card, EmptyState, Spinner, Table, Alert, type Column } from '@/components/ui'
import { reportService, type AssetReportItem, type BorrowingReportItem, type OverdueReportItem } from '@/services/reportService'
import { borrowingStatusLabel, inventoryStatusLabel } from '@/utils/displayLabels'
import { PageHeader } from '@/components/PageHeader'

type ReportType = 'assets' | 'borrowings' | 'overdue'
type ReportData = AssetReportItem[] | BorrowingReportItem[] | OverdueReportItem[]

const TABS: { key: ReportType; label: string }[] = [
  { key: 'assets',     label: 'Assets' },
  { key: 'borrowings', label: 'Borrowed Items' },
  { key: 'overdue',    label: 'Overdue' },
]

export function ReportPage() {
  const [reportType, setReportType] = useState<ReportType>('assets')
  const [data,       setData]       = useState<ReportData>([])
  const [loading,    setLoading]    = useState(false)
  const [message,    setMessage]    = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadReport = async () => {
    setLoading(true); setMessage(null)
    try {
      let result: ReportData = []
      switch (reportType) {
        case 'assets':     result = await reportService.getAssets();    break
        case 'borrowings': result = await reportService.getBorrowings(); break
        case 'overdue':    result = await reportService.getOverdue();    break
      }
      setData(result)
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to load report.' })
    } finally { setLoading(false) }
  }

  useEffect(() => { void loadReport() }, [reportType])

  const assetColumns: Column<AssetReportItem>[] = [
    { key: 'asset_number', header: 'Asset No.',  render: (r) => <span className="font-mono text-xs text-[#6B7280]">{r.asset_number}</span> },
    { key: 'name',         header: 'Name',       render: (r) => <span className="font-medium text-[#1F2937]">{r.name}</span> },
    { key: 'category',     header: 'Category',   render: (r) => r.category },
    { key: 'status',       header: 'Status',     render: (r) => inventoryStatusLabel(r.status) },
    { key: 'location',     header: 'Location',   render: (r) => r.location },
  ]

  const borrowingColumns: Column<BorrowingReportItem>[] = [
    { key: 'asset_name',  header: 'Asset',       render: (r) => <span className="font-medium text-[#1F2937]">{r.asset_name}</span> },
    { key: 'borrower',    header: 'Borrower',    render: (r) => r.borrower },
    { key: 'borrow_date', header: 'Borrow Date', render: (r) => <span className="font-mono text-xs text-[#6B7280]">{r.borrow_date}</span> },
    { key: 'due_date',    header: 'Due Date',    render: (r) => <span className="font-mono text-xs text-[#6B7280]">{r.due_date}</span> },
    { key: 'status',      header: 'Status',      render: (r) => borrowingStatusLabel(r.status) },
  ]

  const overdueColumns: Column<OverdueReportItem>[] = [
    { key: 'asset_name',   header: 'Asset',        render: (r) => <span className="font-medium text-[#1F2937]">{r.asset_name}</span> },
    { key: 'borrower',     header: 'Borrower',     render: (r) => r.borrower },
    { key: 'due_date',     header: 'Due Date',     render: (r) => <span className="font-mono text-xs text-[#6B7280]">{r.due_date}</span> },
    { key: 'days_overdue', header: 'Days Overdue', render: (r) => <span className="font-semibold text-[#D32F2F]">{r.days_overdue}</span> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="View asset, borrowing, and overdue item reports." />

      {message && <Alert tone={message.type} onClose={() => setMessage(null)}>{message.text}</Alert>}

      <Card noPadding>
        {/* ── Tab bar ── */}
        <div className="flex items-center border-b border-[#E5E7EB]">
          {TABS.map((tab) => {
            const active = reportType === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setReportType(tab.key)}
                className={[
                  'relative px-5 py-3.5 text-[14px] font-semibold transition-colors duration-200',
                  active ? 'text-[#0D47A1]' : 'text-[#6B7280] hover:text-[#1F2937]',
                ].join(' ')}
              >
                {tab.label}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full bg-[#0D47A1]" />
                )}
              </button>
            )
          })}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="flex items-center justify-center py-16"><Spinner /></div>
        ) : data.length === 0 ? (
          <div className="py-16">
            <EmptyState title="No report data found" description="No matching records are available for this report yet." />
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
