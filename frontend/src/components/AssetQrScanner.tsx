import { useEffect, useRef, useState } from 'react'

import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser'
import { AlertCircle, CheckCircle2, Info, CameraOff, Camera, QrCode } from 'lucide-react'
import { Badge, Button, Input, Modal, Spinner } from '@/components/ui'

import { assetService } from '@/services/assetService'

import type { Asset, Borrowing } from '@/types'

import { borrowingStatusLabel } from '@/utils/displayLabels'

import { assetStatusTone } from '@/utils/statusTone'

import { notifyDataChanged } from '@/utils/dataRefresh'



interface AssetQrScannerProps {

  open: boolean

  onClose: () => void

  mode?: 'transaction' | 'authorize' | 'request'

  onCompleted?: () => void

}



type ScannerState =

  | 'idle'

  | 'starting'

  | 'scanning'

  | 'resolving'

  | 'found'

  | 'not_found'

  | 'transaction_failed'

  | 'invalid'

  | 'unsupported'

  | 'permission_denied'

  | 'camera_error'



function isLocalhost() {

  return ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)

}

/* ── Design tokens ── */
const T = {
  primary:    '#0B3D91',
  primaryBg:  '#EEF4FF',
  primaryBdr: '#C5D8FF',
  success:    '#16a34a',
  successBg:  '#f0fdf4',
  successBdr: '#bbf7d0',
  danger:     '#E31C23',
  dangerBg:   '#fef2f2',
  dangerBdr:  '#fecaca',
  text:       '#1e293b',
  textMid:    '#475569',
  textMuted:  '#94a3b8',
  border:     '#e2e8f0',
  bg:         '#f8fafc',
  white:      '#ffffff',
}

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

        notifyDataChanged('all')

        onCompleted?.()

        stopCamera()

        return

      }



      if (mode === 'request') {

        const result = await assetService.requestBorrow(identifier)

        setMessage(result.message)

        setState('found')

        notifyDataChanged('all')

        onCompleted?.()

        stopCamera()

        return

      }



      const txn = await assetService.scanTransaction(identifier)

      setBorrowing(txn)

      if (txn.asset_id) {

        setAsset(await assetService.show(txn.asset_id))

      }

      setMessage(txn.status === 'RETURNED' ? 'Asset successfully returned.' : 'Asset successfully borrowed.')

      setState('found')

      notifyDataChanged('all')

      onCompleted?.()

    } catch (error: unknown) {
      try {

        const resolvedAsset = await assetService.scan(identifier)

        setAsset(resolvedAsset)

        setState('transaction_failed')

        setMessage(

          error instanceof Error

            ? error.message

            : 'Asset found, but the transaction was not completed.',

        )

      } catch {

        setState('not_found')

        setMessage(error instanceof Error ? error.message : 'No asset or transaction matched that QR code.')

      }

    } finally {

      stopCamera()

    }

  }



  async function startCamera() {

    stopCamera()

    setAsset(null)

    setBorrowing(null)

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

        {

          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },

          audio: false,

        },

        videoRef.current,

        (result) => {

          const raw = result?.getText()?.trim()

          if (!raw || resolvingRef.current) return

          controlsRef.current?.stop()

          void resolveIdentifier(raw)

        },

      )

      setState('scanning')

      setMessage(

        mode === 'authorize'

          ? 'Camera active. Scan a borrow request receipt QR to authorize.'

          : 'Camera active. Point at a PSA asset QR or transaction receipt.',

      )

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



  const canScanAgain = ['found', 'not_found', 'transaction_failed', 'invalid', 'unsupported', 'permission_denied', 'camera_error'].includes(state)

  const isActive = state === 'starting' || state === 'scanning' || state === 'resolving'



  /* Banner styling */
  const alertConfig = (() => {

    if (!message) return null

    if (state === 'found')
      return { Icon: CheckCircle2, cls: { bg: T.successBg, bdr: T.successBdr, text: T.success } }
    if (state === 'not_found' || state === 'transaction_failed' || state === 'invalid')
      return { Icon: AlertCircle, cls: { bg: T.dangerBg, bdr: T.dangerBdr, text: T.danger } }
    return { Icon: Info, cls: { bg: T.primaryBg, bdr: T.primaryBdr, text: T.primary } }
  })()



  return (

    <Modal

      open={open}

      title={mode === 'authorize' ? 'Scan QR to Authorize' : 'Scan Asset QR'}

      onClose={() => { stopCamera(); onClose() }}

      footer={
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => { stopCamera(); onClose() }}>Close</Button>
          {canScanAgain && <Button onClick={() => void startCamera()}><Camera size={16} style={{ marginRight: 6 }} />Scan Again</Button>}
        </div>
      }

    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Status banner ── */}
        {alertConfig && message && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            borderRadius: 10, border: `1px solid ${alertConfig.cls.bdr}`,
            background: alertConfig.cls.bg,
            padding: '10px 14px', fontSize: 13, fontWeight: 500,
            color: alertConfig.cls.text,
          }}>
            <alertConfig.Icon style={{ flexShrink: 0, marginTop: 1 }} size={16} />
            <span>{message}</span>

          </div>

        )}



        {/* ── Camera viewport ── */}
        <div style={{
          position: 'relative', overflow: 'hidden', borderRadius: 14,
          border: `1px solid ${T.border}`,
          background: '#0f172a', boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.3)',
        }}>
          <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />



          {/* Corner brackets */}
          <div style={{
            pointerEvents: 'none', position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }} aria-hidden="true">
            <div style={{ position: 'relative', width: 160, height: 160 }}>
              {/* Top-left */}
              <span style={{
                position: 'absolute', left: 0, top: 0, width: 28, height: 28,
                borderLeft: '3px solid #FFD400', borderTop: '3px solid #FFD400',
                borderTopLeftRadius: 8,
              }} />
              {/* Top-right */}
              <span style={{
                position: 'absolute', right: 0, top: 0, width: 28, height: 28,
                borderRight: '3px solid #FFD400', borderTop: '3px solid #FFD400',
                borderTopRightRadius: 8,
              }} />
              {/* Bottom-left */}
              <span style={{
                position: 'absolute', left: 0, bottom: 0, width: 28, height: 28,
                borderLeft: '3px solid #FFD400', borderBottom: '3px solid #FFD400',
                borderBottomLeftRadius: 8,
              }} />
              {/* Bottom-right */}
              <span style={{
                position: 'absolute', right: 0, bottom: 0, width: 28, height: 28,
                borderRight: '3px solid #FFD400', borderBottom: '3px solid #FFD400',
                borderBottomRightRadius: 8,
              }} />
              {state === 'scanning' && (
                <span style={{
                  position: 'absolute', left: 8, right: 8, height: 2,
                  borderRadius: '50%', background: 'rgba(255,212,0,0.7)',
                  animation: 'scan 2s ease-in-out infinite',
                }} />
              )}

            </div>

          </div>



          {/* Idle overlay */}

          {state === 'idle' && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: 'rgba(15,23,42,0.7)',
            }}>
              <CameraOff size={32} color="#94a3b8" />
              <p style={{ fontSize: 12, fontWeight: 500, color: '#94a3b8' }}>Camera inactive</p>
            </div>

          )}

        </div>



        {/* ── Spinner status ── */}
        {isActive && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 13, color: T.textMuted }}>
            <Spinner />

            <span>

              {state === 'starting'  && 'Requesting camera permission…'}

              {state === 'scanning'  && (mode === 'authorize' ? 'Point at a borrow request receipt QR.' : 'Point at a PSA asset QR or transaction receipt.')}

              {state === 'resolving' && 'Processing scan…'}

            </span>

          </div>

        )}



        {/* ── Decoded value chip ── */}
        {scannedValue && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            borderRadius: 10, border: `1px solid ${T.border}`,
            background: T.bg, padding: '10px 14px',
          }}>
            <QrCode size={16} style={{ color: T.textMuted, flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: T.textMuted }}>Decoded</span>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: T.text }}>{scannedValue}</span>
          </div>

        )}



        {/* ── Asset result card ── */}
        {asset && (
          <div style={{
            overflow: 'hidden', borderRadius: 12,
            border: `1px solid ${T.successBdr}`,
            background: T.successBg,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              borderBottom: `1px solid ${T.successBdr}`,
              background: 'rgba(22,163,74,0.06)',
              padding: '10px 16px',
            }}>
              <CheckCircle2 size={16} color={T.success} />
              <p style={{ fontSize: 13, fontWeight: 700, color: '#166534' }}>Asset Found</p>
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 16px',
              padding: 16, fontSize: 13,
            }}>
              {[

                { label: 'Name',         value: asset.name },
                { label: 'Asset Number', value: asset.asset_number, mono: true },
                { label: 'PSA QR ID',    value: asset.psa_qr_identifier ?? scannedValue, mono: true },

                { label: 'Status',       value: <Badge tone={assetStatusTone(asset.status)}>{asset.status}</Badge> },

                { label: 'Office',       value: asset.office ?? '—' },

                { label: 'Location',     value: asset.location ?? '—' },

              ].map((item) => (

                <div key={item.label}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: T.success, marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontWeight: 500, color: T.text, fontFamily: item.mono ? 'monospace' : 'inherit', fontSize: item.mono ? 12 : 13 }}>{item.value}</div>
                </div>

              ))}
            </div>
          </div>

        )}



        {/* ── Borrowing transaction card ── */}
        {borrowing && (
          <div style={{
            overflow: 'hidden', borderRadius: 12,
            border: `1px solid ${T.primaryBdr}`,
            background: T.primaryBg,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              borderBottom: `1px solid ${T.primaryBdr}`,
              background: 'rgba(11,61,145,0.06)',
              padding: '10px 16px',
            }}>
              <CheckCircle2 size={16} color={T.primary} />
              <p style={{ fontSize: 13, fontWeight: 700, color: T.primary }}>Borrowing Transaction</p>
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 16px',
              padding: 16, fontSize: 13,
            }}>
              {[

                { label: 'Borrowing ID',       value: `#${borrowing.id}` },

                { label: 'Status',             value: borrowingStatusLabel(borrowing.status) },

                { label: 'Borrower',           value: borrowing.employee_name ?? `User #${borrowing.user_id}` },

                { label: 'Asset',              value: borrowing.asset_name ?? `Asset #${borrowing.asset_id}` },

                { label: 'Asset Identifier',   value: borrowing.asset_number ?? asset?.psa_qr_identifier ?? '—', mono: true },

                { label: 'Borrowed Date',      value: borrowing.borrow_date ?? borrowing.borrowed_at ?? '—' },

                { label: 'Due Date',           value: borrowing.due_date ?? borrowing.due_at ?? '—' },

                { label: 'Returned At',        value: borrowing.returned_at ?? 'Not returned' },

                { label: 'Authorized By',      value: borrowing.authorized_by_name ?? '—' },

                { label: 'Authorized At',      value: borrowing.authorized_at ?? '—' },

              ].map((item) => (

                <div key={item.label}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: `${T.primary}99`, marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontWeight: 500, color: T.text, fontFamily: item.mono ? 'monospace' : 'inherit', fontSize: item.mono ? 12 : 13 }}>{item.value}</div>
                </div>

              ))}
            </div>
          </div>

        )}



        {/* ── Manual lookup ── */}
        <div style={{
          borderRadius: 12,
          border: `1px dashed ${T.border}`,
          background: '#F8FAFD',
          padding: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <QrCode size={14} style={{ color: T.textMuted }} />
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: T.textMuted }}>Manual lookup</p>
          </div>
          <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 10 }}>
            Use on devices without a camera or when browser QR support is unavailable.

          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <Input
                value={manualValue}
                onChange={(e) => setManualValue(e.target.value)}
                placeholder="PSA-ASSET-000123"
                onKeyDown={(e) => { if (e.key === 'Enter') void resolveIdentifier(manualValue) }}
              />
            </div>
            <Button variant="secondary" onClick={() => void resolveIdentifier(manualValue)}>

              Resolve

            </Button>

          </div>

        </div>



      </div>

    </Modal>

  )

}