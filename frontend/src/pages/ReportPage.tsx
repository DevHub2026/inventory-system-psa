import { useEffect, useState } from 'react'
import { Button, EmptyState, Spinner, Table, Alert, type Column } from '@/components/ui'
import {
  reportService,
  type AssetReportItem,
  type BorrowingReportItem,
  type OverdueReportItem,
  type InventoryReportItem,
  type LowStockReportItem,
  type UserActivityReportItem,
} from '@/services/reportService'
import { borrowingStatusLabel, inventoryStatusLabel } from '@/utils/displayLabels'
import { PageHeader } from '@/components/PageHeader'
import { Printer, FileSpreadsheet, FileCode } from 'lucide-react'

type ReportType = 'assets' | 'borrowings' | 'overdue' | 'low_stock' | 'inventory' | 'user_activity'

const TABS: { key: ReportType; label: string }[] = [
  { key: 'assets',        label: 'Assets' },
  { key: 'borrowings',    label: 'Borrowed Items' },
  { key: 'overdue',       label: 'Overdue Items' },
  { key: 'inventory',     label: 'Stock Inventory' },
  { key: 'low_stock',     label: 'Low Stock' },
  { key: 'user_activity', label: 'User Activity' },
]

export function ReportPage() {
  const [reportType, setReportType] = useState<ReportType>('assets')
  const [data, setData] = useState<unknown[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadReport = async () => {
    setLoading(true)
    setMessage(null)
    try {
      let result: unknown[] = []
      switch (reportType) {
        case 'assets':        result = await reportService.getAssets(); break
        case 'borrowings':    result = await reportService.getBorrowings(); break
        case 'overdue':       result = await reportService.getOverdue(); break
        case 'inventory':     result = await reportService.getInventory(); break
        case 'low_stock':     result = await reportService.getLowStock(); break
        case 'user_activity': result = await reportService.getUserActivity(); break
      }
      setData(result)
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to load report.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadReport()
  }, [reportType])

  const handleExport = async (format: 'excel' | 'csv') => {
    setExporting(true)
    setMessage(null)
    try {
      const blob = await reportService.exportReport(reportType, format)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${reportType}_report_${new Date().toISOString().slice(0, 10)}.${format === 'csv' ? 'csv' : 'xlsx'}`
      a.click()
      URL.revokeObjectURL(url)
      setMessage({ type: 'success', text: `Report exported as ${format.toUpperCase()} successfully.` })
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to export report.' })
    } finally {
      setExporting(false)
    }
  }

  const assetColumns: Column<AssetReportItem>[] = [
    { key: 'asset_number', header: 'Asset No.', render: (r) => <span className="font-mono text-xs text-[#6B7280]">{r.asset_number}</span> },
    { key: 'name', header: 'Name', render: (r) => <span className="font-medium text-[#1F2937]">{r.name}</span> },
    { key: 'category', header: 'Category', render: (r) => r.category },
    { key: 'status', header: 'Status', render: (r) => inventoryStatusLabel(r.status) },
    { key: 'location', header: 'Location', render: (r) => r.location },
  ]

  const borrowingColumns: Column<BorrowingReportItem>[] = [
    { key: 'asset_name', header: 'Asset', render: (r) => <span className="font-medium text-[#1F2937]">{r.asset_name}</span> },
    { key: 'borrower', header: 'Borrower', render: (r) => r.borrower },
    { key: 'borrow_date', header: 'Borrow Date', render: (r) => <span className="font-mono text-xs text-[#6B7280]">{r.borrow_date}</span> },
    { key: 'due_date', header: 'Due Date', render: (r) => <span className="font-mono text-xs text-[#6B7280]">{r.due_date}</span> },
    { key: 'status', header: 'Status', render: (r) => borrowingStatusLabel(r.status) },
  ]

  const overdueColumns: Column<OverdueReportItem>[] = [
    { key: 'asset_name', header: 'Asset', render: (r) => <span className="font-medium text-[#1F2937]">{r.asset_name}</span> },
    { key: 'borrower', header: 'Borrower', render: (r) => r.borrower },
    { key: 'due_date', header: 'Due Date', render: (r) => <span className="font-mono text-xs text-[#6B7280]">{r.due_date}</span> },
    { key: 'days_overdue', header: 'Days Overdue', render: (r) => <span className="font-semibold text-[#D32F2F]">{r.days_overdue} days</span> },
  ]

  const inventoryColumns: Column<InventoryReportItem>[] = [
    { key: 'sku', header: 'SKU / Code', render: (r) => <span className="font-mono text-xs text-[#6B7280]">{r.sku || '—'}</span> },
    { key: 'name', header: 'Item Name', render: (r) => <span className="font-medium text-[#1F2937]">{r.name}</span> },
    { key: 'quantity', header: 'Qty', render: (r) => <span className="font-bold text-slate-800">{r.quantity}</span> },
    { key: 'reorder_level', header: 'Reorder Alert', render: (r) => r.reorder_level },
  ]

  const lowStockColumns: Column<LowStockReportItem>[] = [
    { key: 'name', header: 'Item Name', render: (r) => <span className="font-medium text-[#1F2937]">{r.name}</span> },
    { key: 'quantity', header: 'Current Qty', render: (r) => <span className="font-bold text-red-600">{r.quantity}</span> },
    { key: 'reorder_level', header: 'Alert Level', render: (r) => r.reorder_level },
  ]

  const userActivityColumns: Column<UserActivityReportItem>[] = [
    { key: 'user', header: 'User Name', render: (r) => <span className="font-medium text-[#1F2937]">{r.user}</span> },
    { key: 'asset_name', header: 'Asset', render: (r) => r.asset_name },
    { key: 'action', header: 'Action', render: (r) => <span className="font-semibold text-[#0D47A1]">{r.action}</span> },
    { key: 'date', header: 'Date', render: (r) => <span className="font-mono text-xs text-[#6B7280]">{r.date}</span> },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader title="Reports & Exports" subtitle="Generate official reports and export data to Excel, CSV, or Printable PDF." />

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => void handleExport('excel')} disabled={exporting}>
            <FileSpreadsheet size={16} className="mr-1.5 text-emerald-600" /> Export Excel (.xlsx)
          </Button>
          <Button variant="secondary" size="sm" onClick={() => void handleExport('csv')} disabled={exporting}>
            <FileCode size={16} className="mr-1.5 text-blue-600" /> Export CSV (.csv)
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <Printer size={16} className="mr-1.5" /> Print / Save PDF
          </Button>
        </div>
      </div>

      {message && <Alert tone={message.type} onClose={() => setMessage(null)}>{message.text}</Alert>}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-slate-100 px-2 overflow-x-auto">
          {TABS.map((tab) => {
            const active = reportType === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setReportType(tab.key)}
                className={`relative px-4 py-3.5 text-xs font-semibold transition-all ${
                  active ? 'text-[#0D47A1]' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
                {active && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-t-sm bg-[#0D47A1]" />
                )}
              </button>
            )
          })}
        </div>

        {/* Content Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16"><Spinner label="Loading report data..." /></div>
        ) : data.length === 0 ? (
          <div className="py-16">
            <EmptyState title="No report records found" description="No matching records available for this report view." />
          </div>
        ) : reportType === 'assets' ? (
          <Table columns={assetColumns} rows={data as AssetReportItem[]} rowKey={(r) => r.id} />
        ) : reportType === 'borrowings' ? (
          <Table columns={borrowingColumns} rows={data as BorrowingReportItem[]} rowKey={(r) => r.id} />
        ) : reportType === 'overdue' ? (
          <Table columns={overdueColumns} rows={data as OverdueReportItem[]} rowKey={(r) => r.id} />
        ) : reportType === 'inventory' ? (
          <Table columns={inventoryColumns} rows={data as InventoryReportItem[]} rowKey={(r) => r.id} />
        ) : reportType === 'low_stock' ? (
          <Table columns={lowStockColumns} rows={data as LowStockReportItem[]} rowKey={(r) => r.id} />
        ) : (
          <Table columns={userActivityColumns} rows={data as UserActivityReportItem[]} rowKey={(r) => r.id} />
        )}
      </div>
    </div>
  )
}
