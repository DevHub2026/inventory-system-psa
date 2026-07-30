import { useEffect, useState } from 'react'
import { EmptyState, Spinner, Table, Alert, type Column } from '@/components/ui'
import {
  reportService,
  type AssetReportItem,
  type BorrowingReportItem,
  type OverdueReportItem,
  type InventoryReportItem,
  type LowStockReportItem,
  type UserActivityReportItem,
  type ReissuanceReportItem,
} from '@/services/reportService'
import { borrowingStatusLabel, inventoryStatusLabel } from '@/utils/displayLabels'
import { Printer, FileSpreadsheet, FileCode } from 'lucide-react'

type ReportType = 'assets' | 'borrowings' | 'overdue' | 'low_stock' | 'inventory' | 'user_activity' | 'reissuances'

const TABS: { key: ReportType; label: string; description: string }[] = [
  { key: 'assets',        label: 'Assets',           description: 'All registered asset records' },
  { key: 'borrowings',    label: 'Borrowed Items',   description: 'Currently borrowed assets' },
  { key: 'overdue',       label: 'Overdue Items',    description: 'Assets past their due date' },
  { key: 'inventory',     label: 'Stock Inventory',  description: 'Current stock levels' },
  { key: 'low_stock',     label: 'Low Stock',        description: 'Items below reorder threshold' },
  { key: 'user_activity', label: 'User Activity',    description: 'User action history' },
  { key: 'reissuances',   label: 'Re-Issuances',     description: 'Asset transfer records' },
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
        case 'reissuances':   result = await reportService.getReissuances(); break
      }
      setData(result)
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to load report.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadReport() }, [reportType])

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
      setMessage({ type: 'success', text: `Report exported as ${format.toUpperCase()}.` })
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to export report.' })
    } finally {
      setExporting(false)
    }
  }

  // ── Column helpers ──
  const mono = (v: string) => (
    <span className="font-mono text-xs text-slate-600">{v}</span>
  )
  const bold = (v: string) => (
    <span className="font-semibold text-slate-900">{v}</span>
  )

  const assetColumns: Column<AssetReportItem>[] = [
    { key: 'asset_number', header: 'ASSET NO.',  render: (r) => mono(r.asset_number) },
    { key: 'name',         header: 'NAME',       render: (r) => bold(r.name) },
    { key: 'category',     header: 'CATEGORY',   render: (r) => <span className="text-sm text-slate-700">{r.category}</span> },
    { key: 'status',       header: 'STATUS',     render: (r) => inventoryStatusLabel(r.status) },
    { key: 'location',     header: 'LOCATION',   render: (r) => <span className="text-sm text-slate-700">{r.location}</span> },
  ]

  const borrowingColumns: Column<BorrowingReportItem>[] = [
    { key: 'asset_name',  header: 'ASSET',       render: (r) => bold(r.asset_name) },
    { key: 'borrower',    header: 'BORROWER',    render: (r) => <span className="text-sm text-slate-700">{r.borrower}</span> },
    { key: 'borrow_date', header: 'BORROW DATE', render: (r) => mono(r.borrow_date) },
    { key: 'due_date',    header: 'DUE DATE',    render: (r) => mono(r.due_date) },
    { key: 'status',      header: 'STATUS',      render: (r) => borrowingStatusLabel(r.status) },
  ]

  const overdueColumns: Column<OverdueReportItem>[] = [
    { key: 'asset_name',  header: 'ASSET',        render: (r) => bold(r.asset_name) },
    { key: 'borrower',    header: 'BORROWER',     render: (r) => <span className="text-sm text-slate-700">{r.borrower}</span> },
    { key: 'due_date',    header: 'DUE DATE',     render: (r) => mono(r.due_date) },
    {
      key: 'days_overdue',
      header: 'DAYS OVERDUE',
      render: (r) => (
        <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
          {r.days_overdue} days
        </span>
      ),
    },
  ]

  const inventoryColumns: Column<InventoryReportItem>[] = [
    { key: 'sku',           header: 'SKU / CODE',    render: (r) => mono(r.sku || '—') },
    { key: 'name',          header: 'ITEM NAME',     render: (r) => bold(r.name) },
    { key: 'quantity',      header: 'QTY',           render: (r) => <span className="font-bold text-slate-900">{r.quantity}</span> },
    { key: 'reorder_level', header: 'REORDER ALERT', render: (r) => <span className="text-sm text-slate-700">{r.reorder_level}</span> },
  ]

  const lowStockColumns: Column<LowStockReportItem>[] = [
    { key: 'name',          header: 'ITEM NAME',   render: (r) => bold(r.name) },
    {
      key: 'quantity',
      header: 'CURRENT QTY',
      render: (r) => (
        <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700">
          {r.quantity}
        </span>
      ),
    },
    { key: 'reorder_level', header: 'ALERT LEVEL', render: (r) => <span className="text-sm text-slate-700">{r.reorder_level}</span> },
  ]

  const userActivityColumns: Column<UserActivityReportItem>[] = [
    { key: 'user',       header: 'USER',   render: (r) => bold(r.user) },
    { key: 'asset_name', header: 'ASSET',  render: (r) => <span className="text-sm text-slate-700">{r.asset_name}</span> },
    { key: 'action',     header: 'ACTION', render: (r) => <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">{r.action}</span> },
    { key: 'date',       header: 'DATE',   render: (r) => mono(r.date) },
  ]

  const reissuanceColumns: Column<ReissuanceReportItem>[] = [
    { key: 'asset_number',      header: 'ASSET NO.',      render: (r) => mono(r.asset_number) },
    { key: 'asset_name',        header: 'ASSET NAME',     render: (r) => bold(r.asset_name) },
    { key: 'previous_employee', header: 'FROM',           render: (r) => <span className="text-sm text-slate-700">{r.previous_employee}</span> },
    { key: 'new_employee',      header: 'TO',             render: (r) => <span className="font-semibold text-blue-700">{r.new_employee}</span> },
    { key: 'transferred_by',    header: 'TRANSFERRED BY', render: (r) => <span className="text-sm text-slate-700">{r.transferred_by}</span> },
    { key: 'transfer_date',     header: 'DATE',           render: (r) => mono(r.transfer_date) },
    {
      key: 'reason',
      header: 'REASON',
      render: (r) => (
        <span className="block max-w-xs truncate text-xs text-slate-500">{r.reason || '—'}</span>
      ),
    },
  ]

  const currentColumns =
    reportType === 'assets'        ? assetColumns
    : reportType === 'borrowings'  ? borrowingColumns
    : reportType === 'overdue'     ? overdueColumns
    : reportType === 'inventory'   ? inventoryColumns
    : reportType === 'low_stock'   ? lowStockColumns
    : reportType === 'reissuances' ? reissuanceColumns
    : userActivityColumns

  const activeTab = TABS.find((t) => t.key === reportType)!

  return (
    <div className="space-y-5">

      {/* ── Page Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports &amp; Exports</h1>
          <p className="mt-1 text-sm text-slate-600">
            Generate official reports and export data to Excel, CSV, or PDF.
          </p>
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={exporting || data.length === 0}
            onClick={() => void handleExport('excel')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FileSpreadsheet size={14} />
            Excel
          </button>
          <button
            type="button"
            disabled={exporting || data.length === 0}
            onClick={() => void handleExport('csv')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FileCode size={14} />
            CSV
          </button>
          <button
            type="button"
            disabled={data.length === 0}
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Printer size={14} />
            Print / PDF
          </button>
        </div>
      </div>

      {/* ── Alert ── */}
      {message && (
        <Alert tone={message.type} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* ── Main Card ── */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 bg-white">
          <nav className="flex gap-1 px-1" aria-label="Report tabs">
            {TABS.map((tab) => {
              const active = reportType === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setReportType(tab.key)}
                  className={[
                    'relative whitespace-nowrap px-4 py-3 text-sm font-semibold transition-all',
                    active
                      ? 'text-blue-700'
                      : 'text-slate-500 hover:text-slate-700',
                  ].join(' ')}
                >
                  {tab.label}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t" />
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Info Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-2.5">
          <div>
            <p className="text-sm font-medium text-slate-700">{activeTab.label}</p>
            <p className="text-xs text-slate-500">{activeTab.description}</p>
          </div>
          {!loading && (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-100">
              {data.length} {data.length === 1 ? 'Record' : 'Records'}
            </span>
          )}
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <Spinner label="" />
            <p className="text-sm font-medium text-slate-500">Loading report data…</p>
          </div>
        ) : data.length === 0 ? (
          <div className="py-20">
            <EmptyState
              title="No records found"
              description="No data available for this report type."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table
              columns={currentColumns as any}
              rows={data as any[]}
              rowKey={(r: any) => r.id}
            />
          </div>
        )}
      </div>

    </div>
  )
}
