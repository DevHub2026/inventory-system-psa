import { useState } from 'react'
import { Modal, Button, Input, Alert } from '@/components/ui'
import { api } from '@/services/api'
import type { AssetContext } from '@/types'
import { Package } from 'lucide-react'

interface BorrowRequestModalProps {
  open: boolean
  onClose: () => void
  assetContext: AssetContext
  onSuccess: () => void
}

export function BorrowRequestModal({ open, onClose, assetContext, onSuccess }: BorrowRequestModalProps) {
  const [purpose, setPurpose] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  const [remarks, setRemarks] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!purpose.trim()) {
      setError('Please provide a purpose for borrowing.')
      return
    }

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
    <Modal
      open={open}
      onClose={onClose}
      title={`Request to Borrow Asset: ${assetContext.asset.name}`}
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
            <Package size={14} style={{ marginRight: 6 }} />
            {submitting ? 'Submitting...' : 'Submit Borrow Request'}
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

        {/* Asset Summary Badge */}
        <div style={{
          borderRadius: 10,
          border: '1px solid #BFDBFE',
          background: '#EFF6FF',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1E40AF' }}>
              {assetContext.asset.name}
            </div>
            <div style={{ fontSize: 12, color: '#2563EB', fontFamily: 'monospace', marginTop: 2 }}>
              {assetContext.asset.psa_qr_identifier || assetContext.asset.asset_number}
            </div>
          </div>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '3px 10px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            background: '#FFFFFF',
            color: '#1E40AF',
            border: '1px solid #BFDBFE',
          }}>
            {assetContext.asset.office?.name || 'Main Office'}
          </span>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
            Borrow Purpose *
          </label>
          <Input
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="e.g., Field survey data collection"
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
              Start Date *
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
              Expected Return Date *
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
            Additional Remarks
          </label>
          <Input
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Optional additional notes"
          />
        </div>
      </form>
    </Modal>
  )
}
