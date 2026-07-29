import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal, Button, Badge, Alert, Card, Spinner } from '@/components/ui'
import type { QrContext } from '@/types'
import { BorrowRequestModal } from '@/components/qr/BorrowRequestModal'
import { ReportDamageModal } from '@/components/qr/ReportDamageModal'
import { ReportLostModal } from '@/components/qr/ReportLostModal'
import { reservationService } from '@/services/reservationService'
import { borrowingService } from '@/services/borrowingService'
import { qrService } from '@/services/qrService'
import {
  Package,
  MapPin,
  Clock,
  Wrench,
  HelpCircle,
  QrCode,
  User as UserIcon,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  XCircle,
  FileText,
  ArrowLeftRight,
  CheckSquare,
  Send,
  AlertTriangle,
} from 'lucide-react'

interface ScannedQrResultModalProps {
  open: boolean
  onClose: () => void
  context: QrContext | null
  scanSource?: 'sidebar_scanner' | 'assets_page_scanner'
  onScanAnother?: () => void
}

/** Backend returns expanded objects for QR context */
interface QrAsset {
  id: number
  asset_number: string
  name: string
  description?: string | null
  model?: string | null
  status: string
  condition_status?: string | null
  psa_qr_identifier?: string | null
  category?: { id: number; name: string } | null
  manufacturer?: { id: number; name: string } | null
  office?: { id: number; name: string } | null
  location?: { id: number; name: string } | null
  issued_to?: string | null
  issued_to_user_id?: number | null
  issued_by_name?: string | null
  issued_to_name?: string | null
  date_issued?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export function ScannedQrResultModal({
  open,
  onClose,
  context,
  scanSource = 'sidebar_scanner',
  onScanAnother,
}: ScannedQrResultModalProps) {
  const navigate = useNavigate()
  const [activeModal, setActiveModal] = useState<'borrow' | 'extension' | 'reissuance' | 'damage' | 'lost' | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [showConfirm, setShowConfirm] = useState<{ action: string; label: string } | null>(null)
  const [refreshedContext, setRefreshedContext] = useState<QrContext | null>(null)

  // All hooks must be called before any early return
  const refreshContext = useCallback(async (identifier: string) => {
    try {
      const newContext = await qrService.resolveQr(identifier, scanSource)
      setRefreshedContext(newContext)
    } catch (err: unknown) {
      // Refresh failed — keep current context but surface the failure so the
      // success message can warn the user to re-scan.
      const msg = err instanceof Error ? err.message : 'QR refresh failed.'
      console.warn('[QR refresh failed]', msg, 'identifier:', identifier)
      setErrorMessage(
        `Action completed, but QR status refresh failed (${msg}). Please re-scan the QR code to see the updated state.`,
      )
    }
  }, [scanSource])

  const executeAction = useCallback(async (
    actionLabel: string,
    actionFn: () => Promise<void>,
    identifier: string,
  ) => {
    setIsExecuting(true)
    setErrorMessage(null)
    setShowConfirm(null)
    try {
      await actionFn()
      // Action succeeded — show success first, then refresh.
      // Clear any prior error so the success banner is visible.
      setErrorMessage(null)
      setSuccessMessage(`${actionLabel} completed successfully.`)
      // Refresh context independently; failures are surfaced without hiding the success.
      await refreshContext(identifier)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed. Please try again.'
      setErrorMessage(msg)
      setSuccessMessage(null)
    } finally {
      setIsExecuting(false)
    }
  }, [refreshContext])

  // Early return for null context
  if (!context) return null

  const effectiveContext = refreshedContext || context
  const { qr_type, asset: rawAsset, reservation, borrowing, available_actions, user_permissions, asset_status } = effectiveContext
  const isAdmin = user_permissions?.is_admin ?? false
  const isEmployee = user_permissions?.is_employee ?? true

  // Cast asset to QrAsset since backend returns expanded objects
  const asset = rawAsset as unknown as QrAsset | null

  // Get the QR identifier for refresh — always read from effectiveContext so
  // a prior refresh cycle doesn't lose the identifier.
  const getQrIdentifier = (): string => {
    if (effectiveContext?.asset?.psa_qr_identifier) return effectiveContext.asset.psa_qr_identifier
    if (effectiveContext?.asset?.asset_number) return (effectiveContext.asset as unknown as QrAsset).asset_number
    if (effectiveContext?.reservation) return `PSA-RES-${effectiveContext.reservation.id}`
    if (effectiveContext?.borrowing) return `PSA-BOR-${effectiveContext.borrowing.id}`
    return ''
  }

  // ── Render ASSET QR (permanent asset QR) ──
  if (qr_type === 'ASSET' && asset) {
    const isAvailable = asset_status === 'Available for borrowing'
    const isBorrowed = asset_status === 'Currently Borrowed'
    const isMaintenance = asset_status === 'Under Maintenance'
    const isIssued = asset_status === 'Permanently Issued'
    const isUnavailable = asset_status === 'Unavailable'

    const canRequestBorrow = available_actions.includes('REQUEST_BORROW')
    const canReportDamage = available_actions.includes('REPORT_DAMAGE')
    const canReportLost = available_actions.includes('REPORT_LOST')

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

            {errorMessage && (
              <Alert tone="error" onClose={() => setErrorMessage(null)}>
                {errorMessage}
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
                <Badge tone={isAvailable ? 'green' : isBorrowed ? 'blue' : isMaintenance ? 'purple' : 'yellow'}>
                  {asset_status || asset.status}
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
            {isAvailable && !isIssued && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3.5 rounded-xl text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <strong className="font-bold">Available to Borrow:</strong> This asset is currently available for borrowing requests.
                </div>
              </div>
            )}

            {isBorrowed && (
              <div className="bg-blue-50 border border-blue-200 text-blue-900 p-3.5 rounded-xl text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-blue-900">
                  <Clock className="w-4 h-4 text-blue-600" /> Currently Borrowed
                </div>
                <p className="text-blue-800">This asset is currently borrowed and cannot be requested at this time.</p>
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

            {isIssued && (
              <div className="bg-slate-100 border border-slate-200 text-slate-800 p-3.5 rounded-xl text-xs space-y-1">
                <div className="font-bold text-slate-900">Permanently Issued</div>
                <p className="text-slate-600">Issued to: <strong>{asset.issued_to_name || asset.issued_to}</strong></p>
              </div>
            )}

            {isUnavailable && (
              <div className="bg-red-50 border border-red-200 text-red-900 p-3.5 rounded-xl text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-red-900">
                  <XCircle className="w-4 h-4 text-red-600" /> Unavailable
                </div>
                <p className="text-red-800">This asset is currently unavailable and cannot be requested.</p>
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

            {/* Employee Actions */}
            {isEmployee && (
              <div className="space-y-2 pt-2">
                {canRequestBorrow && (
                  <Button
                    variant="primary"
                    className="w-full justify-center py-2.5 text-xs font-bold shadow-sm"
                    onClick={() => setActiveModal('borrow')}
                  >
                    <Package className="w-4 h-4 mr-1.5" /> Request to Borrow Asset
                  </Button>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {canReportDamage && (
                    <Button
                      variant="outline"
                      className="w-full justify-center text-xs py-2"
                      onClick={() => setActiveModal('damage')}
                    >
                      <Wrench className="w-3.5 h-3.5 mr-1" /> Report Damage
                    </Button>
                  )}

                  {canReportLost && (
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
                      onClick={() => { onClose(); onScanAnother() }}
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" /> Scan Another
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Admin Actions */}
            {isAdmin && (
              <div className="space-y-2 pt-2">
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <Button
                    variant="outline"
                    className="flex-1 justify-center text-xs"
                    onClick={() => {
                      onClose()
                      navigate(`/qr/${encodeURIComponent(asset.psa_qr_identifier || asset.asset_number)}`)
                    }}
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1" /> View Asset Details
                  </Button>

                  {onScanAnother && (
                    <Button
                      variant="secondary"
                      className="justify-center text-xs"
                      onClick={() => { onClose(); onScanAnother() }}
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" /> Scan Another
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
            assetContext={effectiveContext as any}
            onSuccess={() => {
              setSuccessMessage('Borrow request submitted successfully.')
              setActiveModal(null)
              void refreshContext(getQrIdentifier())
            }}
          />
        )}
        {activeModal === 'damage' && (
          <ReportDamageModal
            open={true}
            onClose={() => setActiveModal(null)}
            assetContext={effectiveContext as any}
            onSuccess={() => {
              setSuccessMessage('Damage report submitted.')
              setActiveModal(null)
            }}
          />
        )}
        {activeModal === 'lost' && (
          <ReportLostModal
            open={true}
            onClose={() => setActiveModal(null)}
            assetContext={effectiveContext as any}
            onSuccess={() => {
              setSuccessMessage('Lost asset report submitted.')
              setActiveModal(null)
            }}
          />
        )}
      </>
    )
  }

  // ── Render RESERVATION/BORROWING RECEIPT QR ──
  if ((qr_type === 'BORROWING_RECEIPT' || qr_type === 'RETURN_RECEIPT') && (reservation || borrowing)) {
    const canApprove = available_actions.includes('APPROVE_REQUEST')
    const canRelease = available_actions.includes('RELEASE_ASSET')
    const canReturn = available_actions.includes('RETURN_ASSET')
    const isReservation = reservation !== null && reservation !== undefined

    const subject = isReservation ? reservation! : borrowing!
    const subjectType = isReservation ? 'Borrow Request' : 'Borrowing'
    const status = subject?.status || 'UNKNOWN'
    const workflowStatus = isReservation ? (reservation?.workflow_status || status) : status
    // isPending: reservation is PENDING at the main level, regardless of which workflow level it's at
    const isPending = isReservation && (status === 'PENDING' || workflowStatus === 'PENDING_APPROVAL')
    // Multi-level: PENDING_APPROVAL with a current_level_order means at least one level was already approved
    const isWaitingNextLevel = isReservation
      && workflowStatus === 'PENDING_APPROVAL'
      && !!reservation!.current_level_order
      && reservation!.current_level_order > 1
    const isApproved = status === 'APPROVED'
    const isRejected = status === 'REJECTED' || status === 'CANCELLED'
    const isReturned = !isReservation && (status === 'RETURNED')
    const isActiveBorrowing = !isReservation && (status === 'BORROWED' || status === 'ACTIVE' || status === 'OVERDUE')

    // Confirmation dialog
    if (showConfirm) {
      return (
        <Modal open={true} onClose={() => { if (!isExecuting) setShowConfirm(null) }} title="Confirm Action" maxWidth="max-w-md">
          <div className="space-y-4 text-slate-800">
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Confirm {showConfirm.label}</strong>
                <p className="mt-1">Are you sure you want to {showConfirm.action.toLowerCase()} this {isReservation ? 'borrow request' : 'borrowing transaction'}?</p>
                {isReservation && (
                  <div className="mt-2 text-amber-800">
                    Requester: <strong>{reservation!.requester_name || 'N/A'}</strong><br />
                    Asset: <strong>{reservation!.asset_name || 'N/A'}</strong>
                  </div>
                )}
                {!isReservation && (
                  <div className="mt-2 text-amber-800">
                    Borrower: <strong>{borrowing!.borrower_name || 'N/A'}</strong><br />
                    Asset: <strong>{borrowing!.asset_name || 'N/A'}</strong>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="primary"
                className="flex-1 justify-center text-xs font-bold"
                disabled={isExecuting}
                onClick={() => {
                  const identifier = getQrIdentifier()
                  if (showConfirm.action === 'APPROVE') {
                    void executeAction('Approval', async () => {
                      await reservationService.approve(subject.id)
                    }, identifier)
                  } else if (showConfirm.action === 'RELEASE') {
                    void executeAction('Release', async () => {
                      await borrowingService.releaseFromReservation(subject.id)
                    }, identifier)
                  } else if (showConfirm.action === 'RETURN') {
                    void executeAction('Return', async () => {
                      await borrowingService.returnAsset(subject.id)
                    }, identifier)
                  }
                }}
              >
                {isExecuting ? (
                  <><Spinner label="" /> {showConfirm.label}...</>
                ) : (
                  <>{showConfirm.label}</>
                )}
              </Button>
              <Button
                variant="outline"
                className="flex-1 justify-center text-xs"
                disabled={isExecuting}
                onClick={() => setShowConfirm(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )
    }

    return (
      <Modal
        open={open}
        onClose={onClose}
        title={`${subjectType} Receipt #${subject?.id}`}
        maxWidth="max-w-xl"
      >
        <div className="space-y-4 text-slate-800">
          {successMessage && (
            <Alert tone="success" onClose={() => setSuccessMessage(null)}>
              {successMessage}
            </Alert>
          )}

          {errorMessage && (
            <Alert tone="error" onClose={() => setErrorMessage(null)}>
              {errorMessage}
            </Alert>
          )}

          {/* Transaction Summary Header */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3 relative overflow-hidden shadow-md">
            <div className="flex items-start justify-between gap-3 relative z-10">
              <div>
                <span className="font-mono text-[11px] font-bold text-blue-300 bg-blue-950/80 border border-blue-800/80 px-2 py-0.5 rounded-md">
                  {isReservation ? `RES-${String(subject.id).padStart(5, '0')}` : `BR-${String(subject.id).padStart(5, '0')}`}
                </span>
                <h2 className="text-lg font-extrabold text-white mt-1.5">{subject.asset_name || 'Asset'}</h2>
                {subject.asset_number && (
                  <div className="flex items-center gap-1.5 text-xs text-blue-400 font-mono mt-0.5">
                    <QrCode className="w-3.5 h-3.5" /> {subject.asset_number}
                  </div>
                )}
              </div>
              <Badge tone={isPending ? 'yellow' : isApproved ? 'blue' : isReturned ? 'green' : 'slate'}>
                {workflowStatus || status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-800/80 text-slate-300 relative z-10">
              <div className="flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>{isReservation ? 'Requester' : 'Borrower'}: <strong className="text-white">{reservation?.requester_name || borrowing?.borrower_name || 'N/A'}</strong></span>
              </div>
              {subject.employee_number && (
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Emp #: <strong className="text-white">{subject.employee_number}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Transaction Details */}
          <Card className="p-4 rounded-xl border border-slate-200 space-y-2 bg-slate-50/50">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Transaction Details</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-slate-400">Requested:</span> <span className="font-semibold text-slate-700">{subject.requested_date || 'N/A'}</span></div>
              {isReservation && (
                <div><span className="text-slate-400">Expected Return:</span> <span className="font-semibold text-slate-700">{reservation!.expected_return_date || 'N/A'}</span></div>
              )}
              {!isReservation && (
                <>
                  <div><span className="text-slate-400">Borrowed:</span> <span className="font-semibold text-slate-700">{borrowing!.borrowed_at || 'N/A'}</span></div>
                  <div><span className="text-slate-400">Due Date:</span> <span className="font-semibold text-slate-700">{borrowing!.due_date || 'N/A'}</span></div>
                </>
              )}
              <div><span className="text-slate-400">Status:</span> <span className="font-semibold text-slate-700">{workflowStatus || status}</span></div>
              {isReservation && reservation!.current_level_order && (
                <div><span className="text-slate-400">Level:</span> <span className="font-semibold text-slate-700">Level {reservation!.current_level_order}</span></div>
              )}
            </div>
            {subject.remarks && (
              <div className="text-xs pt-2 border-t border-slate-200">
                <span className="text-slate-400">Remarks:</span> <span className="text-slate-700">{subject.remarks}</span>
              </div>
            )}
          </Card>

          {/* Status-specific messages */}
          {isPending && !isWaitingNextLevel && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-xl text-xs flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <strong className="font-bold">Waiting for Approval:</strong> This borrow request is pending review.
              </div>
            </div>
          )}

          {isWaitingNextLevel && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-xl text-xs flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <strong className="font-bold">Waiting for Next Approval Level:</strong> Level {(reservation!.current_level_order ?? 0) - 1} approved. Awaiting Level {reservation!.current_level_order}.
              </div>
            </div>
          )}

          {isApproved && canRelease && (
            <div className="bg-blue-50 border border-blue-200 text-blue-900 p-3.5 rounded-xl text-xs flex items-center gap-2.5">
              <CheckSquare className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div>
                <strong className="font-bold">Ready for Release:</strong> This request has been approved and is ready to be released.
              </div>
            </div>
          )}

          {isReturned && (
            <div className="bg-green-50 border border-green-200 text-green-900 p-3.5 rounded-xl text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div><strong className="font-bold">Returned:</strong> This asset has been successfully returned.</div>
            </div>
          )}

          {isActiveBorrowing && (
            <div className="bg-blue-50 border border-blue-200 text-blue-900 p-3.5 rounded-xl text-xs flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div>
                <strong className="font-bold">Active Borrowing:</strong> This asset is currently borrowed and due on {borrowing!.due_date || 'N/A'}.
              </div>
            </div>
          )}

          {isRejected && (
            <div className="bg-red-50 border border-red-200 text-red-900 p-3.5 rounded-xl text-xs flex items-center gap-2.5">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div><strong className="font-bold">Closed:</strong> This request has been {status.toLowerCase()}.</div>
            </div>
          )}

          {/* Admin Actions */}
          {isAdmin && (
            <div className="space-y-2 pt-2">
              {canApprove && (
                <Button
                  variant="primary"
                  className="w-full justify-center py-2.5 text-xs font-bold shadow-sm"
                  disabled={isExecuting}
                  onClick={() => setShowConfirm({ action: 'APPROVE', label: 'Approve Request' })}
                >
                  <CheckSquare className="w-4 h-4 mr-1.5" /> Approve Request
                </Button>
              )}

              {canRelease && (
                <Button
                  variant="primary"
                  className="w-full justify-center py-2.5 text-xs font-bold shadow-sm"
                  disabled={isExecuting}
                  onClick={() => setShowConfirm({ action: 'RELEASE', label: 'Release Asset' })}
                >
                  <Send className="w-4 h-4 mr-1.5" /> Release Asset
                </Button>
              )}

              {canReturn && (
                <Button
                  variant="primary"
                  className="w-full justify-center py-2.5 text-xs font-bold shadow-sm"
                  disabled={isExecuting}
                  onClick={() => setShowConfirm({ action: 'RETURN', label: 'Return Asset' })}
                >
                  <ArrowLeftRight className="w-4 h-4 mr-1.5" /> Return Asset
                </Button>
              )}

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  className="flex-1 justify-center text-xs"
                  onClick={() => {
                    onClose()
                    const route = isReservation ? `/reservations/${subject.id}` : `/borrowings/${subject.id}`
                    navigate(route)
                  }}
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> View Full Details
                </Button>

                {onScanAnother && (
                  <Button
                    variant="secondary"
                    className="justify-center text-xs"
                    onClick={onScanAnother}
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1" /> Scan Another
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Employee View */}
          {isEmployee && (
            <div className="space-y-2 pt-2">
              <div className="bg-slate-50 border border-slate-200 text-slate-700 p-3.5 rounded-xl text-xs">
                {isPending && isWaitingNextLevel
                  ? `Your borrow request passed Level ${(reservation!.current_level_order ?? 1) - 1} and is waiting for Level ${reservation!.current_level_order} approval.`
                  : isPending
                    ? 'Your borrow request is waiting for approval. No administrative actions are available.'
                    : isReservation
                      ? `This request has been ${status.toLowerCase()}. No administrative actions are available.`
                      : 'You are viewing your own borrowing transaction. No administrative actions are available.'}
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  className="flex-1 justify-center text-xs"
                  onClick={() => {
                    onClose()
                    const route = isReservation ? `/reservations/${subject.id}` : `/borrowings/${subject.id}`
                    navigate(route)
                  }}
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> View Details
                </Button>

                {onScanAnother && (
                  <Button
                    variant="secondary"
                    className="justify-center text-xs"
                    onClick={onScanAnother}
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1" /> Scan Another
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>
    )
  }

  // ── UNKNOWN QR type ──
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Unrecognized QR Code"
      maxWidth="max-w-md"
    >
      <div className="space-y-4 text-slate-800">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs flex items-start gap-2.5">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Unrecognized QR Code:</strong> This QR code is not recognized by the PSA Inventory System. Please scan a valid PSA asset QR code or borrowing receipt.
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          {onScanAnother && (
            <Button
              variant="secondary"
              className="flex-1 justify-center text-xs"
              onClick={onScanAnother}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Scan Another
            </Button>
          )}
          <Button
            variant="outline"
            className="flex-1 justify-center text-xs"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}