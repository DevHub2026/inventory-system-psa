import { useState } from 'react'
import { Modal, Button, Input, Alert } from '@/components/ui'
import { lostAssetService } from '@/services/lostAssetService'
import type { AssetContext } from '@/types'
import { AlertTriangle, HelpCircle } from 'lucide-react'

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
    if (!description.trim() || description.trim().length < 10) {
      setError('Please provide a detailed loss incident description (at least 10 characters).')
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      await lostAssetService.reportLost(assetContext.asset.id, {
        description: description.trim(),
        last_known_location: lastKnownLocation.trim() || undefined,
        date_lost: dateLost || undefined,
        remarks: remarks.trim() || undefined,
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
    <Modal
      open={open}
      onClose={onClose}
      title={`Report Lost Asset: ${assetContext.asset.name}`}
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
            variant="danger"
            size="sm"
            disabled={submitting}
            onClick={(e) => void handleSubmit(e as unknown as React.FormEvent)}
          >
            <HelpCircle size={14} style={{ marginRight: 6 }} />
            {submitting ? 'Submitting...' : 'Submit Lost Asset Report'}
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

        {/* Incident Warning Banner */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          borderRadius: 10,
          border: '1px solid #FECACA',
          background: '#FEF2F2',
          padding: '12px 14px',
        }}>
          <AlertTriangle size={18} style={{ color: '#DC2626', flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#991B1B' }}>
              Official Incident Report Notice
            </div>
            <div style={{ fontSize: 12, color: '#B91C1C', marginTop: 2, lineHeight: 1.4 }}>
              Filing a lost asset report initiates a formal administrative review workflow and property accountability check.
            </div>
          </div>
        </div>

        {/* Asset Summary Badge */}
        <div style={{
          borderRadius: 10,
          border: '1px solid #E2E8F0',
          background: '#F8FAFC',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
              {assetContext.asset.name}
            </div>
            <div style={{ fontSize: 12, color: '#64748B', fontFamily: 'monospace', marginTop: 2 }}>
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
            background: '#F1F5F9',
            color: '#475569',
            border: '1px solid #E2E8F0',
          }}>
            {assetContext.asset.office?.name || 'Main Office'}
          </span>
        </div>

        {/* Loss Incident Description */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
            Loss Incident Description *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              padding: '10px 12px',
              fontSize: 13,
              color: '#0F172A',
              outline: 'none',
              resize: 'vertical',
              minHeight: 72,
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
            placeholder="Explain how, where, or under what circumstances the asset was discovered missing..."
            required
            minLength={10}
          />
        </div>

        {/* Location & Date Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
              Last Known Location
            </label>
            <Input
              value={lastKnownLocation}
              onChange={(e) => setLastKnownLocation(e.target.value)}
              placeholder="e.g., Regional Office Room 302"
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
              Estimated Date Lost
            </label>
            <Input
              type="date"
              value={dateLost}
              onChange={(e) => setDateLost(e.target.value)}
            />
          </div>
        </div>

        {/* Additional Remarks */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
            Additional Remarks
          </label>
          <Input
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Optional notes or security measures taken"
          />
        </div>
      </form>
    </Modal>
  )
}
