import { useState } from 'react'
import { Modal, Button, Input } from '@/components/ui'
import { lostAssetService } from '@/services/lostAssetService'
import type { AssetContext } from '@/types'

interface ReportLostModalProps {
  open: boolean
  onClose: () => void
  assetContext: AssetContext
  onSuccess: () => void
}

export function ReportLostModal({ open, onClose, assetContext, onSuccess }: ReportLostModalProps) {
  const [description, setDescription] = useState('')
  const [lastKnownLocation, setLastKnownLocation] = useState('')
  const [dateLost, setDateLost] = useState(new Date().toISOString().split('T')[0])
  const [remarks, setRemarks] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await lostAssetService.reportLost(assetContext.asset.id, {
        description,
        last_known_location: lastKnownLocation || undefined,
        date_lost: dateLost || undefined,
        remarks: remarks || undefined,
      })
      onSuccess()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit lost asset report.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Report Lost Asset: ${assetContext.asset.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-red-50/70 border border-red-100 p-3 rounded-xl text-xs space-y-1">
          <div className="font-bold text-red-900">Warning: Incident Report</div>
          <div className="text-red-700">
            Filing a lost asset report initiates a formal review workflow and property accountability check.
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Loss Incident Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
            placeholder="Explain how, where, or under what circumstances the asset was discovered missing..."
            required
            minLength={10}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Last Known Location</label>
            <Input
              value={lastKnownLocation}
              onChange={(e) => setLastKnownLocation(e.target.value)}
              placeholder="e.g., Regional Office Room 302"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Estimated Date Lost</label>
            <Input
              type="date"
              value={dateLost}
              onChange={(e) => setDateLost(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Additional Remarks</label>
          <Input
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Optional notes or security measures taken"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Lost Asset Report'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
