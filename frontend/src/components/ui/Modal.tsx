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
   * Override the modal max-width. Defaults to a compact government-style layout.
   */
  maxWidth?: number | string
  /**
   * Override the modal max-height. Defaults to viewport-safe height.
   */
  maxHeight?: number | string
}

export function Modal({ open, title, children, onClose, footer, maxWidth = 1040, maxHeight }: ModalProps) {
  const [isNarrow, setIsNarrow] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 420 : false)

  useEffect(() => {
    const handler = () => setIsNarrow(window.innerWidth <= 420)
    window.addEventListener('resize', handler)
    handler()
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const headerPadding = isNarrow ? '10px 14px 8px' : '10px 18px 8px'
  const bodyPadding = isNarrow ? '10px 12px' : '10px 16px 12px'
  const footerPadding = isNarrow ? '6px 14px' : '8px 16px'
  const borderRadius = isNarrow ? 12 : 16
  const maxH = maxHeight ?? (isNarrow ? 'calc(100dvh - 1rem)' : 'calc(100dvh - 2rem)')

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
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
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex', flexDirection: 'column',
          width: '100%', maxWidth: maxWidth,
          maxHeight: maxH,
          borderRadius: borderRadius,
          border: '1px solid #e2e8f0',
          background: '#ffffff',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          overflow: 'hidden',
        }}
      >
        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          padding: headerPadding,
          borderBottom: '1px solid #f1f5f9',
          flexShrink: 0,
        }}>
          <div>
            {/* PSA tri-colour accent bar */}
            <div style={{ display: 'flex', gap: 4, marginBottom: isNarrow ? 4 : 6 }}>
              <span style={{ height: 3, width: 24, borderRadius: 999, background: '#0B3D91', display: 'block' }} />
              <span style={{ height: 3, width: 12, borderRadius: 999, background: '#FFD400', display: 'block' }} />
              <span style={{ height: 3, width: 8,  borderRadius: 999, background: '#E31C23', display: 'block' }} />
            </div>
            <h2 style={{
              fontSize: isNarrow ? 15 : 16.5,
              fontWeight: 700,
              color: '#1e293b',
              margin: 0,
              lineHeight: 1.2,
              maxWidth: 'calc(100% - 48px)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
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
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: bodyPadding }}>
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
            minHeight: 48,
          }}>
            {footer ?? (
              <Button type="button" variant="secondary" size="sm" onClick={onClose}>Close</Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
