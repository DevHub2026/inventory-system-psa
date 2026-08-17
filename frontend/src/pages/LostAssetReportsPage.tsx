import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Search } from 'lucide-react'
import { Badge, EmptyState, Spinner, Table, type Column } from '@/components/ui'
import { lostAssetService } from '@/services/lostAssetService'
import type { LostAssetReport } from '@/types'

const statusTone: Record<string, 'gray' | 'blue' | 'green' | 'red' | 'yellow' | 'teal' | 'violet' | 'orange'> = {
  PENDING: 'yellow',
  APPROVED: 'green',
  REJECTED: 'red',
  RESOLVED: 'teal',
  REVIEW: 'blue',
  INVESTIGATING: 'violet',
  CLOSED: 'gray',
}

function formatDate(value?: string | null) {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function LostAssetReportsPage() {
  const [reports, setReports] = useState<LostAssetReport[]>([])
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const loadReports = useCallback(async () => {
    setLoading(true)
    setMessage(null)

    try {
      const response = await lostAssetService.list({ per_page: 100, ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}) })
      setReports(response.items)
    } catch (error: unknown) {
      const text = error instanceof Error ? error.message : 'Unable to load lost asset reports.'
      setMessage({ type: 'error', text })
      setReports([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    void loadReports()
  }, [loadReports])

  const availableStatuses = useMemo(() => {
    const values = new Set(reports.map((report) => report.status).filter(Boolean))
    return ['ALL', ...Array.from(values).sort()]
  }, [reports])

  const filteredReports = useMemo(() => {
    const term = search.trim().toLowerCase()

    return reports.filter((report) => {
      const matchesStatus = statusFilter === 'ALL' || report.status === statusFilter
      const haystack = [
        report.asset_name,
        report.asset_number,
        report.reporter_name,
        report.description,
        report.last_known_location,
        report.remarks,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesSearch = !term || haystack.includes(term)
      return matchesStatus && matchesSearch
    })
  }, [reports, search, statusFilter])

  const columns: Column<LostAssetReport>[] = [
    {
      key: 'asset',
      header: 'Asset',
      render: (report) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a' }}>{report.asset_name ?? 'Unknown Asset'}</div>
          <div style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>{report.asset_number ?? '—'}</div>
        </div>
      ),
    },
    {
      key: 'reporter',
      header: 'Reporter',
      render: (report) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1e293b' }}>{report.reporter_name ?? 'Unknown user'}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{formatDate(report.created_at)}</div>
        </div>
      ),
    },
    {
      key: 'details',
      header: 'Details',
      render: (report) => (
        <div style={{ maxWidth: 360 }}>
          <div style={{ color: '#334155', marginBottom: 4 }}>{report.description}</div>
          {report.last_known_location && (
            <div style={{ fontSize: 12, color: '#64748b' }}>Last seen: {report.last_known_location}</div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (report) => (
        <Badge tone={statusTone[report.status] ?? 'gray'} title={report.status ?? 'Unknown'}>
          {report.status ?? 'Unknown'}
        </Badge>
      ),
    },
    {
      key: 'lost_date',
      header: 'Date Lost',
      render: (report) => formatDate(report.date_lost),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              width: 44,
              height: 44,
              borderRadius: 14,
              background: '#fef3c7',
              color: '#b45309',
            }}
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>Lost Asset Reports</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Review employee-submitted missing asset incidents.</div>
          </div>
        </div>
      </div>

      {message && (
        <div
          style={{
            marginBottom: 16,
            padding: '10px 12px',
            borderRadius: 10,
            background: message.type === 'error' ? '#fef2f2' : '#f0fdf4',
            color: message.type === 'error' ? '#b91c1c' : '#166534',
            border: `1px solid ${message.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
          }}
        >
          {message.text}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          marginBottom: 16,
          padding: 16,
          borderRadius: 14,
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06)',
        }}
      >
        <div style={{ position: 'relative', minWidth: 220, flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: '#64748b' }} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search reports..."
            style={{
              width: '100%',
              height: 42,
              padding: '0 12px 0 38px',
              borderRadius: 10,
              border: '1px solid #dfe7f1',
              fontSize: 14,
              color: '#0f172a',
              background: '#f8fafc',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ minWidth: 180 }}>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            style={{
              width: '100%',
              height: 42,
              padding: '0 12px',
              borderRadius: 10,
              border: '1px solid #dfe7f1',
              background: '#fff',
              color: '#0f172a',
              fontSize: 14,
            }}
          >
            {availableStatuses.map((status) => (
              <option key={status} value={status}>
                {status === 'ALL' ? 'All statuses' : status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', placeItems: 'center', minHeight: 220 }}>
          <Spinner label="Loading reports..." />
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <Table
            columns={columns}
            rows={filteredReports}
            rowKey={(report) => report.id}
            empty={
              <EmptyState
                title="No lost asset reports found"
                description={search || statusFilter !== 'ALL' ? 'Try broadening your search or filters.' : 'No employee lost-asset reports have been submitted yet.'}
              />
            }
          />
        </div>
      )}
    </div>
  )
}
