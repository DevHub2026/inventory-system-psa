import { useEffect, useState } from 'react'
import { Modal, Spinner, Badge, Button } from '@/components/ui'
import { workflowService } from '@/services/workflowService'
import type { WorkflowVersion } from '@/types'
import { ChevronRight, ChevronDown } from 'lucide-react'

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
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner label="Loading version history log..." />
          </div>
        ) : versions.length === 0 ? (
          <div className="py-10 text-center">
            <div className="flex justify-center mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600">No Published Versions</p>
            <p className="text-xs text-slate-400 mt-1">This workflow has not been published yet.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-blue-200 via-slate-200 to-slate-100" />

            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1 relative">
              {versions.map((ver, verIdx) => {
                const isExpanded = expandedVersionId === ver.id
                const creatorName = ver.creator?.full_name || ver.creator?.name || ver.creator?.email || 'Admin'

                return (
                  <div
                    key={ver.id}
                    className={`rounded-xl border bg-white overflow-hidden transition-all duration-200 ${
                      isExpanded ? 'border-blue-200 shadow-md' : 'border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300'
                    } ${verIdx === 0 ? 'ring-1 ring-blue-200' : ''}`}
                  >
                    <div
                      onClick={() => setExpandedVersionId(isExpanded ? null : ver.id)}
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold text-xs shadow-sm ${
                          verIdx === 0 ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700'
                        }`}>
                          v{ver.version_number}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-slate-900">
                              Version {ver.version_number}
                              {verIdx === 0 && (
                                <span className="ml-2 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">Latest</span>
                              )}
                            </span>
                            <span className="text-xs text-slate-400">by {creatorName}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{ver.change_summary || 'No change summary recorded'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                          {new Date(ver.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <button
                          type="button"
                          className={`p-1.5 rounded-lg transition-colors ${
                            isExpanded ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                          }`}
                        >
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && ver.approval_levels && (
                      <div className="border-t border-slate-100 bg-gradient-to-b from-slate-50 to-white p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-100 text-blue-700">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                          </div>
                          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Approval Sequence ({ver.approval_levels.length} Level{ver.approval_levels.length > 1 ? 's' : ''})
                          </h5>
                        </div>
                        <div className="grid gap-2">
                          {ver.approval_levels.map((lvl) => (
                            <div
                              key={lvl.id || lvl.level_order}
                              className="flex items-center justify-between p-3 rounded-lg border border-slate-200/80 bg-white hover:border-slate-300 transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 font-bold text-[10px] text-slate-600 border border-slate-200">
                                  {lvl.level_order}
                                </span>
                                <div>
                                  <span className="font-semibold text-slate-800 text-xs">{lvl.name}</span>
                                  <span className="text-[10px] text-slate-400 ml-2">
                                    Roles: {(lvl.roles || []).join(', ') || 'Any'}
                                  </span>
                                </div>
                              </div>
                              <Badge tone={lvl.is_enabled ? 'green' : 'gray'}>
                                {lvl.is_enabled ? 'Enabled' : 'Disabled'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose} className="!border-slate-300">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
