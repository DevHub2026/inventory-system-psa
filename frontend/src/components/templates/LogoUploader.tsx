import { useState } from 'react'
import { Upload, X } from 'lucide-react'
import logoFallback from '@/assets/logo.png'

interface LogoUploaderProps {
  logoUrl?: string | null
  onChange: (url: string | null) => void
}

export function LogoUploader({ logoUrl, onChange }: LogoUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const currentLogo = logoUrl || logoFallback

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'].includes(file.type)) {
      alert('Please upload a PNG, JPG, or SVG file.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold text-slate-700">Official Document Logo</label>

      <div className="flex items-start gap-4">
        {/* Preview Container */}
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white p-2 shadow-xs">
          <img src={currentLogo} alt="Logo preview" className="max-h-full max-w-full object-contain" />
          {logoUrl && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-xs hover:bg-red-600"
              title="Remove custom logo"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Upload Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragActive(false)
            const file = e.dataTransfer.files?.[0]
            if (file) {
              const input = document.getElementById('logo-file-input') as HTMLInputElement
              if (input) {
                const dataTransfer = new DataTransfer()
                dataTransfer.items.add(file)
                input.files = dataTransfer.files
                input.dispatchEvent(new Event('change', { bubbles: true }))
              }
            }
          }}
          className={`flex-1 rounded-xl border-2 border-dashed p-3.5 text-center transition-all ${
            dragActive ? 'border-[#0D47A1] bg-[#EFF6FF]' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
          }`}
        >
          <div className="flex flex-col items-center gap-1 text-slate-500">
            <Upload size={18} className="text-[#0D47A1]" />
            <span className="text-xs font-medium text-slate-700">
              Drop PNG, JPG, or SVG logo here, or{' '}
              <label htmlFor="logo-file-input" className="cursor-pointer text-[#0D47A1] font-semibold hover:underline">
                browse
              </label>
            </span>
            <span className="text-[10px] text-slate-400">Max size 5MB • Instant preview</span>
            <input
              id="logo-file-input"
              type="file"
              accept=".png,.jpg,.jpeg,.svg"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
