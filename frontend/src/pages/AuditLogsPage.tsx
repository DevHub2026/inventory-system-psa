import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Spinner, Table, type Column } from '@/components/ui'
import { listAuditLogs } from '@/services/auditService'

interface AuditLogItem {
  id: number
  user: string
  action: string
  module: string
  description: string
  ip_address?: string | null
  created_at: string
}

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        const data = (await listAuditLogs()) as AuditLogItem[]
        setLogs(data)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const columns: Column<AuditLogItem>[] = [
    { key: 'created_at', header: 'Date/Time', render: (log) => <span className="font-mono text-xs text-slate-700">{log.created_at}</span> },
    { key: 'user', header: 'User', render: (log) => <span className="text-sm font-medium text-slate-800">{log.user || 'System'}</span> },
    { key: 'module', header: 'Module', render: (log) => <span className="text-xs font-semibold text-slate-700">{log.module}</span> },
    { key: 'action', header: 'Action', render: (log) => <span className="text-xs font-bold text-blue-700">{log.action}</span> },
    { key: 'description', header: 'Description', render: (log) => <span className="text-xs text-slate-600">{log.description}</span> },
    { key: 'ip_address', header: 'IP Address', render: (log) => <span className="font-mono text-[11px] text-slate-500">{log.ip_address || '—'}</span> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        subtitle="Administrative activity trail for system changes, user actions, and workflow events."
      />

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Spinner label="Loading audit logs..." />
        </div>
      ) : (
        <Table columns={columns} rows={logs} rowKey={(log) => log.id} />
      )}
    </div>
  )
}
