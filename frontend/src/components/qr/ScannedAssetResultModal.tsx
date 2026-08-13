import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal, Button, Badge, Alert } from '@/components/ui'
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
        maxWidth={800}
        maxHeight="calc(100vh - 40px)"
      >
        <div className="flex flex-col text-slate-800">
          {successMessage && (
            <Alert tone="success" onClose={() => setSuccessMessage(null)}>
              {successMessage}
            </Alert>
          )}

          {/* Header Section */}
          <div className="mb-6 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 p-6 text-center">
            <div className="mb-3 flex justify-center">
              <Badge tone={asset.status === 'AVAILABLE' ? 'green' : asset.status === 'BORROWED' ? 'blue' : 'yellow'} className="shrink-0">
                {asset.status}
              </Badge>
            </div>
            <h2 className="mb-2 text-xl font-bold text-slate-900">{asset.name}</h2>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-600">
              <span className="font-mono text-slate-700">{asset.psa_qr_identifier || 'PSA-ASSET-000000'}</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-slate-500">{asset.asset_number}</span>
            </div>
          </div>

          {/* Status Alert Section */}
          {isAvailable && !isPermanentlyIssued && (
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
              <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold uppercase tracking-wide text-emerald-800">Ready to Borrow</span>
                <p className="text-sm text-emerald-700">This asset is currently available for borrowing.</p>
              </div>
            </div>
          )}

          {isBorrowed && (
            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center gap-2 font-semibold text-blue-900">
                <Clock className="h-4 w-4 text-blue-600" /> Currently Borrowed
              </div>
              <p className="mt-1 text-sm text-blue-800">This asset is currently unavailable for borrowing.</p>
            </div>
          )}

          {isReserved && !isBorrowed && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 font-semibold text-amber-900">
                <Clock className="h-4 w-4 text-amber-600" /> Pending Reservation
              </div>
              <p className="mt-1 text-sm text-amber-800">This asset is currently reserved and temporarily unavailable.</p>
            </div>
          )}

          {isMaintenance && (
            <div className="mb-6 rounded-lg border border-purple-200 bg-purple-50 p-4">
              <div className="flex items-center gap-2 font-semibold text-purple-900">
                <Wrench className="h-4 w-4 text-purple-600" /> Under Maintenance
              </div>
              <p className="mt-1 text-sm text-purple-800">This asset is currently under maintenance and cannot be borrowed.</p>
            </div>
          )}

          {isPermanentlyIssued && (
            <div className="mb-6 rounded-lg border border-slate-200 bg-slate-100 p-4">
              <div className="font-semibold text-slate-900">Permanently Issued</div>
              <p className="mt-1 text-sm text-slate-700">Issued to: <strong>{asset.issued_to_name || asset.issued_to}</strong></p>
            </div>
          )}

          {/* Asset Details Grid */}
          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <Package className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category</div>
                  <div className="truncate text-sm font-semibold text-slate-900">{asset.category?.name || 'IT / Electronic Equipment'}</div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Office Location</div>
                  <div className="truncate text-sm font-semibold text-slate-900">{asset.office?.name || 'Main Office'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Specifications Section */}
          <div className="mb-6">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-600">Asset Specifications</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Manufacturer</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">{asset.manufacturer?.name || 'HERCULES'}</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Model</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">{asset.model || 'MS632B'}</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Condition</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">{asset.condition_status || 'GOOD'}</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">{asset.location?.name || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Primary Action */}
          {actions.can_request_borrow && (
            <Button
              variant="primary"
              className="mb-4 w-full justify-center rounded-lg h-11 text-sm font-semibold shadow-md transition-transform hover:-translate-y-0.5"
              onClick={() => setActiveModal('borrow')}
            >
              <Package className="mr-2 h-4 w-4" /> Request to Borrow Asset
            </Button>
          )}

          {/* Secondary Actions */}
          <div className="mb-6 grid gap-2 sm:grid-cols-2">
            <Button
              variant="outline"
              className="justify-center rounded-lg border-slate-300 bg-white h-10 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => {
                onClose()
                navigate(`/qr/${encodeURIComponent(asset.psa_qr_identifier || asset.asset_number)}`)
              }}
            >
              <ExternalLink className="mr-2 h-4 w-4" /> View Full Details
            </Button>

            {onScanAnother && (
              <Button
                variant="secondary"
                className="justify-center rounded-lg border-slate-300 bg-white h-10 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  onClose()
                  onScanAnother()
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Scan Another
              </Button>
            )}
          </div>

          {/* Issue Reporting Section */}
          {(actions.can_report_damage || actions.can_report_lost) && (
            <div className="border-t border-slate-200 pt-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-600">Report an Issue</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {actions.can_report_damage && (
                  <Button
                    variant="outline"
                    className="justify-center rounded-lg border-slate-300 bg-white h-10 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    onClick={() => setActiveModal('damage')}
                  >
                    <Wrench className="mr-2 h-4 w-4" /> Report Damage
                  </Button>
                )}

                {actions.can_report_lost && (
                  <Button
                    variant="danger"
                    className="justify-center rounded-lg h-10 text-sm font-medium shadow-sm hover:shadow-md"
                    onClick={() => setActiveModal('lost')}
                  >
                    <HelpCircle className="mr-2 h-4 w-4" /> Report Lost
                  </Button>
                )}
              </div>
            </div>
          )}
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
