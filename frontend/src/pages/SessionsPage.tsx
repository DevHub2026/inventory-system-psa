import { useEffect, useState } from 'react'
import { Alert, Button, Card, EmptyState, Spinner, Table, type Column } from '@/components/ui'
import { sessionService } from '@/services/sessionService'
import { PageHeader } from '@/components/PageHeader'
import { formatDate, formatTime } from '@/utils/dateFormat'

interface UserSession {
  id: number
  device_name: string | null
  browser: string | null
  platform: string | null
  ip_address: string | null
  login_at: string | null
  last_activity: string | null
  is_active: boolean
  is_current: boolean
}

export function SessionsPage() {
  const [sessions, setSessions] = useState<UserSession[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 768 : true)

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const loadSessions = async () => {
    setLoading(true)
    try {
      const result = await sessionService.list()
      setSessions(result.items)
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unable to load sessions.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSessions()
  }, [])

  const handleRevoke = async (id: number) => {
    if (!confirm('Are you sure you want to revoke this session?')) return
    try {
      await sessionService.revoke(id)
      setMessage({ type: 'success', text: 'Session revoked successfully.' })
      await loadSessions()
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unable to revoke session.' })
    }
  }

  const handleRevokeAll = async () => {
    if (!confirm('Are you sure you want to revoke all other sessions? This will sign you out from all other devices.')) return
    try {
      await sessionService.revokeAll()
      setMessage({ type: 'success', text: 'All other sessions revoked successfully.' })
      await loadSessions()
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Unable to revoke sessions.' })
    }
  }

  const columns: Column<UserSession>[] = [
    { key: 'device_name', header: 'Device', render: (s) => s.device_name || 'Unknown Device' },
    { key: 'browser', header: 'Browser', render: (s) => s.browser || 'Unknown' },
    { key: 'platform', header: 'Platform', render: (s) => s.platform || 'Unknown' },
    { key: 'ip_address', header: 'IP Address', render: (s) => s.ip_address || 'N/A' },
    { key: 'login_at', header: 'Login Date', render: (s) => s.login_at ? formatDate(s.login_at) : 'N/A' },
    { key: 'login_time', header: 'Login Time', render: (s) => s.login_at ? formatTime(s.login_at) : 'N/A' },
    { key: 'last_activity', header: 'Last Activity', render: (s) => s.last_activity ? formatDate(s.last_activity) : 'N/A' },
    {
      key: 'status',
      header: 'Status',
      render: (s) => (
        <span className={`text-[12px] font-semibold ${s.is_current ? 'text-[#10B981]' : s.is_active ? 'text-[#0D47A1]' : 'text-[#9CA3AF]'}`}>
          {s.is_current ? 'Current Session' : s.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (s) => (
        <div className="flex flex-wrap gap-1">
          {!s.is_current && s.is_active && (
            <Button size="sm" variant="danger" onClick={() => handleRevoke(s.id)}>
              Revoke
            </Button>
          )}
          {s.is_current && (
            <span className="text-[12px] text-[#9CA3AF]">—</span>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Active Sessions" subtitle="Manage your active login sessions across devices." />

      {message && <Alert tone={message.type} onClose={() => setMessage(null)}>{message.text}</Alert>}

      <Card>
        <div className="p-4">
          <Button variant="danger" onClick={handleRevokeAll}>
            Revoke All Other Sessions
          </Button>
        </div>
      </Card>

      <Card noPadding>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        ) : isDesktop ? (
          <Table
            columns={columns}
            rows={sessions}
            rowKey={(s) => s.id}
            empty={
              <div className="py-16">
                <EmptyState title="No active sessions found" description="Your login sessions will appear here." />
              </div>
            }
          />
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {sessions.length === 0 ? (
              <div style={{ padding: '24px' }}>
                <EmptyState title="No active sessions found" description="Your login sessions will appear here." />
              </div>
            ) : (
              sessions.map((s) => (
                <div key={s.id} style={{ border: '1px solid #EFF2FF', borderRadius: 10, padding: 12, background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{s.device_name ?? 'Unknown Device'}</div>
                      <div style={{ fontSize: 13, color: '#64748B' }}>{s.browser ?? 'Unknown'} • {s.platform ?? 'Unknown'}</div>
                      <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: '#64748B', marginTop: 6 }}>{s.ip_address ?? 'N/A'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: '#64748B' }}>{s.login_at ? formatDate(s.login_at) : 'N/A'}</div>
                      <div style={{ fontWeight: 700, marginTop: 6 }}>{s.is_current ? 'Current Session' : s.is_active ? 'Active' : 'Inactive'}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
                    {!s.is_current && s.is_active && (
                      <Button size="sm" variant="danger" onClick={() => handleRevoke(s.id)}>Revoke</Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
