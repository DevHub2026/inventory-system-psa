import { useEffect, useState, useMemo } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Badge, EmptyState, Spinner, Pagination } from '@/components/ui'
import { qrService } from '@/services/qrService'
import type { QrScanHistory } from '@/types'
import {
  RefreshCw,
  Smartphone,
  Monitor,
  QrCode,
  Activity,
  Clock,
  Search,
  User,
} from 'lucide-react'

export function QRScanHistoryPage() {
  const [scans, setScans] = useState<QrScanHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusTab, setStatusTab] = useState<'all' | 'views' | 'requests' | 'reports'>('all')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const perPage = 15

  const loadScans = async () => {
    setLoading(true)
    try {
      const res = await qrService.getHistory({
        action_performed: actionFilter || undefined,
      })
      setScans(res.items || [])
    } catch {
      setScans([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadScans()
  }, [actionFilter])

  // Filtered scans
  const filteredScans = useMemo(() => {
    let list = scans

    if (statusTab === 'views') {
      list = list.filter((s) => s.action_performed === 'VIEW')
    } else if (statusTab === 'requests') {
      list = list.filter((s) =>
        s.action_performed.includes('BORROW') ||
        s.action_performed.includes('EXTENSION') ||
        s.action_performed.includes('REISSUE')
      )
    } else if (statusTab === 'reports') {
      list = list.filter((s) =>
        s.action_performed.includes('DAMAGE') ||
        s.action_performed.includes('LOST')
      )
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      list = list.filter((s) => {
        const assetName = (s.asset?.name || '').toLowerCase()
        const assetNum = (s.asset?.asset_number || '').toLowerCase()
        const userName = (s.user?.full_name || s.user?.email || '').toLowerCase()
        const action = (s.action_performed || '').toLowerCase()
        const ip = (s.ip_address || '').toLowerCase()
        return (
          assetName.includes(term) ||
          assetNum.includes(term) ||
          userName.includes(term) ||
          action.includes(term) ||
          ip.includes(term)
        )
      })
    }

    return list
  }, [scans, statusTab, searchTerm])

  const totalPages = Math.ceil(filteredScans.length / perPage) || 1
  const paginatedScans = useMemo(() => {
    const start = (currentPage - 1) * perPage
    return filteredScans.slice(start, start + perPage)
  }, [filteredScans, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [statusTab, actionFilter, searchTerm])

  // Summary Metrics
  const stats = useMemo(() => {
    const total = scans.length
    const mobile = scans.filter((s) => (s.device || '').toLowerCase().includes('mobile')).length
    const desktop = scans.filter((s) => (s.device || '').toLowerCase().includes('desktop') || !s.device).length
    const actions = scans.filter((s) => s.action_performed !== 'VIEW').length
    return { total, mobile, desktop, actions }
  }, [scans])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 32 }}>
      {/* ── Page Header ── */}
      <PageHeader
        title="QR Scan Audit History"
        subtitle="Real-time audit log of all PSA asset QR code scans, mobile devices, timestamps, and self-service actions."
        actions={
          <button
            type="button"
            onClick={() => void loadScans()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '8px 14px',
              borderRadius: 10,
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              fontSize: 13,
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            <RefreshCw size={14} />
            <span>Refresh Log</span>
          </button>
        }
      />

      {/* ── Summary Stat Cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 14,
      }}>
        {/* Total Scans */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 14,
          border: '1px solid #E2E8F0',
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#EFF6FF',
            color: '#0B3D91',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <QrCode size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B' }}>
              Total Scans
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
              {stats.total}
            </div>
          </div>
        </div>

        {/* Mobile Devices */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 14,
          border: '1px solid #E2E8F0',
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#EEF2FF',
            color: '#4338CA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Smartphone size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B' }}>
              Mobile Scans
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#4338CA', lineHeight: 1.1 }}>
              {stats.mobile}
            </div>
          </div>
        </div>

        {/* Desktop Browsers */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 14,
          border: '1px solid #E2E8F0',
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#F0F9FF',
            color: '#0284C7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Monitor size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B' }}>
              Desktop / Browser
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0284C7', lineHeight: 1.1 }}>
              {stats.desktop}
            </div>
          </div>
        </div>

        {/* Self-Service Actions */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 14,
          border: '1px solid #E2E8F0',
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#FFFBEB',
            color: '#D97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Activity size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B' }}>
              Self-Service Actions
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#D97706', lineHeight: 1.1 }}>
              {stats.actions}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Scan History Card & Table ── */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
      }}>
        {/* Category Tabs Navigation */}
        <div style={{
          display: 'flex',
          overflowX: 'auto',
          background: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0',
          padding: '4px 8px',
          gap: 4,
        }}>
          {[
            { id: 'all',      label: 'All Scans',          count: scans.length },
            { id: 'views',    label: 'Asset Views',        count: scans.filter((s) => s.action_performed === 'VIEW').length },
            { id: 'requests', label: 'Borrow & Extensions', count: scans.filter((s) => s.action_performed.includes('BORROW') || s.action_performed.includes('EXTENSION') || s.action_performed.includes('REISSUE')).length },
            { id: 'reports',  label: 'Damage & Lost',      count: scans.filter((s) => s.action_performed.includes('DAMAGE') || s.action_performed.includes('LOST')).length },
          ].map((tab) => {
            const active = statusTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusTab(tab.id as any)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 16px',
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  color: active ? '#0B3D91' : '#64748B',
                  background: active ? '#FFFFFF' : 'transparent',
                  borderRadius: 10,
                  border: active ? '1px solid #CBD5E1' : '1px solid transparent',
                  boxShadow: active ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  fontFamily: 'inherit',
                }}
              >
                <span>{tab.label}</span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  padding: '1px 7px',
                  borderRadius: 999,
                  background: active ? '#EFF6FF' : '#E2E8F0',
                  color: active ? '#0B3D91' : '#475569',
                }}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Filters Toolbar */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          padding: '16px 20px',
          borderBottom: '1px solid #F1F5F9',
        }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1, minWidth: 260, maxWidth: 420 }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94A3B8',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by asset name, property tag, user, or IP..."
              style={{
                width: '100%',
                height: 38,
                paddingLeft: 34,
                paddingRight: 14,
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                fontSize: 13,
                color: '#0F172A',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Action Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#64748B' }}>Action:</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              style={{
                height: 38,
                padding: '0 12px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                fontSize: 13,
                color: '#334155',
                outline: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
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

        {/* Audit Log Table */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
            <Spinner label="Loading scan audit history..." />
          </div>
        ) : filteredScans.length === 0 ? (
          <div style={{ padding: '64px 20px' }}>
            <EmptyState
              title="No QR scan records found"
              description="Audit events will appear automatically when employees scan asset QR codes."
            />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#64748B' }}>
                  <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', width: 170 }}>Scan Timestamp</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Asset Item</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Scanned By</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', width: 160 }}>Action Performed</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client Context</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', width: 140 }}>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {paginatedScans.map((s) => {
                  const isMobile = (s.device || '').toLowerCase().includes('mobile')
                  return (
                    <tr
                      key={s.id}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        transition: 'background 0.1s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                    >
                      {/* Timestamp */}
                      <td style={{ padding: '12px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#334155', fontFamily: 'monospace' }}>
                          <Clock size={13} style={{ color: '#94A3B8' }} />
                          <span>{new Date(s.scanned_at).toLocaleString()}</span>
                        </div>
                      </td>

                      {/* Asset Item */}
                      <td style={{ padding: '12px 18px' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>
                          {s.asset?.name || `Asset #${s.asset_id}`}
                        </div>
                        {s.asset?.asset_number && (
                          <div style={{
                            display: 'inline-block',
                            marginTop: 2,
                            fontFamily: 'monospace',
                            fontSize: 11,
                            fontWeight: 700,
                            background: '#F1F5F9',
                            color: '#0B3D91',
                            padding: '1px 6px',
                            borderRadius: 4,
                            border: '1px solid #E2E8F0',
                          }}>
                            {s.asset.asset_number}
                          </div>
                        )}
                      </td>

                      {/* Scanned By */}
                      <td style={{ padding: '12px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: '#F1F5F9',
                            color: '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}>
                            <User size={13} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 13 }}>
                              {s.user?.full_name || 'Public / Guest User'}
                            </div>
                            {s.user?.email && (
                              <div style={{ fontSize: 11.5, color: '#64748B' }}>
                                {s.user.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Action Performed */}
                      <td style={{ padding: '12px 18px' }}>
                        <Badge
                          tone={
                            s.action_performed === 'VIEW'
                              ? 'gray'
                              : s.action_performed.includes('BORROW')
                              ? 'blue'
                              : s.action_performed.includes('DAMAGE') || s.action_performed.includes('LOST')
                              ? 'red'
                              : 'blue'
                          }
                        >
                          {s.action_performed}
                        </Badge>
                      </td>

                      {/* Client Context */}
                      <td style={{ padding: '12px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: '#475569' }}>
                          {isMobile ? (
                            <Smartphone size={15} style={{ color: '#4338CA' }} />
                          ) : (
                            <Monitor size={15} style={{ color: '#0284C7' }} />
                          )}
                          <span>
                            {s.device || 'Desktop'} ({s.platform || 'OS'}, {s.browser || 'Browser'})
                          </span>
                        </div>
                      </td>

                      {/* IP Address */}
                      <td style={{ padding: '12px 18px' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: 11.5,
                          color: '#475569',
                          background: '#F8FAFC',
                          padding: '2px 6px',
                          borderRadius: 4,
                          border: '1px solid #E2E8F0',
                        }}>
                          {s.ip_address || '—'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div style={{ borderTop: '1px solid #F1F5F9', padding: '12px 20px' }}>
              <Pagination
                page={currentPage}
                lastPage={totalPages}
                total={filteredScans.length}
                onPageChange={(p) => setCurrentPage(p)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
