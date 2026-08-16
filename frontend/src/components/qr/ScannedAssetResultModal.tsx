import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal, Button, Alert } from '@/components/ui'
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

  const handleViewFullDetails = () => {
    onClose()
    navigate(`/qr/${encodeURIComponent(asset.psa_qr_identifier || asset.asset_number)}`)
  }

  const handleScanAnotherClick = () => {
    onClose()
    if (onScanAnother) {
      onScanAnother()
    } else {
      navigate('/qr')
    }
  }

  return (
    <>
      <Modal
        open={open && !activeModal}
        onClose={onClose}
        title={`Scanned Asset: ${asset.name}`}
        maxWidth={740}
        maxHeight="calc(100vh - 24px)"
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, width: '100%' }}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              style={{ minWidth: 80 }}
            >
              Close
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, boxSizing: 'border-box' }}>
          {successMessage && (
            <Alert tone="success" onClose={() => setSuccessMessage(null)}>
              {successMessage}
            </Alert>
          )}

          {/* Top Hero Section */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 10,
            padding: '10px 14px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            {/* Status Badge */}
            <div style={{ marginBottom: 4 }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px 10px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                background: asset.status === 'AVAILABLE' ? '#E8F5E9' : asset.status === 'BORROWED' ? '#EFF6FF' : '#FEF3C7',
                color: asset.status === 'AVAILABLE' ? '#166534' : asset.status === 'BORROWED' ? '#1E40AF' : '#92400E',
                border: asset.status === 'AVAILABLE' ? '1px solid #BBF7D0' : asset.status === 'BORROWED' ? '1px solid #BFDBFE' : '1px solid #FDE68A',
                lineHeight: 1.3,
              }}>
                {asset.status}
              </span>
            </div>

            {/* Asset Name */}
            <h2 style={{
              fontSize: 17,
              fontWeight: 800,
              color: '#0F172A',
              margin: '0 0 3px 0',
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
            }}>
              {asset.name}
            </h2>

            {/* Identifiers */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontSize: 12,
              fontFamily: 'monospace',
              color: '#64748B',
            }}>
              <span style={{ fontWeight: 600, color: '#475569' }}>
                {asset.psa_qr_identifier || 'PSA-ASSET-000000'}
              </span>
              <span style={{ color: '#CBD5E1' }}>•</span>
              <span style={{ color: '#64748B' }}>
                {asset.asset_number}
              </span>
            </div>
          </div>

          {/* Status Alert Notification */}
          {isAvailable && !isPermanentlyIssued && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              borderRadius: 10,
              border: '1px solid #BBF7D0',
              background: '#F0FDF4',
              padding: '7px 12px',
            }}>
              <div style={{
                display: 'flex',
                width: 20,
                height: 20,
                flexShrink: 0,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                background: '#DCFCE7',
                color: '#16A34A',
              }}>
                <CheckCircle2 size={14} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: '#15803D',
                  lineHeight: 1.2,
                }}>
                  READY TO BORROW
                </div>
                <div style={{ fontSize: 12, color: '#166534', marginTop: 1, lineHeight: 1.3 }}>
                  This asset is currently available for borrowing.
                </div>
              </div>
            </div>
          )}

          {isBorrowed && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              borderRadius: 10,
              border: '1px solid #BFDBFE',
              background: '#EFF6FF',
              padding: '7px 12px',
            }}>
              <div style={{
                display: 'flex',
                width: 20,
                height: 20,
                flexShrink: 0,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                background: '#DBEAFE',
                color: '#2563EB',
              }}>
                <Clock size={14} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1E40AF' }}>
                  CURRENTLY BORROWED
                </div>
                <div style={{ fontSize: 12, color: '#1E3A8A', marginTop: 1 }}>
                  This asset is currently unavailable for borrowing.
                </div>
              </div>
            </div>
          )}

          {isReserved && !isBorrowed && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              borderRadius: 10,
              border: '1px solid #FDE68A',
              background: '#FFFBEB',
              padding: '7px 12px',
            }}>
              <div style={{
                display: 'flex',
                width: 20,
                height: 20,
                flexShrink: 0,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                background: '#FEF3C7',
                color: '#D97706',
              }}>
                <Clock size={14} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#92400E' }}>
                  PENDING RESERVATION
                </div>
                <div style={{ fontSize: 12, color: '#78350F', marginTop: 1 }}>
                  This asset is currently reserved and temporarily unavailable.
                </div>
              </div>
            </div>
          )}

          {isMaintenance && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              borderRadius: 10,
              border: '1px solid #DDD6FE',
              background: '#FAF5FF',
              padding: '7px 12px',
            }}>
              <div style={{
                display: 'flex',
                width: 20,
                height: 20,
                flexShrink: 0,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                background: '#F3E8FF',
                color: '#7C3AED',
              }}>
                <Wrench size={14} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6B21A8' }}>
                  UNDER MAINTENANCE
                </div>
                <div style={{ fontSize: 12, color: '#581C87', marginTop: 1 }}>
                  This asset is currently under maintenance and cannot be borrowed.
                </div>
              </div>
            </div>
          )}

          {isPermanentlyIssued && (
            <div style={{
              borderRadius: 10,
              border: '1px solid #E2E8F0',
              background: '#F8FAFC',
              padding: '8px 12px',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>Permanently Issued</div>
              <div style={{ fontSize: 12, color: '#475569', marginTop: 1 }}>
                Issued to: <strong>{asset.issued_to_name || asset.issued_to}</strong>
              </div>
            </div>
          )}

          {/* Category and Office Location Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 8,
          }}>
            {/* Category */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderRadius: 10,
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              padding: '7px 12px',
            }}>
              <div style={{
                display: 'flex',
                width: 26,
                height: 26,
                flexShrink: 0,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 6,
                background: '#F1F5F9',
                color: '#475569',
              }}>
                <Package size={15} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748B' }}>
                  CATEGORY
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {asset.category?.name || 'Inventory Item'}
                </div>
              </div>
            </div>

            {/* Office Location */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderRadius: 10,
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              padding: '7px 12px',
            }}>
              <div style={{
                display: 'flex',
                width: 26,
                height: 26,
                flexShrink: 0,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 6,
                background: '#F1F5F9',
                color: '#475569',
              }}>
                <MapPin size={15} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748B' }}>
                  OFFICE LOCATION
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {asset.office?.name || 'Main Office'}
                </div>
              </div>
            </div>
          </div>

          {/* Asset Specifications */}
          <div>
            <h3 style={{
              fontSize: 11.5,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#0F172A',
              margin: '0 0 6px 0',
            }}>
              ASSET SPECIFICATIONS
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 8,
            }}>
              {/* Manufacturer */}
              <div style={{
                borderRadius: 10,
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                padding: '6px 12px',
              }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748B' }}>
                  MANUFACTURER
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginTop: 1 }}>
                  {asset.manufacturer?.name || 'HERCULES'}
                </div>
              </div>

              {/* Model */}
              <div style={{
                borderRadius: 10,
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                padding: '6px 12px',
              }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748B' }}>
                  MODEL
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginTop: 1 }}>
                  {asset.model || 'MS632B'}
                </div>
              </div>

              {/* Condition */}
              <div style={{
                borderRadius: 10,
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                padding: '6px 12px',
              }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748B' }}>
                  CONDITION
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginTop: 1 }}>
                  {asset.condition_status || 'GOOD'}
                </div>
              </div>

              {/* Location */}
              <div style={{
                borderRadius: 10,
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                padding: '6px 12px',
              }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748B' }}>
                  LOCATION
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginTop: 1 }}>
                  {asset.location?.name || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* ── ACTION BUTTONS SECTION ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 2 }}>

            {/* Primary Action Button (Full Width) */}
            {actions.can_request_borrow && (
              <Button
                type="button"
                variant="primary"
                style={{
                  width: '100%',
                  height: 38,
                  borderRadius: 8,
                  fontSize: 13.5,
                  fontWeight: 700,
                  background: '#0B3D91',
                  borderColor: '#0B3D91',
                  color: '#FFFFFF',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
                onClick={() => setActiveModal('borrow')}
              >
                <Package size={16} />
                <span>Request to Borrow Asset</span>
              </Button>
            )}

            {/* Secondary Actions (2-Column Grid) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 8,
            }}>
              {/* View Full Details */}
              <Button
                type="button"
                variant="secondary"
                style={{
                  width: '100%',
                  height: 36,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  color: '#0B3D91',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
                onClick={handleViewFullDetails}
              >
                <ExternalLink size={14} style={{ color: '#0B3D91' }} />
                <span>View Full Details</span>
              </Button>

              {/* Scan Another */}
              <Button
                type="button"
                variant="secondary"
                style={{
                  width: '100%',
                  height: 36,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  color: '#0F172A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
                onClick={handleScanAnotherClick}
              >
                <RefreshCw size={14} style={{ color: '#0F172A' }} />
                <span>Scan Another</span>
              </Button>
            </div>

            {/* Issue Reporting Section */}
            {(actions.can_report_damage || actions.can_report_lost) && (
              <div style={{ marginTop: 2 }}>
                <h3 style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#0F172A',
                  margin: '0 0 6px 0',
                }}>
                  REPORT AN ISSUE
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 8,
                }}>
                  {/* Report Damage */}
                  {actions.can_report_damage && (
                    <Button
                      type="button"
                      variant="secondary"
                      style={{
                        width: '100%',
                        height: 36,
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        background: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        color: '#0B3D91',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                      onClick={() => setActiveModal('damage')}
                    >
                      <Wrench size={14} style={{ color: '#0B3D91' }} />
                      <span>Report Damage</span>
                    </Button>
                  )}

                  {/* Report Lost */}
                  {actions.can_report_lost && (
                    <Button
                      type="button"
                      variant="danger"
                      style={{
                        width: '100%',
                        height: 36,
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        background: '#DC2626',
                        border: '1px solid #DC2626',
                        color: '#FFFFFF',
                        boxShadow: '0 1px 2px rgba(220,38,38,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                      onClick={() => setActiveModal('lost')}
                    >
                      <HelpCircle size={14} style={{ color: '#FFFFFF' }} />
                      <span>Report Lost</span>
                    </Button>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </Modal>

      {/* Triggered Sub-Modals */}
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
