import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

interface ModalProps {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
  footer?: ReactNode
}

export function Modal({ open, title, children, onClose, footer }: ModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[3px]"
      aria-modal="true"
      role="dialog"
    >
      <div
        className={[
          'flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden',
          'rounded-[20px] border border-[#E5E7EB] bg-white',
          'shadow-[0_8px_40px_rgba(0,0,0,.18)]',
        ].join(' ')}
      >
        {/* ── Header ── */}
        <div className="flex flex-none items-center justify-between gap-4 border-b border-[#E5E7EB] px-6 py-4">
          <div>
            {/* PSA tri-colour accent */}
            <div className="mb-1.5 flex gap-1">
              <span className="h-[3px] w-6 rounded-full bg-[#0D47A1]" />
              <span className="h-[3px] w-3 rounded-full bg-[#FFD400]" />
              <span className="h-[3px] w-2 rounded-full bg-[#E31C23]" />
            </div>
            <h2 className="text-[16px] font-bold text-[#1F2937]">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className={[
              'rounded-lg p-1.5 text-[#6B7280]',
              'transition-colors duration-200',
              'hover:bg-[#F3F4F6] hover:text-[#1F2937]',
              'focus:outline-none focus:ring-2 focus:ring-[#0D47A1]/30',
            ].join(' ')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {/* ── Footer ── */}
        <div className="flex flex-none items-center justify-end gap-2 border-t border-[#E5E7EB] bg-[#F9FAFB] px-6 py-4">
          {footer ?? (
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
