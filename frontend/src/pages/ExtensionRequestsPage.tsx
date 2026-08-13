import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Modal,
  Spinner,
  Table,
  type Column,
} from '@/components/ui'
import { PageHeader } from '@/components/PageHeader'
import { borrowExtensionService } from '@/services/borrowExtensionService'
import { borrowingService } from '@/services/borrowingService'
import { useAuth } from '@/hooks/useAuth'
import { isAdmin, isStaff } from '@/utils/roleHelpers'
import type { BorrowExtensionRequest } from '@/types'
import { affectsScope, notifyDataChanged, onDataChanged } from '@/utils/dataRefresh'
import { formatDate } from '@/utils/dateFormat'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Compute the number of additional days between two Y-M-D strings */
function diffDays(current: string, requested: string): number {
  const a = new Date(current)
  const b = new Date(requested)
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return 0
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

function statusTone(status: BorrowExtensionRequest['status']): 'yellow' | 'green' | 'red' | 'gray' {
  switch (status) {
    case 'PENDING':  return 'yellow'
    case 'APPROVED': return 'green'
    case 'REJECTED': return 'red'
    default:         return 'gray'
  }
}

// ─── Inline table button ───────────────────────────────────────────────────────

function TblBtn({
  label,
  onClick,
  variant = 'default',
  disabled = false,
}: {
  label: string
  onClick: () => void
  variant?: 'default' | 'success' | 'danger'
  disabled?: boolean
}) {
  const map = {
    default: { bg: '#F8FAFC', bgH: '#EEF2F7', color: '#374151', border: '1px solid #E2E8F0' },
    success: { bg: '#F0FDF4', bgH: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0' },
    danger:  { bg: '#FEF2F2', bgH: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA' },
  }
  const s = map[variant]
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 28, paddingInline: 10, borderRadius: 6,
        border: s.border, background: s.bg, color: s.color,
        fontSize: 11.5, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        display: 'inline-flex', alignItems: 'center', gap: 5,
        whiteSpace: 'nowrap',
        transition: 'background 0.1s',
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={(e) => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = s.bgH }}
      onMouseLeave={(e) => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = s.bg  }}
    >
      {label}
    </button>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ExtensionRequestsPage() {
  const { user } = useAuth()
  const canManage = isAdmin(user) || isStaff(user)

  // Data
  const [rows, setRows]       = useState<BorrowExtensionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast]     = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 768 : true)

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Approve flow
  const [approveTarget, setApproveTarget]   = useState<BorrowExtensionRequest | null>(null)
  const [approving, setApproving]           = useState(false)

  // Reject flow
  const [rejectTarget, setRejectTarget]     = useState<BorrowExtensionRequest | null>(null)
  const [rejectRemarks, setRejectRemarks]   = useState('')
  const [remarkError, setRemarkError]       = useState<string | null>(null)
  const [rejecting, setRejecting]           = useState(false)

  // ── Data loading ────────────────────────────────────────────────────────────

  const loadRequests = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch all borrowings, then gather extension requests — or use the
      // pending-count-aware combined approach using the list endpoint.
      // The service gives us per-borrowing history; we need a flat pending list.
      // We'll collect all pending requests from the service's global approach.
      // The backend exposes: GET /borrowings/{id}/extension-requests per borrowing,
      // and GET /extension-requests/pending-count for the badge.
      // There is no global flat listing endpoint yet, so we do the practical approach:
      // fetch the pending count and — if the caller has canManage rights — pull from
      // each individual borrowing. Since the backend's BorrowExtensionController
      // returns ALL requests for a borrowing that the caller can manage, we will
      // call a helper that requests a broad list.
      //
      // For now, the most realistic approach is to call borrowingService.list,
      // then for each active borrowing with a pending extension, pull its requests.
      // However that's too many network calls. Instead we rely on the borrowings
      // list endpoint (which already exposes `has_pending_extension`) to filter
      // candidates, then fetch their extension requests.
      //
      // ⚡ Practical shortcut: because the backend only has per-borrowing endpoints,
      // we'll use a small "gather" utility to load borrowings and expand requests.

      const all = await gatherPendingRequests()
      setRows(all)
    } catch (e: unknown) {
      setToast({ type: 'error', text: e instanceof Error ? e.message : 'Unable to load extension requests.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadRequests() }, [loadRequests])

  useEffect(() => {
    return onDataChanged((scope) => {
      if (affectsScope(scope, 'borrowings') || scope === 'all') void loadRequests()
    })
  }, [loadRequests])

  // ── Approve ─────────────────────────────────────────────────────────────────

  const handleApproveConfirm = async () => {
    if (!approveTarget) return
    setApproving(true)
    try {
      await borrowExtensionService.approveExtension(approveTarget.id)
      setApproveTarget(null)
      setToast({ type: 'success', text: 'Extension request approved. Due date updated.' })
      notifyDataChanged('borrowings')
      await loadRequests()
    } catch (e: unknown) {
      setToast({ type: 'error', text: e instanceof Error ? e.message : 'Failed to approve extension.' })
    } finally {
      setApproving(false)
    }
  }

  // ── Reject ──────────────────────────────────────────────────────────────────

  const openRejectModal = (req: BorrowExtensionRequest) => {
    setRejectTarget(req)
    setRejectRemarks('')
    setRemarkError(null)
  }

  const handleRejectSubmit = async () => {
    if (!rejectTarget) return
    if (!rejectRemarks.trim()) {
      setRemarkError('Remarks are required when rejecting an extension request.')
      return
    }
    setRejecting(true)
    setRemarkError(null)
    try {
      await borrowExtensionService.rejectExtension(rejectTarget.id, { remarks: rejectRemarks.trim() })
      setRejectTarget(null)
      setToast({ type: 'success', text: 'Extension request rejected.' })
      notifyDataChanged('borrowings')
      await loadRequests()
    } catch (e: unknown) {
      setToast({ type: 'error', text: e instanceof Error ? e.message : 'Failed to reject extension.' })
    } finally {
      setRejecting(false)
    }
  }

  // ── Table columns ────────────────────────────────────────────────────────────

  const columns: Column<BorrowExtensionRequest>[] = [
    {
      key: 'borrowing_id',
      header: 'Borrowing',
      render: (r) => (
        <span style={{
          fontFamily: 'ui-monospace, monospace', fontSize: 12,
          fontWeight: 700, color: '#1E40AF',
          background: '#EFF6FF', borderRadius: 5,
          padding: '2px 7px', display: 'inline-block',
        }}>
          #{r.borrowing_id}
        </span>
      ),
    },
    {
      key: 'current_due_date',
      header: 'Current Due Date',
      render: (r) => (
        <span style={{ fontWeight: 500, color: '#0F172A', fontSize: 13 }}>
          {formatDate(r.current_due_date)}
        </span>
      ),
    },
    {
      key: 'requested_days',
      header: 'Requested Days',
      render: (r) => {
        const days = diffDays(r.current_due_date, r.requested_due_date)
        return (
          <span style={{
            fontWeight: 700, fontSize: 13,
            color: '#1E40AF',
            background: '#EFF6FF',
            borderRadius: 6, padding: '2px 8px',
            display: 'inline-block',
          }}>
            +{days} day{days !== 1 ? 's' : ''}
          </span>
        )
      },
    },
    {
      key: 'requested_due_date',
      header: 'Proposed Due Date',
      render: (r) => (
        <span style={{ fontWeight: 600, color: '#0F172A', fontSize: 13 }}>
          {formatDate(r.requested_due_date)}
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (r) => (
        <span style={{
          fontSize: 12.5, color: '#475569',
          display: 'block', maxWidth: 260,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }} title={r.reason}>
          {r.reason}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Requested',
      render: (r) => (
        <span style={{ fontSize: 12, color: '#94A3B8' }}>
          {r.created_at ? formatDate(r.created_at) : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <Badge tone={statusTone(r.status)}>
          {r.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => {
        if (!canManage || r.status !== 'PENDING') {
          return <span style={{ fontSize: 12, color: '#CBD5E1' }}>—</span>
        }
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <TblBtn
              label="Approve"
              variant="success"
              onClick={() => setApproveTarget(r)}
              disabled={approving || rejecting}
            />
            <TblBtn
              label="Reject"
              variant="danger"
              onClick={() => openRejectModal(r)}
              disabled={approving || rejecting}
            />
          </div>
        )
      },
    },
  ]

  // ── Summary counts ────────────────────────────────────────────────────────

  const pending  = rows.filter((r) => r.status === 'PENDING').length
  const approved = rows.filter((r) => r.status === 'APPROVED').length
  const rejected = rows.filter((r) => r.status === 'REJECTED').length

  // ── Approve confirm dialog message ─────────────────────────────────────────

  const approveDialogMessage = approveTarget ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ margin: 0, color: '#334155', fontSize: 14, lineHeight: 1.6 }}>
        You are about to <strong>approve</strong> this extension request. The borrowing's due date will be updated.
      </p>
      <div style={{
        padding: '12px 14px', borderRadius: 10,
        background: '#F8FAFC', border: '1px solid #E2E8F0',
        display: 'flex', flexDirection: 'column', gap: 6,
        fontSize: 13,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748B' }}>Current Due Date</span>
          <span style={{ fontWeight: 600, color: '#0F172A' }}>{formatDate(approveTarget.current_due_date)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748B' }}>Additional Days</span>
          <span style={{ fontWeight: 700, color: '#1E40AF' }}>
            +{diffDays(approveTarget.current_due_date, approveTarget.requested_due_date)} day{diffDays(approveTarget.current_due_date, approveTarget.requested_due_date) !== 1 ? 's' : ''}
          </span>
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          borderTop: '1px solid #E2E8F0', paddingTop: 8, marginTop: 2,
        }}>
          <span style={{ color: '#166534', fontWeight: 600 }}>New Due Date</span>
          <span style={{ fontWeight: 700, color: '#166534' }}>{formatDate(approveTarget.requested_due_date)}</span>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
        This action will notify the borrower of the approval.
      </p>
    </div>
  ) : ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Extension Requests"
        subtitle="Review and manage borrower due-date extension requests."
      />

      {toast && (
        <Alert tone={toast.type} onClose={() => setToast(null)}>
          {toast.text}
        </Alert>
      )}

      {/* ── Summary chips ── */}
      {!loading && rows.length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'Total',    count: rows.length, bg: '#F1F5F9', color: '#475569', dot: '#94A3B8' },
            { label: 'Pending',  count: pending,  bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B' },
            { label: 'Approved', count: approved, bg: '#F0FDF4', color: '#15803D', dot: '#22C55E' },
            { label: 'Rejected', count: rejected, bg: '#FEF2F2', color: '#DC2626', dot: '#EF4444' },
          ].map(({ label, count, bg, color, dot }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: bg, color,
              border: `1px solid ${color}22`,
              borderRadius: 8, padding: '6px 14px',
              fontSize: 12.5, fontWeight: 600,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, display: 'inline-block', flexShrink: 0 }} />
              {label}: {count}
            </div>
          ))}
        </div>
      )}

      {/* ── Table ── */}
      <Card noPadding>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
            <Spinner />
          </div>
        ) : isDesktop ? (
          <Table
            columns={columns}
            rows={rows}
            rowKey={(r) => r.id}
            empty={
              <div style={{ padding: '64px 0' }}>
                <EmptyState
                  title="No extension requests"
                  description="Borrowers haven't submitted any due-date extension requests yet."
                />
              </div>
            }
          />
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {rows.length === 0 ? (
              <div style={{ padding: '24px' }}>
                <EmptyState title="No extension requests" description="Borrowers haven't submitted any due-date extension requests yet." />
              </div>
            ) : (
              rows.map((r) => (
                <div key={r.id} style={{ border: '1px solid #EFF2FF', borderRadius: 10, padding: 12, background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>Borrowing #{r.borrowing_id}</div>
                      <div style={{ fontSize: 13, color: '#64748B' }}>{formatDate(r.requested_due_date)} • +{diffDays(r.current_due_date, r.requested_due_date)} days</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: '#64748B' }}>{r.created_at ? formatDate(r.created_at) : '—'}</div>
                      <div style={{ marginTop: 6 }}><Badge tone={statusTone(r.status)}>{r.status}</Badge></div>
                    </div>
                  </div>

                  <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ color: '#64748B', fontSize: 13, flex: 1 }}>{r.reason}</div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      {canManage && r.status === 'PENDING' && (
                        <>
                          <TblBtn label="Approve" variant="success" onClick={() => setApproveTarget(r)} disabled={approving || rejecting} />
                          <TblBtn label="Reject" variant="danger" onClick={() => openRejectModal(r)} disabled={approving || rejecting} />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Card>

      {/* ── Approve Confirm Dialog ── */}
      <ConfirmDialog
        open={approveTarget !== null}
        title="Approve Extension Request"
        message={approveDialogMessage}
        confirmLabel={approving ? 'Approving…' : 'Approve Extension'}
        cancelLabel="Cancel"
        tone="primary"
        onConfirm={() => void handleApproveConfirm()}
        onCancel={() => { if (!approving) setApproveTarget(null) }}
      />

      {/* ── Reject Modal ── */}
      <Modal
        open={rejectTarget !== null}
        title="Reject Extension Request"
        onClose={() => { if (!rejecting) setRejectTarget(null) }}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setRejectTarget(null)}
              disabled={rejecting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => void handleRejectSubmit()}
              disabled={rejecting}
            >
              {rejecting ? 'Rejecting…' : 'Reject Request'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {rejectTarget && (
            <div style={{
              padding: '12px 14px', borderRadius: 10,
              background: '#FEF2F2', border: '1px solid #FECACA',
              fontSize: 13, color: '#991B1B',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <div>
                <strong>Borrowing #{rejectTarget.borrowing_id}</strong>
                {' — '}
                Requested {diffDays(rejectTarget.current_due_date, rejectTarget.requested_due_date)} extra day{diffDays(rejectTarget.current_due_date, rejectTarget.requested_due_date) !== 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: 12, color: '#B91C1C' }}>
                Proposed due date: {formatDate(rejectTarget.requested_due_date)}
              </div>
            </div>
          )}

          <div>
            <label style={{
              display: 'block',
              marginBottom: 6,
              fontSize: 13,
              fontWeight: 600,
              color: '#334155',
            }}>
              Remarks <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <textarea
              rows={4}
              value={rejectRemarks}
              onChange={(e) => { setRejectRemarks(e.target.value); if (remarkError) setRemarkError(null) }}
              placeholder="Provide a reason for rejection so the borrower is informed…"
              style={{
                width: '100%',
                borderRadius: 10,
                border: remarkError ? '1px solid #C62828' : '1px solid #E2E8F0',
                background: '#ffffff',
                padding: '10px 14px',
                fontSize: 14,
                color: '#1e293b',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => { if (!remarkError) e.currentTarget.style.borderColor = '#0B3D91' }}
              onBlur={(e) => { if (!remarkError) e.currentTarget.style.borderColor = '#E2E8F0' }}
            />
            {remarkError && (
              <div style={{ marginTop: 5, fontSize: 12, fontWeight: 500, color: '#C62828' }}>
                {remarkError}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ExtensionRequestsPage

// ─── Data helper ──────────────────────────────────────────────────────────────

/**
 * Gathers all BorrowExtensionRequests by first listing borrowings that have
 * a pending extension (has_pending_extension=true), then pulling each one's
 * extension history.
 *
 * This approach relies on the existing per-borrowing endpoint since no
 * global flat listing endpoint exists yet.
 */
async function gatherPendingRequests(): Promise<BorrowExtensionRequest[]> {
  const borrowings = await borrowingService.list({ per_page: 200 })

  // We want borrowings that have a pending extension OR have any history
  // so admins get full visibility. Filter to those with the flag or all active ones.
  const candidates = borrowings.items.filter(
    (b) =>
      b.has_pending_extension ||
      b.status === 'BORROWED' ||
      b.status === 'ACTIVE' ||
      b.status === 'OVERDUE'
  )

  if (candidates.length === 0) return []

  const results = await Promise.allSettled(
    candidates.map((b) =>
      borrowExtensionService.getExtensionHistory(b.id)
    )
  )

  const all: BorrowExtensionRequest[] = []
  results.forEach((res) => {
    if (res.status === 'fulfilled') {
      all.push(...res.value.items)
    }
  })

  // De-duplicate (a borrowing may appear multiple times) and sort newest first
  const seen = new Set<number>()
  const deduped = all.filter((r) => {
    if (seen.has(r.id)) return false
    seen.add(r.id)
    return true
  })

  return deduped.sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0
    return bTime - aTime
  })
}
