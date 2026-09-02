import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Search } from 'lucide-react'
import { Badge, Button, EmptyState, Spinner, Table, type Column } from '@/components/ui'
import { maintenanceService } from '@/services/maintenanceService'
import type { MaintenanceRequest } from '@/types'
import { notifyDataChanged } from '@/utils/dataRefresh'

const DAMAGE_TYPES = new Set(['minor_damage', 'major_damage', 'needs_maintenance'])

type DamageReportRow = MaintenanceRequest & {
  reported_by?: string | null
  type?: string
  severity?: string | null
  workflow_status?: string | null
  created_at?: string
  asset_id?: number
  asset_name?: string
}

const statusTone: Record<string, 'gray' | 'blue' | 'green' | 'red' | 'yellow' | 'teal' | 'violet' | 'orange'> = {
  scheduled: 'yellow',
  in_progress: 'blue',
  completed: 'green',
  cancelled: 'gray',
  pending: 'orange',
  approved: 'teal',
  rejected: 'red',
}

const typeTone: Record<string, 'gray' | 'blue' | 'green' | 'red' | 'yellow' | 'teal' | 'violet' | 'orange'> = {
  minor_damage: 'yellow',
  major_damage: 'red',
  needs_maintenance: 'orange',
}

function formatLabel(value?: string | null) {
  if (!value) return '—'
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
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

interface DamageReportsPageProps {
  embedded?: boolean
}

export function DamageReportsPage({ embedded = false }: DamageReportsPageProps) {
  const [reports, setReports] = useState<DamageReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const loadReports = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const result = await maintenanceService.list({ per_page: 100 })
      const damageRows = (result.items as DamageReportRow[]).filter((item) => {
        const type = String(item.type ?? '').trim()
        return DAMAGE_TYPES.has(type)
      })

      setReports(damageRows)
    } catch (error: unknown) {
      const text = error instanceof Error ? error.message : 'Unable to load damage reports.'
      setMessage({ type: 'error', text })
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadReports()
  }, [])

  const handleComplete = async (report: DamageReportRow) => {
    if (!window.confirm(`Mark this damage report for ${report.asset_name ?? 'this asset'} as complete?`)) return

    try {
      await maintenanceService.complete(report.id)
      notifyDataChanged('maintenance')
      setMessage({ type: 'success', text: 'Damage report marked as complete.' })
      await loadReports()
    } catch (error: unknown) {
      const text = error instanceof Error ? error.message : 'Unable to complete this damage report.'
      setMessage({ type: 'error', text })
    }
  }

  const handleStatusUpdate = async (report: DamageReportRow, status: 'in_progress' | 'cancelled') => {
    const actionLabel = status === 'in_progress' ? 'in progress' : 'cancelled'
    if (!window.confirm(`Set this damage report to ${actionLabel}?`)) return

    try {
      await maintenanceService.update(report.id, { status })
      notifyDataChanged('maintenance')
      setMessage({ type: 'success', text: `Damage report set to ${actionLabel}.` })
      await loadReports()
    } catch (error: unknown) {
      const text = error instanceof Error ? error.message : `Unable to set this damage report to ${actionLabel}.`
      setMessage({ type: 'error', text })
    }
  }

  const handleDelete = async (report: DamageReportRow) => {
    if (!window.confirm(`Delete the damage report for ${report.asset_name ?? 'this asset'}?`)) return

    try {
      await maintenanceService.delete(report.id)
      notifyDataChanged('maintenance')
      setMessage({ type: 'success', text: 'Damage report deleted.' })
      await loadReports()
    } catch (error: unknown) {
      const text = error instanceof Error ? error.message : 'Unable to delete this damage report.'
      setMessage({ type: 'error', text })
    }
  }

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
        report.reported_by,
        report.type,
        report.severity,
        report.description,
        report.workflow_status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return matchesStatus && (!term || haystack.includes(term))
    })
  }, [reports, search, statusFilter])

  const columns: Column<DamageReportRow>[] = [
    {
      key: 'asset',
      header: 'Asset',
      render: (report) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a' }}>{report.asset_name ?? 'Unknown asset'}</div>
          <div style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>{report.asset_id ?? '—'}</div>
        </div>
      ),
    },
    {
      key: 'reporter',
      header: 'Reporter',
      render: (report) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1e293b' }}>{report.reported_by ?? 'Unknown'}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{formatDate(report.created_at)}</div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (report) => (
        <Badge tone={typeTone[String(report.type ?? '')] ?? 'gray'}>
          {formatLabel(report.type)}
        </Badge>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      render: (report) => <span>{formatLabel(report.severity)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (report) => (
        <Badge tone={statusTone[String(report.status ?? '')] ?? 'gray'}>
          {formatLabel(report.status)}
        </Badge>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (report) => (
        <div style={{ maxWidth: 360 }}>
          <div style={{ color: '#334155' }}>{report.description ?? '—'}</div>
          {report.workflow_status && (
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Workflow: {formatLabel(report.workflow_status)}</div>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (report) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {report.status === 'scheduled' && (
            <>
              <Button size="sm" variant="secondary" onClick={() => void handleStatusUpdate(report, 'in_progress')}>In progress</Button>
              <Button size="sm" variant="success" onClick={() => void handleComplete(report)}>Complete</Button>
            </>
          )}
          {report.status === 'in_progress' && (
            <Button size="sm" variant="success" onClick={() => void handleComplete(report)}>Complete</Button>
          )}
          {report.status !== 'completed' && report.status !== 'cancelled' && (
            <Button size="sm" variant="danger" onClick={() => void handleStatusUpdate(report, 'cancelled')}>Cancel</Button>
          )}
          <Button size="sm" variant="danger" onClick={() => void handleDelete(report)}>Delete</Button>
        </div>
      ),
    },
  ]

  return (
    <div style={{ padding: embedded ? 0 : 24 }}>
      {!embedded && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                display: 'grid',
                placeItems: 'center',
                width: 44,
                height: 44,
                borderRadius: 14,
                background: '#fef2f2',
                color: '#b91c1c',
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>Damage Reports</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Review asset damage submissions and workflow status.</div>
            </div>
          </div>
        </div>
      )}

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
                {status === 'ALL' ? 'All statuses' : formatLabel(status)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', placeItems: 'center', minHeight: 220 }}>
          <Spinner label="Loading damage reports..." />
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <Table
            columns={columns}
            rows={filteredReports}
            rowKey={(report) => report.id}
            empty={
              <EmptyState
                title="No damage reports found"
                description={search || statusFilter !== 'ALL' ? 'Try broadening the search or filters.' : 'No asset damage reports have been submitted yet.'}
              />
            }
          />
        </div>
      )}
    </div>
  )
}
