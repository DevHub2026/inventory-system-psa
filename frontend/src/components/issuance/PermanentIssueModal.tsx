import { useEffect, useState } from 'react'
import { Alert, Button, Modal } from '@/components/ui'
import { IssuanceUserSearchSelect } from '@/components/issuance/IssuanceUserSearchSelect'
import { permanentIssuanceService } from '@/services/permanentIssuanceService'
import type { Asset } from '@/types'
import type { IssuanceUserSummary } from '@/types/permanentIssuance'
import { notifyDataChanged } from '@/utils/dataRefresh'

const SELECT_CLS =
  'w-full h-11 rounded-[10px] border border-[#E5E7EB] bg-white px-3.5 text-[14px] text-[#1F2937] ' +
  'shadow-[0_1px_2px_rgba(0,0,0,.05)] transition-colors duration-200 ' +
  'focus:border-[#0D47A1] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]/15'

const LABEL_CLS = 'mb-1.5 block text-[13px] font-medium text-[#1F2937]'

interface PermanentIssueModalProps {
  open: boolean
  onClose: () => void
  asset: Asset
  onSuccess: () => void
}

export function PermanentIssueModal({ open, onClose, asset, onSuccess }: PermanentIssueModalProps) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [selectedUser, setSelectedUser] = useState<IssuanceUserSummary | null>(null)
  const [dateIssued, setDateIssued] = useState(new Date().toISOString().slice(0, 10))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setSelectedUserId(null)
    setSelectedUser(null)
    setDateIssued(new Date().toISOString().slice(0, 10))
    setError(null)
    setSubmitting(false)
  }, [open, asset.id])

  const handleSubmit = async () => {
    if (!selectedUserId) {
      setError('Please select an accountable employee.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await permanentIssuanceService.assignPermanentIssue(asset.id, {
        issued_to_user_id: selectedUserId,
        date_issued: dateIssued,
      })
      notifyDataChanged('assets')
      onSuccess()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to permanently issue asset.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Permanent Issuance"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? 'Issuing…' : 'Issue Asset'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3.5 text-sm text-[#475569]">
          <p><span className="font-semibold text-[#0F172A]">Asset:</span> {asset.name}</p>
          <p className="mt-1"><span className="font-semibold text-[#0F172A]">Property Number:</span> {asset.property_number ?? '—'}</p>
          <p className="mt-1"><span className="font-semibold text-[#0F172A]">Asset Number:</span> {asset.asset_number}</p>
        </div>

        <IssuanceUserSearchSelect
          value={selectedUserId}
          initialUser={selectedUser}
          onChange={(userId, user) => {
            setSelectedUserId(userId)
            setSelectedUser(user)
          }}
        />

        <div>
          <label className={LABEL_CLS}>Date Issued</label>
          <input
            type="date"
            className={SELECT_CLS}
            value={dateIssued}
            onChange={(e) => setDateIssued(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  )
}
