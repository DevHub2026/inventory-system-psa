import { useEffect, useRef, useState } from 'react'
import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser'
import { ScanLine, AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { Badge, Button, Input, Modal, Spinner } from '@/components/ui'
import { assetService } from '@/services/assetService'
import type { Asset } from '@/types'
import { assetStatusTone } from '@/utils/statusTone'

interface AssetQrScannerProps {
  open: boolean
  onClose: () => void
}

type ScannerState =
  | 'idle'
  | 'starting'
  | 'scanning'
  | 'resolving'
  | 'found'
  | 'not_found'
  | 'invalid'
  | 'unsupported'
  | 'permission_denied'
  | 'camera_error'

function isLocalhost() {
  return ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
}

export function AssetQrScanner({ open, onClose }: AssetQrScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null)
  const resolvingRef = useRef(false)

  const [state, setState] = useState<ScannerState>('idle')
  const [message, setMessage] = useState('')
  const [scannedValue, setScannedValue] = useState('')
  const [manualValue, setManualValue] = useState('')
  const [asset, setAsset] = useState<Asset | null>(null)

  function stopCamera() {
    controlsRef.current?.stop()
    controlsRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    resolvingRef.current = false
  }

  async function resolveIdentifier(value: string) {
    const identifier = value.trim()
    if (!identifier) {
      setState('invalid')
      setMessage('The QR value was empty.')
      return
    }
    resolvingRef.current = true
    setScannedValue(identifier)
    setState('resolving')
    setAsset(null)
    try {
      const resolvedAsset = await assetService.scan(identifier)
      setAsset(resolvedAsset)
      setState('found')
      setMessage('Asset found.')
    } catch (error: unknown) {
      setState('not_found')
      setMessage(error instanceof Error ? error.message : 'No asset matched that identifier.')
    } finally {
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
      setMessage('Camera access requires HTTPS. Use localhost, HTTPS, or allow this origin in Chrome flags.')
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setState('unsupported')
      setMessage('This browser does not expose camera access. Try Chrome or Edge over HTTPS.')
      return
    }
    if (!videoRef.current) {
      setState('camera_error')
      setMessage('Camera preview not ready. Close and try again.')
      return
    }

    try {
      codeReaderRef.current = new BrowserQRCodeReader()
      controlsRef.current = await codeReaderRef.current.decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        videoRef.current,
        (result) => {
          const raw = result?.getText()?.trim()
          if (!raw || resolvingRef.current) return
          controlsRef.current?.stop()
          void resolveIdentifier(raw)
        },
      )
      setState('scanning')
      setMessage('Point the camera at a PSA asset QR code.')
    } catch (error: unknown) {
      stopCamera()
      if (error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError')) {
        setState('permission_denied')
        setMessage('Camera permission denied. Allow camera access to scan.')
        return
      }
      setState('camera_error')
      setMessage(error instanceof Error ? error.message : 'No usable camera found.')
    }
  }

  useEffect(() => {
    if (open) { void startCamera(); return }
    stopCamera()
    setState('idle')
  }, [open])

  useEffect(() => () => stopCamera(), [])

  const canScanAgain = ['found', 'not_found', 'invalid', 'unsupported', 'permission_denied', 'camera_error'].includes(state)
  const isActive = state === 'starting' || state === 'scanning' || state === 'resolving'

  /* ── Alert banner ── */
  const alertConfig = (() => {
    if (!message) return null
    if (state === 'found')
      return { Icon: CheckCircle2, bg: 'bg-emerald-50 border-emerald-200 text-emerald-800' }
    if (state === 'not_found' || state === 'invalid')
      return { Icon: AlertCircle, bg: 'bg-red-50 border-[#E31C23]/20 text-[#E31C23]' }
    return { Icon: Info, bg: 'bg-[#EEF4FF] border-[#C5D8FF] text-[#003DA5]' }
  })()

  return (
    <Modal
      open={open}
      title="Scan Asset QR"
      onClose={() => { stopCamera(); onClose() }}
      footer={
        <>
          <Button variant="secondary" onClick={() => { stopCamera(); onClose() }}>Close</Button>
          {canScanAgain && <Button onClick={() => void startCamera()}>Scan Again</Button>}
        </>
      }
    >
      <div className="space-y-4">

        {/* Status banner */}
        {alertConfig && message && (
          <div className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm font-medium ${alertConfig.bg}`}>
            <alertConfig.Icon className="mt-px h-4 w-4 flex-none" />
            <span>{message}</span>
          </div>
        )}

        {/* Camera viewport */}
        <div className="relative overflow-hidden rounded-xl border border-[#E2EAF3] bg-slate-950 shadow-inner">
          <video
            ref={videoRef}
            className="aspect-video w-full object-cover"
            muted
            playsInline
          />

          {/* Corner scan brackets */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <div className="relative h-40 w-40">
              {/* TL */ }<span className="absolute left-0 top-0 h-6 w-6 rounded-tl-md border-l-2 border-t-2 border-[#FFD400]" />
              {/* TR */ }<span className="absolute right-0 top-0 h-6 w-6 rounded-tr-md border-r-2 border-t-2 border-[#FFD400]" />
              {/* BL */ }<span className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-md border-b-2 border-l-2 border-[#FFD400]" />
              {/* BR */ }<span className="absolute bottom-0 right-0 h-6 w-6 rounded-br-md border-b-2 border-r-2 border-[#FFD400]" />
              {/* Scan line */}
              {state === 'scanning' && (
                <span className="absolute inset-x-2 h-[2px] animate-[scan_2s_ease-in-out_infinite] rounded-full bg-[#FFD400]/80" />
              )}
            </div>
          </div>

          {/* Overlay label */}
          {state === 'idle' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/60">
              <ScanLine className="h-8 w-8 text-slate-400" />
              <p className="text-xs font-medium text-slate-400">Camera inactive</p>
            </div>
          )}
        </div>

        {/* Spinner row */}
        {isActive && (
          <div className="flex items-center justify-center gap-2.5 text-sm text-slate-500">
            <Spinner />
            <span>
              {state === 'starting'  && 'Requesting camera permission…'}
              {state === 'scanning'  && 'Ready — point at a PSA asset QR code.'}
              {state === 'resolving' && 'Looking up asset…'}
            </span>
          </div>
        )}

        {/* Decoded value chip */}
        {scannedValue && (
          <div className="flex items-center gap-2 rounded-lg border border-[#E2EAF3] bg-[#F4F7FC] px-3.5 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Decoded</span>
            <span className="flex-1 truncate font-mono text-sm font-semibold text-slate-800">{scannedValue}</span>
          </div>
        )}

        {/* Asset result card */}
        {asset && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50">
            <div className="flex items-center gap-2 border-b border-emerald-200 px-4 py-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-bold text-emerald-800">Asset Found</p>
            </div>
            <dl className="grid gap-x-4 gap-y-3 px-4 py-4 sm:grid-cols-2">
              {[
                { label: 'Name',         value: asset.name },
                { label: 'Asset Number', value: asset.asset_number },
                { label: 'PSA QR ID',    value: asset.psa_qr_identifier ?? scannedValue, mono: true },
                { label: 'Status',       value: <Badge tone={assetStatusTone(asset.status)}>{asset.status}</Badge> },
                { label: 'Office',       value: asset.office ?? '—' },
                { label: 'Location',     value: asset.location ?? '—' },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">{item.label}</dt>
                  <dd className={`mt-0.5 text-sm font-medium text-slate-900 ${item.mono ? 'font-mono' : ''}`}>
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* Manual / dev fallback */}
        <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFD] p-4">
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Manual lookup</p>
          <p className="mb-3 text-xs text-slate-400">
            Use on devices without a camera or when browser QR support is unavailable.
          </p>
          <div className="flex gap-2">
            <Input
              value={manualValue}
              onChange={(e) => setManualValue(e.target.value)}
              placeholder="PSA-ASSET-000123"
              onKeyDown={(e) => { if (e.key === 'Enter') void resolveIdentifier(manualValue) }}
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
