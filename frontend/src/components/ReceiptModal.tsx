import { Button, Modal } from '@/components/ui'
import { QrCode } from '@/components/QrCode'
import { borrowingStatusLabel, reservationStatusLabel } from '@/utils/displayLabels'
import { formatDate, formatTime, calculateDuration } from '@/utils/dateFormat'

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

function receiptTypeLabel(type: ReceiptRecord['type'], status?: string) {
  if (type === 'Reservation') return 'Borrow Request'
  return status === 'RETURNED' ? 'Return Receipt' : 'Borrow Receipt'
}

function receiptStatusLabel(receipt: ReceiptRecord) {
  if (!receipt.status) return 'Not available'
  return receipt.type === 'Reservation' ? reservationStatusLabel(receipt.status) : borrowingStatusLabel(receipt.status)
}

export function ReceiptModal({ receipt, onClose }: ReceiptModalProps) {
  return (
    <Modal
      open={receipt !== null}
      title={`${receipt ? receiptTypeLabel(receipt.type, receipt.status) : 'Transaction'} Receipt`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => window.print()}>Print Receipt</Button>
        </>
      }
    >
      {receipt && (
        <div className="receipt-print-area space-y-4 text-sm">
          <div className="rounded-md border border-gray-200 p-4">
            <div className="text-xs uppercase tracking-widest text-gray-500">INVENTORY MANAGEMENT SYSTEM</div>
            <h3 className="mt-1 text-lg font-semibold text-gray-900">{receiptTypeLabel(receipt.type, receipt.status)}</h3>
            <p className="text-xs text-gray-500">Official transaction reference for asset custody verification.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-[170px_1fr]">
            <div className="flex flex-col items-center gap-2">
              <QrCode value={receipt.payload} className="h-40 w-40 rounded border border-gray-300 bg-white p-2 text-gray-950" />
              <div className="break-all text-center text-xs font-semibold text-gray-700">{receipt.code}</div>
              <div className="break-all text-center text-[10px] text-gray-400">{receipt.payload}</div>
            </div>

            <dl className="grid gap-2">
              <div>
                <dt className="text-gray-500">Receipt No.</dt>
                <dd className="font-medium text-gray-900">{receipt.code}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Employee</dt>
                <dd className="font-medium text-gray-900">{receipt.employee ?? 'Not available'}</dd>
              </div>
              {receipt.employeeId && (
                <div>
                  <dt className="text-gray-500">Employee ID</dt>
                  <dd>{receipt.employeeId}</dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500">Asset</dt>
                <dd className="font-medium text-gray-900">{receipt.assetName ?? 'Not available'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Asset Code</dt>
                <dd>{receipt.assetCode ?? receipt.assetNumber ?? 'Not available'}</dd>
              </div>
              {receipt.quantity !== undefined && (
                <div>
                  <dt className="text-gray-500">Quantity</dt>
                  <dd>{receipt.quantity}</dd>
                </div>
              )}
              {receipt.borrowedAt && (
                <>
                  <div>
                    <dt className="text-gray-500">Borrow Date</dt>
                    <dd>{formatDate(receipt.borrowedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Borrow Time</dt>
                    <dd>{formatTime(receipt.borrowedAt)}</dd>
                  </div>
                </>
              )}
              {receipt.returnedAt && (
                <>
                  <div>
                    <dt className="text-gray-500">Return Date</dt>
                    <dd>{formatDate(receipt.returnedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Return Time</dt>
                    <dd>{formatTime(receipt.returnedAt)}</dd>
                  </div>
                  {receipt.borrowedAt && (
                    <div>
                      <dt className="text-gray-500">Borrow Duration</dt>
                      <dd>{calculateDuration(receipt.borrowedAt, receipt.returnedAt)}</dd>
                    </div>
                  )}
                </>
              )}
              <div>
                <dt className="text-gray-500">Status</dt>
                <dd className="font-medium text-gray-900">{receiptStatusLabel(receipt)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Processed By</dt>
                <dd>{receipt.authorizedBy ?? 'Admin'}</dd>
              </div>
              {receipt.remarks && (
                <div>
                  <dt className="text-gray-500">Remarks</dt>
                  <dd>{receipt.remarks}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}
    </Modal>
  )
}
