import { useCallback, useEffect, useState } from 'react'
import { EmptyState, Spinner, Table, Alert, Card, type Column } from '@/components/ui'
import {
  reportService,
  type AssetReportItem,
  type BorrowingReportItem,
  type OverdueReportItem,
  type InventoryReportItem,
  type LowStockReportItem,
  type UserActivityReportItem,
  type ReissuanceReportItem,
  type ReservationReportItem,
  type AssetHistoryReportItem,
} from '@/services/reportService'
import { borrowingStatusLabel, inventoryStatusLabel } from '@/utils/displayLabels'
import { Printer, FileSpreadsheet, FileCode } from 'lucide-react'

type ReportType = 'assets' | 'borrowings' | 'overdue' | 'low_stock' | 'inventory' | 'user_activity' | 'reissuances' | 'reservations' | 'asset_history'
type ReportRow =
  | AssetReportItem
  | BorrowingReportItem
  | OverdueReportItem
  | InventoryReportItem
  | LowStockReportItem
  | UserActivityReportItem
  | ReissuanceReportItem
  | ReservationReportItem

const TABS: { key: ReportType; label: string; description: string }[] = [
  { key: 'assets',        label: 'Assets',           description: 'All registered asset records' },
  { key: 'borrowings',    label: 'Borrowed Items',   description: 'Currently borrowed assets' },
  { key: 'overdue',       label: 'Overdue Items',    description: 'Assets past their due date' },
  { key: 'reservations',   label: 'Reservations',     description: 'Borrow request reservation history' },
  { key: 'inventory',     label: 'Stock Inventory',  description: 'Current stock levels' },
  { key: 'low_stock',     label: 'Low Stock',        description: 'Items below reorder threshold' },
  { key: 'user_activity', label: 'User Activity',    description: 'User action history' },
  { key: 'reissuances',   label: 'Re-Issuances',     description: 'Asset transfer records' },
  { key: 'asset_history', label: 'Asset History',    description: 'Chronological lifecycle and accountability events' },
]

export function ReportPage() {
  const [reportType, setReportType] = useState<ReportType>('assets')
  const [data, setData] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Asset History pagination & meta
  const [currentPage, setCurrentPage] = useState(1)
  const perPage = 15
  const [assetHistoryMeta, setAssetHistoryMeta] = useState<{ current_page: number; per_page: number; total: number; last_page: number } | null>(null)

  const loadReport = useCallback(async () => {
    setLoading(true)
    setMessage(null)
    try {
      let result: ReportRow[] = []
      switch (reportType) {
        case 'assets':        result = await reportService.getAssets(); break
        case 'borrowings':    result = await reportService.getBorrowings(); break
        case 'overdue':       result = await reportService.getOverdue(); break
        case 'reservations':  result = await reportService.getReservations(); break
        case 'inventory':     result = await reportService.getInventory(); break
        case 'low_stock':     result = await reportService.getLowStock(); break
        case 'user_activity': result = await reportService.getUserActivity(); break
        case 'reissuances':   result = await reportService.getReissuances(); break
        case 'asset_history': {
          const resp = await reportService.getAssetHistory({ page: currentPage, per_page: perPage })
          result = (resp.items ?? []) as unknown as ReportRow[]
          setAssetHistoryMeta(resp.meta ?? null)
          break
        }
      }
      setData(result)
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to load report.' })
    } finally {
      setLoading(false)
    }
  }, [reportType, currentPage, perPage])

  useEffect(() => { void loadReport() }, [loadReport])

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
    <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#475569' }}>{v}</span>
  )
  const bold = (v: string) => (
    <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span>
  )

  const assetColumns: Column<AssetReportItem>[] = [
    { key: 'property_number', header: 'Property Number', render: (r) => <span className="font-mono text-xs text-[#6B7280]">{r.property_number ?? '—'}</span> },
    { key: 'asset_number', header: 'Asset Number', render: (r) => <span className="font-mono text-xs text-[#6B7280]">{r.asset_number}</span> },
    { key: 'name', header: 'Name', render: (r) => <span className="font-medium text-[#1F2937]">{r.name}</span> },
    { key: 'category', header: 'Category', render: (r) => r.category },
    { key: 'status', header: 'Status', render: (r) => inventoryStatusLabel(r.status) },
    { key: 'accountability', header: 'Accountability', render: (r) => r.accountability ?? 'Unassigned' },
    { key: 'location', header: 'Location', render: (r) => r.location },
  ]

  const borrowingColumns: Column<BorrowingReportItem>[] = [
    { key: 'asset_name',  header: 'ASSET',       render: (r) => bold(r.asset_name) },
    { key: 'borrower',    header: 'BORROWER',    render: (r) => <span style={{ fontSize: 13, color: '#475569' }}>{r.borrower}</span> },
    { key: 'borrow_date', header: 'BORROW DATE', render: (r) => mono(r.borrow_date) },
    { key: 'due_date',    header: 'DUE DATE',    render: (r) => mono(r.due_date) },
    { key: 'status',      header: 'STATUS',      render: (r) => borrowingStatusLabel(r.status) },
  ]

  const overdueColumns: Column<OverdueReportItem>[] = [
    { key: 'asset_name',  header: 'ASSET',        render: (r) => bold(r.asset_name) },
    { key: 'borrower',    header: 'BORROWER',     render: (r) => <span style={{ fontSize: 13, color: '#475569' }}>{r.borrower}</span> },
    { key: 'due_date',    header: 'DUE DATE',     render: (r) => mono(r.due_date) },
    {
      key: 'days_overdue',
      header: 'DAYS OVERDUE',
      render: (r) => (
        <span style={{
          display: 'inline-flex', alignItems: 'center',
          borderRadius: 20, background: '#FEF2F2',
          padding: '4px 12px', fontSize: 12, fontWeight: 600, color: '#DC2626',
        }}>
          {r.days_overdue} days
        </span>
      ),
    },
  ]

  const inventoryColumns: Column<InventoryReportItem>[] = [
    { key: 'sku',           header: 'SKU / CODE',    render: (r) => mono(r.sku || '—') },
    { key: 'name',          header: 'ITEM NAME',     render: (r) => bold(r.name) },
    { key: 'quantity',      header: 'QTY',           render: (r) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{r.quantity}</span> },
    { key: 'reorder_level', header: 'REORDER ALERT', render: (r) => <span style={{ fontSize: 13, color: '#475569' }}>{r.reorder_level}</span> },
  ]

  const lowStockColumns: Column<LowStockReportItem>[] = [
    { key: 'name',          header: 'ITEM NAME',   render: (r) => bold(r.name) },
    {
      key: 'quantity',
      header: 'CURRENT QTY',
      render: (r) => (
        <span style={{
          display: 'inline-flex', alignItems: 'center',
          borderRadius: 20, background: '#FEF2F2',
          padding: '4px 12px', fontSize: 12, fontWeight: 600, color: '#DC2626',
        }}>
          {r.quantity}
        </span>
      ),
    },
    { key: 'reorder_level', header: 'ALERT LEVEL', render: (r) => <span style={{ fontSize: 13, color: '#475569' }}>{r.reorder_level}</span> },
  ]

  const userActivityColumns: Column<UserActivityReportItem>[] = [
    { key: 'user',       header: 'USER',   render: (r) => bold(r.user) },
    { key: 'asset_name', header: 'ASSET',  render: (r) => <span style={{ fontSize: 13, color: '#475569' }}>{r.asset_name}</span> },
    { key: 'action',     header: 'ACTION', render: (r) => <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 6, background: '#EFF6FF', padding: '4px 10px', fontSize: 12, fontWeight: 600, color: '#003DA5' }}>{r.action}</span> },
    { key: 'date',       header: 'DATE',   render: (r) => mono(r.date) },
  ]

  const reservationColumns: Column<ReservationReportItem>[] = [
    { key: 'user',        header: 'REQUESTER', render: (r) => bold(r.user) },
    { key: 'status',      header: 'STATUS',    render: (r) => <span style={{ fontSize: 13, color: '#475569' }}>{r.status}</span> },
    { key: 'start_date',  header: 'START',     render: (r) => mono(r.start_date) },
    { key: 'end_date',    header: 'END',       render: (r) => mono(r.end_date) },
    { key: 'asset_count', header: 'ASSETS',    render: (r) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{r.asset_count}</span> },
    {
      key: 'remarks',
      header: 'REMARKS',
      render: (r) => (
        <span style={{ display: 'block', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: '#64748B' }}>{r.remarks || '—'}</span>
      ),
    },
  ]

  const reissuanceColumns: Column<ReissuanceReportItem>[] = [
    { key: 'asset_number',      header: 'ASSET NO.',      render: (r) => mono(r.asset_number) },
    { key: 'asset_name',        header: 'ASSET NAME',     render: (r) => bold(r.asset_name) },
    { key: 'previous_employee', header: 'FROM',           render: (r) => <span style={{ fontSize: 13, color: '#475569' }}>{r.previous_employee}</span> },
    { key: 'new_employee',      header: 'TO',             render: (r) => <span style={{ fontWeight: 600, color: '#003DA5' }}>{r.new_employee}</span> },
    { key: 'transferred_by',    header: 'TRANSFERRED BY', render: (r) => <span style={{ fontSize: 13, color: '#475569' }}>{r.transferred_by}</span> },
    { key: 'transfer_date',     header: 'DATE',           render: (r) => mono(r.transfer_date) },
    {
      key: 'reason',
      header: 'REASON',
      render: (r) => (
        <span style={{ display: 'block', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: '#64748B' }}>{r.reason || '—'}</span>
      ),
    },
  ]

  const activeTab = TABS.find((t) => t.key === reportType)!

  const assetHistoryColumns: Column<AssetHistoryReportItem>[] = [
    { key: 'event_at', header: 'Date / Time', render: (r) => <span className="font-mono text-xs text-[#6B7280]">{r.event_at ?? '—'}</span> },
    { key: 'event_type', header: 'Event', render: (r) => <span style={{ fontWeight: 700 }}>{r.event_type}</span> },
    { key: 'asset_number', header: 'Asset No.', render: (r) => <span className="font-mono text-xs text-[#6B7280]">{r.asset_number ?? '—'}</span> },
    { key: 'property_number', header: 'Property No.', render: (r) => <span className="font-mono text-xs text-[#6B7280]">{r.property_number ?? '—'}</span> },
    { key: 'asset_name', header: 'Asset', render: (r) => <span style={{ fontWeight: 600 }}>{r.asset_name}</span> },
    { key: 'performed_by', header: 'Performed By', render: (r) => <span style={{ fontSize: 13, color: '#475569' }}>{r.performed_by ?? '—'}</span> },
    { key: 'previous_custodian', header: 'Prev Custodian', render: (r) => <span style={{ fontSize: 13, color: '#64748B' }}>{r.previous_custodian ?? '—'}</span> },
    { key: 'new_custodian', header: 'New Custodian', render: (r) => <span style={{ fontSize: 13, color: '#64748B' }}>{r.new_custodian ?? '—'}</span> },
    { key: 'previous_location', header: 'Prev Location', render: (r) => <span style={{ fontSize: 13, color: '#64748B' }}>{r.previous_location ?? '—'}</span> },
    { key: 'new_location', header: 'New Location', render: (r) => <span style={{ fontSize: 13, color: '#64748B' }}>{r.new_location ?? '—'}</span> },
    { key: 'reason', header: 'Reason', render: (r) => <span style={{ display: 'block', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: '#64748B' }}>{r.reason || '—'}</span> },
    { key: 'remarks', header: 'Remarks', render: (r) => <span style={{ display: 'block', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: '#64748B' }}>{r.remarks || '—'}</span> },
    { key: 'reference', header: 'Reference', render: (r) => <span className="font-mono text-xs text-[#6B7280]">{r.reference ?? '—'}</span> },
  ]

  const renderTable = () => {
    switch (reportType) {
      case 'assets':
        return <Table columns={assetColumns} rows={data as AssetReportItem[]} rowKey={(r) => r.id} />
      case 'borrowings':
        return <Table columns={borrowingColumns} rows={data as BorrowingReportItem[]} rowKey={(r) => r.id} />
      case 'overdue':
        return <Table columns={overdueColumns} rows={data as OverdueReportItem[]} rowKey={(r) => r.id} />
      case 'reservations':
        return <Table columns={reservationColumns} rows={data as ReservationReportItem[]} rowKey={(r) => r.id} />
      case 'inventory':
        return <Table columns={inventoryColumns} rows={data as InventoryReportItem[]} rowKey={(r) => r.id} />
      case 'low_stock':
        return <Table columns={lowStockColumns} rows={data as LowStockReportItem[]} rowKey={(r) => r.id} />
      case 'reissuances':
        return <Table columns={reissuanceColumns} rows={data as ReissuanceReportItem[]} rowKey={(r) => r.id} />
      case 'user_activity':
        return <Table columns={userActivityColumns} rows={data as UserActivityReportItem[]} rowKey={(r) => r.id} />
      case 'asset_history':
        return <Table columns={assetHistoryColumns} rows={data as AssetHistoryReportItem[]} rowKey={(r) => r.event_id || `${r.source}_${r.source_id}_${r.asset_id}`} />
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 32 }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
            Reports &amp; Exports
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: '#64748B', lineHeight: 1.4 }}>
            Generate official reports and export data to Excel, CSV, or PDF.
          </p>
        </div>

        {/* Export buttons — hidden when printing */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="report-no-print">
          <button
            type="button"
            disabled={exporting || data.length === 0}
            onClick={() => void handleExport('excel')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              height: 38, paddingInline: 16, borderRadius: 10,
              border: '1px solid #BBF7D0', background: '#F0FDF4',
              fontSize: 13, fontWeight: 600, color: '#166534',
              cursor: exporting || data.length === 0 ? 'not-allowed' : 'pointer',
              opacity: exporting || data.length === 0 ? 0.5 : 1,
              fontFamily: 'inherit', transition: 'all 0.15s',
            }}
          >
            <FileSpreadsheet size={15} />
            Excel
          </button>
          <button
            type="button"
            disabled={exporting || data.length === 0}
            onClick={() => void handleExport('csv')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              height: 38, paddingInline: 16, borderRadius: 10,
              border: '1px solid #E2E8F0', background: '#fff',
              fontSize: 13, fontWeight: 600, color: '#475569',
              cursor: exporting || data.length === 0 ? 'not-allowed' : 'pointer',
              opacity: exporting || data.length === 0 ? 0.5 : 1,
              fontFamily: 'inherit', transition: 'all 0.15s',
            }}
          >
            <FileCode size={15} />
            CSV
          </button>
          <button
            type="button"
            disabled={data.length === 0}
            onClick={() => window.print()}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              height: 38, paddingInline: 16, borderRadius: 10,
              border: '1px solid #003DA5', background: '#003DA5',
              fontSize: 13, fontWeight: 600, color: '#fff',
              cursor: data.length === 0 ? 'not-allowed' : 'pointer',
              opacity: data.length === 0 ? 0.5 : 1,
              fontFamily: 'inherit', transition: 'all 0.15s',
            }}
          >
            <Printer size={15} />
            Print / PDF
          </button>
        </div>
      </div>

      {/* Alert */}
      {message && <Alert tone={message.type} onClose={() => setMessage(null)}>{message.text}</Alert>}

      {/* ── Printable report area — this wrapper is the only thing visible when printing ── */}
      <div className="report-print-area">

        {/* Print-only page header (invisible on screen via CSS inversion) */}
        <div className="report-print-only" style={{ display: 'none' }}>
          <div style={{ textAlign: 'center', marginBottom: 16, borderBottom: '2px solid #003DA5', paddingBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#003DA5', letterSpacing: '0.04em' }}>
              PHILIPPINE STATISTICS AUTHORITY
            </div>
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
              Inventory Management System — {activeTab.label} ({new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })})
            </div>
          </div>
        </div>

      {/* ── Main Card ── */}
      <Card noPadding>
        {/* Tab Navigation — hidden when printing */}
        <div className="report-no-print" style={{
          display: 'flex', gap: 0,
          borderBottom: '1px solid #E2E8F0',
          background: '#FAFBFC',
          padding: '0 16px',
          overflowX: 'auto',
        }}>
          {TABS.map((tab) => {
            const active = reportType === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setReportType(tab.key)}
                style={{
                  position: 'relative',
                  padding: '14px 18px',
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  color: active ? '#003DA5' : '#64748B',
                  background: 'none',
                  border: 'none',
                  borderBottom: active ? '2px solid #003DA5' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = '#334155' }}
                onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = '#64748B' }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Info Bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #F1F5F9',
          padding: '12px 20px',
          background: '#fff',
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0F172A', lineHeight: 1.3 }}>{activeTab.label}</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>{activeTab.description}</p>
          </div>
          {!loading && (
            <span style={{
              borderRadius: 20, background: '#EFF6FF',
              padding: '4px 14px', fontSize: 12, fontWeight: 600, color: '#003DA5',
              border: '1px solid #BFDBFE',
            }}>
              {data.length} {data.length === 1 ? 'Record' : 'Records'}
            </span>
          )}
        </div>

        {/* Content Area */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '80px 0' }}>
            <Spinner label="" />
            <p style={{ fontSize: 13, fontWeight: 500, color: '#64748B' }}>Loading report data…</p>
          </div>
        ) : data.length === 0 ? (
          <div style={{ padding: '80px 0' }}>
            <EmptyState
              title="No records found"
              description="No data available for this report type."
            />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            {renderTable()}
            {reportType === 'asset_history' && assetHistoryMeta && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px' }}>
                <div style={{ color: '#64748B' }}>
                  Showing page {assetHistoryMeta.current_page} of {assetHistoryMeta.last_page} — {assetHistoryMeta.total} total events
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" disabled={assetHistoryMeta.current_page <= 1} onClick={() => { setCurrentPage(Math.max(1, currentPage - 1)); void loadReport(); }} style={{ padding: '8px 12px', borderRadius: 8 }}>Previous</button>
                  <button type="button" disabled={assetHistoryMeta.current_page >= assetHistoryMeta.last_page} onClick={() => { setCurrentPage(Math.min(assetHistoryMeta.last_page, currentPage + 1)); void loadReport(); }} style={{ padding: '8px 12px', borderRadius: 8 }}>Next</button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      </div>{/* end .report-print-area */}
    </div>
  )
}
