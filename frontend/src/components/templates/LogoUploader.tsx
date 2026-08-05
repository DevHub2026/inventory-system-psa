import { useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'

interface LogoUploaderProps {
  logoUrl?: string | null
  onChange: (url: string | null) => void
}

/**
 * LogoUploader — allows the template editor to attach a logo to the document.
 *
 * Behaviour:
 * - The user can either paste an image URL directly into the text field, or
 *   pick a local file which is read as a base-64 data-URL and stored in
 *   logo_url (no separate upload endpoint is needed; the value is persisted
 *   with the rest of the template metadata).
 * - Clearing removes the logo_url (sets it to null).
 */
export function LogoUploader({ logoUrl, onChange }: LogoUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [urlInput, setUrlInput] = useState(logoUrl ?? '')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setUrlInput(dataUrl)
      onChange(dataUrl)
    }
    reader.readAsDataURL(file)
    // reset so the same file can be re-selected if needed
    e.target.value = ''
  }

  const handleUrlBlur = () => {
    const trimmed = urlInput.trim()
    onChange(trimmed || null)
  }

  const handleClear = () => {
    setUrlInput('')
    onChange(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <label style={{
        display: 'block', fontSize: 12, fontWeight: 700,
        color: '#334155', marginBottom: 2,
      }}>
        Header Logo
      </label>

      {/* Preview */}
      {logoUrl && (
        <div style={{
          position: 'relative', display: 'inline-flex', alignItems: 'center',
          padding: 8, borderRadius: 10, border: '1px solid #E2E8F0',
          background: '#F8FAFC', width: 'fit-content',
        }}>
          <img
            src={logoUrl}
            alt="Logo preview"
            style={{ maxHeight: 60, maxWidth: 200, objectFit: 'contain', borderRadius: 6 }}
          />
          <button
            type="button"
            onClick={handleClear}
            title="Remove logo"
            style={{
              position: 'absolute', top: -6, right: -6,
              width: 20, height: 20, borderRadius: '50%',
              border: '1px solid #E2E8F0', background: '#fff',
              color: '#64748B', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 0,
            }}
          >
            <X size={11} />
          </button>
        </div>
      )}

      {/* URL text input */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#E2E8F0'
            handleUrlBlur()
          }}
          placeholder="Paste image URL or upload a file below…"
          style={{
            flex: 1, height: 36, borderRadius: 8,
            border: '1px solid #E2E8F0', background: '#fff',
            padding: '0 10px', fontSize: 12.5, color: '#1E293B',
            outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
            transition: 'border-color 0.12s',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#1E40AF' }}
        />

        {/* File picker button */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          style={{
            height: 36, paddingInline: 12, borderRadius: 8,
            border: '1px solid #E2E8F0', background: '#F8FAFC',
            fontSize: 12.5, fontWeight: 600, color: '#475569',
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'inline-flex', alignItems: 'center', gap: 5,
            transition: 'background 0.1s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#EEF2F7' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#F8FAFC' }}
        >
          <Upload size={13} />
          Upload
        </button>
      </div>

      {/* Hidden file input — accepts common image types */}
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <p style={{ margin: 0, fontSize: 11, color: '#94A3B8', lineHeight: 1.5 }}>
        Upload a PNG, JPEG, or SVG file, or paste a direct image URL.
        The logo will appear in the document header.
      </p>
    </div>
  )
}
