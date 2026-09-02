import { useCallback, useEffect, useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Badge, Table, Spinner, type Column } from '@/components/ui'
import { qrService } from '@/services/qrService'
import type { QrScanHistory } from '@/types'
import { RefreshCw, Smartphone, Monitor, Download, Archive } from 'lucide-react'

export function QRScanHistoryPage() {
  const [scans, setScans] = useState<QrScanHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState('')
  const [clearing, setClearing] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const exportCurrentHistory = useCallback(() => {
    if (scans.length === 0) {
      setNotice('No scan history is available to export.')
      return
    }

    const headers = ['Scan Time', 'Asset', 'Asset Number', 'Scanned By', 'Action', 'Device', 'Platform', 'Browser', 'IP Address']
    const rows = scans.map((entry) => [
      entry.scanned_at ?? '',
      entry.asset?.name ?? `Asset #${entry.asset_id}`,
      entry.asset?.asset_number ?? '',
      entry.user?.full_name ?? entry.user?.email ?? 'Anonymous / Guest',
      entry.action_performed ?? '',
      entry.device ?? '',
      entry.platform ?? '',
      entry.browser ?? '',
      entry.ip_address ?? '',
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `qr_scan_history_backup_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setNotice('QR scan history backup exported successfully.')
  }, [scans])

  const loadScans = useCallback(async () => {
    setLoading(true)
    try {
      const res = await qrService.getHistory({
        action_performed: actionFilter || undefined,
      })
      setScans(res.items)
      setNotice(null)
    } catch {
      setNotice('Unable to load QR scan history.')
    } finally {
      setLoading(false)
    }
  }, [actionFilter])

  useEffect(() => {
    void loadScans()
  }, [loadScans])

  const handleClearHistory = useCallback(async () => {
    const confirmed = window.confirm(
      'Archive the active QR scan history view? This will hide current records from the active audit view without destroying the underlying soft-deleted database records. Export a backup first if you need a CSV copy.',
    )

    if (!confirmed) {
      return
    }

    setClearing(true)
    try {
      const result = await qrService.clearHistory()
      await loadScans()
      setNotice(result.message || 'QR scan history archived successfully.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to archive QR scan history.')
    } finally {
      setClearing(false)
    }
  }, [loadScans])

  const handleRestoreHistory = useCallback(async () => {
    const confirmed = window.confirm('Restore soft-deleted QR scan history records back to the active audit view?')

    if (!confirmed) {
      return
    }

    setRestoring(true)
    try {
      const result = await qrService.restoreHistory()
      await loadScans()
      setNotice(result.message || 'QR scan history restored successfully.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to restore QR scan history.')
    } finally {
      setRestoring(false)
    }
  }, [loadScans])

  const columns: Column<QrScanHistory>[] = [
    {
      key: 'scanned_at',
      header: 'Scan Time',
      render: (s) => (
        <span className="font-mono text-xs text-slate-700">
          {new Date(s.scanned_at).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'asset_id',
      header: 'Asset',
      render: (s) => (
        <div>
          <div className="font-bold text-xs text-slate-900">{s.asset?.name || `Asset #${s.asset_id}`}</div>
          <div className="font-mono text-[10px] text-blue-700">{s.asset?.asset_number}</div>
        </div>
      ),
    },
    {
      key: 'user_id',
      header: 'Scanned By',
      render: (s) => (
        <span className="text-xs text-slate-700 font-medium">
          {s.user?.full_name || s.user?.email || 'Anonymous / Guest'}
        </span>
      ),
    },
    {
      key: 'action_performed',
      header: 'Action Taken',
      render: (s) => (
        <Badge
          tone={
            s.action_performed === 'VIEW'
              ? 'gray'
              : s.action_performed.includes('BORROW')
              ? 'blue'
              : s.action_performed.includes('DAMAGE') || s.action_performed.includes('LOST')
              ? 'red'
              : 'violet'
          }
        >
          {s.action_performed}
        </Badge>
      ),
    },
    {
      key: 'device',
      header: 'Client Context',
      render: (s) => (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {s.device === 'Mobile' ? (
            <Smartphone className="w-3.5 h-3.5 text-blue-500" />
          ) : (
            <Monitor className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span>{s.device || 'Desktop'} ({s.platform || 'OS'}, {s.browser || 'Browser'})</span>
        </div>
      ),
    },
    {
      key: 'ip_address',
      header: 'IP Address',
      render: (s) => <span className="font-mono text-xs text-slate-500">{s.ip_address || '—'}</span>,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="QR Scan Audit History"
        subtitle="Real-time audit log of all employee PSA QR code scans, device contexts, and self-service actions."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={exportCurrentHistory}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" /> Export backup
            </button>
            <button
              type="button"
              disabled={clearing}
              onClick={() => void handleClearHistory()}
              className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg hover:bg-amber-100 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Archive className="w-3.5 h-3.5" /> {clearing ? 'Archiving...' : 'Archive active logs'}
            </button>
            <button
              type="button"
              disabled={restoring}
              onClick={() => void handleRestoreHistory()}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg hover:bg-emerald-100 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <RefreshCw className="w-3.5 h-3.5" /> {restoring ? 'Restoring...' : 'Restore archived logs'}
            </button>
            <button
              onClick={() => void loadScans()}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Log
            </button>
          </div>
        }
      />

      {notice && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800">
          {notice}
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="w-full sm:w-64">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Scan Actions</option>
            <option value="VIEW">VIEW (Asset Page Opened)</option>
            <option value="BORROW_REQUESTED">BORROW_REQUESTED</option>
            <option value="EXTENSION_REQUESTED">EXTENSION_REQUESTED</option>
            <option value="REISSUE_SUBMITTED">REISSUE_SUBMITTED</option>
            <option value="DAMAGE_REPORTED">DAMAGE_REPORTED</option>
            <option value="LOST_REPORTED">LOST_REPORTED</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <Spinner label="Loading scan logs..." />
        </div>
      ) : (
        <Table columns={columns as unknown as Column<unknown>[]} rows={scans as unknown[]} rowKey={(s) => (s as QrScanHistory).id} />
      )}
    </div>
  )
}
