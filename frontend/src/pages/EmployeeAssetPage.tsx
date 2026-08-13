import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Badge, Spinner, Alert, Card } from '@/components/ui'
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
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-12 flex justify-center">
      {/* Top Header Bar */}
      <div className="bg-slate-900 text-white px-4 py-3 sticky top-0 z-10 shadow-md w-full">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/qr')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" /> Scan
          </button>
          <div className="font-bold text-xs tracking-wide flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-blue-400" />
            <span>{asset.psa_qr_identifier || asset.asset_number}</span>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-xs text-slate-400 hover:text-white"
          >
            Home
          </button>
        </div>
      </div>

      <div className="max-w-2xl w-full mx-auto p-6 space-y-5">
        {actionMessage && (
          <Alert tone={actionMessage.tone} onClose={() => setActionMessage(null)}>
            {actionMessage.text}
          </Alert>
        )}

        {/* Hero Card */}
        <Card className="bg-white p-6 rounded-[14px] border border-slate-200 shadow-sm">
          {/* PSA tri-color accent */}
          <div className="flex items-center gap-2 mb-3">
            <span className="block" style={{ height: 4, width: 36, borderRadius: 999, background: '#0B3D91' }} />
            <span className="block" style={{ height: 4, width: 18, borderRadius: 999, background: '#FFD400' }} />
            <span className="block" style={{ height: 4, width: 12, borderRadius: 999, background: '#E31C23' }} />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div style={{ minWidth: 0 }}>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">{asset.asset_number}</span>
                <Badge tone={asset.status === 'AVAILABLE' ? 'green' : asset.status === 'BORROWED' ? 'blue' : 'yellow'} className="ml-2">{asset.status}</Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-3 leading-tight">{asset.name}</h1>
              <p className="text-sm text-slate-500 mt-2 max-w-2xl">{asset.description || 'No description provided.'}</p>
            </div>
            <div className="flex-shrink-0 hidden md:flex items-center">
              {/* placeholder for any right-side action or image */}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-slate-600">
              <Package className="w-4 h-4 text-slate-400" />
              <span>Category: <strong>{asset.category?.name || 'N/A'}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span className="truncate">Office: <strong>{asset.office?.name || 'N/A'}</strong></span>
            </div>
          </div>
        </Card>

        {/* Prominent Action Bar */}
        <Card className="bg-white p-6 rounded-[14px] border border-slate-200 shadow-sm">
          <div className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Available Actions</div>

          {/* Primary action full width */}
          <div>
            {actions.can_request_borrow && (
              <Button
                variant="primary"
                className="w-full justify-center text-sm py-3 rounded-[10px] font-bold shadow-md"
                onClick={() => setActiveModal('borrow')}
              >
                <Package className="w-4 h-4 mr-2" /> Request to Borrow Asset
              </Button>
            )}
          </div>

          {/* Secondary actions row */}
          <div className="mt-3 grid gap-3 sm:grid-cols-[1.7fr_1fr]">
            <div className="grid grid-cols-2 gap-3">
              {actions.can_request_extension && (
                <Button
                  variant="secondary"
                  className="w-full justify-center text-sm py-3 rounded-[10px] font-semibold"
                  onClick={() => setActiveModal('extension')}
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> Request Extension
                </Button>
              )}

              {actions.can_request_reissuance && (
                <Button
                  variant="outline"
                  className="w-full justify-center text-sm py-3 rounded-[10px] font-semibold"
                  onClick={() => setActiveModal('reissuance')}
                >
                  <UserIcon className="w-4 h-4 mr-2" /> Transfer Accountability
                </Button>
              )}
            </div>

            <div className="">
              {actions.can_report_damage && (
                <Button
                  variant="outline"
                  className="w-full justify-center text-sm py-3 rounded-[10px] font-semibold mb-3"
                  onClick={() => setActiveModal('damage')}
                >
                  <Wrench className="w-4 h-4 mr-2" /> Report Damage
                </Button>
              )}

              {actions.can_report_lost && (
                <Button
                  variant="danger"
                  className="w-full justify-center text-sm py-3 rounded-[10px] font-semibold"
                  onClick={() => setActiveModal('lost')}
                >
                  <HelpCircle className="w-4 h-4 mr-2" /> Report Lost Asset
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Current State Info Cards */}
        {active_borrowing && (
          <Card className="bg-blue-50/70 border border-blue-200 p-4 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-blue-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" /> Currently Borrowed
              </span>
              <Badge tone="blue">Due: {active_borrowing.due_date || 'N/A'}</Badge>
            </div>
            <div className="text-xs text-blue-800">
              Borrower: <strong>{active_borrowing.user_name}</strong>
            </div>
          </Card>
        )}

        {pending_reservation && (
          <Card className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" /> Pending Borrow Request
              </span>
              <Badge tone="yellow">Level {pending_reservation.current_level_order || 1}</Badge>
            </div>
            <div className="text-xs text-amber-800">
              Requested by: <strong>{pending_reservation.user_name}</strong>
            </div>
            <ApprovalHistoryTimeline
              requestType="borrow_request"
              requestId={pending_reservation.id}
            />
          </Card>
        )}

        {/* Detailed Information Tabs */}
        <Card className="bg-white p-6 rounded-[14px] border border-slate-200 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">Asset Specifications</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-50 rounded-[10px] p-3">
              <div className="text-[11px] text-slate-400">Manufacturer</div>
              <div className="font-semibold text-slate-700">{asset.manufacturer?.name || 'N/A'}</div>
            </div>
            <div className="bg-slate-50 rounded-[10px] p-3">
              <div className="text-[11px] text-slate-400">Model</div>
              <div className="font-semibold text-slate-700">{asset.model || 'N/A'}</div>
            </div>
            <div className="bg-slate-50 rounded-[10px] p-3">
              <div className="text-[11px] text-slate-400">Condition</div>
              <div className="font-semibold text-slate-700">{asset.condition_status || 'GOOD'}</div>
            </div>
            <div className="bg-slate-50 rounded-[10px] p-3">
              <div className="text-[11px] text-slate-400">Office / Department</div>
              <div className="font-semibold text-slate-700">{asset.office?.name || 'N/A'}</div>
            </div>
            {asset.issued_to && (
              <div className="col-span-2 pt-2 border-t border-slate-100">
                <span className="text-slate-400 block">Permanently Issued To</span>
                <span className="font-bold text-slate-800">{asset.issued_to_name || asset.issued_to}</span>
                {asset.date_issued && (
                  <span className="text-[11px] text-slate-500 block">Date Issued: {asset.date_issued}</span>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Activity & Scan History for Asset */}
        {history.borrow_history.length > 0 && (
          <Card className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Recent Borrow History</h2>
            <div className="divide-y divide-slate-100 text-xs">
              {history.borrow_history.map((b) => (
                <div key={b.id} className="py-2 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-800">{b.user_name}</div>
                    <div className="text-[11px] text-slate-400">{b.borrow_date} to {b.due_date}</div>
                  </div>
                  <Badge tone={b.status === 'RETURNED' ? 'gray' : 'blue'}>{b.status}</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}
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
