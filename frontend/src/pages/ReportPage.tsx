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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="Reports" subtitle="View asset, borrowing, and overdue item reports." />

      {message && <Alert tone={message.type} onClose={() => setMessage(null)}>{message.text}</Alert>}

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

        {/* ── Tab bar ── */}
        <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', padding: '0 4px' }}>
          {TABS.map((tab) => {
            const active = reportType === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setReportType(tab.key)}
                style={{
                  position: 'relative',
                  padding: '14px 20px',
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  color: active ? '#0B3D91' : '#64748b',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'color 0.15s',
                  whiteSpace: 'nowrap',
                  lineHeight: 1,
                  outline: 'none',
                }}
                onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = '#1e293b' }}
                onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = '#64748b' }}
              >
                {tab.label}
                {active && (
                  <span style={{
                    position: 'absolute',
                    bottom: 0, left: 8, right: 8,
                    height: 2,
                    borderRadius: '2px 2px 0 0',
                    background: '#0B3D91',
                    display: 'block',
                  }} />
                )}
              </button>
            )
          })}

          {/* Export button pushed to the right */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', paddingRight: 12 }}>
            <Button size="sm" variant="secondary" onClick={() => window.print()}>
              Export / Print
            </Button>
          </div>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="flex items-center justify-center py-16"><Spinner /></div>
        ) : data.length === 0 ? (
          <div className="py-16">
            <EmptyState title="No report data found" description="No matching records are available for this report yet." />
          </div>
        ) : reportType === 'assets' ? (
          <Table columns={assetColumns}     rows={data as AssetReportItem[]}    rowKey={(r) => r.id} />
        ) : reportType === 'borrowings' ? (
          <Table columns={borrowingColumns} rows={data as BorrowingReportItem[]} rowKey={(r) => r.id} />
        ) : (
          <Table columns={overdueColumns}   rows={data as OverdueReportItem[]}  rowKey={(r) => r.id} />
        )}
      </div>
    </div>
  )
}
