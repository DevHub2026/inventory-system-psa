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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[3px]">
      <div
        role="dialog"
        aria-modal="true"
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#E2EAF3] bg-white shadow-2xl shadow-slate-900/20"
      >
        {/* Header */}
        <div className="flex flex-none items-center justify-between border-b border-[#EEF2F8] px-6 py-4">
          <div>
            {/* PSA accent line */}
            <div className="mb-1.5 flex gap-1">
              <span className="h-[3px] w-6 rounded-full bg-[#003DA5]" />
              <span className="h-[3px] w-3 rounded-full bg-[#FFD400]" />
              <span className="h-[3px] w-2 rounded-full bg-[#E31C23]" />
            </div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {/* Footer */}
        <div className="flex flex-none items-center justify-end gap-2 border-t border-[#EEF2F8] bg-[#F8FAFD] px-6 py-4">
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
