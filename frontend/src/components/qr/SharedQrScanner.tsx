import { useEffect, useRef, useState } from 'react'
import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser'
import { Camera, QrCode, Search, RefreshCw, AlertTriangle } from 'lucide-react'
import { Button, Input, Modal, Spinner, Card } from '@/components/ui'
import { qrService } from '@/services/qrService'
import type { QrContext } from '@/types'
import { ScannedQrResultModal } from '@/components/qr/ScannedQrResultModal'

interface SharedQrScannerProps {
  open: boolean
  onClose: () => void
  scanSource?: 'sidebar_scanner' | 'assets_page_scanner'
  mode?: 'modal' | 'page'
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

export function SharedQrScanner({
  open,
  onClose,
  scanSource = 'sidebar_scanner',
  mode = 'modal',
  onCompleted,
}: SharedQrScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null)
  const resolvingRef = useRef(false)

  const [status, setStatus] = useState<ScannerStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [manualCode, setManualCode] = useState('')
  const [resolvedContext, setResolvedContext] = useState<QrContext | null>(null)
  const [showResultModal, setShowResultModal] = useState(false)

  const stopCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.stop()
      controlsRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
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

    if (resolvingRef.current) return
    resolvingRef.current = true
    stopCamera()
    setStatus('resolving')
    setErrorMessage(null)

    try {
      const context = await qrService.resolveQr(value, scanSource)
      setResolvedContext(context)
      setShowResultModal(true)
      setStatus('idle')
      onCompleted?.()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to validate the scanned asset.'
      if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('no asset')) {
        setStatus('not_found')
        setErrorMessage('The scanned QR code was recognized, but no matching asset was found.')
      } else {
        setStatus('error')
        setErrorMessage(msg || 'Unable to validate the scanned asset. Please check your connection and try again.')
      }
    } finally {
      resolvingRef.current = false
    }
  }

  const startScanner = async () => {
    setErrorMessage(null)
    setStatus('starting')

    try {
      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserQRCodeReader()
      }

      const devices = await BrowserQRCodeReader.listVideoInputDevices()
      if (!devices || devices.length === 0) {
        setStatus('camera_unavailable')
        setErrorMessage('Camera is unavailable on this device. Use manual entry instead.')
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
            if (result && !resolvingRef.current) {
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
        setErrorMessage('Camera access is required to scan a QR code. You may allow camera access or enter the asset code manually.')
      } else {
        setStatus('camera_unavailable')
        setErrorMessage('Camera is unavailable on this device. Use manual entry instead.')
      }
    }
  }

  useEffect(() => {
    if (open) {
      void startScanner()
    } else {
      stopCamera()
      setShowResultModal(false)
      setResolvedContext(null)
    }
    return () => {
      stopCamera()
    }
  }, [open])

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode.trim()) return
    void handleResolve(manualCode.trim())
  }

  const scannerContent = (
    <div className="space-y-4 text-slate-900">
      {/* Scanner Viewfinder Box */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-800 aspect-square flex items-center justify-center shadow-inner">
        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${status === 'scanning' ? 'block' : 'hidden'}`}
        />

        {status === 'resolving' && (
          <div className="flex flex-col items-center gap-2 text-white p-4">
            <Spinner label="Resolving asset context..." />
          </div>
        )}

        {status !== 'resolving' && status !== 'scanning' && (
          <div className="flex flex-col items-center gap-3 text-slate-400 p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-400 mb-1">
              <Camera className="w-7 h-7" />
            </div>
            <p className="text-xs text-slate-400">
              {status === 'permission_denied'
                ? 'Camera access denied'
                : status === 'camera_unavailable'
                ? 'Camera unavailable'
                : 'Camera inactive'}
            </p>
            <Button
              type="button"
              onClick={() => void startScanner()}
              variant="primary"
              className="text-xs font-bold px-5"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Start Camera
            </Button>
          </div>
        )}

        {status === 'scanning' && (
          <div className="absolute inset-0 border-2 border-blue-500/60 pointer-events-none flex flex-col justify-between p-6">
            <div className="flex justify-between">
              <div className="w-6 h-6 border-t-2 border-l-2 border-blue-400"></div>
              <div className="w-6 h-6 border-t-2 border-r-2 border-blue-400"></div>
            </div>
            <div className="flex justify-between">
              <div className="w-6 h-6 border-b-2 border-l-2 border-blue-400"></div>
              <div className="w-6 h-6 border-b-2 border-r-2 border-blue-400"></div>
            </div>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}

      {/* Manual Entry Fallback Form */}
      <Card className="p-3.5 bg-slate-50 border-slate-200 rounded-xl space-y-2">
        <label className="text-xs font-semibold text-slate-700 block">
          Or enter QR Code / Asset Number manually:
        </label>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <Input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="e.g. PSA-ASSET-000105 or PSA-CAM-2026-001"
            className="bg-white text-xs"
          />
          <Button type="submit" variant="primary" className="px-4 text-xs font-bold">
            <Search className="w-3.5 h-3.5" />
          </Button>
        </form>
      </Card>
    </div>
  )

  if (mode === 'page') {
    return (
      <div className="space-y-6 max-w-md mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-700" />
            <h1 className="text-lg font-bold text-slate-900">Scan QR Code</h1>
          </div>
        </div>
        {scannerContent}

        <ScannedQrResultModal
          open={showResultModal}
          onClose={() => setShowResultModal(false)}
          context={resolvedContext}
          scanSource={scanSource}
          onScanAnother={() => {
            setShowResultModal(false)
            void startScanner()
          }}
        />
      </div>
    )
  }

  return (
    <>
      <Modal open={open && !showResultModal} onClose={onClose} title="Scan QR Code" maxWidth="max-w-md">
        {scannerContent}
      </Modal>

      <ScannedQrResultModal
        open={showResultModal}
        onClose={() => {
          setShowResultModal(false)
          onClose()
        }}
        context={resolvedContext}
        scanSource={scanSource}
        onScanAnother={() => {
          setShowResultModal(false)
          void startScanner()
        }}
      />
    </>
  )
}