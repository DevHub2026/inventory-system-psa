import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Alert, Spinner } from '@/components/ui'
import { ApprovalHistoryTimeline } from '@/components/workflows/ApprovalHistoryTimeline'
import { qrService } from '@/services/qrService'
import type { AssetContext } from '@/types'
import { BorrowRequestModal } from '@/components/qr/BorrowRequestModal'
import { BorrowExtensionModal } from '@/components/qr/BorrowExtensionModal'
import { ReIssuanceRequestModal } from '@/components/qr/ReIssuanceRequestModal'
import { ReportDamageModal } from '@/components/qr/ReportDamageModal'
import { ReportLostModal } from '@/components/qr/ReportLostModal'
import {
  Package,
  User as UserIcon,
  MapPin,
  Clock,
  AlertTriangle,
  RotateCcw,
  Wrench,
  HelpCircle,
  CheckCircle2,
  X,
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
      const msg = err instanceof Error ? err.message : 'Asset not found or invalid QR code.'
      setError({ status: 404, message: msg })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAsset()
  }, [identifier])

  const handleBack = () => {
    navigate(`/qr?asset=${encodeURIComponent(identifier || '')}`)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <Spinner label="Loading asset details..." />
      </div>
    )
  }

  if (error || !context) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#F8FAFC' }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: '#FEE2E2',
          color: '#DC2626',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}>
          <AlertTriangle size={28} />
        </div>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: '0 0 6px 0' }}>Asset Validation Error</h1>
        <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 20px 0', textAlign: 'center', maxWidth: 360 }}>
          {error?.message || 'Invalid or unrecognized PSA QR code.'}
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" onClick={() => navigate('/qr')}>
            Scan Another QR
          </Button>
          <Button variant="primary" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const { asset, actions, active_borrowing, pending_reservation, active_maintenance, history } = context

  const isAvailable = asset.status === 'AVAILABLE'
  const isBorrowed = asset.status === 'BORROWED' || Boolean(active_borrowing)
  const isReserved = asset.status === 'RESERVED' || Boolean(pending_reservation)
  const isMaintenance = asset.status === 'MAINTENANCE' || Boolean(active_maintenance)
  const isPermanentlyIssued = Boolean(asset.issued_to)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      boxSizing: 'border-box',
    }}>
      {/* ── Modal Card Container ── */}
      <div style={{
        width: '100%',
        maxWidth: 740,
        borderRadius: 16,
        border: '1px solid #E2E8F0',
        background: '#FFFFFF',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.22)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* ── Header with PSA Ribbon & Title ── */}
        <div style={{
          padding: '12px 18px 10px',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          background: '#FFFFFF',
        }}>
          {/* PSA Tri-color Accent Bar */}
          <div style={{ display: 'flex', gap: 4 }}>
            <span style={{ height: 3, width: 24, borderRadius: 999, background: '#0B3D91', display: 'block' }} />
            <span style={{ height: 3, width: 12, borderRadius: 999, background: '#FFD400', display: 'block' }} />
            <span style={{ height: 3, width: 8,  borderRadius: 999, background: '#E31C23', display: 'block' }} />
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <h2 style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 800,
              color: '#0F172A',
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              PSA Asset Record: {asset.name}
            </h2>

            <button
              type="button"
              onClick={handleBack}
              aria-label="Close"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: 6,
                border: 'none',
                background: 'transparent',
                color: '#64748B',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                const b = e.currentTarget as HTMLButtonElement
                b.style.background = '#F1F5F9'
                b.style.color = '#0F172A'
              }}
              onMouseLeave={(e) => {
                const b = e.currentTarget as HTMLButtonElement
                b.style.background = 'transparent'
                b.style.color = '#64748B'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Modal Body Content ── */}
        <div style={{
          padding: '12px 18px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          boxSizing: 'border-box',
          maxHeight: 'calc(100vh - 120px)',
          overflowY: 'auto',
        }}>
          {actionMessage && (
            <Alert tone={actionMessage.tone} onClose={() => setActionMessage(null)}>
              {actionMessage.text}
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
            <h1 style={{
              fontSize: 17,
              fontWeight: 800,
              color: '#0F172A',
              margin: '0 0 3px 0',
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
            }}>
              {asset.name}
            </h1>

            {/* Description (if present) */}
            {asset.description && (
              <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 4px 0', maxWidth: 500 }}>
                {asset.description}
              </p>
            )}

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
                  {active_borrowing?.user_name ? (
                    <>Borrowed by: <strong>{active_borrowing.user_name}</strong> · Due: <strong>{active_borrowing.due_date || 'N/A'}</strong></>
                  ) : (
                    'This asset is currently unavailable for borrowing.'
                  )}
                </div>
              </div>
            </div>
          )}

          {isReserved && !isBorrowed && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              borderRadius: 10,
              border: '1px solid #FDE68A',
              background: '#FFFBEB',
              padding: '7px 12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
                    PENDING BORROW REQUEST
                  </div>
                  <div style={{ fontSize: 12, color: '#78350F', marginTop: 1 }}>
                    Requested by: <strong>{pending_reservation?.user_name || 'Staff'}</strong>
                  </div>
                </div>
              </div>
              {pending_reservation && (
                <div style={{ marginTop: 2, paddingTop: 6, borderTop: '1px solid #FEF3C7' }}>
                  <ApprovalHistoryTimeline
                    requestType="borrow_request"
                    requestId={pending_reservation.id}
                  />
                </div>
              )}
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
                {asset.date_issued && <span> · Date: {asset.date_issued}</span>}
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

            {/* Workflow Action Buttons (if extension or reissuance available) */}
            {(actions.can_request_extension || actions.can_request_reissuance) && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 8,
              }}>
                {actions.can_request_extension && (
                  <Button
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
                    onClick={() => setActiveModal('extension')}
                  >
                    <RotateCcw size={15} style={{ color: '#0B3D91' }} />
                    <span>Request Extension</span>
                  </Button>
                )}

                {actions.can_request_reissuance && (
                  <Button
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
                    onClick={() => setActiveModal('reissuance')}
                  >
                    <UserIcon size={15} style={{ color: '#0B3D91' }} />
                    <span>Transfer Accountability</span>
                  </Button>
                )}
              </div>
            )}

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
                      <Wrench size={15} style={{ color: '#0B3D91' }} />
                      <span>Report Damage</span>
                    </Button>
                  )}

                  {/* Report Lost */}
                  {actions.can_report_lost && (
                    <Button
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
                        boxShadow: '0 1px 2px rgba(220,38,38,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                      onClick={() => setActiveModal('lost')}
                    >
                      <HelpCircle size={15} style={{ color: '#FFFFFF' }} />
                      <span>Report Lost</span>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Borrow History Section (if present) */}
          {history && history.borrow_history && history.borrow_history.length > 0 && (
            <div style={{
              marginTop: 6,
              paddingTop: 10,
              borderTop: '1px solid #F1F5F9',
            }}>
              <h3 style={{
                fontSize: 11.5,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#64748B',
                margin: '0 0 6px 0',
              }}>
                Recent Borrow History
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {history.borrow_history.map((b) => (
                  <div
                    key={b.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderRadius: 8,
                      border: '1px solid #E2E8F0',
                      background: '#F8FAFC',
                      padding: '8px 12px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0F172A' }}>{b.user_name}</div>
                      <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 1 }}>{b.borrow_date} → {b.due_date}</div>
                    </div>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '2px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      background: b.status === 'RETURNED' ? '#F1F5F9' : '#EFF6FF',
                      color: b.status === 'RETURNED' ? '#64748B' : '#1D4ED8',
                    }}>
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer with Close Button ── */}
        <div style={{
          padding: '10px 18px',
          background: '#F8FAFC',
          borderTop: '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 10,
        }}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleBack}
            style={{ minWidth: 80 }}
          >
            Close
          </Button>
        </div>
      </div>

      {/* Triggered Modals */}
      {activeModal === 'borrow' && (
        <BorrowRequestModal
          open={true}
          onClose={() => setActiveModal(null)}
          assetContext={context}
          onSuccess={() => {
            setActionMessage({ tone: 'success', text: 'Borrow request submitted successfully. Workflow initialized.' })
            void loadAsset()
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
            setActionMessage({ tone: 'success', text: 'Borrow extension request submitted.' })
            void loadAsset()
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
            setActionMessage({ tone: 'success', text: 'Custody re-issuance request submitted.' })
            void loadAsset()
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
            setActionMessage({ tone: 'success', text: 'Damage report logged successfully.' })
            void loadAsset()
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
            setActionMessage({ tone: 'success', text: 'Lost asset report submitted.' })
            void loadAsset()
            setActiveModal(null)
          }}
        />
      )}
    </div>
  )
}
