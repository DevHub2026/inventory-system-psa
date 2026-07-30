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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Workflow Approval Timeline</h4>
        </div>
        <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg">{histories.length} Event{histories.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="relative">
        {/* Timeline Vertical Line */}
        <div className="absolute left-[17px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-blue-100 via-slate-200 to-slate-100 rounded-full" />

        <div className="space-y-5">
          {histories.map((h, idx) => {
            const uName = h.user?.full_name || h.user?.name || h.user?.email || 'System'
            const roleLabel = h.role || 'Approver'
            const officeLabel = h.office?.name ? ` (${h.office.name})` : ''
            const deptLabel = h.department?.name ? ` [${h.department.name}]` : ''

            return (
              <div key={h.id || idx} className="relative flex gap-4">
                {/* Timeline Bullet */}
                <div className="relative z-10 flex-shrink-0 mt-0.5">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl shadow-sm border-2 border-white ${
                    h.action === 'APPROVED' ? 'bg-emerald-50' :
                    h.action === 'AUTO_APPROVED' ? 'bg-blue-50' :
                    h.action === 'REJECTED' ? 'bg-red-50' :
                    h.action === 'CANCELLED' || h.action === 'WITHDRAWN' ? 'bg-amber-50' : 'bg-slate-50'
                  }`}>
                    {getActionIcon(h.action)}
                  </div>
                </div>

                {/* Event Card */}
                <div className="flex-1 min-w-0">
                  <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
                    {/* Top Row: Badge + Date */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Badge tone={getActionTone(h.action)} className="uppercase text-[10px] font-bold tracking-wide">
                          {h.action.replace('_', ' ')}
                        </Badge>
                        {h.level_order && (
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                            Level {h.level_order}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
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

                    {/* User Info */}
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-[10px] font-bold shrink-0">
                        {uName.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-[13px] text-slate-800">
                        <span className="font-semibold text-slate-900">{uName}</span>
                        <span className="text-slate-500 text-xs ml-1.5">
                          — {roleLabel}{officeLabel}{deptLabel}
                        </span>
                      </div>
                    </div>

                    {/* Remarks */}
                    {h.remarks && (
                      <div className="mt-3 text-xs bg-gradient-to-r from-slate-50 to-white border border-slate-100 p-3 rounded-lg text-slate-700 italic leading-relaxed">
                        <span className="text-[10px] font-semibold text-slate-400 not-italic block mb-0.5">Remarks</span>
                        "{h.remarks}"
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
