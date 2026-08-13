import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Badge, Spinner, Alert } from '@/components/ui'
import { ApprovalHistoryTimeline } from '@/components/workflows/ApprovalHistoryTimeline'
import { qrService } from '@/services/qrService'
import type { AssetContext } from '@/types'
import { BorrowRequestModal } from '@/components/qr/BorrowRequestModal'
import { BorrowExtensionModal } from '@/components/qr/BorrowExtensionModal'
import { ReIssuanceRequestModal } from '@/components/qr/ReIssuanceRequestModal'
import { ReportDamageModal } from '@/components/qr/ReportDamageModal'
import { ReportLostModal } from '@/components/qr/ReportLostModal'
import {
  ArrowLeft,
  QrCode,
  Package,
  User as UserIcon,
  MapPin,
  Clock,
  AlertTriangle,
  RotateCcw,
  Wrench,
  HelpCircle,
} from 'lucide-react'

export function EmployeeAssetPage() {
  const { identifier } = useParams<{ identifier: string }>()
  const navigate = useNavigate()
  const [context, setContext] = useState<AssetContext | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<{ status: number; message: string } | null>(null)
  const [actionMessage, setActionMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  // Active modal state
  const [activeModal, setActiveModal] = useState<'borrow' | 'extension' | 'reissuance' | 'damage' | 'lost' | null>(null)

  const loadAsset = async () => {
    if (!identifier) return
    setLoading(true)
    setError(null)
    try {
      const res = await qrService.resolveAsset(identifier)
      setContext(res)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Asset not found or invalid QR.'
      setError({ status: 404, message: msg })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAsset()
  }, [identifier])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Spinner label="Scanning PSA Asset Record..." />
      </div>
    )
  }

  if (error || !context) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 max-w-md mx-auto text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-lg font-bold text-slate-900 mb-1">Asset Validation Error</h1>
        <p className="text-xs text-slate-500 mb-6">{error?.message || 'Invalid or unrecognized PSA QR code.'}</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/qr')}>
            Scan Another QR
          </Button>
          <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
        </div>
      </div>
    )
  }

  const { asset, actions, active_borrowing, pending_reservation, history } = context

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-800 pb-12">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/qr')}
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Scanner
          </button>
          <div className="flex items-center gap-2 font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">
            <QrCode className="w-3.5 h-3.5 text-blue-600" />
            {asset.psa_qr_identifier || asset.asset_number}
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Dashboard
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
        {actionMessage && (
          <Alert tone={actionMessage.tone} onClose={() => setActionMessage(null)}>
            {actionMessage.text}
          </Alert>
        )}

        {/* Header Section - Centered */}
        <div className="text-center mb-2">
          <div className="flex justify-center mb-3">
            <Badge tone={asset.status === 'AVAILABLE' ? 'green' : asset.status === 'BORROWED' ? 'blue' : 'yellow'}>
              {asset.status}
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">{asset.name}</h1>
          <p className="text-base text-slate-600 max-w-2xl mx-auto">{asset.description || 'No description provided.'}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm">
            <span className="font-mono text-slate-700 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
              Asset #: {asset.asset_number}
            </span>
            <span className="font-mono text-slate-700 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
              ID: {asset.psa_qr_identifier || 'N/A'}
            </span>
          </div>
        </div>

        {/* Asset Details Grid */}
        <div className="grid gap-3 sm:grid-cols-2 mb-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Package className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category</div>
                <div className="truncate text-sm font-semibold text-slate-900">{asset.category?.name || 'N/A'}</div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Office / Department</div>
                <div className="truncate text-sm font-semibold text-slate-900">{asset.office?.name || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Current State Status Cards */}
        {active_borrowing && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-2 font-semibold text-blue-900 mb-2">
              <Clock className="h-4 w-4 text-blue-600" /> Currently Borrowed
            </div>
            <p className="text-sm text-blue-800">
              Borrower: <strong>{active_borrowing.user_name}</strong>
            </p>
            <p className="text-sm text-blue-800">
              Due Date: <strong>{active_borrowing.due_date || 'N/A'}</strong>
            </p>
          </div>
        )}

        {pending_reservation && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-semibold text-amber-900">
                <Clock className="h-4 w-4 text-amber-600" /> Pending Borrow Request
              </div>
              <Badge tone="yellow">Level {pending_reservation.current_level_order || 1}</Badge>
            </div>
            <p className="text-sm text-amber-800 mb-3">
              Requested by: <strong>{pending_reservation.user_name}</strong>
            </p>
            <ApprovalHistoryTimeline
              requestType="borrow_request"
              requestId={pending_reservation.id}
            />
          </div>
        )}

        {/* Asset Specifications */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-600">Asset Specifications</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Manufacturer</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{asset.manufacturer?.name || 'N/A'}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Model</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{asset.model || 'N/A'}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Condition</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{asset.condition_status || 'GOOD'}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{asset.location?.name || 'N/A'}</div>
            </div>
            {asset.issued_to && (
              <div className="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Permanently Issued To</div>
                <div className="text-sm font-semibold text-slate-900 mb-1">{asset.issued_to_name || asset.issued_to}</div>
                {asset.date_issued && (
                  <div className="text-xs text-slate-600">Date Issued: {asset.date_issued}</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Primary Action */}
        {actions.can_request_borrow && (
          <Button
            variant="primary"
            className="w-full justify-center rounded-lg h-12 text-base font-semibold shadow-md transition-transform hover:-translate-y-0.5"
            onClick={() => setActiveModal('borrow')}
          >
            <Package className="mr-2 h-5 w-5" /> Request to Borrow Asset
          </Button>
        )}

        {/* Secondary Actions Grid */}
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            variant="outline"
            className="justify-center rounded-lg border-slate-300 bg-white h-10 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => setActiveModal('damage')}
          >
            <Wrench className="mr-2 h-4 w-4" /> Report Damage
          </Button>

          {actions.can_request_extension && (
            <Button
              variant="outline"
              className="justify-center rounded-lg border-slate-300 bg-white h-10 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => setActiveModal('extension')}
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Request Extension
            </Button>
          )}

          {actions.can_request_reissuance && (
            <Button
              variant="outline"
              className="justify-center rounded-lg border-slate-300 bg-white h-10 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => setActiveModal('reissuance')}
            >
              <UserIcon className="mr-2 h-4 w-4" /> Transfer Accountability
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

        {/* Borrow History */}
        {history.borrow_history.length > 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-600">Recent Borrow History</h2>
            <div className="space-y-3">
              {history.borrow_history.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{b.user_name}</div>
                    <div className="text-xs text-slate-600">{b.borrow_date} to {b.due_date}</div>
                  </div>
                  <Badge tone={b.status === 'RETURNED' ? 'gray' : 'blue'}>{b.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Header Section - Centered */}
        <div className="text-center mb-2">
          <div className="flex justify-center mb-3">
            <Badge tone={asset.status === 'AVAILABLE' ? 'green' : asset.status === 'BORROWED' ? 'blue' : 'yellow'}>
              {asset.status}
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">{asset.name}</h1>
          <p className="text-base text-slate-600 max-w-2xl mx-auto">{asset.description || 'No description provided.'}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm">
            <span className="font-mono text-slate-700 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
              Asset #: {asset.asset_number}
            </span>
            <span className="font-mono text-slate-700 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
              ID: {asset.psa_qr_identifier || 'N/A'}
            </span>
          </div>
        </div>

        {/* Asset Details Grid */}
        <div className="grid gap-3 sm:grid-cols-2 mb-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Package className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category</div>
                <div className="truncate text-sm font-semibold text-slate-900">{asset.category?.name || 'N/A'}</div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Office / Department</div>
                <div className="truncate text-sm font-semibold text-slate-900">{asset.office?.name || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Modals */}
      {activeModal === 'borrow' && (
        <BorrowRequestModal
          open={true}
          onClose={() => setActiveModal(null)}
          assetContext={context}
          onSuccess={() => {
            setActionMessage({ tone: 'success', text: 'Borrow request submitted successfully. Workflow initialized.' })
            void loadAsset()
          }}
        />
      )}

      {activeModal === 'extension' && (
        <BorrowExtensionModal
          open={true}
          onClose={() => setActiveModal(null)}
          assetContext={context}
          onSuccess={() => {
            setActionMessage({ tone: 'success', text: 'Borrow extension request submitted.' })
            void loadAsset()
          }}
        />
      )}

      {activeModal === 'reissuance' && (
        <ReIssuanceRequestModal
          open={true}
          onClose={() => setActiveModal(null)}
          assetContext={context}
          onSuccess={() => {
            setActionMessage({ tone: 'success', text: 'Asset re-issuance transfer request submitted.' })
            void loadAsset()
          }}
        />
      )}

      {activeModal === 'damage' && (
        <ReportDamageModal
          open={true}
          onClose={() => setActiveModal(null)}
          assetContext={context}
          onSuccess={() => {
            setActionMessage({ tone: 'success', text: 'Damage report submitted. Maintenance ticket generated.' })
            void loadAsset()
          }}
        />
      )}

      {activeModal === 'lost' && (
        <ReportLostModal
          open={true}
          onClose={() => setActiveModal(null)}
          assetContext={context}
          onSuccess={() => {
            setActionMessage({ tone: 'success', text: 'Lost asset report submitted.' })
            void loadAsset()
          }}
        />
      )}
    </div>
  )
}
