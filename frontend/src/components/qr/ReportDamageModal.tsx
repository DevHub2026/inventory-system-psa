import { useState } from 'react'
import { Modal, Button, Input, Alert } from '@/components/ui'
import { api } from '@/services/api'
import type { AssetContext } from '@/types'
import { Wrench } from 'lucide-react'

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
    if (!description.trim() || description.trim().length < 10) {
      setError('Please provide a detailed damage description (at least 10 characters).')
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      await api.post(`/assets/${assetContext.asset.id}/report-damage`, {
        type,
        severity,
        description: description.trim(),
        remarks: remarks.trim() || undefined,
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
    <Modal
      open={open}
      onClose={onClose}
      title={`Report Damage: ${assetContext.asset.name}`}
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
            <Wrench size={14} style={{ marginRight: 6 }} />
            {submitting ? 'Submitting...' : 'Submit Damage Report'}
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

        {/* Asset Context Summary Box */}
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
            background: '#EFF6FF',
            color: '#1E40AF',
            border: '1px solid #BFDBFE',
          }}>
            {assetContext.asset.office?.name || 'Main Office'}
          </span>
        </div>

        {/* Category & Severity Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
              Damage Category *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{
                width: '100%',
                height: 38,
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                padding: '0 10px',
                fontSize: 13,
                color: '#0F172A',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            >
              <option value="minor_damage">Minor Damage</option>
              <option value="major_damage">Major Damage</option>
              <option value="needs_maintenance">Needs Maintenance / Calibration</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
              Severity Level *
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              style={{
                width: '100%',
                height: 38,
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                padding: '0 10px',
                fontSize: 13,
                color: '#0F172A',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            >
              <option value="low">Low (Cosmetic)</option>
              <option value="medium">Medium (Partial Functionality)</option>
              <option value="high">High (Inoperable)</option>
              <option value="critical">Critical (Safety Hazard)</option>
            </select>
          </div>
        </div>

        {/* Damage Description */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
            Damage Description *
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
            placeholder="Describe the issue, symptoms, or visible physical damage..."
            required
            minLength={10}
          />
        </div>

        {/* Additional Remarks */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
            Additional Remarks
          </label>
          <Input
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Optional details or circumstances"
          />
        </div>
      </form>
    </Modal>
  )
}
