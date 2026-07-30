import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Alert, Badge, Button, Card, EmptyState, Input, Modal, Spinner } from '@/components/ui'
import { PageHeader } from '@/components/PageHeader'
import { borrowingService } from '@/services/borrowingService'
import { borrowExtensionService } from '@/services/borrowExtensionService'
import { useAuth } from '@/hooks/useAuth'
import type { Borrowing, BorrowExtensionRequest } from '@/types'
import { borrowingStatusTone } from '@/utils/statusTone'
import { borrowingStatusLabel } from '@/utils/displayLabels'
import { formatDate, formatTime } from '@/utils/dateFormat'
import { affectsScope, notifyDataChanged, onDataChanged } from '@/utils/dataRefresh'
import { GenerateDocumentModal } from '@/components/documents/GenerateDocumentModal'
import { Printer } from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calculateNewDueDate(currentDueDateStr?: string, additionalDays?: number): string {
  if (!currentDueDateStr || !additionalDays || additionalDays <= 0) return ''
  const parts = currentDueDateStr.split('T')[0].split('-')
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1
    const day = parseInt(parts[2], 10)
    const date = new Date(year, month, day)
    date.setDate(date.getDate() + additionalDays)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  const date = new Date()
  date.setDate(date.getDate() + (additionalDays || 0))
  return date.toISOString().split('T')[0]
}

function extensionStatusTone(status: string): 'yellow' | 'green' | 'red' | 'gray' {
  switch (status) {
    case 'PENDING':
      return 'yellow'
    case 'APPROVED':
      return 'green'
    case 'REJECTED':
      return 'red'
    default:
      return 'gray'
  }
}

// ─── Table Styles ─────────────────────────────────────────────────────────────

const th: React.CSSProperties = {
  padding: '11px 16px',
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  color: '#94A3B8',
  whiteSpace: 'nowrap',
  background: '#F8FAFC',
  borderBottom: '1px solid #E2E8F0',
}

const td: React.CSSProperties = {
  padding: '14px 16px',
  verticalAlign: 'middle',
  fontSize: 13,
  color: '#334155',
  borderBottom: '1px solid #F1F5F9',
}

export interface BorrowingDetailsPageProps {
  borrowingId?: number
  onClose?: () => void
  onUpdated?: () => void
}

export function BorrowingDetailsPage({
  borrowingId: propBorrowingId,
  onClose,
  onUpdated,
}: BorrowingDetailsPageProps) {
  const { id: paramId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const targetId = propBorrowingId ?? (paramId ? parseInt(paramId, 10) : undefined)

  const [borrowing, setBorrowing] = useState<Borrowing | null>(null)
  const [history, setHistory] = useState<BorrowExtensionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Extension Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [additionalDays, setAdditionalDays] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Validation Errors State
  const [errors, setErrors] = useState<{ additionalDays?: string; reason?: string; submit?: string }>({})

  // Printable Document Modal
  const [printModalOpen, setPrintModalOpen] = useState(false)
  const [printDocType, setPrintDocType] = useState<'borrow_receipt' | 'return_receipt'>('borrow_receipt')

  const openPrintModal = (type: 'borrow_receipt' | 'return_receipt') => {
    setPrintDocType(type)
    setPrintModalOpen(true)
  }

  // Load borrowing details
  const loadBorrowing = useCallback(async () => {
    if (!targetId) return
    try {
      const b = await borrowingService.getById(targetId)
      setBorrowing(b)
    } catch (e: unknown) {
      setToastMessage({
        type: 'error',
        text: e instanceof Error ? e.message : 'Unable to load borrowing details.',
      })
    }
  }, [targetId])

  // Load extension history
  const loadHistory = useCallback(async () => {
    if (!targetId) return
    setHistoryLoading(true)
    try {
      const res = await borrowExtensionService.getExtensionHistory(targetId)
      setHistory(res.items)
    } catch {
      // History might fail if unauthorized or non-existent, default to empty
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }, [targetId])

  const refreshAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([loadBorrowing(), loadHistory()])
    setLoading(false)
  }, [loadBorrowing, loadHistory])

  useEffect(() => {
    void refreshAll()
  }, [refreshAll])

  useEffect(() => {
    return onDataChanged((scope) => {
      if (affectsScope(scope, 'borrowings')) {
        void refreshAll()
      }
    })
  }, [refreshAll])

  // Eligibility check
  const isBorrower = Boolean(user && borrowing && user.id === borrowing.user_id)
  const isStatusActive = borrowing?.status === 'BORROWED' || borrowing?.status === 'ACTIVE'
  const isNotReturned = !borrowing?.returned_at
  const hasPendingExtension =
    borrowing?.has_pending_extension || history.some((req) => req.status === 'PENDING')
  const isEligibleForExtension = isBorrower && isStatusActive && isNotReturned && !hasPendingExtension

  // Open modal and reset form
  const handleOpenModal = () => {
    setAdditionalDays('')
    setReason('')
    setErrors({})
    setModalOpen(true)
  }

  // Handle form submission
  const handleSubmitExtension = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!borrowing || !targetId) return

    // Validation
    const newErrors: { additionalDays?: string; reason?: string } = {}
    const daysNum = parseInt(additionalDays.trim(), 10)

    if (!additionalDays.trim()) {
      newErrors.additionalDays = 'Additional days is required.'
    } else if (isNaN(daysNum) || daysNum <= 0) {
      newErrors.additionalDays = 'Please enter a valid number of days (at least 1).'
    }

    if (!reason.trim()) {
      newErrors.reason = 'Reason for extension is required.'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const requestedDueDate = calculateNewDueDate(borrowing.due_date, daysNum)
    if (!requestedDueDate) {
      setErrors({ additionalDays: 'Invalid due date calculation.' })
      return
    }

    setSubmitting(true)
    setErrors({})

    try {
      await borrowExtensionService.requestExtension(targetId, {
        requested_due_date: requestedDueDate,
        reason: reason.trim(),
      })

      // 4. On successful submission:
      // - Close the modal
      setModalOpen(false)
      // - Refresh the borrowing details & extension history automatically
      await refreshAll()
      onUpdated?.()
      notifyDataChanged('all')
      // - Show success toast
      setToastMessage({
        type: 'success',
        text: 'Due date extension request submitted successfully!',
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit extension request.'
      setErrors({ submit: msg })
    } finally {
      setSubmitting(false)
    }
  }

  const calculatedDueDate = calculateNewDueDate(borrowing?.due_date, parseInt(additionalDays, 10))

  if (!targetId) {
    return (
      <div style={{ padding: 24 }}>
        <Alert tone="error">Invalid borrowing ID specified.</Alert>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Header ── */}
      <PageHeader
        title={borrowing ? `Borrowing Transaction #${borrowing.id}` : 'Borrowing Details'}
        subtitle="View borrowing status, asset allocation, and request due date extensions."
        actions={
          <div style={{ display: 'flex', gap: 10 }}>
            {onClose ? (
              <Button variant="secondary" onClick={onClose}>
                Back
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => navigate('/borrowings')}>
                ← Back to Borrowed Items
              </Button>
            )}

            {/* Print Borrow Receipt */}
            {!loading && borrowing && (
              <Button variant="secondary" onClick={() => openPrintModal('borrow_receipt')}>
                <Printer size={14} style={{ marginRight: 6 }} /> Generate Borrow Receipt
              </Button>
            )}

            {/* Print Return Receipt (only once returned) */}
            {!loading && borrowing && ['RETURNED', 'COMPLETED'].includes(borrowing.status) && (
              <Button variant="secondary" onClick={() => openPrintModal('return_receipt')}>
                <Printer size={14} style={{ marginRight: 6 }} /> Generate Return Receipt
              </Button>
            )}

            {/* Requirement 1: Display "Request Extension" button if eligible */}
            {!loading && isEligibleForExtension && (
              <Button variant="primary" onClick={handleOpenModal}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Request Extension
              </Button>
            )}
          </div>
        }
      />

      {/* Toast Notification / Success / Error Alert */}
      {toastMessage && (
        <Alert tone={toastMessage.type} onClose={() => setToastMessage(null)}>
          {toastMessage.text}
        </Alert>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
          <Spinner />
        </div>
      ) : !borrowing ? (
        <EmptyState
          title="Borrowing Record Not Found"
          description="The requested borrowing transaction does not exist or was removed."
        />
      ) : (
        <>
          {/* Pending Extension Request Banner */}
          {hasPendingExtension && (
            <Alert tone="warning" title="Extension Request Pending">
              An extension request for this borrowing is currently under review by administrators.
            </Alert>
          )}

          {/* ── Details Card ── */}
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #F1F5F9',
                  paddingBottom: 16,
                }}
              >
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                    {borrowing.asset_name}
                  </h3>
                  <div
                    style={{
                      fontFamily: 'ui-monospace, monospace',
                      fontSize: 12,
                      color: '#475569',
                      background: '#F1F5F9',
                      padding: '2px 8px',
                      borderRadius: 4,
                      marginTop: 4,
                      display: 'inline-block',
                    }}
                  >
                    {borrowing.asset_number || borrowing.asset_code || `Asset #${borrowing.asset_id}`}
                  </div>
                </div>
                <Badge tone={borrowingStatusTone(borrowing.status)}>
                  {borrowingStatusLabel(borrowing.status)}
                </Badge>
              </div>

              {/* Grid Information */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 16,
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: '#94A3B8',
                    }}
                  >
                    Borrower
                  </span>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: '#0F172A', marginTop: 2 }}>
                    {borrowing.employee_name}
                  </div>
                  {borrowing.employee_id && (
                    <div style={{ fontSize: 11.5, color: '#64748B' }}>
                      ID: {borrowing.employee_id}
                    </div>
                  )}
                </div>

                <div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: '#94A3B8',
                    }}
                  >
                    Borrowed Date
                  </span>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: '#0F172A', marginTop: 2 }}>
                    {borrowing.borrowed_at
                      ? `${formatDate(borrowing.borrowed_at)} ${formatTime(borrowing.borrowed_at)}`
                      : borrowing.borrow_date
                      ? formatDate(borrowing.borrow_date)
                      : '—'}
                  </div>
                </div>

                <div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: '#94A3B8',
                    }}
                  >
                    Current Due Date
                  </span>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      color: borrowing.status === 'OVERDUE' ? '#DC2626' : '#1E40AF',
                      marginTop: 2,
                    }}
                  >
                    {borrowing.due_date ? formatDate(borrowing.due_date) : '—'}
                  </div>
                </div>

                <div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: '#94A3B8',
                    }}
                  >
                    Returned At
                  </span>
                  <div style={{ fontWeight: 500, fontSize: 13.5, color: '#334155', marginTop: 2 }}>
                    {borrowing.returned_at
                      ? `${formatDate(borrowing.returned_at)} ${formatTime(borrowing.returned_at)}`
                      : 'Not returned'}
                  </div>
                </div>

                {borrowing.authorized_by_name && (
                  <div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: '#94A3B8',
                      }}
                    >
                      Authorized By
                    </span>
                    <div style={{ fontWeight: 500, fontSize: 13.5, color: '#334155', marginTop: 2 }}>
                      {borrowing.authorized_by_name}
                    </div>
                  </div>
                )}

                {borrowing.remarks && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: '#94A3B8',
                      }}
                    >
                      Remarks
                    </span>
                    <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>
                      {borrowing.remarks}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* ── Requirement 4: Extension History ── */}
          <Card noPadding>
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                Extension Request History
              </h4>
              <span style={{ fontSize: 12, color: '#64748B' }}>
                {history.length} request{history.length === 1 ? '' : 's'}
              </span>
            </div>

            {historyLoading ? (
              <div style={{ padding: '32px 0', textAlign: 'center' }}>
                <Spinner />
              </div>
            ) : history.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                No extension requests recorded for this borrowing.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={th}>Submitted</th>
                      <th style={th}>Current Due</th>
                      <th style={th}>Requested Due</th>
                      <th style={th}>Reason</th>
                      <th style={th}>Status</th>
                      <th style={{ ...th, textAlign: 'right', paddingRight: 20 }}>Reviewed By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((req) => (
                      <tr key={req.id}>
                        <td style={td}>
                          {req.created_at ? formatDate(req.created_at) : '—'}
                        </td>
                        <td style={td}>
                          {formatDate(req.current_due_date)}
                        </td>
                        <td style={{ ...td, fontWeight: 600, color: '#1E40AF' }}>
                          {formatDate(req.requested_due_date)}
                        </td>
                        <td style={{ ...td, maxWidth: 220 }}>
                          <span style={{ fontSize: 12.5, color: '#334155' }}>
                            {req.reason}
                          </span>
                        </td>
                        <td style={td}>
                          <Badge tone={extensionStatusTone(req.status)}>
                            {req.status}
                          </Badge>
                        </td>
                        <td style={{ ...td, textAlign: 'right', paddingRight: 20 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ fontSize: 12.5, fontWeight: 500, color: '#0F172A' }}>
                              {req.reviewed_by_name || '—'}
                            </span>
                            {req.remarks && (
                              <span style={{ fontSize: 11, color: '#94A3B8' }}>
                                ({req.remarks})
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {/* ── Requirement 2 & 3: Extension Request Modal ── */}
      <Modal
        open={modalOpen}
        title="Request Due Date Extension"
        onClose={() => !submitting && setModalOpen(false)}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => void handleSubmitExtension()}
              disabled={submitting}
            >
              {submitting ? 'Submitting…' : 'Submit Extension Request'}
            </Button>
          </>
        }
      >
        <form onSubmit={(e) => void handleSubmitExtension(e)} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {errors.submit && (
            <Alert tone="error" onClose={() => setErrors((prev) => ({ ...prev, submit: undefined }))}>
              {errors.submit}
            </Alert>
          )}

          <div
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              fontSize: 12.5,
              color: '#475569',
            }}
          >
            <div>
              <strong>Current Due Date:</strong>{' '}
              {borrowing?.due_date ? formatDate(borrowing.due_date) : '—'}
            </div>
            {calculatedDueDate && (
              <div style={{ marginTop: 4, color: '#1E40AF', fontWeight: 600 }}>
                New Requested Due Date: {formatDate(calculatedDueDate)}
              </div>
            )}
          </div>

          {/* Additional Days (number input) */}
          <Input
            label="Additional Days *"
            type="number"
            min={1}
            step={1}
            placeholder="e.g. 3"
            value={additionalDays}
            onChange={(e) => setAdditionalDays(e.target.value)}
            error={errors.additionalDays}
            helperText="Enter the number of additional days you need to borrow this asset."
          />

          {/* Reason (textarea) */}
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: 6,
                fontSize: 13,
                fontWeight: 600,
                color: '#334155',
                lineHeight: 1.4,
              }}
            >
              Reason for Extension *
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a detailed explanation for why you need an extension…"
              style={{
                width: '100%',
                borderRadius: 10,
                border: errors.reason ? '1px solid #C62828' : '1px solid #E2E8F0',
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
              onFocus={(e) => {
                if (!errors.reason) e.currentTarget.style.borderColor = '#0B3D91'
              }}
              onBlur={(e) => {
                if (!errors.reason) e.currentTarget.style.borderColor = '#E2E8F0'
              }}
            />
            {errors.reason && (
              <div style={{ marginTop: 5, fontSize: 12, fontWeight: 500, color: '#C62828' }}>
                {errors.reason}
              </div>
            )}
          </div>
        </form>
      </Modal>

      <GenerateDocumentModal
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        documentType={printDocType}
        targetId={targetId ?? null}
        title={printDocType === 'return_receipt' ? 'Property Return Receipt' : 'Property Borrow Receipt'}
      />
    </div>
  )
}

export default BorrowingDetailsPage
