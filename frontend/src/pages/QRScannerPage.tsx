import { useNavigate } from 'react-router-dom'
import { ArrowLeft, QrCode } from 'lucide-react'
import { SharedQrScanner } from '@/components/qr/SharedQrScanner'

export function QRScannerPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-between p-4 md:p-8">
      {/* Header Bar */}
      <div className="w-full max-w-md flex items-center justify-between py-2 border-b border-slate-800 pb-3 mb-2">
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

      {/* Main Shared Scanner */}
      <div className="w-full max-w-md my-auto">
        <SharedQrScanner
          open={true}
          onClose={() => navigate('/dashboard')}
          scanSource="sidebar_scanner"
          mode="page"
        />
      </div>

      {/* Footer */}
      <div className="text-[11px] text-slate-600 text-center py-2">
        Philippine Statistics Authority — Asset Self-Service Module
      </div>
    </div>
  )
}
