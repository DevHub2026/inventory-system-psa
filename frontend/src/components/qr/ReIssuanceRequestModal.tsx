import { useState } from 'react'
import { Modal, Button, Input } from '@/components/ui'
import { assetService } from '@/services/assetService'
import type { AssetContext } from '@/types'

interface ReIssuanceRequestModalProps {
  open: boolean
  onClose: () => void
  assetContext: AssetContext
  onSuccess: () => void
}

export function ReIssuanceRequestModal({ open, onClose, assetContext, onSuccess }: ReIssuanceRequestModalProps) {
  const [newEmployeeId, setNewEmployeeId] = useState('')
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0])
  const [reason, setReason] = useState('')
  const [remarks, setRemarks] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await assetService.reissue(assetContext.asset.id, {
        new_employee_id: Number(newEmployeeId),
        transfer_date: transferDate,
        reason,
        remarks,
      })
      onSuccess()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit re-issuance request.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Request Re-Issuance for: ${assetContext.asset.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-xs space-y-1">
          <div className="font-semibold text-blue-900">Current Accountability</div>
          <div className="text-blue-700 font-bold">{assetContext.asset.issued_to_name || 'N/A'}</div>
          <div className="text-blue-600">Date Issued: {assetContext.asset.date_issued || 'N/A'}</div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">New Employee ID *</label>
          <Input
            type="number"
            value={newEmployeeId}
            onChange={(e) => setNewEmployeeId(e.target.value)}
            placeholder="Target Employee User ID"
            required
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Transfer Date *</label>
          <Input
            type="date"
            value={transferDate}
            onChange={(e) => setTransferDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Reason for Re-Issuance *</label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Personnel reassignment to Region VII"
            required
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Remarks</label>
          <Input
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Optional notes"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Re-Issuance Request'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
