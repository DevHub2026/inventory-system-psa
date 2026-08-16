import { useState } from 'react'
import { Modal, Button, Input, Alert } from '@/components/ui'
import { assetService } from '@/services/assetService'
import type { AssetContext } from '@/types'
import { ArrowRightLeft } from 'lucide-react'

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
    if (!newEmployeeId || !reason.trim()) {
      setError('Please provide a target employee ID and reason.')
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      await assetService.reissue(assetContext.asset.id, {
        new_employee_id: Number(newEmployeeId),
        transfer_date: transferDate,
        reason: reason.trim(),
        remarks: remarks.trim() || undefined,
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
    <Modal
      open={open}
      onClose={onClose}
      title={`Request Transfer: ${assetContext.asset.name}`}
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
            <ArrowRightLeft size={14} style={{ marginRight: 6 }} />
            {submitting ? 'Submitting...' : 'Submit Transfer Request'}
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

        {/* Current Accountability Box */}
        <div style={{
          borderRadius: 10,
          border: '1px solid #BFDBFE',
          background: '#EFF6FF',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', color: '#1E40AF' }}>
              Current Accountability
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1E3A8A', marginTop: 2 }}>
              {assetContext.asset.issued_to_name || 'N/A'}
            </div>
          </div>
          <span style={{ fontSize: 12, color: '#2563EB' }}>
            Issued: {assetContext.asset.date_issued || 'N/A'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
              New Employee ID *
            </label>
            <Input
              type="number"
              value={newEmployeeId}
              onChange={(e) => setNewEmployeeId(e.target.value)}
              placeholder="e.g. 104"
              required
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
              Transfer Date *
            </label>
            <Input
              type="date"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
            Reason for Re-Issuance *
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Personnel reassignment to regional section"
            required
          />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
            Remarks
          </label>
          <Input
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Optional notes"
          />
        </div>
      </form>
    </Modal>
  )
}
