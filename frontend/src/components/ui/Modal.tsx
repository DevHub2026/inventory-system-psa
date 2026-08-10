import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'

interface ModalProps {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
  /**
   * Footer slot — action buttons rendered in the modal footer bar.
   * When not provided, a default "Close" button is shown.
   * Pass footer={null} to suppress the footer entirely.
   */
  footer?: ReactNode
  /**
   * Override the modal max-width. Defaults to 520px.
   */
  maxWidth?: number | string
}

export function Modal({ open, title, children, onClose, footer, maxWidth = 520 }: ModalProps) {
  const [isNarrow, setIsNarrow] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 420 : false)

  useEffect(() => {
    const handler = () => setIsNarrow(window.innerWidth <= 420)
    window.addEventListener('resize', handler)
    // run once
    handler()
    return () => window.removeEventListener('resize', handler)
  }, [])

  if (!open) return null

  const headerPadding = isNarrow ? '12px 16px 10px' : '18px 24px 16px'
  const bodyPadding = isNarrow ? '16px' : '24px'
  const footerPadding = isNarrow ? '10px 16px' : '14px 24px'
  const borderRadius = isNarrow ? 12 : 20
  const maxH = isNarrow ? 'calc(100dvh - 1rem)' : 'calc(100dvh - 2rem)'

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        background: 'rgba(15,23,42,0.55)',
        backdropFilter: 'blur(3px)',
      }}
      aria-modal="true"
      role="dialog"
    >
      <div style={{
        display: 'flex', flexDirection: 'column',
        width: '100%', maxWidth: maxWidth,
        maxHeight: maxH,
        borderRadius: borderRadius,
        border: '1px solid #e2e8f0',
        background: '#ffffff',
        boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
        overflow: 'hidden',
      }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          padding: headerPadding,
          borderBottom: '1px solid #f1f5f9',
          flexShrink: 0,
        }}>
          <div>
            {/* PSA tri-colour accent bar */}
            <div style={{ display: 'flex', gap: 4, marginBottom: isNarrow ? 6 : 8 }}>
              <span style={{ height: 3, width: 24, borderRadius: 999, background: '#0B3D91', display: 'block' }} />
              <span style={{ height: 3, width: 12, borderRadius: 999, background: '#FFD400', display: 'block' }} />
              <span style={{ height: 3, width: 8,  borderRadius: 999, background: '#E31C23', display: 'block' }} />
            </div>
            <h2 style={{ fontSize: isNarrow ? 16 : 17, fontWeight: 700, color: '#1e293b', margin: 0, lineHeight: 1.2 }}>
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              border: 'none', background: 'transparent', cursor: 'pointer',
              color: '#64748b', transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: bodyPadding }}>
          {children}
        </div>

        {/* ── Footer ── */}
        {footer !== null && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10,
            padding: footerPadding,
            borderTop: '1px solid #f1f5f9',
            background: '#f8fafc',
            flexShrink: 0,
          }}>
            {footer ?? (
              <Button variant="secondary" onClick={onClose}>Close</Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
