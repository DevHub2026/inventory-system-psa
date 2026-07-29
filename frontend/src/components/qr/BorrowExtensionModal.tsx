import { useState } from 'react'
import { Modal, Button, Input } from '@/components/ui'
import { borrowExtensionService } from '@/services/borrowExtensionService'
import type { AssetContext } from '@/types'

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
    setError(null)
    setSubmitting(true)

    try {
      await borrowExtensionService.requestExtension(borrowing.id, {
        requested_due_date: requestedDueDate,
        reason,
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
    <Modal open={open} onClose={onClose} title={`Request Extension for: ${assetContext.asset.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs space-y-1">
          <div className="font-semibold text-amber-900">Current Due Date</div>
          <div className="font-mono text-sm font-bold text-amber-700">
            {borrowing?.due_date || 'N/A'}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Proposed New Due Date *</label>
          <Input
            type="date"
            value={requestedDueDate}
            onChange={(e) => setRequestedDueDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Reason for Extension *</label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Project fieldwork extended by 3 days"
            required
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Extension Request'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
