import { useEffect, useState } from 'react'
import { Modal, Spinner, Badge, Button } from '@/components/ui'
import { workflowService } from '@/services/workflowService'
import type { WorkflowVersion } from '@/types'
import { CalendarDays, ChevronDown, ChevronRight, Clock3, Layers3, UserRound } from 'lucide-react'

interface WorkflowVersionHistoryModalProps {
  open: boolean
  onClose: () => void
  workflowId: number | null
  workflowName?: string
}

export function WorkflowVersionHistoryModal({
  open,
  onClose,
  workflowId,
  workflowName = 'Workflow',
}: WorkflowVersionHistoryModalProps) {
  const [versions, setVersions] = useState<WorkflowVersion[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedVersionId, setExpandedVersionId] = useState<number | null>(null)

  useEffect(() => {
    if (!open || !workflowId) return
    setLoading(true)
    workflowService
      .getVersions(workflowId)
      .then((res) => {
        setVersions(res)
        if (res.length > 0) setExpandedVersionId(res[0].id)
      })
      .catch((err) => console.error('Failed to load version history:', err))
      .finally(() => setLoading(false))
  }, [open, workflowId])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Version History — ${workflowName}`}
      maxWidth={820}
      footer={<Button type="button" variant="secondary" size="sm" onClick={onClose}>Close</Button>}
    >
      <div style={{ display: 'grid', gap: 16 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '44px 0' }}>
            <Spinner label="Loading version history log..." />
          </div>
        ) : versions.length === 0 ? (
          <div style={{ padding: '28px 12px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock3 size={24} color="#94a3b8" />
              </div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>No published versions</div>
            <div style={{ marginTop: 6, fontSize: 12, color: '#64748b' }}>This workflow has not been published yet.</div>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 18, top: 0, bottom: 0, width: 2, background: 'linear-gradient(to bottom, #bfdbfe, #e2e8f0, #e2e8f0)' }} />

            <div style={{ display: 'grid', gap: 12, maxHeight: 520, overflowY: 'auto', paddingRight: 2, position: 'relative' }}>
              {versions.map((ver, verIdx) => {
                const isExpanded = expandedVersionId === ver.id
                const creatorName = ver.creator?.full_name || ver.creator?.name || ver.creator?.email || 'Admin'

                return (
                  <div
                    key={ver.id}
                    style={{
                      borderRadius: 14,
                      border: isExpanded ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                      background: '#ffffff',
                      boxShadow: isExpanded ? '0 8px 24px rgba(59, 130, 246, 0.08)' : '0 2px 8px rgba(15, 23, 42, 0.04)',
                      overflow: 'hidden',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div
                      onClick={() => setExpandedVersionId(isExpanded ? null : ver.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        padding: '14px 16px',
                        cursor: 'pointer',
                        background: verIdx === 0 ? '#f8fbff' : '#fff',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 800,
                            color: verIdx === 0 ? '#ffffff' : '#1d4ed8',
                            background: verIdx === 0 ? '#1d4ed8' : '#eff6ff',
                            border: '1px solid rgba(29, 78, 216, 0.08)',
                            flexShrink: 0,
                          }}
                        >
                          v{ver.version_number}
                        </div>

                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Version {ver.version_number}</span>
                            {verIdx === 0 && (
                              <span style={{ fontSize: 10, fontWeight: 700, background: '#dbeafe', color: '#1d4ed8', borderRadius: 6, padding: '2px 6px' }}>
                                Latest
                              </span>
                            )}
                            <span style={{ fontSize: 11, color: '#64748b' }}>by {creatorName}</span>
                          </div>
                          <div style={{ marginTop: 4, fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                            {ver.change_summary || 'No change summary recorded'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '5px 8px' }}>
                          <CalendarDays size={12} />
                          {new Date(ver.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <button
                          type="button"
                          aria-label={isExpanded ? 'Collapse version details' : 'Expand version details'}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            border: '1px solid #e2e8f0',
                            background: isExpanded ? '#eff6ff' : '#ffffff',
                            color: isExpanded ? '#1d4ed8' : '#64748b',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && ver.approval_levels && (
                      <div style={{ borderTop: '1px solid #e2e8f0', background: 'linear-gradient(to bottom, #f8fafc, #ffffff)', padding: 16, display: 'grid', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 20, height: 20, borderRadius: 6, background: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Layers3 size={12} />
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b' }}>
                            Approval Sequence ({ver.approval_levels.length} Level{ver.approval_levels.length > 1 ? 's' : ''})
                          </div>
                        </div>

                        <div style={{ display: 'grid', gap: 8 }}>
                          {ver.approval_levels.map((lvl) => (
                            <div
                              key={lvl.id || lvl.level_order}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 12,
                                padding: '10px 12px',
                                borderRadius: 10,
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                                <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#475569' }}>
                                  {lvl.level_order}
                                </span>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{lvl.name}</div>
                                  <div style={{ marginTop: 2, fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    Roles: {(lvl.roles || []).join(', ') || 'Any'}
                                  </div>
                                </div>
                              </div>

                              <Badge tone={lvl.is_enabled ? 'green' : 'gray'}>
                                {lvl.is_enabled ? 'Enabled' : 'Disabled'}
                              </Badge>
                            </div>
                          ))}
                        </div>

                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12, display: 'grid', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
                            <UserRound size={12} />
                            Created by
                          </div>
                          <div style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>{creatorName}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
