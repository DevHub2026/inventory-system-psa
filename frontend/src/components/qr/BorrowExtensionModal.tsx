import { useState } from 'react'
import { Modal, Button, Input, Alert } from '@/components/ui'
import { borrowExtensionService } from '@/services/borrowExtensionService'
import type { AssetContext } from '@/types'
import { RotateCcw } from 'lucide-react'

interface BorrowExtensionModalProps {
  open: boolean
  onClose: () => void
  assetContext: AssetContext
  onSuccess: () => void
}

export function BorrowExtensionModal({ open, onClose, assetContext, onSuccess }: BorrowExtensionModalProps) {
  const [requestedDueDate, setRequestedDueDate] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const borrowing = assetContext.my_active_borrowing

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!borrowing) return
    if (!requestedDueDate || !reason.trim()) {
      setError('Please select a new due date and specify a reason.')
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      await borrowExtensionService.requestExtension(borrowing.id, {
        requested_due_date: requestedDueDate,
        reason: reason.trim(),
      })
      onSuccess()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit extension request.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Request Extension: ${assetContext.asset.name}`}
      maxWidth={620}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={submitting}
            onClick={(e) => void handleSubmit(e as unknown as React.FormEvent)}
          >
            <RotateCcw size={14} style={{ marginRight: 6 }} />
            {submitting ? 'Submitting...' : 'Submit Extension Request'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {error && (
          <Alert tone="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Current Due Date Box */}
        <div style={{
          borderRadius: 10,
          border: '1px solid #FDE68A',
          background: '#FFFBEB',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: '#92400E' }}>
              Current Due Date
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#78350F', fontFamily: 'monospace', marginTop: 2 }}>
              {borrowing?.due_date || 'N/A'}
            </div>
          </div>
          <span style={{ fontSize: 12, color: '#B45309', fontWeight: 600 }}>
            {assetContext.asset.name}
          </span>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
            Proposed New Due Date *
          </label>
          <Input
            type="date"
            value={requestedDueDate}
            onChange={(e) => setRequestedDueDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
            Reason for Extension *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Project fieldwork extended by 3 days"
            required
          />
        </div>
      </form>
    </Modal>
  )
}
