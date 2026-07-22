import { useEffect, useRef, useState } from 'react'
import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser'
import { Alert, Badge, Button, Input, Modal, Spinner } from '@/components/ui'
import { assetService } from '@/services/assetService'
import type { Asset, Borrowing } from '@/types'
import { borrowingStatusLabel } from '@/utils/displayLabels'
import { assetStatusTone } from '@/utils/statusTone'

interface AssetQrScannerProps {
  open: boolean
  onClose: () => void
  mode?: 'transaction' | 'authorize'
  onCompleted?: () => void
}

type ScannerState = 'idle' | 'starting' | 'scanning' | 'resolving' | 'found' | 'not_found' | 'transaction_failed' | 'invalid' | 'unsupported' | 'permission_denied' | 'camera_error'

export function AssetQrScanner({ open, onClose, mode = 'transaction', onCompleted }: AssetQrScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null)
  const resolvingRef = useRef(false)
  const [state, setState] = useState<ScannerState>('idle')
  const [message, setMessage] = useState('')
  const [scannedValue, setScannedValue] = useState('')
  const [manualValue, setManualValue] = useState('')
  const [asset, setAsset] = useState<Asset | null>(null)
  const [borrowing, setBorrowing] = useState<Borrowing | null>(null)

  function isLocalhost() {
    return ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
  }

  function stopCamera() {
    controlsRef.current?.stop()
    controlsRef.current = null

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

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
    setBorrowing(null)

    try {
      if (mode === 'authorize') {
        const borrowingResult = await assetService.scanTransaction(identifier)
        setBorrowing(borrowingResult)

        if (borrowingResult.asset_id) {
          setAsset(await assetService.show(borrowingResult.asset_id))
        }

        setMessage('Borrowing authorized and marked as borrowed successfully.')
        setState('found')
        onCompleted?.()
        return
      }

      const borrowing = await assetService.scanTransaction(identifier)
      setBorrowing(borrowing)

      if (borrowing.asset_id) {
        setAsset(await assetService.show(borrowing.asset_id))
      }

      setMessage(borrowing.status === 'RETURNED' ? 'Asset successfully returned.' : 'Asset successfully borrowed.')
      setState('found')
      onCompleted?.()
    } catch (error: unknown) {
      try {
        const resolvedAsset = await assetService.scan(identifier)
        setAsset(resolvedAsset)
        setState('transaction_failed')
        setMessage(error instanceof Error ? `Asset found, but the transaction was not completed: ${error.message}` : 'Asset found, but the borrowing transaction failed.')
      } catch {
        setState('not_found')
        setMessage(error instanceof Error ? error.message : 'No asset or transaction matched that QR code.')
      }
    } finally {
      // A decoded value completes this scan attempt, even when it has no asset match.
      // Requiring an explicit "Scan Again" prevents a live camera from continuing in
      // the background while the user reads the outcome.
      stopCamera()
    }
  }

  async function startCamera() {
    stopCamera()
    setAsset(null)
    setScannedValue('')
    setMessage('')
    setState('starting')

    if (!window.isSecureContext && !isLocalhost()) {
      setState('unsupported')
      setMessage('Camera access is blocked because this page is opened over LAN HTTP. Use desktop localhost, HTTPS, or allow this LAN origin as secure in Chrome flags for phone testing.')
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setState('unsupported')
      setMessage('This browser does not expose camera access. Check browser permissions, HTTPS requirements, or try Chrome/Edge.')
      return
    }

    if (!videoRef.current) {
      setState('camera_error')
      setMessage('Camera preview is not ready. Close the scanner and try again.')
      return
    }

    try {
      codeReaderRef.current = new BrowserQRCodeReader()
      controlsRef.current = await codeReaderRef.current.decodeFromConstraints(
        {
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        },
        videoRef.current,
        (result) => {
          const rawValue = result?.getText()?.trim()

          if (!rawValue || resolvingRef.current) {
            return
          }

          controlsRef.current?.stop()
          void resolveIdentifier(rawValue)
        },
      )
      setState('scanning')
      setMessage(mode === 'authorize' ? 'Camera is active. Scan a borrow request receipt QR to authorize and mark it borrowed.' : 'Camera is active. Scan a PSA asset QR or valid transaction receipt.')
    } catch (error: unknown) {
      stopCamera()

      if (error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError')) {
        setState('permission_denied')
        setMessage('Camera permission was denied. Allow camera access to scan a real asset QR code.')
        return
      }

      setState('camera_error')
      setMessage(error instanceof Error ? error.message : 'No usable camera was found or the camera could not be opened.')
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

  const canScanAgain = ['found', 'not_found', 'transaction_failed', 'invalid', 'unsupported', 'permission_denied', 'camera_error'].includes(state)

  return (
    <Modal
      open={open}
      title={mode === 'authorize' ? 'Scan QR to Authorize' : 'Scan QR to Borrow or Return'}
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
          <Alert tone={state === 'found' ? 'success' : state === 'not_found' || state === 'transaction_failed' || state === 'invalid' ? 'error' : 'info'}>
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
            {state === 'scanning' && (mode === 'authorize' ? 'Point the camera at a borrow request receipt QR.' : 'Point the camera at a PSA asset QR or transaction receipt.')}
            {state === 'resolving' && (mode === 'authorize' ? 'Resolving the receipt and marking the borrowing as borrowed...' : 'Resolving and completing the authorized QR workflow...')}
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

        {borrowing && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="mb-2 text-sm font-semibold text-blue-900">Borrowing Transaction</div>
            <dl className="grid gap-3 text-sm md:grid-cols-2">
              <div>
                <dt className="text-blue-700">Borrowing ID</dt>
                <dd className="font-medium text-gray-900">#{borrowing.id}</dd>
              </div>
              <div>
                <dt className="text-blue-700">Status</dt>
                <dd className="font-medium text-gray-900">{borrowingStatusLabel(borrowing.status)}</dd>
              </div>
              <div>
                <dt className="text-blue-700">Borrower</dt>
                <dd className="font-medium text-gray-900">{borrowing.employee_name ?? `User #${borrowing.user_id}`}</dd>
              </div>
              <div>
                <dt className="text-blue-700">Asset</dt>
                <dd className="font-medium text-gray-900">{borrowing.asset_name ?? `Asset #${borrowing.asset_id}`}</dd>
              </div>
              <div>
                <dt className="text-blue-700">Asset Identifier</dt>
                <dd className="font-mono text-gray-900">{borrowing.asset_number ?? asset?.psa_qr_identifier ?? 'Not available'}</dd>
              </div>
              <div>
                <dt className="text-blue-700">Borrowed Date</dt>
                <dd>{borrowing.borrow_date ?? borrowing.borrowed_at ?? 'Not available'}</dd>
              </div>
              <div>
                <dt className="text-blue-700">Due Date</dt>
                <dd>{borrowing.due_date ?? borrowing.due_at ?? 'Not available'}</dd>
              </div>
              <div>
                <dt className="text-blue-700">Returned At</dt>
                <dd>{borrowing.returned_at ?? 'Not returned'}</dd>
              </div>
              <div>
                <dt className="text-blue-700">Authorized By</dt>
                <dd>{borrowing.authorized_by_name ?? `User #${borrowing.authorized_by ?? 'N/A'}`}</dd>
              </div>
              <div>
                <dt className="text-blue-700">Authorized At</dt>
                <dd>{borrowing.authorized_at ?? 'Not available'}</dd>
              </div>
            </dl>
          </div>
        )}

        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3">
          <div className="mb-2 text-sm font-semibold text-gray-700">Development fallback</div>
          <p className="mb-3 text-xs text-gray-500">
            Use this only on devices without a camera or without browser QR detection support. Production flow remains camera scan to backend lookup.
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
