import { useState } from 'react'
import { Modal, Button, Input } from '@/components/ui'
import { api } from '@/services/api'
import type { AssetContext } from '@/types'

interface ReportDamageModalProps {
  open: boolean
  onClose: () => void
  assetContext: AssetContext
  onSuccess: () => void
}

export function ReportDamageModal({ open, onClose, assetContext, onSuccess }: ReportDamageModalProps) {
  const [type, setType] = useState('minor_damage')
  const [severity, setSeverity] = useState('medium')
  const [description, setDescription] = useState('')
  const [remarks, setRemarks] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await api.post(`/assets/${assetContext.asset.id}/report-damage`, {
        type,
        severity,
        description,
        remarks: remarks || undefined,
      })
      onSuccess()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit damage report.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Report Damage: ${assetContext.asset.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Damage Category *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="minor_damage">Minor Damage</option>
              <option value="major_damage">Major Damage</option>
              <option value="needs_maintenance">Needs Maintenance / Calibration</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Severity *</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="low">Low (Cosmetic)</option>
              <option value="medium">Medium (Partial Functionality)</option>
              <option value="high">High (Inoperable)</option>
              <option value="critical">Critical (Safety Hazard)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Damage Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
            placeholder="Describe the issue, symptoms, or visible physical damage..."
            required
            minLength={10}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Additional Remarks</label>
          <Input
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Optional details or circumstances"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Damage Report'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
