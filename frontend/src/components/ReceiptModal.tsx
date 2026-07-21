import { Button, Modal } from '@/components/ui'
import { borrowingStatusLabel, reservationStatusLabel } from '@/utils/displayLabels'

export interface ReceiptRecord {
  type: 'Borrowing' | 'Reservation'
  code: string
  payload: string
  employee?: string | null
  assetName?: string | null
  assetNumber?: string | null
  timestamp?: string | null
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

function QRPlaceholder({ payload }: { payload: string }) {
  const cells = Array.from({ length: 49 }, (_, index) => {
    const charCode = payload.charCodeAt(index % Math.max(payload.length, 1)) || index
    return (charCode + index) % 3 !== 0
  })

  return (
    <div className="grid h-40 w-40 grid-cols-7 gap-1 rounded border border-gray-300 bg-white p-3">
      {cells.map((filled, index) => (
        <span key={index} className={filled ? 'bg-gray-900' : 'bg-gray-100'} />
      ))}
    </div>
  )
}

function receiptTypeLabel(type: ReceiptRecord['type']) {
  return type === 'Reservation' ? 'Borrow Request' : 'Borrowed Item'
}

function receiptStatusLabel(receipt: ReceiptRecord) {
  if (!receipt.status) return 'Not available'
  return receipt.type === 'Reservation' ? reservationStatusLabel(receipt.status) : borrowingStatusLabel(receipt.status)
}

export function ReceiptModal({ receipt, onClose }: ReceiptModalProps) {
  return (
    <Modal
      open={receipt !== null}
      title={`${receipt ? receiptTypeLabel(receipt.type) : 'Transaction'} Receipt`}
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
            <div className="text-xs uppercase tracking-widest text-gray-500">Philippine Statistics Authority</div>
            <h3 className="mt-1 text-lg font-semibold text-gray-900">{receiptTypeLabel(receipt.type)} Receipt</h3>
            <p className="text-xs text-gray-500">Official transaction reference for asset custody verification.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-[170px_1fr]">
            <div className="flex flex-col items-center gap-2">
              <QRPlaceholder payload={receipt.payload} />
              <div className="break-all text-center text-xs font-semibold text-gray-700">{receipt.code}</div>
              <div className="break-all text-center text-[10px] text-gray-400">{receipt.payload}</div>
            </div>

            <dl className="grid gap-2">
              <div>
                <dt className="text-gray-500">Borrower / Employee</dt>
                <dd className="font-medium text-gray-900">{receipt.employee ?? 'Not available'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Asset / Item</dt>
                <dd className="font-medium text-gray-900">{receipt.assetName ?? 'Not available'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Asset Number</dt>
                <dd>{receipt.assetNumber ?? 'Not available'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Transaction Timestamp</dt>
                <dd>{receipt.timestamp ?? 'Not available'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Schedule</dt>
                <dd>
                  {receipt.startDate ?? 'Not set'} - {receipt.endDate ?? 'Not set'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Status</dt>
                <dd>{receiptStatusLabel(receipt)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Authorized By</dt>
                <dd>{receipt.authorizedBy ?? 'Pending staff authorization'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Authorized At</dt>
                <dd>{receipt.authorizedAt ?? 'Pending'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Remarks</dt>
                <dd>{receipt.remarks ?? 'None'}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </Modal>
  )
}
