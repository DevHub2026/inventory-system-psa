import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Camera,
  ArrowLeft,
  Zap,
  ShieldCheck,
} from 'lucide-react'
import psaLogo from '@/assets/logo.png'
import { SharedQrScanner, stopGlobalCameraStreams } from '@/components/qr/SharedQrScanner'
import { Button } from '@/components/ui'

export function QRScannerPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialAsset = searchParams.get('asset')

  // Ensure camera streams are completely shut off when unmounting
  useEffect(() => {
    return () => {
      stopGlobalCameraStreams()
    }
  }, [])

  // Auto refresh & stop camera when navigating back to dashboard
  const handleBackToDashboard = () => {
    stopGlobalCameraStreams()
    window.location.href = '/dashboard'
  }

  const handleModalClose = () => {
    if (initialAsset) {
      setSearchParams({})
    }
    stopGlobalCameraStreams()
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      maxWidth: 1100,
      width: '100%',
      paddingBottom: 36,
      margin: '0 auto',
    }}>
      {/* ── Top Navigation & Page Header ── */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid #E2E8F0',
        padding: '20px 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleBackToDashboard}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              height: 40,
              paddingInline: 16,
              fontSize: 13,
              fontWeight: 600,
              color: '#0F172A',
              border: '1px solid #CBD5E1',
              borderRadius: 10,
              background: '#FFFFFF',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </Button>

          {/* Official PSA Seal / Logo */}
          <img
            src={psaLogo}
            alt="Philippine Statistics Authority"
            style={{
              width: 44,
              height: 44,
              objectFit: 'contain',
              flexShrink: 0,
            }}
          />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}>
                QR Code Scanner
              </h1>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 999,
                background: '#EFF6FF',
                color: '#0B3D91',
                border: '1px solid #BFDBFE',
              }}>
                Optical Scanner
              </span>
            </div>
            <p style={{
              margin: '3px 0 0',
              fontSize: 13,
              color: '#64748B',
              lineHeight: 1.4,
            }}>
              Instant asset identification, real-time property verification, and self-service custody workflows.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '6px 14px',
            borderRadius: 999,
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            color: '#16A34A',
            fontSize: 12,
            fontWeight: 700,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 6px #22C55E' }} />
            <span>System Armed & Ready</span>
          </div>
        </div>
      </div>



      {/* ── Main Scanner Grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)',
        gap: 20,
        alignItems: 'start',
      }}>
        {/* Left Column: Live Scanner Container */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
        }}>
          <div style={{
            padding: '16px 20px',
            background: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: '#EFF6FF',
                color: '#0B3D91',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Camera size={18} />
              </div>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: '#0F172A' }}>
                  Live Camera Scanner
                </div>
                <div style={{ fontSize: 12, color: '#64748B' }}>
                  Optical barcode & QR code recognition
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: '20px' }}>
            <SharedQrScanner
              open={true}
              onClose={handleModalClose}
              initialCode={initialAsset}
              scanSource="sidebar_scanner"
              mode="page"
            />
          </div>
        </div>

        {/* Right Column: Instructions & Feature Highlights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Quick Guide Card */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid #E2E8F0',
            padding: '20px 22px',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: '#EFF6FF',
                color: '#0B3D91',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Zap size={18} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                How to Scan
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { step: '1', title: 'Allow Camera Access', desc: 'Ensure your web browser has permission to access your webcam or mobile camera.' },
                { step: '2', title: 'Frame the QR Code', desc: 'Hold your device steady and center the official PSA asset tag inside the viewfinder box.' },
                { step: '3', title: 'Automatic Identification', desc: 'The system reads the tag instantly and opens the complete asset record.' },
                { step: '4', title: 'Instant Actions', desc: 'Directly initiate borrowing, request maintenance, report damage, or transfer custody.' },
              ].map((item) => (
                <div key={item.step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: '#EFF6FF',
                    color: '#0B3D91',
                    fontSize: 12,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: '1px solid #BFDBFE',
                    marginTop: 1,
                  }}>
                    {item.step}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 2, lineHeight: 1.45 }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security & Verification Guarantee */}
          <div style={{
            background: '#F8FAFC',
            borderRadius: 14,
            border: '1px solid #E2E8F0',
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#F0FDF4',
              color: '#16A34A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                Secure Audit Logging
              </div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2, lineHeight: 1.5 }}>
                Every QR scan event is timestamped and recorded in the forensic audit trail for accountability.
              </div>
            </div>
          </div>

          {/* Supported Actions Card */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 14,
            border: '1px solid #E2E8F0',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B' }}>
              Supported Actions on Scan
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[
                'Borrow Equipment',
                'Extend Loan',
                'Re-issue Custody',
                'Report Damage',
                'Report Lost',
                'Schedule Service',
              ].map((action) => (
                <span
                  key={action}
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: '#334155',
                    background: '#F1F5F9',
                    border: '1px solid #E2E8F0',
                    borderRadius: 6,
                    padding: '3px 8px',
                  }}
                >
                  {action}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
