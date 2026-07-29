import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal, Button, Badge, Alert, Card } from '@/components/ui'
import type { AssetContext } from '@/types'
import { BorrowRequestModal } from '@/components/qr/BorrowRequestModal'
import { ReportDamageModal } from '@/components/qr/ReportDamageModal'
import { ReportLostModal } from '@/components/qr/ReportLostModal'
import { ReIssuanceRequestModal } from '@/components/qr/ReIssuanceRequestModal'
import { BorrowExtensionModal } from '@/components/qr/BorrowExtensionModal'
import {
  Package,
  MapPin,
  Clock,
  Wrench,
  HelpCircle,
  QrCode,
  RotateCcw,
  User as UserIcon,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react'

interface ScannedAssetResultModalProps {
  open: boolean
  onClose: () => void
  context: AssetContext | null
  scanSource?: 'sidebar_scanner' | 'assets_page_scanner'
  onScanAnother?: () => void
}

export function ScannedAssetResultModal({
  open,
  onClose,
  context,
  onScanAnother,
}: ScannedAssetResultModalProps) {
  const navigate = useNavigate()
  const [activeModal, setActiveModal] = useState<'borrow' | 'extension' | 'reissuance' | 'damage' | 'lost' | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  if (!context) return null

  const { asset, actions, active_borrowing, pending_reservation, active_maintenance } = context

  const isAvailable = asset.status === 'AVAILABLE'
  const isBorrowed = asset.status === 'BORROWED' || Boolean(active_borrowing)
  const isReserved = asset.status === 'RESERVED' || Boolean(pending_reservation)
  const isMaintenance = asset.status === 'MAINTENANCE' || Boolean(active_maintenance)
  const isPermanentlyIssued = Boolean(asset.issued_to)

  return (
    <>
      <Modal
        open={open && !activeModal}
        onClose={onClose}
        title={`Scanned Asset: ${asset.name}`}
        maxWidth="max-w-xl"
      >
        <div className="space-y-4 text-slate-800">
          {successMessage && (
            <Alert tone="success" onClose={() => setSuccessMessage(null)}>
              {successMessage}
            </Alert>
          )}

          {/* Asset Hero Header */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3 relative overflow-hidden shadow-md">
            <div className="flex items-start justify-between gap-3 relative z-10">
              <div>
                <span className="font-mono text-[11px] font-bold text-blue-300 bg-blue-950/80 border border-blue-800/80 px-2 py-0.5 rounded-md">
                  {asset.asset_number}
                </span>
                <h2 className="text-lg font-extrabold text-white mt-1.5">{asset.name}</h2>
                {asset.psa_qr_identifier && (
                  <div className="flex items-center gap-1.5 text-xs text-blue-400 font-mono mt-0.5">
                    <QrCode className="w-3.5 h-3.5" /> {asset.psa_qr_identifier}
                  </div>
                )}
              </div>
              <Badge tone={asset.status === 'AVAILABLE' ? 'green' : asset.status === 'BORROWED' ? 'blue' : 'yellow'}>
                {asset.status}
              </Badge>
            </div>

            {asset.description && (
              <p className="text-xs text-slate-300 line-clamp-2 relative z-10">{asset.description}</p>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-800/80 text-slate-300 relative z-10">
              <div className="flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-slate-400" />
                <span>Category: <strong className="text-white">{asset.category?.name || 'N/A'}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">Office: <strong className="text-white">{asset.office?.name || 'N/A'}</strong></span>
              </div>
            </div>
          </div>

          {/* Availability & State Warnings */}
          {isAvailable && !isPermanentlyIssued && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3.5 rounded-xl text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <strong className="font-bold">Ready to Borrow:</strong> This asset is currently available for borrowing requests.
              </div>
            </div>
          )}

          {isBorrowed && (
            <div className="bg-blue-50 border border-blue-200 text-blue-900 p-3.5 rounded-xl text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-blue-900">
                <Clock className="w-4 h-4 text-blue-600" /> Currently Borrowed
              </div>
              <p className="text-blue-800">This asset is currently borrowed and cannot be requested at this time.</p>
              {active_borrowing?.user_name && (
                <div className="text-[11px] text-blue-700 pt-1">
                  Borrower: <strong>{active_borrowing.user_name}</strong> (Due: {active_borrowing.due_date || 'N/A'})
                </div>
              )}
            </div>
          )}

          {isReserved && !isBorrowed && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-xl text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <Clock className="w-4 h-4 text-amber-600" /> Pending Reservation
              </div>
              <p className="text-amber-800">This asset is currently reserved and is temporarily unavailable.</p>
            </div>
          )}

          {isMaintenance && (
            <div className="bg-purple-50 border border-purple-200 text-purple-900 p-3.5 rounded-xl text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-purple-900">
                <Wrench className="w-4 h-4 text-purple-600" /> Under Maintenance
              </div>
              <p className="text-purple-800">This asset is currently under maintenance and cannot be borrowed.</p>
            </div>
          )}

          {isPermanentlyIssued && (
            <div className="bg-slate-100 border border-slate-200 text-slate-800 p-3.5 rounded-xl text-xs space-y-1">
              <div className="font-bold text-slate-900">Permanently Issued</div>
              <p className="text-slate-600">Issued to: <strong>{asset.issued_to_name || asset.issued_to}</strong></p>
            </div>
          )}

          {/* Asset Specs Overview */}
          <Card className="p-4 rounded-xl border border-slate-200 space-y-2 bg-slate-50/50">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Specifications</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-slate-400">Manufacturer:</span> <span className="font-semibold text-slate-700">{asset.manufacturer?.name || 'N/A'}</span></div>
              <div><span className="text-slate-400">Model:</span> <span className="font-semibold text-slate-700">{asset.model || 'N/A'}</span></div>
              <div><span className="text-slate-400">Condition:</span> <span className="font-semibold text-slate-700">{asset.condition_status || 'GOOD'}</span></div>
              <div><span className="text-slate-400">Location:</span> <span className="font-semibold text-slate-700">{asset.location?.name || 'N/A'}</span></div>
            </div>
          </Card>

          {/* Main Actions */}
          <div className="space-y-2 pt-2">
            {actions.can_request_borrow && (
              <Button
                variant="primary"
                className="w-full justify-center py-2.5 text-xs font-bold shadow-sm"
                onClick={() => setActiveModal('borrow')}
              >
                <Package className="w-4 h-4 mr-1.5" /> Request to Borrow Asset
              </Button>
            )}

            <div className="grid grid-cols-2 gap-2">
              {actions.can_request_extension && (
                <Button
                  variant="secondary"
                  className="w-full justify-center text-xs py-2"
                  onClick={() => setActiveModal('extension')}
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> Extend Borrowing
                </Button>
              )}

              {actions.can_request_reissuance && (
                <Button
                  variant="outline"
                  className="w-full justify-center text-xs py-2"
                  onClick={() => setActiveModal('reissuance')}
                >
                  <UserIcon className="w-3.5 h-3.5 mr-1" /> Transfer Accountability
                </Button>
              )}

              {actions.can_report_damage && (
                <Button
                  variant="outline"
                  className="w-full justify-center text-xs py-2"
                  onClick={() => setActiveModal('damage')}
                >
                  <Wrench className="w-3.5 h-3.5 mr-1" /> Report Damage
                </Button>
              )}

              {actions.can_report_lost && (
                <Button
                  variant="danger"
                  className="w-full justify-center text-xs py-2"
                  onClick={() => setActiveModal('lost')}
                >
                  <HelpCircle className="w-3.5 h-3.5 mr-1" /> Report Lost
                </Button>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                className="flex-1 justify-center text-xs"
                onClick={() => {
                  onClose()
                  navigate(`/qr/${encodeURIComponent(asset.psa_qr_identifier || asset.asset_number)}`)
                }}
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1" /> View Full Asset Details
              </Button>

              {onScanAnother && (
                <Button
                  variant="secondary"
                  className="justify-center text-xs"
                  onClick={() => {
                    onClose()
                    onScanAnother()
                  }}
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> Scan Another
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Triggered Modals */}
      {activeModal === 'borrow' && (
        <BorrowRequestModal
          open={true}
          onClose={() => setActiveModal(null)}
          assetContext={context}
          onSuccess={() => {
            setSuccessMessage('Borrow request submitted successfully. Workflow initialized.')
            setActiveModal(null)
          }}
        />
      )}

      {activeModal === 'extension' && (
        <BorrowExtensionModal
          open={true}
          onClose={() => setActiveModal(null)}
          assetContext={context}
          onSuccess={() => {
            setSuccessMessage('Borrow extension request submitted.')
            setActiveModal(null)
          }}
        />
      )}

      {activeModal === 'reissuance' && (
        <ReIssuanceRequestModal
          open={true}
          onClose={() => setActiveModal(null)}
          assetContext={context}
          onSuccess={() => {
            setSuccessMessage('Asset transfer request submitted.')
            setActiveModal(null)
          }}
        />
      )}

      {activeModal === 'damage' && (
        <ReportDamageModal
          open={true}
          onClose={() => setActiveModal(null)}
          assetContext={context}
          onSuccess={() => {
            setSuccessMessage('Damage report submitted. Maintenance ticket generated.')
            setActiveModal(null)
          }}
        />
      )}

      {activeModal === 'lost' && (
        <ReportLostModal
          open={true}
          onClose={() => setActiveModal(null)}
          assetContext={context}
          onSuccess={() => {
            setSuccessMessage('Lost asset report submitted.')
            setActiveModal(null)
          }}
        />
      )}
    </>
  )
}
