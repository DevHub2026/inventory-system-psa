import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

type AlertTone = 'info' | 'success' | 'warning' | 'error'

interface AlertProps {
  tone?: AlertTone
  title?: string
  children: ReactNode
  onClose?: () => void
  className?: string
}

const tones: Record<AlertTone, string> = {
  info: 'border-blue-200 bg-blue-50 text-blue-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  error: 'border-red-200 bg-red-50 text-red-900',
}

export function Alert({ tone = 'info', title, children, onClose, className }: AlertProps) {
  return (
    <div className={cn('rounded-xl border px-4 py-3 text-sm shadow-sm', tones[tone], className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          {title && <p className="font-medium">{title}</p>}
          <div className={title ? 'mt-0.5' : undefined}>{children}</div>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="text-current opacity-70" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
