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
          <div className="py-8 text-center text-sm text-slate-500 italic">
            No published versions found.
          </div>
        ) : (
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {versions.map((ver) => {
              const isExpanded = expandedVersionId === ver.id
              const creatorName = ver.creator?.full_name || ver.creator?.name || ver.creator?.email || 'Admin'

              return (
                <div
                  key={ver.id}
                  className="rounded-xl border border-slate-200 bg-white overflow-hidden transition-all shadow-2xs"
                >
                  <div
                    onClick={() => setExpandedVersionId(isExpanded ? null : ver.id)}
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700 font-bold text-xs">
                        v{ver.version_number}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900">
                            Version {ver.version_number}
                          </span>
                          <span className="text-xs text-slate-400">by {creatorName}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{ver.change_summary || 'No change summary recorded'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-slate-400">
                        {new Date(ver.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      {isExpanded ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
                    </div>
                  </div>

                  {isExpanded && ver.approval_levels && (
                    <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-3">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Approval Sequence ({ver.approval_levels.length} Levels)
                      </h5>
                      <div className="grid gap-2">
                        {ver.approval_levels.map((lvl) => (
                          <div
                            key={lvl.id || lvl.level_order}
                            className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200/80 bg-white text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 font-bold text-[10px] text-slate-700">
                                {lvl.level_order}
                              </span>
                              <span className="font-semibold text-slate-800">{lvl.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500">
                                Roles: {(lvl.roles || []).join(', ') || 'Any'}
                              </span>
                              <Badge tone={lvl.is_enabled ? 'green' : 'gray'}>
                                {lvl.is_enabled ? 'Enabled' : 'Disabled'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
