import { useState } from 'react'
import { Modal, Button, Input } from '@/components/ui'
import { api } from '@/services/api'
import type { AssetContext } from '@/types'

interface BorrowRequestModalProps {
  open: boolean
  onClose: () => void
  assetContext: AssetContext
  onSuccess: () => void
}

const todayIsoDate = () => new Date().toISOString().split('T')[0]
const dateAfterDaysIso = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

export function BorrowRequestModal({ open, onClose, assetContext, onSuccess }: BorrowRequestModalProps) {
  const [purpose, setPurpose] = useState('')
  const [startDate, setStartDate] = useState(todayIsoDate)
  const [endDate, setEndDate] = useState(() => dateAfterDaysIso(7))
  const [remarks, setRemarks] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await api.post('/reservations', {
        asset_ids:  [assetContext.asset.id],
        purpose:    purpose.trim(),
        start_date: startDate,
        end_date:   endDate,
        remarks:    remarks.trim() || undefined,
      })
      onSuccess()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit borrow request.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Request to Borrow Asset: ${assetContext.asset.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-blue-50/70 border border-blue-100 p-3 rounded-xl text-xs space-y-1">
          <div className="font-bold text-blue-900">{assetContext.asset.name}</div>
          <div className="text-blue-700 font-mono">Code: {assetContext.asset.asset_number}</div>
          <div className="text-blue-600">
            Location: {assetContext.asset.office?.name || 'N/A'} - {assetContext.asset.location?.name || 'N/A'}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Borrow Purpose *</label>
          <Input
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="e.g., Field survey data collection"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Start Date *</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Expected Return Date *</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Additional Remarks</label>
          <Input
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Optional additional details"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Borrow Request'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
