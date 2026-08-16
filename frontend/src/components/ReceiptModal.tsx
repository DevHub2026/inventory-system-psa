import { Button, Modal } from '@/components/ui'
import { QrCode } from '@/components/QrCode'
import { borrowingStatusLabel, reservationStatusLabel } from '@/utils/displayLabels'
import { formatDate, formatTime, calculateDuration } from '@/utils/dateFormat'
import psaLogo from '@/assets/logo.png'

export interface ReceiptRecord {
  type: 'Borrowing' | 'Reservation'
  code: string
  payload: string
  employee?: string | null
  employeeId?: string | null
  assetName?: string | null
  assetNumber?: string | null
  assetCode?: string | null
  quantity?: number
  timestamp?: string | null
  borrowedAt?: string | null
  returnedAt?: string | null
  startDate?: string | null
  endDate?: string | null
  status?: string | null
  authorizedBy?: string | null
  authorizedAt?: string | null
  remarks?: string | null
}

interface ReceiptModalProps {
  receipt: ReceiptRecord | null
  onClose: () => void
}

function receiptTypeLabel(type: ReceiptRecord['type'], status?: string | null) {
  if (type === 'Reservation') return 'Borrow Request QR Slip'
  return status === 'RETURNED' ? 'Return Receipt' : 'Borrow Receipt'
}

function receiptStatusLabel(receipt: ReceiptRecord) {
  if (!receipt.status) return 'Not available'
  return receipt.type === 'Reservation'
    ? reservationStatusLabel(receipt.status)
    : borrowingStatusLabel(receipt.status)
}

function statusColor(status?: string | null) {
  if (!status) return { color: '#6B7280', background: '#F3F4F6' }
  const s = status.toUpperCase()
  if (s === 'APPROVED' || s === 'ACTIVE' || s === 'RETURNED')
    return { color: '#065F46', background: '#D1FAE5' }
  if (s === 'PENDING')
    return { color: '#92400E', background: '#FEF3C7' }
  if (s === 'REJECTED' || s === 'CANCELLED')
    return { color: '#991B1B', background: '#FEE2E2' }
  return { color: '#1E40AF', background: '#DBEAFE' }
}

// ─── Reusable field row ────────────────────────────────────────────────────────
function Field({ label, value, mono = false }: { label: string; value?: React.ReactNode; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9CA3AF' }}>
        {label}
      </span>
      <span style={{
        fontSize: 13, fontWeight: 500, color: '#111827',
        fontFamily: mono ? 'ui-monospace, monospace' : 'inherit',
      }}>
        {value ?? <span style={{ color: '#D1D5DB' }}>—</span>}
      </span>
    </div>
  )
}

// ─── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 0 }}>
      {title && (
        <div style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
          color: '#6B7280', marginBottom: 10, paddingBottom: 5,
          borderBottom: '1px solid #F3F4F6',
        }}>
          {title}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px 18px' }}>
        {children}
      </div>
    </div>
  )
}

export function ReceiptModal({ receipt, onClose }: ReceiptModalProps) {
  const title = receipt ? receiptTypeLabel(receipt.type, receipt.status) : 'Transaction'
  const sc = statusColor(receipt?.status)

  return (
    <Modal
      open={receipt !== null}
      title={title === 'Borrow Request QR Slip' ? 'Borrow Request QR Slip' : `${title} Receipt`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button onClick={() => window.print()}>Print Receipt</Button>
        </>
      }
    >
      {receipt && (
        <div className="receipt-print-area" style={{ fontFamily: 'inherit', color: '#111827' }}>

          {/* ── Header: Logo + Agency name ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
            paddingBottom: 16, marginBottom: 16,
            borderBottom: '2px solid #1E40AF',
          }}>
            <img
              src={psaLogo}
              alt="PSA Logo"
              style={{ width: 80, height: 80, objectFit: 'contain', flexShrink: 0, background: 'transparent' }}
            />
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280' }}>
                Republic of the Philippines
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1E3A8A', lineHeight: 1.2 }}>
                Philippine Statistics Authority
              </div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                Inventory Management System
              </div>
            </div>

            {/* Receipt type badge — pushed right */}
            <div style={{ marginLeft: 'auto', textAlign: 'right', minWidth: 150 }}>
              <div style={{
                display: 'inline-block',
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                color: '#1E40AF', background: '#DBEAFE',
                border: '1px solid #BFDBFE',
                borderRadius: 6, padding: '3px 10px',
                marginBottom: 4,
              }}>
                {title}
              </div>
              <div style={{ fontSize: 10, color: '#9CA3AF' }}>Official Transaction Document</div>
            </div>
          </div>

          {/* ── Divider title ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>
              Transaction Details
            </div>
            <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
            <div style={{
              fontSize: 12, fontWeight: 700,
              fontFamily: 'ui-monospace, monospace',
              color: '#1E40AF', background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: 5, padding: '2px 8px',
            }}>
              {receipt.code}
            </div>
          </div>

          {/* ── Main body: details left, QR right ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20, alignItems: 'start' }}>

            {/* Left: field sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <Section title="Personnel">
                <Field label="Employee Name" value={receipt.employee} />
                {receipt.employeeId
                  ? <Field label="Employee ID"   value={receipt.employeeId} mono />
                  : <div />
                }
              </Section>

              <Section title="Asset Information">
                <Field label="Asset Name"  value={receipt.assetName} />
                <Field label="Asset Number"  value={receipt.assetNumber ?? receipt.assetCode} mono />
                {receipt.quantity !== undefined && (
                  <Field label="Quantity" value={String(receipt.quantity)} />
                )}
              </Section>

              {(receipt.borrowedAt || receipt.startDate) && (
                <Section title="Schedule">
                  {receipt.borrowedAt && (
                    <>
                      <Field label="Borrow Date" value={formatDate(receipt.borrowedAt)} />
                      <Field label="Borrow Time" value={formatTime(receipt.borrowedAt)} />
                    </>
                  )}
                  {receipt.returnedAt && (
                    <>
                      <Field label="Return Date" value={formatDate(receipt.returnedAt)} />
                      <Field label="Return Time" value={formatTime(receipt.returnedAt)} />
                      {receipt.borrowedAt && (
                        <Field label="Duration" value={calculateDuration(receipt.borrowedAt, receipt.returnedAt)} />
                      )}
                    </>
                  )}
                  {receipt.startDate && !receipt.borrowedAt && (
                    <Field label="Requested Date" value={formatDate(receipt.startDate)} />
                  )}
                  {receipt.endDate && (
                    <Field label="Expected Return" value={formatDate(receipt.endDate)} />
                  )}
                </Section>
              )}

              <Section title="Status & Authorization">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9CA3AF' }}>
                    Status
                  </span>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center',
                    fontSize: 12, fontWeight: 700,
                    color: sc.color, background: sc.background,
                    borderRadius: 5, padding: '2px 8px',
                    width: 'fit-content',
                  }}>
                    {receiptStatusLabel(receipt)}
                  </span>
                </div>
                <Field label="Processed By" value={receipt.authorizedBy ?? 'Admin'} />
                {receipt.authorizedAt && (
                  <Field label="Processed On" value={formatDate(receipt.authorizedAt)} />
                )}
              </Section>

              {receipt.remarks && (
                <div style={{
                  padding: '10px 12px', background: '#FFFBEB',
                  border: '1px solid #FDE68A', borderRadius: 8,
                  fontSize: 12, color: '#92400E',
                }}>
                  <span style={{ fontWeight: 700 }}>Remarks: </span>
                  {receipt.remarks}
                </div>
              )}
            </div>

            {/* Right: QR code */}
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              padding: '12px 10px',
              border: '1px solid #E5E7EB', borderRadius: 10,
              background: '#F9FAFB',
            }}>
              <div style={{ border: '1px solid #E5E7EB', borderRadius: 6, padding: 6, background: '#fff' }}>
                <QrCode
                  value={receipt.payload}
                  className="h-32 w-32 rounded bg-white text-gray-950"
                />
              </div>
              <div style={{
                fontSize: 10, fontWeight: 700,
                fontFamily: 'ui-monospace, monospace',
                color: '#374151', textAlign: 'center',
                wordBreak: 'break-all',
              }}>
                {receipt.code}
              </div>
              <div style={{
                fontSize: 9, color: '#9CA3AF', textAlign: 'center',
                wordBreak: 'break-all', lineHeight: 1.4,
              }}>
                {receipt.payload}
              </div>
              <div style={{ fontSize: 9, color: '#9CA3AF', textAlign: 'center', marginTop: 2 }}>
                Scan to verify
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div style={{
            marginTop: 20, paddingTop: 12,
            borderTop: '1px solid #E5E7EB',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ fontSize: 10, color: '#9CA3AF' }}>
              This document serves as an official record of asset transaction.
            </div>
            <div style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'ui-monospace, monospace' }}>
              PSA — Inventory System
            </div>
          </div>

        </div>
      )}
    </Modal>
  )
}
