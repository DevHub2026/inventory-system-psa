import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Card } from '@/components/ui'
import { BrowserQRCodeReader } from '@zxing/browser'
import { Camera, QrCode, Search, ArrowLeft } from 'lucide-react'

export function QRScannerPage() {
  const navigate = useNavigate()
  const [manualCode, setManualCode] = useState('')
  const [scanning, setScanning] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null)
  const controlsRef = useRef<{ stop: () => void } | null>(null)

  const startScanner = async () => {
    setErrorMessage(null)
    setScanning(true)

    try {
      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserQRCodeReader()
      }

      const videoInputDevices = await BrowserQRCodeReader.listVideoInputDevices()
      if (videoInputDevices.length === 0) {
        setErrorMessage('No camera found on this device. Please enter the QR code manually.')
        setScanning(false)
        return
      }

      const selectedDevice =
        videoInputDevices.find((device) => device.label.toLowerCase().includes('back'))?.deviceId ||
        videoInputDevices[0].deviceId

      if (videoRef.current) {
        const controls = await codeReaderRef.current.decodeFromVideoDevice(
          selectedDevice,
          videoRef.current,
          (result) => {
            if (result) {
              const text = result.getText()
              controlsRef.current?.stop()
              setScanning(false)
              navigate(`/qr/${encodeURIComponent(text)}`)
            }
          }
        )
        controlsRef.current = controls
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to initialize camera.')
      setScanning(false)
    }
  }

  const stopScanner = () => {
    if (controlsRef.current) {
      controlsRef.current.stop()
      controlsRef.current = null
    }
    setScanning(false)
  }

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [])

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode.trim()) return
    stopScanner()
    navigate(`/qr/${encodeURIComponent(manualCode.trim())}`)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-between p-4 md:p-8">
      {/* Header */}
      <div className="w-full max-w-md flex items-center justify-between py-2">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to App
        </button>
        <div className="flex items-center gap-1.5 font-bold text-sm tracking-wide">
          <QrCode className="w-5 h-5 text-blue-400" />
          <span className="text-white">PSA</span>
          <span className="text-blue-400">QR Portal</span>
        </div>
      </div>

      {/* Main Scanner Container */}
      <div className="w-full max-w-md my-auto space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold text-white">Scan Asset QR Code</h1>
          <p className="text-xs text-slate-400">
            Point your camera at any official PSA QR sticker or enter code manually below.
          </p>
        </div>

        {/* Camera Viewfinder */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-800 shadow-2xl aspect-square flex items-center justify-center">
          <video
            ref={videoRef}
            className={`w-full h-full object-cover ${scanning ? 'block' : 'hidden'}`}
          />

          {!scanning && (
            <div className="flex flex-col items-center gap-3 text-slate-500 p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 mb-1">
                <Camera className="w-8 h-8" />
              </div>
              <p className="text-xs text-slate-400">Camera inactive</p>
              <Button onClick={startScanner} variant="primary" className="text-xs font-bold px-6">
                Tap to Start Camera
              </Button>
            </div>
          )}

          {scanning && (
            <div className="absolute inset-0 border-2 border-blue-500/50 pointer-events-none flex flex-col justify-between p-6">
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

        {scanning && (
          <div className="flex justify-center">
            <Button variant="outline" onClick={stopScanner} className="text-xs text-slate-300 border-slate-700">
              Stop Camera
            </Button>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-950/80 border border-red-800/80 text-red-200 text-xs p-3 rounded-xl text-center">
            {errorMessage}
          </div>
        )}

        {/* Manual Code Fallback */}
        <Card className="bg-slate-900 border-slate-800 p-4 rounded-xl">
          <form onSubmit={handleManualSubmit} className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">Or enter QR Identifier manually:</label>
            <div className="flex gap-2">
              <Input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="e.g. PSA-ASSET-000105"
                className="bg-slate-950 border-slate-800 text-white placeholder-slate-600"
              />
              <Button type="submit" variant="primary" className="px-4">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Footer */}
      <div className="text-[11px] text-slate-600 text-center py-2">
        Philippine Statistics Authority — Asset Self-Service Module
      </div>
    </div>
  )
}
