import { useState, useEffect } from 'react'
import { Modal, Button, Input, Spinner, Alert } from '@/components/ui'
import { userService } from '@/services/userService'
import { assetService } from '@/services/assetService'
import type { Asset, User } from '@/types'
import { PrintableDocumentModal } from '@/components/documents/PrintableDocumentModal'

interface ReissueAssetModalProps {
  open: boolean
  onClose: () => void
  asset: Asset
  onSuccess: () => void
}

export function ReissueAssetModal({ open, onClose, asset, onSuccess }: ReissueAssetModalProps) {
  const [step, setStep] = useState(1)
  const [loadingUser, setLoadingUser] = useState(false)
  const [currentHolderUser, setCurrentHolderUser] = useState<User | null>(null)

  // Step 2 state
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [searchingUsers, setSearchingUsers] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Step 3 state
  const [transferDate, setTransferDate] = useState(new Date().toISOString().slice(0, 10))
  const [reason, setReason] = useState('')
  const [remarks, setRemarks] = useState('')

  // Step 4 state
  const [confirmed, setConfirmed] = useState(false)

  // Step 5 state
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [historyId, setHistoryId] = useState<number | null>(null)
  const [printModalOpen, setPrintModalOpen] = useState(false)

  // Quick reasons
  const quickReasons = [
    'Promotion',
    'Resigned',
    'Department reassignment',
    'Office transfer',
    'Replacement',
  ]

  // Resolve current holder user
  useEffect(() => {
    if (!open || !asset) return

    // Reset state
    setStep(1)
    setCurrentHolderUser(null)
    setSelectedUser(null)
    setSearchQuery('')
    setUsers([])
    setReason('')
    setRemarks('')
    setConfirmed(false)
    setErrorMsg(null)
    setHistoryId(null)

    const fetchCurrentHolder = async () => {
      setLoadingUser(true)
      try {
        if (asset.issued_to_user_id) {
          const u = await userService.getUser(asset.issued_to_user_id)
          setCurrentHolderUser(u)
        } else if (asset.issued_to) {
          // Attempt search by name
          const paginated = await userService.getUsers({ search: asset.issued_to })
          if (paginated.items.length > 0) {
            setCurrentHolderUser(paginated.items[0])
          }
        }
      } catch (e) {
        console.error('Failed to load current holder user details:', e)
      } finally {
        setLoadingUser(false)
      }
    }

    void fetchCurrentHolder()
  }, [open, asset])

  // Search users for step 2
  useEffect(() => {
    if (step !== 2 || !open) return

    const searchEmployees = async () => {
      setSearchingUsers(true)
      try {
        const paginated = await userService.getUsers({ search: searchQuery, per_page: 50 })
        // Exclude current holder
        const filtered = paginated.items.filter(
          (u) => u.id !== asset.issued_to_user_id && u.full_name !== asset.issued_to
        )
        setUsers(filtered)
      } catch (e) {
        console.error('Failed to search employees:', e)
      } finally {
        setSearchingUsers(false)
      }
    }

    const timer = setTimeout(() => {
      void searchEmployees()
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, step, open, asset])

  const handleNext = () => {
    if (step === 2 && !selectedUser) return
    if (step === 3 && !reason.trim()) return
    if (step === 4 && !confirmed) return

    setStep((prev) => prev + 1)
  }

  const handleBack = () => {
    setStep((prev) => prev - 1)
  }

  const handleSubmit = async () => {
    if (!selectedUser) return
    setSubmitting(true)
    setErrorMsg(null)

    try {
      const response = await assetService.reissue(asset.id, {
        new_employee_id: selectedUser.id,
        transfer_date: transferDate,
        reason: reason.trim(),
        remarks: remarks.trim(),
      })
      setHistoryId(response.history_id)
      setStep(5)
      onSuccess()
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to transfer accountability.')
    } finally {
      setSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: 12 }}>
                Current Accountability
              </h4>
              {loadingUser ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
                  <Spinner label="Loading current holder details..." />
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 0', color: '#64748b', fontWeight: 500 }}>Employee Name</td>
                      <td style={{ padding: '8px 0', color: '#1e293b', fontWeight: 600 }}>{asset.issued_to}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 0', color: '#64748b', fontWeight: 500 }}>Employee Number</td>
                      <td style={{ padding: '8px 0', color: '#1e293b', fontWeight: 500 }}>
                        {currentHolderUser?.employee_number || 'N/A'}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 0', color: '#64748b', fontWeight: 500 }}>Office</td>
                      <td style={{ padding: '8px 0', color: '#1e293b', fontWeight: 500 }}>
                        {asset.office || 'PSA Regional Office'}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 0', color: '#64748b', fontWeight: 500 }}>Department</td>
                      <td style={{ padding: '8px 0', color: '#1e293b', fontWeight: 500 }}>
                        {currentHolderUser?.department?.name || 'N/A'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px 0', color: '#64748b', fontWeight: 500 }}>Date Issued</td>
                      <td style={{ padding: '8px 0', color: '#1e293b', fontWeight: 500 }}>
                        {asset.date_issued || 'N/A'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )

      case 2:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                Search and Select New Employee
              </label>
              <Input
                placeholder="Type name or email to search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div
              style={{
                maxHeight: 200,
                overflowY: 'auto',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                background: '#ffffff',
              }}
            >
              {searchingUsers ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
                  <Spinner />
                </div>
              ) : users.length === 0 ? (
                <div style={{ padding: 16, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                  No active employees found matching query.
                </div>
              ) : (
                users.map((u) => {
                  const isSelected = selectedUser?.id === u.id
                  return (
                    <div
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        background: isSelected ? '#eff6ff' : '#ffffff',
                        borderBottom: '1px solid #f1f5f9',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = isSelected ? '#eff6ff' : '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = isSelected ? '#eff6ff' : '#ffffff')}
                    >
                      <div style={{ display: 'flex', justifySelf: 'space-between', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{u.full_name}</span>
                        <span style={{ fontSize: 11, fontWeight: 500, color: '#64748b', fontFamily: 'monospace' }}>
                          {u.employee_number}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        {u.office?.name || 'PSA Regional Office'} • {u.department?.name || 'No Department'}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {selectedUser && (
              <div
                style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  padding: 12,
                  borderRadius: 10,
                  fontSize: 13,
                  color: '#1e40af',
                }}
              >
                Selected: <strong>{selectedUser.full_name}</strong> ({selectedUser.employee_number})
              </div>
            )}
          </div>
        )

      case 3:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                Transfer Date
              </label>
              <Input type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                Reason for Transfer <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Provide detailed explanation..."
                style={{
                  width: '100%',
                  height: 80,
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  padding: '8px 12px',
                  fontSize: 13,
                  outline: 'none',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {quickReasons.map((qr) => (
                  <button
                    key={qr}
                    type="button"
                    onClick={() => setReason(qr)}
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: '#0d47a1',
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: 16,
                      padding: '4px 10px',
                      cursor: 'pointer',
                    }}
                  >
                    {qr}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                Remarks (Optional)
              </label>
              <Input
                placeholder="Additional notes..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>
        )

      case 4:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: 12 }}>
                Confirm Transfer Details
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                <div>
                  <span style={{ color: '#64748b' }}>Asset:</span>{' '}
                  <strong style={{ color: '#1e293b' }}>
                    {asset.name} ({asset.asset_number})
                  </strong>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                      Current Holder
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#475569', marginTop: 4 }}>
                      {asset.issued_to}
                    </div>
                  </div>
                  <div style={{ fontSize: 20, color: '#94a3b8' }}>➔</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#0066cc', textTransform: 'uppercase', fontWeight: 600 }}>
                      New Holder
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0d47a1', marginTop: 4 }}>
                      {selectedUser?.full_name}
                    </div>
                  </div>
                </div>

                <div>
                  <span style={{ color: '#64748b' }}>Transfer Date:</span>{' '}
                  <strong style={{ color: '#1e293b' }}>{transferDate}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Reason:</span>{' '}
                  <strong style={{ color: '#1e293b' }}>{reason}</strong>
                </div>
                {remarks && (
                  <div>
                    <span style={{ color: '#64748b' }}>Remarks:</span>{' '}
                    <span style={{ color: '#1e293b' }}>{remarks}</span>
                  </div>
                )}
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', fontSize: 13, color: '#334155' }}>
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                style={{ marginTop: 3 }}
              />
              <span>I confirm this asset will now be permanently assigned to the selected employee.</span>
            </label>
          </div>
        )

      case 5:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16, padding: '20px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: 28, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Transfer Completed Successfully!</h3>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 6, maxWidth: 360 }}>
                The accountability of this asset has been permanently reassigned to {selectedUser?.full_name}.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <Button onClick={() => setPrintModalOpen(true)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                Print Re-Issuance Form
              </Button>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={step === 5 ? 'Accountability Transfer Completed' : `Re-Issue Asset (Step ${step} of 4)`}
        maxWidth={500}
        footer={
          step === 5 ? (
            <Button onClick={onClose} variant="secondary" style={{ width: '100%' }}>
              Done
            </Button>
          ) : (
            <div style={{ display: 'flex', justifySelf: 'space-between', justifyContent: 'space-between', width: '100%' }}>
              {step > 1 ? (
                <Button variant="secondary" onClick={handleBack} disabled={submitting}>
                  Back
                </Button>
              ) : (
                <Button variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
              )}

              {step === 4 ? (
                <Button onClick={handleSubmit} disabled={!confirmed || submitting}>
                  {submitting ? 'Processing...' : 'Transfer Accountability'}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={
                    (step === 2 && !selectedUser) ||
                    (step === 3 && !reason.trim())
                  }
                >
                  Next
                </Button>
              )}
            </div>
          )
        }
      >
        {errorMsg && (
          <div style={{ marginBottom: 12 }}>
            <Alert tone="error">{errorMsg}</Alert>
          </div>
        )}
        {renderStep()}
      </Modal>

      {historyId && (
        <PrintableDocumentModal
          open={printModalOpen}
          onClose={() => setPrintModalOpen(false)}
          documentType="reissuance"
          targetId={historyId}
          title="Asset Re-Issuance Form"
        />
      )}
    </>
  )
}
