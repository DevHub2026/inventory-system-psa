import { useEffect, useState } from 'react'
import { Badge, Spinner } from '@/components/ui'
import { workflowService } from '@/services/workflowService'
import type { WorkflowApprovalHistory } from '@/types'
import { CheckCircle2, XCircle, Clock, AlertCircle, ShieldCheck } from 'lucide-react'

interface ApprovalHistoryTimelineProps {
  requestType: string
  requestId: number
  refreshKey?: number
  className?: string
}

export function ApprovalHistoryTimeline({
  requestType,
  requestId,
  refreshKey = 0,
  className = '',
}: ApprovalHistoryTimelineProps) {
  const [histories, setHistories] = useState<WorkflowApprovalHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)

    workflowService
      .getRequestHistory(requestType, requestId)
      .then((data) => {
        if (isMounted) setHistories(data)
      })
      .catch((err: unknown) => {
        if (isMounted) setError(err instanceof Error ? err.message : 'Failed to load approval history.')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [requestType, requestId, refreshKey])

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner label="Loading workflow history..." />
      </div>
    )
  }

  if (error) {
    return <div className="py-4 text-center text-xs text-red-500">{error}</div>
  }

  if (histories.length === 0) {
    return (
      <div className="py-6 text-center text-xs italic text-slate-400">
        No workflow approval records found for this request.
      </div>
    )
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'APPROVED':
        return <CheckCircle2 className="h-5 w-5 text-emerald-600 bg-white rounded-full" />
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-600 bg-white rounded-full" />
      case 'CANCELLED':
      case 'WITHDRAWN':
        return <AlertCircle className="h-5 w-5 text-amber-600 bg-white rounded-full" />
      case 'AUTO_APPROVED':
        return <ShieldCheck className="h-5 w-5 text-blue-600 bg-white rounded-full" />
      default:
        return <Clock className="h-5 w-5 text-blue-500 bg-white rounded-full" />
    }
  }

  const getActionTone = (action: string) => {
    switch (action) {
      case 'APPROVED':
      case 'AUTO_APPROVED':
        return 'green'
      case 'REJECTED':
        return 'red'
      case 'CANCELLED':
      case 'WITHDRAWN':
        return 'yellow'
      default:
        return 'blue'
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Workflow Approval Sequence</h4>
        <span className="text-[11px] font-medium text-slate-400">{histories.length} Event(s)</span>
      </div>

      <div className="relative ml-3 border-l-2 border-slate-200 pl-6 space-y-6">
        {histories.map((h, idx) => {
          const uName = h.user?.full_name || h.user?.name || h.user?.email || 'System'
          const roleLabel = h.role || 'Approver'
          const officeLabel = h.office?.name ? ` (${h.office.name})` : ''
          const deptLabel = h.department?.name ? ` [${h.department.name}]` : ''

          return (
            <div key={h.id || idx} className="relative group">
              {/* Timeline Bullet Icon */}
              <div className="absolute -left-[35px] top-0 flex items-center justify-center">
                {getActionIcon(h.action)}
              </div>

              {/* Event Content */}
              <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs transition-all hover:border-slate-300">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <Badge tone={getActionTone(h.action)}>
                      {h.action.replace('_', ' ')}
                    </Badge>
                    {h.level_order && (
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        Level {h.level_order}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[11px] text-slate-400">
                    {new Date(h.created_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </span>
                </div>

                <div className="text-[13px] text-slate-800 font-medium">
                  <span className="font-semibold text-slate-900">{uName}</span>
                  <span className="text-slate-500 text-xs ml-1.5">
                    — {roleLabel}{officeLabel}{deptLabel}
                  </span>
                </div>

                {h.remarks && (
                  <div className="mt-2 text-xs bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-slate-700 italic">
                    "{h.remarks}"
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
