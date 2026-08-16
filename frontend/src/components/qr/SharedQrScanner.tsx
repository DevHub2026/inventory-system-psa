import { useEffect, useRef, useState } from 'react'
import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser'
import { Camera, QrCode, Search, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Button, Input, Modal, Spinner } from '@/components/ui'
import { qrService } from '@/services/qrService'
import type { AssetContext } from '@/types'
import { ScannedAssetResultModal } from '@/components/qr/ScannedAssetResultModal'

interface SharedQrScannerProps {
  open: boolean
  onClose: () => void
  scanSource?: 'sidebar_scanner' | 'assets_page_scanner'
  mode?: 'modal' | 'page'
  initialCode?: string | null
  onCompleted?: () => void
}

type ScannerStatus =
  | 'idle'
  | 'starting'
  | 'scanning'
  | 'resolving'
  | 'permission_denied'
  | 'camera_unavailable'
  | 'invalid_qr'
  | 'not_found'
  | 'error'

export function stopGlobalCameraStreams() {
  try {
    document.querySelectorAll('video').forEach((v) => {
      if (v.srcObject) {
        try {
          const stream = v.srcObject as MediaStream
          stream.getTracks().forEach((t) => {
            try {
              t.stop()
              t.enabled = false
            } catch {}
          })
          v.srcObject = null
          v.pause()
        } catch {}
      }
    })
  } catch {}
}

export function SharedQrScanner({
  open,
  onClose,
  scanSource = 'sidebar_scanner',
  mode = 'modal',
  initialCode,
  onCompleted,
}: SharedQrScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null)
  const resolvingRef = useRef(false)
  const isResultOpenRef = useRef(false)

  const [status, setStatus] = useState<ScannerStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [manualCode, setManualCode] = useState('')
  const [resolvedContext, setResolvedContext] = useState<AssetContext | null>(null)
  const [showResultModal, setShowResultModal] = useState(false)

  const stopCamera = () => {
    if (controlsRef.current) {
      try {
        controlsRef.current.stop()
      } catch {}
      controlsRef.current = null
    }
    if (codeReaderRef.current) {
      try {
        (codeReaderRef.current as any).reset?.()
      } catch {}
      codeReaderRef.current = null
    }
    if (videoRef.current && videoRef.current.srcObject) {
      try {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach((t) => {
          try {
            t.stop()
            t.enabled = false
          } catch {}
        })
        videoRef.current.srcObject = null
        videoRef.current.pause()
      } catch {}
    }
    stopGlobalCameraStreams()
    resolvingRef.current = false
    setStatus('idle')
  }

  const handleResolve = async (rawValue: string) => {
    const value = rawValue.trim()
    if (!value) {
      setStatus('invalid_qr')
      setErrorMessage('This QR code is not recognized by the PSA Inventory System.')
      return
    }

    if (resolvingRef.current || isResultOpenRef.current) return
    resolvingRef.current = true
    stopCamera()
    setStatus('resolving')
    setErrorMessage(null)

    try {
      const context = await qrService.resolveAsset(value, scanSource)
      setResolvedContext(context)
      isResultOpenRef.current = true
      setShowResultModal(true)
      setStatus('idle')
      onCompleted?.()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to validate the scanned asset.'
      if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('no asset')) {
        setStatus('not_found')
        setErrorMessage('The scanned QR code was recognized, but no matching asset record was found in the catalog.')
      } else {
        setStatus('error')
        setErrorMessage(msg || 'Unable to validate the scanned asset. Please check your connection and try again.')
      }
    } finally {
      resolvingRef.current = false
    }
  }

  const startScanner = async () => {
    if (isResultOpenRef.current) return
    setErrorMessage(null)
    setStatus('starting')

    try {
      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserQRCodeReader()
      }

      const devices = await BrowserQRCodeReader.listVideoInputDevices()
      if (!devices || devices.length === 0) {
        setStatus('camera_unavailable')
        setErrorMessage('Camera hardware was not detected. Please verify your camera or use manual code lookup.')
        return
      }

      const backCamera = devices.find((d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear'))
      const deviceId = backCamera ? backCamera.deviceId : devices[0].deviceId

      if (videoRef.current) {
        setStatus('scanning')
        const controls = await codeReaderRef.current.decodeFromVideoDevice(
          deviceId,
          videoRef.current,
          (result) => {
            if (result && !resolvingRef.current && !isResultOpenRef.current) {
              const text = result.getText()
              void handleResolve(text)
            }
          }
        )
        controlsRef.current = controls
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied') || msg.toLowerCase().includes('notallowed')) {
        setStatus('permission_denied')
        setErrorMessage('Camera access was blocked by browser permissions. Please allow camera access in your browser settings or use manual lookup.')
      } else {
        setStatus('camera_unavailable')
        setErrorMessage('Unable to initialize camera video stream. Please use manual property code lookup.')
      }
    }
  }

  // Handle initialCode if provided (e.g. Back from Asset details)
  useEffect(() => {
    if (initialCode && initialCode.trim()) {
      void handleResolve(initialCode.trim())
    }
  }, [initialCode])

  useEffect(() => {
    if (open && !initialCode) {
      void startScanner()
    } else if (!open) {
      isResultOpenRef.current = false
      stopCamera()
      setShowResultModal(false)
      setResolvedContext(null)
    }
    return () => {
      isResultOpenRef.current = false
      stopCamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode.trim()) return
    void handleResolve(manualCode.trim())
  }

  const handleCloseModal = () => {
    isResultOpenRef.current = false
    setShowResultModal(false)
    setResolvedContext(null)
    stopCamera()
    if (mode === 'modal') {
      onClose()
    }
  }

  const handleScanAnother = () => {
    isResultOpenRef.current = false
    setShowResultModal(false)
    setResolvedContext(null)
    setManualCode('')
    void startScanner()
  }

  const scannerContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, color: '#0F172A' }}>
      {/* ── Viewfinder Card ── */}
      <div style={{
        borderRadius: 16,
        border: '1px solid #E2E8F0',
        background: '#FFFFFF',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
      }}>
        {/* Top Viewfinder Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          borderBottom: '1px solid #F1F5F9',
          background: '#F8FAFC',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              display: 'inline-flex',
              width: 32,
              height: 32,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              background: '#EFF6FF',
              color: '#0B3D91',
            }}>
              <QrCode size={16} />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>
                Camera Viewfinder
              </div>
            </div>
          </div>

          {/* Status Indicator Pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11.5,
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: 999,
            background: status === 'scanning' ? '#F0FDF4' : '#F1F5F9',
            color: status === 'scanning' ? '#16A34A' : '#64748B',
            border: `1px solid ${status === 'scanning' ? '#BBF7D0' : '#E2E8F0'}`,
          }}>
            <span style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: status === 'scanning' ? '#22C55E' : '#94A3B8',
              boxShadow: status === 'scanning' ? '0 0 8px rgba(34,197,94,0.6)' : 'none',
            }} />
            <span>{status === 'scanning' ? 'LIVE SCANNER' : status === 'resolving' ? 'IDENTIFYING...' : 'STANDBY'}</span>
          </div>
        </div>

        {/* Viewfinder Video Frame */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{
            position: 'relative',
            borderRadius: 14,
            overflow: 'hidden',
            background: '#0B132B',
            border: '1px solid #1E293B',
            aspectRatio: '4 / 3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
          }}>
            {/* Live Video Feed */}
            <video
              ref={videoRef}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: status === 'scanning' ? 'block' : 'none',
              }}
            />

            {/* Futuristic High-Contrast HUD Target Brackets */}
            {status === 'scanning' && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {/* Viewfinder Target Frame */}
                <div style={{
                  position: 'absolute',
                  inset: '16%',
                  border: '1px dashed rgba(56, 189, 248, 0.4)',
                  borderRadius: 12,
                }} />

                {/* 4 Glowing Corner Brackets */}
                <div style={{ position: 'absolute', top: '15%', left: '15%', width: 26, height: 26, borderTop: '3.5px solid #38BDF8', borderLeft: '3.5px solid #38BDF8', borderTopLeftRadius: 8 }} />
                <div style={{ position: 'absolute', top: '15%', right: '15%', width: 26, height: 26, borderTop: '3.5px solid #38BDF8', borderRight: '3.5px solid #38BDF8', borderTopRightRadius: 8 }} />
                <div style={{ position: 'absolute', bottom: '15%', left: '15%', width: 26, height: 26, borderBottom: '3.5px solid #38BDF8', borderLeft: '3.5px solid #38BDF8', borderBottomLeftRadius: 8 }} />
                <div style={{ position: 'absolute', bottom: '15%', right: '15%', width: 26, height: 26, borderBottom: '3.5px solid #38BDF8', borderRight: '3.5px solid #38BDF8', borderBottomRightRadius: 8 }} />

                {/* Center Crosshair Dot */}
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#38BDF8',
                  boxShadow: '0 0 10px #38BDF8',
                }} />

                {/* Scanning Guidance Text */}
                <div style={{
                  position: 'absolute',
                  bottom: 12,
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                  textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                }}>
                  Align QR Code within the brackets
                </div>
              </div>
            )}

            {/* Resolving / Loading State */}
            {status === 'resolving' && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.9)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 14,
                color: '#FFFFFF',
                textAlign: 'center',
                padding: 24,
              }}>
                <Spinner label="Verifying asset in PSA database..." />
              </div>
            )}

            {/* Standby / Permission Denied / Camera Off State */}
            {status !== 'resolving' && status !== 'scanning' && (
              <div style={{
                position: 'relative',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                textAlign: 'center',
                color: '#94A3B8',
                padding: 24,
              }}>
                <div style={{
                  display: 'flex',
                  width: 52,
                  height: 52,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 14,
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#93C5FD',
                }}>
                  <Camera size={26} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>
                    {status === 'permission_denied'
                      ? 'Camera Access Denied'
                      : status === 'camera_unavailable'
                      ? 'Camera Unavailable'
                      : 'Camera Standby'}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94A3B8', maxWidth: 260, lineHeight: 1.45 }}>
                    {status === 'permission_denied'
                      ? 'Please grant camera access in browser permissions or enter code below.'
                      : 'Tap button below to start live optical scanner.'}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => void startScanner()}
                  variant="primary"
                  size="sm"
                  style={{
                    marginTop: 4,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#0B3D91',
                    paddingInline: 16,
                    height: 38,
                    fontWeight: 700,
                  }}
                >
                  <Camera size={15} />
                  <span>Start Camera</span>
                </Button>
              </div>
            )}
          </div>

          {/* Error Message Notification */}
          {errorMessage && (
            <div style={{
              borderRadius: 10,
              border: '1px solid #FECACA',
              background: '#FEF2F2',
              padding: '12px 14px',
              fontSize: 12.5,
              color: '#B91C1C',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
            }}>
              <AlertTriangle size={16} style={{ color: '#EF4444', flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1, lineHeight: 1.45 }}>{errorMessage}</div>
            </div>
          )}

          {/* Divider */}
          <div style={{ position: 'relative', padding: '4px 0' }}>
            <div style={{ position: 'absolute', insetInline: 0, top: '50%', height: 1, background: '#E2E8F0' }} />
            <div style={{
              position: 'relative',
              margin: '0 auto',
              width: 'max-content',
              background: '#FFFFFF',
              padding: '0 14px',
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#94A3B8',
            }}>
              Or Manual Code Lookup
            </div>
          </div>

          {/* Manual Entry Lookup Box */}
          <div style={{
            padding: '16px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Property Tag / QR Identifier
            </label>
            <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <Input
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="e.g., PSA-ASSET-000029"
                  style={{
                    height: 42,
                    paddingLeft: 14,
                    paddingRight: 14,
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    fontSize: 13.5,
                  }}
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                size="md"
                style={{
                  paddingInline: 18,
                  height: 42,
                  background: '#0B3D91',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 700,
                  borderRadius: 10,
                }}
              >
                <Search size={15} />
                <span>Lookup</span>
              </Button>
            </form>
            <div style={{ fontSize: 11.5, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={12} style={{ color: '#16A34A' }} />
              <span>Supports official QR payload, UUID tags, and property inventory serials.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (mode === 'page') {
    return (
      <div style={{ maxWidth: 460, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {scannerContent}

        <ScannedAssetResultModal
          open={showResultModal}
          onClose={handleCloseModal}
          context={resolvedContext}
          scanSource={scanSource}
          onScanAnother={handleScanAnother}
        />
      </div>
    )
  }

  return (
    <>
      <Modal open={open && !showResultModal} onClose={onClose} title="Scan QR Code" maxWidth={500}>
        {scannerContent}
      </Modal>

      <ScannedAssetResultModal
        open={showResultModal}
        onClose={handleCloseModal}
        context={resolvedContext}
        scanSource={scanSource}
        onScanAnother={handleScanAnother}
      />
    </>
  )
}