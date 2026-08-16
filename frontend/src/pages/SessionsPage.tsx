import { useEffect, useMemo, useState } from 'react'
import { Clock3, Globe, MonitorSmartphone, ShieldCheck, Smartphone } from 'lucide-react'
import { Alert, Badge, Button, Card, EmptyState, Spinner, Table, type Column } from '@/components/ui'
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

function getSessionBadgeTone(session: UserSession): 'green' | 'blue' | 'gray' {
  if (session.is_current) return 'green'
  if (session.is_active) return 'blue'
  return 'gray'
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

  const summary = useMemo(() => {
    const active = sessions.filter((session) => session.is_active).length
    const current = sessions.filter((session) => session.is_current).length
    const inactive = sessions.length - active
    return {
      total: sessions.length,
      active,
      current,
      inactive,
      latest: sessions.find((session) => Boolean(session.last_activity || session.login_at)) ?? null,
    }
  }, [sessions])

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
    {
      key: 'device_name',
      header: 'Device',
      render: (session) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: session.is_current ? '#ecfdf5' : '#eff6ff',
              color: session.is_current ? '#15803d' : '#1d4ed8',
              border: '1px solid rgba(15, 23, 42, 0.05)',
            }}
          >
            {session.platform?.toLowerCase().includes('mobile') ? <Smartphone size={16} /> : <MonitorSmartphone size={16} />}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#0f172a' }}>{session.device_name || 'Unknown Device'}</div>
            <div style={{ marginTop: 2, fontSize: 12, color: '#64748b' }}>{session.browser || 'Unknown browser'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'platform',
      header: 'Platform',
      render: (session) => (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#334155' }}>
          <Globe size={14} style={{ opacity: 0.7 }} />
          <span>{session.platform || 'Unknown'}</span>
        </div>
      ),
    },
    {
      key: 'ip_address',
      header: 'IP Address',
      render: (session) => (
        <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', color: '#475569' }}>
          {session.ip_address || 'N/A'}
        </span>
      ),
    },
    {
      key: 'login_at',
      header: 'Login',
      render: (session) => (
        <div style={{ lineHeight: 1.5 }}>
          <div style={{ fontWeight: 500, color: '#0f172a' }}>{session.login_at ? formatDate(session.login_at) : 'N/A'}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{session.login_at ? formatTime(session.login_at) : '—'}</div>
        </div>
      ),
    },
    {
      key: 'last_activity',
      header: 'Last Activity',
      render: (session) => (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#334155' }}>
          <Clock3 size={14} style={{ opacity: 0.7 }} />
          <span>{session.last_activity ? formatDate(session.last_activity) : 'N/A'}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (session) => (
        <Badge tone={getSessionBadgeTone(session)}>
          {session.is_current ? 'Current Session' : session.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (session) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          {!session.is_current && session.is_active ? (
            <Button size="sm" variant="danger" onClick={() => handleRevoke(session.id)}>
              Revoke
            </Button>
          ) : (
            <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>
          )}
        </div>
      ),
    },
  ]

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <PageHeader
        title="Active Sessions"
        subtitle="Review and manage every device currently signed in to your account."
        actions={
          <Button variant="danger" onClick={handleRevokeAll}>
            Revoke All Other Sessions
          </Button>
        }
      />

      {message && <Alert tone={message.type} onClose={() => setMessage(null)}>{message.text}</Alert>}

      {!loading && (
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Total</div>
                <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700, color: '#0f172a' }}>{summary.total}</div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eff6ff', color: '#1d4ed8' }}>
                <MonitorSmartphone size={18} />
              </div>
            </div>
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Active</div>
                <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700, color: '#0f172a' }}>{summary.active}</div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eff6ff', color: '#0f766e' }}>
                <ShieldCheck size={18} />
              </div>
            </div>
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Current</div>
                <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700, color: '#0f172a' }}>{summary.current}</div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ecfdf5', color: '#15803d' }}>
                <ShieldCheck size={18} />
              </div>
            </div>
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Inactive</div>
                <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700, color: '#0f172a' }}>{summary.inactive}</div>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#475569' }}>
                <Clock3 size={18} />
              </div>
            </div>
          </Card>
        </div>
      )}

      <Card title="Signed-in devices" subtitle={summary.latest ? `Last activity: ${summary.latest.last_activity ? formatDate(summary.latest.last_activity) : 'Recently'}` : 'No active sessions yet'}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
            <Spinner />
          </div>
        ) : isDesktop ? (
          <Table
            columns={columns}
            rows={sessions}
            rowKey={(session) => session.id}
            empty={
              <div style={{ padding: '32px 0' }}>
                <EmptyState title="No active sessions found" description="Your login sessions will appear here." />
              </div>
            }
          />
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {sessions.length === 0 ? (
              <div style={{ padding: '24px 0' }}>
                <EmptyState title="No active sessions found" description="Your login sessions will appear here." />
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 14,
                    padding: 16,
                    background: '#f8fafc',
                    display: 'grid',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{session.device_name || 'Unknown Device'}</div>
                      <div style={{ marginTop: 4, fontSize: 12, color: '#64748b' }}>
                        {session.browser || 'Unknown browser'} • {session.platform || 'Unknown'}
                      </div>
                    </div>
                    <Badge tone={getSessionBadgeTone(session)}>
                      {session.is_current ? 'Current' : session.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div style={{ display: 'grid', gap: 6, fontSize: 12, color: '#475569' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <span>Login</span>
                      <strong style={{ color: '#0f172a' }}>{session.login_at ? formatDate(session.login_at) : 'N/A'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <span>IP</span>
                      <strong style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', color: '#0f172a' }}>
                        {session.ip_address || 'N/A'}
                      </strong>
                    </div>
                  </div>

                  {!session.is_current && session.is_active && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button size="sm" variant="danger" onClick={() => handleRevoke(session.id)}>
                        Revoke
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
