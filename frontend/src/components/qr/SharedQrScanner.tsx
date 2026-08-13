import { useEffect, useRef, useState } from 'react'
import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser'
import { Camera, QrCode, Search, AlertTriangle } from 'lucide-react'
import { Button, Input, Modal, Spinner, Card } from '@/components/ui'
import { qrService } from '@/services/qrService'
import type { AssetContext } from '@/types'
import { ScannedAssetResultModal } from '@/components/qr/ScannedAssetResultModal'

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
  const [resolvedContext, setResolvedContext] = useState<AssetContext | null>(null)
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
      const context = await qrService.resolveAsset(value, scanSource)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode.trim()) return
    void handleResolve(manualCode.trim())
  }

  const scannerContent = (
    <div className="space-y-4 text-slate-900">
      <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-blue-700">
            <QrCode className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">Scan QR Code</p>
            <p className="text-sm text-slate-500">Scan an asset QR code to quickly access its information.</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="relative rounded-[24px] overflow-hidden bg-slate-50 border border-slate-200 aspect-[4/3] flex items-center justify-center">
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${status === 'scanning' ? 'block' : 'hidden'}`}
            />

            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-4 rounded-[20px] border border-slate-200" />
              <div className="absolute inset-8 rounded-[16px] border border-slate-200/70" />
            </div>

            {status === 'resolving' && (
              <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-3 text-white text-center p-6">
                <Spinner label="Resolving asset context..." />
              </div>
            )}

            {status !== 'resolving' && status !== 'scanning' && (
              <div className="relative z-10 flex flex-col items-center gap-3 text-center text-slate-500 p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 border border-slate-200 text-slate-600">
                  <Camera className="w-7 h-7" />
                </div>
                <p className="text-sm font-medium text-slate-700">
                  {status === 'permission_denied'
                    ? 'Camera access denied'
                    : status === 'camera_unavailable'
                    ? 'Camera unavailable'
                    : 'Camera inactive'}
                </p>
                <p className="text-sm text-slate-500 max-w-[18rem]">
                  Allow camera access to scan QR codes, or use manual entry below.
                </p>
                <Button
                  type="button"
                  onClick={() => void startScanner()}
                  variant="primary"
                  className="text-sm font-semibold px-5"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Start Camera
                </Button>
              </div>
            )}

            {status === 'scanning' && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-6 rounded-[18px] border border-blue-500/20" />
                <div className="absolute top-6 left-6 h-10 w-10 border-t-2 border-l-2 border-blue-500 rounded-tl-xl" />
                <div className="absolute top-6 right-6 h-10 w-10 border-t-2 border-r-2 border-blue-500 rounded-tr-xl" />
                <div className="absolute bottom-6 left-6 h-10 w-10 border-b-2 border-l-2 border-blue-500 rounded-bl-xl" />
                <div className="absolute bottom-6 right-6 h-10 w-10 border-b-2 border-r-2 border-blue-500 rounded-br-xl" />
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm flex items-start gap-3">
              <AlertTriangle className="mt-1 h-4 w-4 flex-shrink-0 text-red-500" />
              <div>{errorMessage}</div>
            </div>
          )}

          <div className="relative py-3">
            <div className="absolute inset-x-0 top-1/2 h-px bg-slate-200" />
            <div className="relative mx-auto w-max bg-white px-3 text-xs uppercase tracking-[0.22em] text-slate-500">
              Or
            </div>
          </div>

          <Card className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <label className="text-xs font-semibold text-slate-700 block mb-2">
              Enter QR Code / Asset Number manually
            </label>
            <form onSubmit={handleManualSubmit} className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="e.g. PSA-ASSET-000105 or PSA-CAM-2026-001"
                className="bg-white text-sm placeholder:text-slate-400"
              />
              <Button type="submit" variant="primary" className="shrink-0 px-4 text-sm font-semibold">
                <Search className="w-4 h-4" />
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )

  if (mode === 'page') {
    return (
      <div className="space-y-6 max-w-md mx-auto">
        {scannerContent}

        <ScannedAssetResultModal
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

      <ScannedAssetResultModal
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