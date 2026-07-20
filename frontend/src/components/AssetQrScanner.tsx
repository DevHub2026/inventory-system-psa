import { useEffect, useRef, useState } from 'react'
import { Alert, Badge, Button, Input, Modal, Spinner } from '@/components/ui'
import { assetService } from '@/services/assetService'
import type { Asset } from '@/types'
import { assetStatusTone } from '@/utils/statusTone'

interface AssetQrScannerProps {
  open: boolean
  onClose: () => void
}

type ScannerState = 'idle' | 'starting' | 'scanning' | 'resolving' | 'found' | 'not_found' | 'invalid' | 'unsupported' | 'permission_denied' | 'camera_error'

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => {
  detect(source: HTMLVideoElement): Promise<Array<{ rawValue?: string }>>
}

function getBarcodeDetector(): BarcodeDetectorConstructor | null {
  const candidate = (window as Window & { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector
  return candidate ?? null
}

export function AssetQrScanner({ open, onClose }: AssetQrScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanLoopRef = useRef<number | null>(null)
  const resolvingRef = useRef(false)
  const [state, setState] = useState<ScannerState>('idle')
  const [message, setMessage] = useState('')
  const [scannedValue, setScannedValue] = useState('')
  const [manualValue, setManualValue] = useState('')
  const [asset, setAsset] = useState<Asset | null>(null)

  function stopCamera() {
    if (scanLoopRef.current !== null) {
      cancelAnimationFrame(scanLoopRef.current)
      scanLoopRef.current = null
    }

    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    resolvingRef.current = false
  }

  async function resolveIdentifier(value: string) {
    const identifier = value.trim()

    if (!identifier) {
      setState('invalid')
      setMessage('The scanned QR value was empty.')
      return
    }

    resolvingRef.current = true
    setScannedValue(identifier)
    setState('resolving')
    setAsset(null)

    try {
      const resolvedAsset = await assetService.scan(identifier)
      stopCamera()
      setAsset(resolvedAsset)
      setState('found')
      setMessage('Asset found from backend identifier lookup.')
    } catch (error: unknown) {
      resolvingRef.current = false
      setState('not_found')
      setMessage(error instanceof Error ? error.message : 'No asset matched that identifier.')
    }
  }

  async function startCamera() {
    stopCamera()
    setAsset(null)
    setScannedValue('')
    setMessage('')
    setState('starting')

    if (!navigator.mediaDevices?.getUserMedia) {
      setState('unsupported')
      setMessage('This browser does not support camera access.')
      return
    }

    const BarcodeDetector = getBarcodeDetector()
    if (!BarcodeDetector) {
      setState('unsupported')
      setMessage('This browser does not support native QR detection. Use Chrome or Edge, or use the development fallback below.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      const detector = new BarcodeDetector({ formats: ['qr_code'] })
      setState('scanning')

      const scanFrame = async () => {
        if (!videoRef.current || resolvingRef.current || !streamRef.current) return

        try {
          if (videoRef.current.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            const codes = await detector.detect(videoRef.current)
            const rawValue = codes.find((code) => code.rawValue)?.rawValue

            if (rawValue) {
              void resolveIdentifier(rawValue)
              return
            }
          }
        } catch {
          setState('camera_error')
          setMessage('The camera opened, but QR detection failed.')
          return
        }

        scanLoopRef.current = requestAnimationFrame(scanFrame)
      }

      scanLoopRef.current = requestAnimationFrame(scanFrame)
    } catch (error: unknown) {
      stopCamera()

      if (error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError')) {
        setState('permission_denied')
        setMessage('Camera permission was denied. Allow camera access to scan a real asset QR code.')
        return
      }

      setState('camera_error')
      setMessage('No usable camera was found or the camera could not be opened.')
    }
  }

  useEffect(() => {
    if (open) {
      void startCamera()
      return
    }

    stopCamera()
    setState('idle')
  }, [open])

  useEffect(() => () => stopCamera(), [])

  const canScanAgain = ['found', 'not_found', 'invalid', 'unsupported', 'permission_denied', 'camera_error'].includes(state)

  return (
    <Modal
      open={open}
      title="Scan Asset QR"
      onClose={() => {
        stopCamera()
        onClose()
      }}
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => {
              stopCamera()
              onClose()
            }}
          >
            Close
          </Button>
          {canScanAgain && <Button onClick={() => void startCamera()}>Scan Again</Button>}
        </>
      }
    >
      <div className="space-y-4">
        {message && (
          <Alert tone={state === 'found' ? 'success' : state === 'not_found' || state === 'invalid' ? 'error' : 'info'}>
            {message}
          </Alert>
        )}

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-black">
          <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
        </div>

        {(state === 'starting' || state === 'scanning' || state === 'resolving') && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Spinner />
            {state === 'starting' && 'Requesting camera permission...'}
            {state === 'scanning' && 'Point the camera at a PSA asset QR code.'}
            {state === 'resolving' && 'Resolving scanned identifier with the backend...'}
          </div>
        )}

        {scannedValue && (
          <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm">
            <div className="text-gray-500">Decoded QR value</div>
            <div className="font-mono font-semibold text-gray-900">{scannedValue}</div>
          </div>
        )}

        {asset && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="mb-2 text-sm font-semibold text-green-900">Asset Found</div>
            <dl className="grid gap-3 text-sm md:grid-cols-2">
              <div>
                <dt className="text-green-700">Name</dt>
                <dd className="font-medium text-gray-900">{asset.name}</dd>
              </div>
              <div>
                <dt className="text-green-700">Asset Number</dt>
                <dd className="font-medium text-gray-900">{asset.asset_number}</dd>
              </div>
              <div>
                <dt className="text-green-700">PSA QR</dt>
                <dd className="font-mono text-gray-900">{asset.psa_qr_identifier ?? scannedValue}</dd>
              </div>
              <div>
                <dt className="text-green-700">Status</dt>
                <dd>
                  <Badge tone={assetStatusTone(asset.status)}>{asset.status}</Badge>
                </dd>
              </div>
              <div>
                <dt className="text-green-700">Office</dt>
                <dd>{asset.office ?? 'Not set'}</dd>
              </div>
              <div>
                <dt className="text-green-700">Location</dt>
                <dd>{asset.location ?? 'Not set'}</dd>
              </div>
            </dl>
          </div>
        )}

        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3">
          <div className="mb-2 text-sm font-semibold text-gray-700">Development fallback</div>
          <p className="mb-3 text-xs text-gray-500">
            Use this only on devices without a camera or without browser QR detection support. Production flow remains camera scan → backend lookup.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={manualValue}
              onChange={(event) => setManualValue(event.target.value)}
              placeholder="PSA-ASSET-000123"
              onKeyDown={(event) => {
                if (event.key === 'Enter') void resolveIdentifier(manualValue)
              }}
            />
            <Button variant="secondary" onClick={() => void resolveIdentifier(manualValue)}>
              Resolve
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
